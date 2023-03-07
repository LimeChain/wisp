import { Module } from "@nestjs/common";
import { AppService } from "./app.service";
import { LightClientModule } from "./light-client/light-client.module";
import { MessagesModule } from "./messages/messages.module";
import { PersistenceModule } from "./persistence/persistence.module";

@Module({
  imports: [
    LightClientModule,
    MessagesModule,
    PersistenceModule
  ],
  controllers: [],
  providers: [AppService]
})
export class AppModule {
}
