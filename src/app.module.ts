import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { LightClientModule } from './light-client/light-client.module';
import { MessageRelayerModule } from './message-relayer/message-relayer.module';
import configuration from './configuration';
import { MessageRelayerService } from './message-relayer/message-relayer.service';
import { ContractService } from './message-relayer/contracts/contracts.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    LightClientModule,
    MessageRelayerModule,
  ],
  controllers: [],
  providers: [AppService, MessageRelayerService, ContractService],
})
export class AppModule {}
