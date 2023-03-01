import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { CRCMessage } from "../../models";

export class MessageDTO {
  @IsNumber()
  version: number;

  @IsNumber()
  nonce: string;

  @IsString()
  user: string;

  @IsString()
  payload: string;

  @IsString()
  extra: string;

  @IsNumber()
  stateRelayFee: string;

  @IsNumber()
  deliveryFee: string;

  @IsNumber()
  L2BlockNumber: number;

  @IsString()
  target: string;

  @IsNumber()
  destinationChainId: string;

  @IsString()
  hash: string;

  @IsNumber()
  index: number;

  @IsNumber()
  @IsOptional()
  L1BlockNumber: number;

  @IsBoolean()
  @IsOptional()
  sentHash: boolean;

  static fromCRCMessage(message: CRCMessage, L2BlockNumber: number, hash: string, index: number): MessageDTO {
    return {
      hash,
      index,
      L2BlockNumber,
      L1BlockNumber: 0,
      sentHash: null,
      ...message
    };
  }
}
