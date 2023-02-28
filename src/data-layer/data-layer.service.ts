import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Messages, MessagesDocument } from '../database/schemas/message.schema';
import { MessageDTO } from 'src/messages/dtos/message.dto';
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

  async updateMessages(L1BlockNumber: number) {
    return this.messagesModel.updateMany(
      {
        L1BlockNumber: null,
        L2BlockNumber: { $lte: L1BlockNumber },
      },
      {
        $set: {
          L1BlockNumber: L1BlockNumber,
        },
      },
    );
  }

  async getMessages() {
    return this.messagesModel.find();
  }
}
