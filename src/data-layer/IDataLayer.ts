import { MessageDTO } from 'src/messages/dtos/message.dto';

export interface IDataLayer {
  createMessage(message: MessageDTO);
  updateMessages(L1BlockNumber: number);
  getMessages();
}
