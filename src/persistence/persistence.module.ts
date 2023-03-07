import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PersistenceService } from './persistence.service';
import configuration from "../configuration";
import { MongooseModule } from "@nestjs/mongoose";
import { Message, MessagesSchema } from "./schemas/message.schema";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        let uri = config.get<string>("mongodb.uri")
        return {
          uri: uri,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };
      },
      inject: [ConfigService]
    }),
    MongooseModule.forFeature([
      {
        name: Message.name,
        schema: MessagesSchema,
      },
    ]),
  ],
  providers: [PersistenceService],
  exports: [PersistenceService],
})
export class PersistenceModule {}
