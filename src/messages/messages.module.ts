import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Message, MessagesSchema } from "src/database/schemas/message.schema";
import { DataLayerService } from "src/data-layer/data-layer.service";
import { OutboxContract } from "./outbox-contract";
import { RollupStateContract } from "./rollup-state-contract";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { IDataLayer } from "../data-layer/IDataLayer";
import configuration, { NetworkConfig } from "../configuration";
import { InboxContract } from "./inbox-contract";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SharedModule } from "../shared/shared.module";
import { SignerService } from "../shared/signer.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration]
    }),
    MongooseModule.forFeature([{ name: Message.name, schema: MessagesSchema }]),
    SharedModule
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
        const l1RpcUrl = config.get<string>("networks.l1.executionNode.url");
        // Instantiate Rollup contract listeners for rollups that support outgoing communication
        return config.get<NetworkConfig[]>("networks.rollups")
          .filter(config => config.outgoing.supported)
          .map((config) => new RollupStateContract(dataLayer, config, l1RpcUrl));
      },
      inject: [ConfigService, DataLayerService]
    },
    {
      provide: "InboxContracts",
      useFactory: (signerService: SignerService, config: ConfigService, dataLayer: IDataLayer, eventEmitter: EventEmitter2) => {
        const l1RpcUrl = config.get<string>("networks.l1.executionNode.url");
        const networksConfig = config.get<NetworkConfig[]>("networks.rollups");
        return networksConfig.filter(config => config.incoming.supported)
          .map((config) => new InboxContract(dataLayer, signerService, config, l1RpcUrl, networksConfig, eventEmitter));
      },
      inject: [SignerService, ConfigService, DataLayerService, EventEmitter2]
    }
  ]
})
export class MessagesModule {
}
