import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesSchema, Messages } from 'src/database/schemas/message.schema';
import { DataLayerService } from './data-layer.service';

@Module({
  providers: [DataLayerService],
  exports: [DataLayerService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Messages.name,
        schema: MessagesSchema,
      },
    ]),
  ],
})
export class DataLayerModule {}
