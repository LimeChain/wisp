import { Inject, Injectable, Logger } from '@nestjs/common';
import { DATA_LAYER_SERVICE, EVENT_MESSAGE_SENT } from './constants';
import { ContractService } from './contracts/contracts.service';
import { IDataLayer } from 'src/data-layer/IDataLayer';

@Injectable()
export class MessageRelayerService {
  private readonly logger = new Logger(MessageRelayerService.name);
  constructor(
    @Inject(DATA_LAYER_SERVICE)
    private readonly dataLayerService: IDataLayer,
    private contractService: ContractService,
  ) {}

  async init() {
    this.logger.log(`${MessageRelayerService.name} initialized`);

    const outboxContract = this.contractService.getContract();
    outboxContract.on(EVENT_MESSAGE_SENT, async (...args) => {
      const tx = args[args.length - 1];
      const message = {
        blockNumber: tx.blockNumber,
        from: tx.args.sender,
        destinationChainId: tx.args.destinationChainId,
        messageHash: tx.args.hash,
        messageIndex: tx.args.messageIndex,
      };

      this.dataLayerService.createMessage(message);

      this.logger.log(`Messages: ${JSON.stringify(message)}}`);
    });
  }
}
