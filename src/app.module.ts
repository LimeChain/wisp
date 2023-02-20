import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppService } from "./app.service";
import { LightClientModule } from './light-client/light-client.module';
import { MessageRelayerModule } from './message-relayer/message-relayer.module';

@Module({
  imports: [ConfigModule.forRoot(), LightClientModule, MessageRelayerModule],
  controllers: [],
  providers: [AppService],
})
export class AppModule {
}
