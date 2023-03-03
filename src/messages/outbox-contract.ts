import { Inject, Injectable, Logger } from "@nestjs/common";
import { DATA_LAYER } from "../constants";
import { IDataLayer } from "src/data-layer/IDataLayer";
import { MessageDTO } from "./dtos/message.dto";
import * as Outbox from "../../abis/Outbox.json";
import { BigNumber, Contract, ethers } from "ethers";
import { NetworkConfig } from "../configuration";
import { CRCMessage } from "../models";

@Injectable()
export class OutboxContract {

  private readonly logger: Logger;
  private readonly chainId: number;
  private readonly outbox: Contract;

  constructor(
    @Inject(DATA_LAYER)
    private readonly dataLayerService: IDataLayer,
    private readonly networkConfig: NetworkConfig
  ) {
    this.logger = new Logger(`${OutboxContract.name}-${networkConfig.name}`);
    this.chainId = networkConfig.chainId;

    // Initialise outbox contract instance
    const provider = new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
    this.outbox = new ethers.Contract(networkConfig.outgoing.outboxContract, Outbox, provider);

    // Subscribe to new cross-rollup messages
    this.outbox.on("MessageSent", this.onNewMessage.bind(this));
    this.logger.log(`Instantiated contract at ${this.outbox.address}`);
  }

  /**
   * Called once `MessageSent` event is received from the corresponding Outbox contract
   * @param sender
   * @param destChainId
   * @param messageHash
   * @param messageIndex
   * @param eventData
   */
  async onNewMessage(sender: string, destChainId: BigNumber, messageHash: string, messageIndex: number, eventData) {
    this.logger.log(`New message found. msgHash=[${messageHash}], index=[${messageIndex}]`);
    const message: CRCMessage = await this.outbox.getMessageByIndex(messageIndex);
    const messageDTO = new MessageDTO(
      message,
      eventData.transactionHash,
      eventData.blockNumber,
      messageHash,
      messageIndex,
      this.chainId,
      sender
    );
    await this.dataLayerService.createMessage(messageDTO);
  }
}
