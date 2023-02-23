import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Messages,
  MessagesDocument,
} from 'src/database/schemas/message.schema';

import { IDataLayer } from './IDataLayer';

@Injectable()
export class DataLayerService implements IDataLayer {
  constructor(
    @InjectModel(Messages.name)
    private readonly messagesModel: Model<MessagesDocument>,
  ) {}
  async createMessage(): Promise<any> {
    return 1;
  }
}
