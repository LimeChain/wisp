import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { LightClientModule } from "./light-client/light-client.module";
import { MessageRelayerModule } from "./message-relayer/message-relayer.module";
import { DataLayerModule } from "./data-layer/data-layer.module";
import { DatabaseModule } from "./database/database.module";

@Module({
  imports: [
    LightClientModule,
    MessageRelayerModule,
    DataLayerModule,
    DatabaseModule
  ],
  controllers: [],
  providers: [AppService]
})
export class AppModule {
}
