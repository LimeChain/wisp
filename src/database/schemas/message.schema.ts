import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional } from 'class-validator';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'messages' })
export class Messages {
  @Prop({ required: true })
  public blockNumber: number;

  @Prop({ required: true })
  public from: string;

  @Prop({ required: true })
  public destinationChainId: number;

  @Prop({ required: true, unique: true })
  public messageHash: string;

  @Prop({ required: true })
  public messageIndex: number;
}

export type MessagesDocument = Messages & Document;

export const MessagesSchema = SchemaFactory.createForClass(Messages);
MessagesSchema.index({ blockNumber: 1, _id: 1 });
