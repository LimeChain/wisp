import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { LightClientModule } from './light-client/light-client.module';
import { MessageRelayerModule } from './message-relayer/message-relayer.module';
import configuration from './configuration';
import { MessageRelayerService } from './message-relayer/message-relayer.service';
import { ContractService } from './message-relayer/contracts/contracts.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database/database.service';
import { DatabaseModule } from './database/database.module';
import { DataLayerService } from './data-layer/data-layer.service';
import { DataLayerModule } from './data-layer/data-layer.module';
import {
  Messages,
  MessagesSchema,
  MessagesDocument,
} from './database/schemas/message.schema';

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
  ],
  controllers: [],
  providers: [
    AppService,
    MessageRelayerService,
    ContractService,
    {
      useClass: DataLayerService,
      provide: 'DATA LAYER SERVICE',
    },
  ],
})
export class AppModule {}
