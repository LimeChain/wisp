import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { LightClientModule } from "./light-client/light-client.module";
import { MessagesModule } from "./messages/messages.module";
import { PersistenceModule } from "./persistence/persistence.module";
import { ConfigModule } from "@nestjs/config";
import configuration from "./configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true
    }),
    LightClientModule,
    MessagesModule,
    PersistenceModule
  ],
  controllers: [],
  providers: [AppService]
})
export class AppModule {
}
