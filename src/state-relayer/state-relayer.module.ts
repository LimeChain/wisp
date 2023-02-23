import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATA_LAYER_SERVICE } from 'src/constants';
import { DataLayerService } from 'src/data-layer/data-layer.service';
import { Messages, MessagesSchema } from 'src/database/schemas/message.schema';
import { ContractService } from './contracts/contracts.service';
import { StateRelayerService } from './state-relayer.service';

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
    StateRelayerService,
    ContractService,
    {
      useClass: DataLayerService,
      provide: DATA_LAYER_SERVICE,
    },
  ],
})
export class StateRelayerModule {}
