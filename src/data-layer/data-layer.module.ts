import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesSchema, Message } from 'src/database/schemas/message.schema';
import { DataLayerService } from './data-layer.service';
import { DatabaseModule } from '../database/database.module';
import { DatabaseService } from '../database/database.service';

@Module({
  providers: [DataLayerService],
  exports: [DataLayerService],
  imports: [
    MongooseModule.forRootAsync({
      imports: [DatabaseModule],
      useExisting: DatabaseService,
    }),
    MongooseModule.forFeature([
      {
        name: Message.name,
        schema: MessagesSchema,
      },
    ]),
  ],
})
export class DataLayerModule {}
