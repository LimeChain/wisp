import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Messages, MessagesSchema } from 'src/database/schemas/message.schema';
import { DataLayerService } from 'src/data-layer/data-layer.service';
import { MessageListener } from './services/message-listener/message-listener.service';
import { RollupListener } from './services/rollup-listener/rollup-listener.service';
import { LightClientListener } from './services/light-client-listener/light-client-listener.service';
import { ConfigService } from '@nestjs/config';
import { IDataLayer } from '../data-layer/IDataLayer';

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
    {
      provide: 'OutboxContracts',
      useFactory: (config: ConfigService, dataLayer: IDataLayer) => {
        return config
          .get('rollups')
          .map((rollup) => new MessageListener(dataLayer, rollup));
      },
      inject: [ConfigService, DataLayerService],
    },
    {
      provide: 'RollupContracts',
      useFactory: (config: ConfigService, dataLayer: IDataLayer) => {
        return config
          .get('rollups')
          .map((rollup) => new RollupListener(dataLayer, rollup));
      },
      inject: [ConfigService, DataLayerService],
    },
    //LightClientListener,
    ConfigService,
    DataLayerService,
  ],
})
export class MessageRelayerModule {}
