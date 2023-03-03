import { Inject, Injectable, Logger } from "@nestjs/common";
import { DATA_LAYER } from "src/constants";
import { IDataLayer } from "src/data-layer/IDataLayer";
import { NetworkConfig } from "../configuration";
import { BigNumber, Contract, ethers } from "ethers";
import * as Inbox from "../../abis/Optimism/OptimismInbox.json";
import { Events } from "../events/events";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  BASE_GOERLI_CONFIG,
  MPTProofsEncoder,
  OPTIMISM_GOERLI_CONFIG,
  OptimismExtractoorClient,
  OutputData
} from "extractoor";
import { MessageDTO } from "./dtos/message.dto";
import { CRCMessage, OptimismMessageMIP, OptimismOutputRootMIP } from "../models";
import { Utils } from "../utils";

// Important! `networks.rollups[].name` must match the ones here
const EXTRACTOOR_CONFIG = {
  "Base": BASE_GOERLI_CONFIG,
  "Optimism": OPTIMISM_GOERLI_CONFIG
};

@Injectable()
export class InboxContract {

  private readonly logger: Logger;
  private readonly chainId: number;
  private readonly inbox: Contract;
  private readonly chain2Extractoor = new Map<number, OptimismExtractoorClient>();
  private readonly chain2Outbox = new Map<number, string>();
  private readonly chain2Name = new Map<number, string>();

  // The position of the variable for the `outbox` array inside the `Outbox` contract
  private readonly MESSAGES_ARRAY_POSITION = 0;
  // The storage key at which messages are stored inside the `outbox` contract
  private readonly MESSAGES_ARRAY_STORAGE_KEY: BigNumber;

  constructor(
    @Inject(DATA_LAYER)
    private readonly dataLayerService: IDataLayer,
    private readonly inboxChainConfig: NetworkConfig,
    private readonly l1RpcUrl: string,
    private readonly networks: NetworkConfig[],
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger = new Logger(`${InboxContract.name}-${inboxChainConfig.name}`);
    this.chainId = inboxChainConfig.chainId;
    // Creates extractoor per source chain (excluding current chain)
    // Important! Supports only Optimism based networks
    networks.filter(network => network.chainId != this.chainId).forEach(n => {
      const extractoor = new OptimismExtractoorClient(n.rpcUrl, l1RpcUrl, EXTRACTOOR_CONFIG[n.name]);
      this.chain2Extractoor.set(n.chainId, extractoor);
      this.chain2Outbox.set(n.chainId, n.outgoing.outboxContract);
      this.chain2Name.set(n.chainId, n.name);
    });
    this.MESSAGES_ARRAY_STORAGE_KEY = Utils.computeStorageKey(this.MESSAGES_ARRAY_POSITION);

    // Initialise inbox contract instance
    const provider = new ethers.providers.JsonRpcProvider(inboxChainConfig.rpcUrl);
    const signer = new ethers.Wallet(inboxChainConfig.privateKey, provider);
    this.inbox = new ethers.Contract(inboxChainConfig.incoming.inboxContract, Inbox, signer);

    // Subscribe to new Light Client head updates
    this.eventEmitter.on(Events.LIGHT_CLIENT_NEW_HEAD, this.onNewLightClientUpdate.bind(this));
    this.inbox.on('MessageReceived', this.onMessageReceived.bind(this));
    this.logger.log(`Instantiated contract at ${this.inbox.address}`);
  }

