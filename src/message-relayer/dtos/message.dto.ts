import { IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';

export class MessageDTO {
  @IsNumber()
  version: number;

  @IsNumber()
  nonce: number;

  @IsString()
  initialCaller: string;

  @IsString()
  payload: string;

  @IsString()
  extra: string;

  // stateRelayFee: number;
  // deliveryFee: number;

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
