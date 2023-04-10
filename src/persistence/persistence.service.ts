import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Message, MessagesDocument } from "./schemas/message.schema";
import { Model } from "mongoose";
import { LightClientUpdate, LightClientUpdateDocument } from "./schemas/light-client-update.schema";
import { MessageDTO } from "./dtos/message.dto";


@Injectable()
export class PersistenceService {

  private readonly logger = new Logger(PersistenceService.name);

  constructor(
    @InjectModel(Message.name)
    private readonly messagesModel: Model<MessagesDocument>,
    @InjectModel(LightClientUpdate.name)
    private readonly lightClientUpdatesModel: Model<LightClientUpdateDocument>
  ) {
  }

  get lightClientUpdates() {
    return this.lightClientUpdatesModel;
  }

  get messages() {
    return this.messagesModel;
  }

  createMessage(message: MessageDTO) {
    return this.messagesModel.create(message);
  }

  async updateDelivered(messageHash: string, targetChainTxHash: string, txTimestamp: number, deliveryCost: string, blockNumber: number) {
    const updated = await this.messagesModel.updateMany(
      { hash: messageHash },
      {
        $set: {
          targetChainTxHash: targetChainTxHash,
          targetChainTxTimestamp: txTimestamp,
          deliveryCost: deliveryCost,
          targetChainTXBlockNumber: blockNumber
        }
      }
    );
    if (updated.modifiedCount == 0) {
      this.logger.debug(`Error while updating state to delivered. Message with hash=[${messageHash}] was not found`);
    } else if (updated.modifiedCount == 1) {
      this.logger.debug(`Updated message to delivered. hash [${messageHash}]`);
    } else {
      this.logger.warn(`Multiple messages found with hash=[${messageHash}]`);
    }
  }

  async updateWithL1BlockNumber(sourceChainId: number, l2BlockNumber: number, l1BlockNumber: number, l1ChainTxHash: string, l1BlockTimestamp: number) {
    const result = await this.messagesModel.updateMany(
      { sourceChainId, l1BlockNumber: 0, l2BlockNumber: { $lte: l2BlockNumber } },
      { $set: { l1BlockNumber, l1ChainTxHash, l1BlockTimestamp } }
    );
    return result.modifiedCount;
  }

  getReadyUndeliveredMessages(targetChainId: number, l1BlockNumber: number) {
    return this.messagesModel.find({
      targetChainTxHash: null,
      targetChainId: targetChainId,
      l1BlockNumber: { $lte: l1BlockNumber, $ne: 0 }
    });
  }

  getLightClientPendingMessages() {
    return this.messagesModel.find({
      targetChainTxHash: null,
      l1BlockNumber: { $ne: 0 }
    });
  }
}
