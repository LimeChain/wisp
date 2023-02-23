import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Messages,
  MessagesDocument,
} from 'src/database/schemas/message.schema';
import { MessageDTO } from 'src/message-relayer/dtos/message.dto';
import { IDataLayer } from './IDataLayer';

@Injectable()
export class DataLayerService implements IDataLayer {
  constructor(
    @InjectModel(Messages.name)
    private readonly messagesModel: Model<MessagesDocument>,
  ) {}

  async createMessage(message: MessageDTO) {
    return await this.messagesModel.create(message);
  }

  async updateMessages(_L1BlockNumber: number) {
    return await this.messagesModel.updateMany(
      {
        L1BlockNumber: null,
        OptimismBlockNumber: { $lte: _L1BlockNumber },
      },
      {
        $set: {
          L1BlockNumber: _L1BlockNumber,
        },
      },
    );
  }
}
