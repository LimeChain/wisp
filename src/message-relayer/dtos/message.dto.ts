import { IsNumber, IsString } from 'class-validator';

export class MessageDTO {
  @IsNumber()
  blockNumber: number;
  @IsString()
  from: string;
  @IsNumber()
  destinationChainId: number;
  @IsString()
  messageHash: string;
  @IsNumber()
  messageIndex: number;
}
