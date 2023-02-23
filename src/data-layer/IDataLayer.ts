import { MessageDTO } from 'src/message-relayer/dtos/message.dto';

export interface IDataLayer {
  createMessage(message: MessageDTO);
}
