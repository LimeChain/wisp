import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsOptional } from 'class-validator';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'messages' })
export class Messages {
  @Prop({ trim: true, required: true })
  public blockNumber: string;
}

export type MessagesDocument = Messages & Document;

export const MessagesSchema = SchemaFactory.createForClass(Messages);
MessagesSchema.index({ blockNumber: 1, _id: 1 });