  /**
   * Called once `LIGHT_CLIENT_NEW_HEAD` NodeJs event is emitted by LightClient Listeners
   * If `chainId` is corresponding to the Inbox contract chain, messages ready for submission are processed
   * @param payload
   */
  async onNewLightClientUpdate(payload: Events.HeadUpdate) {
    // LC Update is not for the Inbox contract chain
    if (payload.chainId != this.chainId) {
      return;
    }
    const messages: MessageDTO[] = await this.dataLayerService.getUndeliveredMessages(this.chainId, payload.blockNumber);

    if (messages.length > 0) {
      this.logger.log(`Light Client head updated to L1 Block [${payload.blockNumber}]. Found [${messages.length}] message(s) for processing`);
      const messagesMap = messages.reduce((acc, msg) => {
        const messagesForChain = acc.get(msg.sourceChainId) || [];
        messagesForChain.push(msg);
        acc.set(msg.sourceChainId, messagesForChain);
        return acc;
      }, new Map<number, MessageDTO[]>());
      const messageGroupsPerChain = Array.from(messagesMap.entries());
      // Process messages per chain in parallel
      await Promise.all(messageGroupsPerChain.map(async ([chain, messages]) => {
        const extractoor = this.chain2Extractoor.get(chain);
        const rollupStateProofData = await extractoor.generateLatestOutputData(`0x${payload.blockNumber.toString(16)}`);
        // Processing of messages for a given chain in parallel
        await Promise.all(messages.map(msg => this.process(extractoor, rollupStateProofData, msg)));
      }));
    } else {
      this.logger.log(`Light Client updated to L1 Block [${payload.blockNumber}]. No messages found for processing`);
    }
  }

  /**
   * Processes a single message by preparing and sending `inboxContract.receiveMessage` function
   * @param extractoor
   * @param rollupStateProofData
   * @param message
   */
  async process(extractoor: OptimismExtractoorClient, rollupStateProofData: OutputData, message: MessageDTO) {
    // Compute storage slot of the message inside the outbox contract in `source` rollup
    const messageStorageSlot = ethers.utils.hexlify(this.MESSAGES_ARRAY_STORAGE_KEY.add(message.index));

    const outboxAddress = this.chain2Outbox.get(message.sourceChainId);
    // Get state proof for the message within the outbox contract inside the source rollup
    const outboxProofData = await extractoor.optimism.getProof(
      outboxAddress,
      messageStorageSlot,
      ethers.BigNumber.from(rollupStateProofData.blockNum).toHexString()
    );

    // Prepare the calldata
    const inclusionProof = MPTProofsEncoder.rlpEncodeProofs(
      [
        outboxProofData.accountProof,
        outboxProofData.storageProof[0].proof
      ]);

    const envelope = {
      message: CRCMessage.fromDTO(message),
      sender: message.sender
    };
    const outputProof: OptimismOutputRootMIP = {
      outputRootProof: {
        stateRoot: rollupStateProofData.optimismStateRoot,
        withdrawalStorageRoot: rollupStateProofData.withdrawalStorageRoot,
        latestBlockhash: rollupStateProofData.blockHash
      },
      optimismStateProofsBlob: rollupStateProofData.outputRootRLPProof
    };
    const MPTInclusionProof: OptimismMessageMIP = {
      target: outboxAddress,
      slotPosition: messageStorageSlot,
      proofsBlob: inclusionProof
    };

    try {
      const transaction = await this.inbox.receiveMessage(
        envelope,
        ethers.BigNumber.from(rollupStateProofData.l1BlockNumber),
        ethers.BigNumber.from(rollupStateProofData.outputIndex),
        outputProof,
        MPTInclusionProof
      );
      this.logger.log(`Submitted delivery of message. {from =[${this.chain2Name.get(message.sourceChainId)}] msgHash=[${message.hash}] txHash=[${transaction.hash}] }`);
    } catch (e) {
      this.logger.log(`Transaction for delivery of message will fail. {from=[${this.chain2Name.get(message.sourceChainId)}] msgHash=[${message.hash}]}. Error: ${e.error.reason}`);
    }
  }

  async onMessageReceived(user: string, target: string, hash: string, eventData) {
    this.logger.log(`Message with hash [${hash}] has been processed`);
    await this.dataLayerService.setDeliveryTXHash(hash, eventData.transactionHash);
  }
}
