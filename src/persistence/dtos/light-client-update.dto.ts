import { IsNumber, IsString } from "class-validator";

export class LightClientUpdateDTO {

  constructor(
    chainId: number,
    txHash: string,
    txTimestamp: number,
    slot: number,
    l1BlockNumber: number,
    l1BlockTimestamp: number,
    executionRoot: string
  ) {
    this.chainId = chainId;
    this.transactionHash = txHash;
    this.transactionTimestamp = txTimestamp;
    this.slot = slot;
    this.l1BlockNumber = l1BlockNumber;
    this.l1BlockTimestamp = l1BlockTimestamp;
    this.executionRoot = executionRoot;
  }

  @IsNumber()
  chainId: number;

  @IsString()
  transactionHash: string;

  @IsNumber()
  transactionTimestamp: number;

  @IsNumber()
  slot: number;

  @IsNumber()
  l1BlockNumber: number;

  @IsNumber()
  l1BlockTimestamp: number;

  @IsString()
  executionRoot: string;

}
