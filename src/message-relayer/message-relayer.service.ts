import { Inject, Injectable, Logger } from '@nestjs/common';
import { EVENT_MESSAGE_SENT } from './config';
import { ContractService } from './contracts/contracts.service';
import { InjectModel } from '@nestjs/mongoose';
import {
  Messages,
  MessagesDocument,
} from 'src/database/schemas/message.schema';
import { Model, Types } from 'mongoose';
import { IDataLayer } from 'src/data-layer/IDataLayer';

@Injectable()
export class MessageRelayerService {
  private readonly logger = new Logger(MessageRelayerService.name);
  constructor(
    @Inject('DATA LAYER SERVICE')
    private readonly dataLayerService: IDataLayer,
    private contractService: ContractService,
  ) {}

  async init() {
    this.logger.log(`${MessageRelayerService.name} initialized`);
    const mockDB = [];
    const outboxContract = this.contractService.getContract();
    outboxContract.on(EVENT_MESSAGE_SENT, async (...args) => {
      const tx = args[args.length - 1];
      mockDB.push({
        blockNumber: tx.blockNumber,
        from: tx.args.sender,
        destinationChainId: tx.args.destinationChainId,
        messageHash: tx.args.hash,
        messageIndex: tx.args.messageIndex,
      });

      this.logger.log(`Messages: ${JSON.stringify(mockDB)}`);
    });
  }
}
