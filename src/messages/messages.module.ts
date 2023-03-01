import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Messages, MessagesSchema } from "src/database/schemas/message.schema";
import { DataLayerService } from "src/data-layer/data-layer.service";
import { OutboxContract } from "./outbox-contract";
import { RollupStateContract } from "./rollup-state-contract";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { IDataLayer } from "../data-layer/IDataLayer";
import configuration, { NetworkConfig } from "../configuration";
import { InboxContract } from "./inbox-contract";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration]
    }),
    MongooseModule.forFeature([{ name: Messages.name, schema: MessagesSchema }]),
  ],
  providers: [
    DataLayerService,
    {
      provide: "OutboxContracts",
      useFactory: (config: ConfigService, dataLayer: IDataLayer) => {
        // Instantiate Outbox contract listeners for rollups that support outgoing communication
        return config.get<NetworkConfig[]>("networks.rollups")
          .filter(config => config.outgoing.supported)
          .map((config) => new OutboxContract(dataLayer, config));
      },
      inject: [ConfigService, DataLayerService]
    },
    {
      provide: "RollupStateContracts",
      useFactory: (config: ConfigService, dataLayer: IDataLayer) => {
        const l1RpcUrl = config.get<string>("networks.l1.executionNode");
        // Instantiate Rollup contract listeners for rollups that support outgoing communication
        return config.get<NetworkConfig[]>("networks.rollups")
          .filter(config => config.outgoing.supported)
          .map((config) => new RollupStateContract(dataLayer, config, l1RpcUrl));
      },
      inject: [ConfigService, DataLayerService]
    },
    {
      provide: "InboxContracts",
      useFactory: (config: ConfigService, dataLayer: IDataLayer, eventEmitter: EventEmitter2) => {
        const l1RpcUrl = config.get<string>("networks.l1.executionNode");
        return config.get<NetworkConfig[]>("networks.rollups")
          .filter(config => config.incoming.supported)
          .map((config) => new InboxContract(dataLayer, config, l1RpcUrl, eventEmitter));
      },
      inject: [ConfigService, DataLayerService, EventEmitter2]
    },
  ]
})
export class MessagesModule {
}
