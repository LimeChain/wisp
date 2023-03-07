import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PersistenceService } from "./persistence.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Message, MessagesSchema } from "./schemas/message.schema";
import { LightClientUpdate, LightClientUpdateSchema } from "./schemas/light-client-update.schema";

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        let uri = config.get<string>("mongodb.uri");
        return {
          uri: uri,
          useNewUrlParser: true,
          useUnifiedTopology: true
        };
      },
      inject: [ConfigService]
    }),
    MongooseModule.forFeature([{ name: Message.name, schema: MessagesSchema }]),
    MongooseModule.forFeature([{ name: LightClientUpdate.name, schema: LightClientUpdateSchema }])
  ],
  providers: [PersistenceService],
  exports: [
    PersistenceService,
    MongooseModule.forFeature([{ name: Message.name, schema: MessagesSchema }]),
    MongooseModule.forFeature([{ name: LightClientUpdate.name, schema: LightClientUpdateSchema }])
  ]
})
export class PersistenceModule {
}
