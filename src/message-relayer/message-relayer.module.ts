import { Module } from '@nestjs/common';
import { ContractService } from './contracts/contracts.service';
import { MessageRelayerService } from './message-relayer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Messages, MessagesSchema } from 'src/database/schemas/message.schema';
import { DataLayerService } from 'src/data-layer/data-layer.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Messages.name,
        schema: MessagesSchema,
      },
    ]),
  ],
  providers: [
    MessageRelayerService,
    ContractService,
    {
      useClass: DataLayerService,
      provide: 'DATA LAYER SERVICE',
    },
  ],
})
export class MessageRelayerModule {}
