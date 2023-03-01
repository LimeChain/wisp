import { Inject, Injectable, Logger } from "@nestjs/common";
import { DATA_LAYER_SERVICE } from "src/constants";
import { IDataLayer } from "src/data-layer/IDataLayer";
import { NetworkConfig } from "../configuration";
import { BigNumber, Contract, ethers } from "ethers";
import * as Inbox from "../../abis/Optimism/OptimismInbox.json";
import { Events } from "../events/events";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { OPTIMISM_GOERLI_CONFIG, OptimismExtractoorClient, OutputData } from "extractoor";
import { MessageDTO } from "./dtos/message.dto";
import { bufferToHex, toBuffer, unpadBuffer } from "ethereumjs-util";

// Important! InboxContract works only for Optimism Bedrock based networks such as Optimism and Base!
@Injectable()
export class InboxContract {

  private readonly logger: Logger;
  private readonly chainId: number;
  private readonly inbox: Contract;
  private readonly chain2Extractoor = new Map<number,OptimismExtractoorClient>();
  private readonly optimismExtractoor: OptimismExtractoorClient; // TODO should be deprecated

  // The position of the variable for the `outbox` array inside the `Outbox` contract
  private readonly OUTBOX_ARRAY_POSITION = 0;
  // Storage key is derived from keccak256(0x...{position}) converted to a uint256 number
  private readonly OUTBOX_ARRAY_STORAGE_KEY: BigNumber = ethers.BigNumber.from(ethers.utils.keccak256(ethers.utils.hexlify(this.OUTBOX_ARRAY_POSITION)));

  constructor(
    @Inject(DATA_LAYER_SERVICE)
    private readonly dataLayerService: IDataLayer,
    private readonly inboxChainConfig: NetworkConfig,
    private readonly l1RpcUrl: string,
    private readonly eventEmitter: EventEmitter2
  ) {
    this.logger = new Logger(`${InboxContract.name}-${inboxChainConfig.name}`);
    this.chainId = inboxChainConfig.chainId;
    // TODO extractoor should be per source chain
    this.optimismExtractoor = new OptimismExtractoorClient(inboxChainConfig.rpcUrl, l1RpcUrl, OPTIMISM_GOERLI_CONFIG);

    // Initialise inbox contract instance
    const provider = new ethers.providers.JsonRpcProvider(inboxChainConfig.rpcUrl);
    this.inbox = new ethers.Contract(inboxChainConfig.incoming.inboxContract, Inbox, provider);

    // Subscribe to new Light Client head updates
    this.eventEmitter.on(Events.LIGHT_CLIENT_NEW_HEAD, this.onNewLightClientUpdate.bind(this));
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
    this.logger.log(`Light Client update received for BlockNumber = ${payload.blockNumber}`);
    const messages: MessageDTO[] = await this.dataLayerService.getUndeliveredMessages(this.chainId, payload.blockNumber);

    if (messages.length > 0) {
      const rollupStateProofData: OutputData = await this.optimismExtractoor.generateLatestOutputData(ethers.utils.hexlify(payload.blockNumber));
      await Promise.all(messages.map(message => {
        return this.process(rollupStateProofData, message);
      }));
    }

  }

  async process(rollupStateProofData: OutputData, message: MessageDTO) {
    // storage slot of the message inside the outbox contract in `source` rollup
    const messageStorageSlot = ethers.utils.hexlify(this.OUTBOX_ARRAY_STORAGE_KEY.add(0));

    // Step 3 - Get all the information needed for the Merkle inclusion proof inside Optimism
    // const rollupStateProof = await this.optimismExtractoor.optimism.getProof(
    //   rollup.outgoing.outBoxContract, // TODO outbox address per sourceChain
    //   messageStorageSlot,
    //   bufferToHex(unpadBuffer(toBuffer(output.blockNum)))
    // );
  }

  //
  //       const tx = args[args.length - 1];
  //       const newBlockHeaderNumber = tx.args.blockNumber.toNumber(); // This is the slot from NewHead (LC)
  //       const messages = await this.dataLayerService.getMessages();
  //
  //       // Step 1 - Derive the storage slot from the array definition and index of the array
  //       //the starting storage key of the array   |     position of the array
  //       const arrayDefinitionHash = keccak(setLengthLeft(toBuffer(0), 32));
  //       const arrayDefinitionBN = new BN(arrayDefinitionHash);
  //       const indexBN = new BN(0); // TODO fix should be the index of the message; must be in the for loop
  //       const slotBN = arrayDefinitionBN.add(indexBN);
  //       const slot = `0x${slotBN.toString("hex")}`; // Bytes32 of the Storage key
  //
  //       for (const message of messages) {
  //
  //           // Step 2 - Get all the information needed for the Optimism Output Root inclusion inside L1 proof
  //           const output = await fetcher.generateLatestOutputData(
  //             `0x${newBlockHeaderNumber.toString(16)}`
  //           );
  //
  //           // Step 3 - Get all the information needed for the Merkle inclusion proof inside Optimism
  //           const getProofRes = await fetcher.optimism.getProof(
  //             rollup.outgoing.outBoxContract,
  //             slot, // <- FIXME per message
  //             bufferToHex(unpadBuffer(toBuffer(output.blockNum)))
  //           );
  //
  //           // Step 4 - RLP encode the Proof from Step 3
  //           const inclusionProof =
  //             MPTProofsEncoder.rlpEncodeProofs([
  //               getProofRes.accountProof,
  //               getProofRes.storageProof[0].proof
  //             ]);
  //
  //           const {
  //             version,
  //             destinationChainId,
  //             nonce,
  //             target,
  //             payload,
  //             extra,
  //             user,
  //             stateRelayFee,
  //             deliveryFee
  //           } = message;
  //
  //           const envelope = {
  //             message: { // This is the message from the mapping
  //               version,
  //               destinationChainId,
  //               nonce,
  //               user,
  //               target, // Bridge contract should be changed
  //               payload,
  //               stateRelayFee,
  //               deliveryFee,
  //               extra
  //             },
  //             sender: target // FIXME should be received from new message event
  //           };
  //
  //           const outputProof = {
  //             outputRootProof: {
  //               stateRoot: output.optimismStateRoot,
  //               withdrawalStorageRoot: output.withdrawalStorageRoot,
  //               latestBlockhash: output.blockHash
  //             },
  //             optimismStateProofsBlob: output.outputRootRLPProof
  //           };
  //           const MPTInclusionProof = {
  //             address: rollup.outgoing.outBoxContract,
  //             slotPositon: slot,
  //             proofsBlob: inclusionProof
  //           };
  //
  //           console.log(envelope);
  //           console.log(newBlockHeaderNumber);
  //           console.log(output.outputIndex);
  //           console.log(outputProof);
  //           console.log(MPTInclusionProof);
  //
  //           try {
  //             const receipt = await inboxContract.receiveMessage(
  //               envelope,
  //               newBlockHeaderNumber, // Head update slot (coming from NewHead event)
  //               ethers.BigNumber.from(output.outputIndex).toNumber(), // This is the Index coming from the Rollup State Contract
  //               outputProof,
  //               MPTInclusionProof
  //             );
  //             // TODO update the state of the message in the DB
  //             console.log(receipt);
  //           } catch (error) {
  //             console.error(error);
  //           }
  //         }
  //       }
}
