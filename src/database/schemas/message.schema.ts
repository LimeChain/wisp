import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional } from 'class-validator';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'messages' })
export class Messages {
  @Prop({ required: true })
  public version: number;

  @Prop({ required: true })
  public nonce: number;

  @Prop({ required: true })
  public user: string;

  @Prop({ required: true })
  public payload: string;

  @Prop({ required: true })
  public extra: string;

  @Prop({ required: true })
  stateRelayFee: number;

  @Prop({ required: true })
  deliveryFee: number;

  @Prop({ required: true })
  public L2BlockNumber: number;

  @Prop({ required: true })
  public target: string;

  @Prop({ required: true })
  public destinationChainId: number;

  @Prop({ required: true, unique: true })
  public messageHash: string;

  @Prop({ required: true })
  public messageIndex: number;

  @Prop()
  @IsOptional()
  public L1BlockNumber: number;

  @Prop()
  @IsOptional()
  public sentHash: boolean;
}

export type MessagesDocument = Messages & Document;

export const MessagesSchema = SchemaFactory.createForClass(Messages);
MessagesSchema.index({ blockNumber: 1, _id: 1 });
