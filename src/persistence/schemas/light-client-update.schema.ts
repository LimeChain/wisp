import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true, collection: "light-client-updates" })
export class LightClientUpdate {

  @Prop({ required: true })
  public chainId: number;

  @Prop({ required: true })
  public transactionHash: string;

  @Prop({required: true})
  public transactionTimestamp: number;

  @Prop({ required: true })
  public slot: number;

  @Prop({ required: true })
  public l1BlockNumber: number;

  @Prop({ required: true })
  public l1BlockTimestamp: number;

  @Prop({ required: true })
  public executionRoot: string;

}

export type LightClientUpdateDocument = LightClientUpdate & Document;

export const LightClientUpdateSchema = SchemaFactory.createForClass(LightClientUpdate);
LightClientUpdateSchema.index({ transactionHash: 1 });
