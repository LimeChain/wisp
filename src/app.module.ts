import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { LightClientModule } from './light-client/light-client.module';
import { MessageRelayerModule } from './message-relayer/message-relayer.module';
import configuration from './configuration';
import { MessageRelayerService } from './message-relayer/message-relayer.service';
import { ContractService } from './message-relayer/contracts/contracts.service';
import { ContractService as ContractSeriviceOracle } from './state-relayer/contracts/contracts.service';
import { ContractService as ContractSeriviceLightClient } from './light-client-relayer/contracts/contracts.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database/database.service';
import { DatabaseModule } from './database/database.module';
import { DataLayerService } from './data-layer/data-layer.service';
import { Messages, MessagesSchema } from './database/schemas/message.schema';
import { DATA_LAYER_SERVICE } from './constants';
import { StateRelayerModule } from './state-relayer/state-relayer.module';
import { StateRelayerService } from './state-relayer/state-relayer.service';
import { LightClientRelayerModule } from './light-client-relayer/light-client-relayer.module';
import { LightClientRelayService } from './light-client-relayer/light-client-relayer.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    LightClientModule,
    MessageRelayerModule,
    MongooseModule.forRootAsync({
      imports: [DatabaseModule],
      useExisting: DatabaseService,
    }),
    MongooseModule.forFeature([
      {
        name: Messages.name,
        schema: MessagesSchema,
      },
    ]),
    StateRelayerModule,
    LightClientRelayerModule,
  ],
  controllers: [],
  providers: [
    AppService,
    MessageRelayerService,
    StateRelayerService,
    LightClientRelayService,
    ContractService,
    ContractSeriviceOracle,
    ContractSeriviceLightClient,
    {
      useClass: DataLayerService,
      provide: DATA_LAYER_SERVICE,
    },
  ],
})
export class AppModule {}
