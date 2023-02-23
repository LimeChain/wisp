import { IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';

export class MessageDTO {
  @IsNumber()
  OptimismBlockNumber: number;

  @IsString()
  from: string;

  @IsNumber()
  destinationChainId: number;

  @IsString()
  messageHash: string;

  @IsNumber()
  messageIndex: number;

  @IsNumber()
  @IsOptional()
  L1BlockNumber: number;

  @IsBoolean()
  @IsOptional()
  sent: boolean;
}
