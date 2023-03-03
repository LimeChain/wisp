import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Message, MessagesDocument } from "../database/schemas/message.schema";
import { MessageDTO } from "src/messages/dtos/message.dto";
import { IDataLayer } from "./IDataLayer";

@Injectable()
export class DataLayerService implements IDataLayer {

  private readonly logger = new Logger(DataLayerService.name);

  constructor(
    @InjectModel(Message.name)
    private readonly messagesModel: Model<MessagesDocument>
  ) {
  }

  async createMessage(message: MessageDTO) {
    return await this.messagesModel.create(message);
  }

  async setDeliveryTXHash(messageHash: string, targetChainTxHash: string) {
    const updated = await this.messagesModel.updateMany(
      { hash: messageHash },
      { $set: { targetChainTxHash: targetChainTxHash } }
    );
    if (updated.modifiedCount == 0) {
      this.logger.debug(`Error while setting target chain tx hash for message. Message with hash=[${messageHash}] was not found`);
    } else if (updated.modifiedCount == 1) {
      this.logger.debug(`Populated target chain tx hash for message [${messageHash}]`);
    } else {
      this.logger.warn(`Multiple messages found with hash=[${messageHash}]`);
    }
  }

  async updateWithL1BlockNumber(sourceChainId: number, l1BlockNumber: number) {
    const result = await this.messagesModel.updateMany(
      { sourceChainId, l1BlockNumber: 0 },
      { $set: { l1BlockNumber } }
    );
    if (result.modifiedCount > 0) {
      this.logger.log(`Populated L1 block number for ${result.modifiedCount} message(s)`);
    }
  }

  getUndeliveredMessages(targetChainId: number, l1BlockNumber: number) {
    return this.messagesModel.find({
      targetChainTxHash: null,
      targetChainId: targetChainId,
      l1BlockNumber: { $lte: l1BlockNumber, $ne: 0 }
    });
  }
}
