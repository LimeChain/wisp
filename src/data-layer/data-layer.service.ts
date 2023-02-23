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
    return this.messagesModel.create(message);
  }
}
