import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { CRCMessage } from "../../models";

export class MessageDTO {
  @IsNumber()
  version: number;

  @IsNumber()
  nonce: string;

  @IsNumber()
  sourceChainId: number;

  @IsNumber()
  targetChainId: number;

  @IsString()
  user: string;

  @IsString()
  target: string;

  @IsString()
  payload: string;

  @IsString()
  extra: string;

  @IsNumber()
  index: number;

  @IsString()
  hash: string;

  @IsNumber()
  stateRelayFee: string;

  @IsNumber()
  deliveryFee: string;

  @IsNumber()
  l2BlockNumber: number;

  @IsNumber()
  @IsOptional()
  l1BlockNumber: number;

  @IsString()
  @IsOptional()
  deliveryTransactionHash: string;

  static fromCRCMessage({destinationChainId, ...message}: CRCMessage, l2BlockNumber: number, hash: string, index: number, chainId: number): MessageDTO {
    return {
      hash,
      index,
      sourceChainId: chainId,
      targetChainId: Number(destinationChainId),
      l2BlockNumber,
      l1BlockNumber: 0,
      deliveryTransactionHash: null,
      ...message
    };
  }
}
