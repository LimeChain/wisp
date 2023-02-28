import { Inject, Injectable, Logger } from "@nestjs/common";
import { DATA_LAYER_SERVICE } from "../../../constants";
import { IDataLayer } from "src/data-layer/IDataLayer";
import { MessageDTO } from "../../dtos/message.dto";
import * as Outbox from "../../../../abis/Outbox.json";
import { Contract, ethers } from "ethers";
import { NetworkConfig } from "../../../configuration";

@Injectable()
export class MessageListener {

  private readonly logger: Logger;
  private outbox: Contract;

  constructor(
    @Inject(DATA_LAYER_SERVICE)
    private readonly dataLayerService: IDataLayer,
    private readonly networkConfig: NetworkConfig
  ) {
    this.logger = new Logger(`${MessageListener.name}-${networkConfig.name}`);

    // Initialise outbox contract instance
    const provider = new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
    this.outbox = new ethers.Contract(networkConfig.outgoing.outboxContract, Outbox, provider);

    // Subscribe to new cross-rollup messages
    this.outbox.on("MessageSent", this.onNewMessage.bind(this));
    this.logger.log(`Instantiated contract at ${this.outbox.address}`);
  }

  async onNewMessage(...args) {
    const tx = args[args.length - 1];
    const {
      version,
      nonce,
      user,
      payload,
      extra,
      stateRelayFee,
      deliveryFee,
      target
    } = await this.outbox.getMessageByIndex(tx.args.messageIndex);

    const message: MessageDTO = {
      version,
      nonce,
      user,
      payload,
      extra,
      stateRelayFee,
      deliveryFee,
      L2BlockNumber: tx.blockNumber,
      target,
      destinationChainId: tx.args.destinationChainId,
      messageHash: tx.args.hash,
      messageIndex: tx.args.messageIndex,
      L1BlockNumber: null,
      sentHash: null
    };

    this.dataLayerService.createMessage(message);

    this.logger.log(`Messages: ${JSON.stringify(message)}}`);
  }
}
