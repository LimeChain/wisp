import { IsNumber, IsNumberString, IsOptional, IsString } from "class-validator";
import { CRCMessage } from "../../models";

export class MessageDTO {

  constructor(message: CRCMessage, txHash: string, txTimestamp: number, l2BlockNumber: number, hash: string, index: number, chainId: number, sender: string) {
    this.version = message.version;
    this.nonce = message.nonce;
    this.sourceChainId = chainId;
    this.targetChainId = Number(message.destinationChainId);
    this.user = message.user;
    this.sender = sender;
    this.target = message.target;
    this.payload = message.payload;
    this.extra = message.extra;
    this.index = index;
    this.hash = hash;
    this.stateRelayFee = message.stateRelayFee;
    this.deliveryFee = message.deliveryFee;
    this.l2BlockNumber = l2BlockNumber;
    this.l1BlockNumber = 0;
    this.l1BlockTimestamp = 0;
    this.sourceChainTxHash = txHash;
    this.sourceChainTxTimestamp = txTimestamp;
    this.l1ChainTxHash = null;
    this.targetChainTxHash = null;
    this.targetChainTxTimestamp = 0;
    this.deliveryCost = null;
    this.stateRelayCost = null;
    this.targetChainTXBlockNumber = 0;
  }

  @IsNumber()
  version: number;

  @IsNumber()
  nonce: string;

  @IsNumber()
  sourceChainId: number;

  @IsNumber()
  targetChainId: number;

  @IsString()
  sender: string;

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

  @IsString()
  sourceChainTxHash: string;

  @IsNumber()
  sourceChainTxTimestamp: number;

  @IsString()
  l1ChainTxHash: string;

  @IsString()
  @IsOptional()
  targetChainTxHash: string;

  @IsNumber()
  @IsOptional()
  targetChainTxTimestamp: number;

  @IsNumber()
  @IsOptional()
  targetChainTXBlockNumber: number;

  @IsNumber()
  @IsOptional()
  l1BlockNumber: number;

  @IsNumber()
  @IsOptional()
  l1BlockTimestamp: number

  @IsNumberString()
  @IsOptional()
  deliveryCost: string;

  @IsNumberString()
  @IsOptional()
  stateRelayCost: string
}
