import { MessageDTO } from 'src/messages/dtos/message.dto';

export interface IDataLayer {
  createMessage(message: MessageDTO);
  updateWithL1BlockNumber(sourceChainId: number, l1BlockNumber: number);
  getUndeliveredMessages(targetChainId: number, l1BlockNumber: number);
}
