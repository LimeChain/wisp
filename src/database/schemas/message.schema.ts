import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional } from 'class-validator';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'messages' })
export class Messages {
  @Prop({ required: true })
  public version: number;

  @Prop({ required: true })
  public nonce: string;

  @Prop({ required: true })
  public sourceChainId: number;

  @Prop({ required: true })
  public targetChainId: number;

  @Prop({ required: true })
  public user: string;

  @Prop({ required: true })
  public target: string;

  @Prop({ required: true })
  public payload: string;

  @Prop({ required: true })
  public extra: string;

  @Prop({ required: true })
  public index: number;

  @Prop({ required: true, unique: true })
  public hash: string;

  @Prop({ required: true })
  stateRelayFee: string;

  @Prop({ required: true })
  deliveryFee: string;

  @Prop({ required: true })
  public l2BlockNumber: number;

  @Prop()
  @IsOptional()
  public l1BlockNumber: number;

  @Prop()
  @IsOptional()
  public sentHash: boolean;
}

export type MessagesDocument = Messages & Document;

export const MessagesSchema = SchemaFactory.createForClass(Messages);
MessagesSchema.index({ blockNumber: 1, _id: 1 });
