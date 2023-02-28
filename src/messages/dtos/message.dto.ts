import { IsNumber, IsString, IsOptional, IsBoolean } from 'class-validator';

export class MessageDTO {
  @IsNumber()
  version: number;

  @IsNumber()
  nonce: number;

  @IsString()
  user: string;

  @IsString()
  payload: string;

  @IsString()
  extra: string;

  @IsNumber()
  stateRelayFee: number;

  @IsNumber()
  deliveryFee: number;

  @IsNumber()
  L2BlockNumber: number;

  @IsString()
  target: string;

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
  sentHash: boolean;
}
