import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Message, MessagesSchema } from "src/persistence/schemas/message.schema";
import { OutboxContract } from "./outbox-contract";
import { RollupStateContract } from "./rollup-state-contract";
import { ConfigModule, ConfigService } from "@nestjs/config";
import configuration, { NetworkConfig } from "../configuration";
import { InboxContract } from "./inbox-contract";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { SharedModule } from "../shared/shared.module";
import { SignerService } from "../shared/signer.service";
import { PersistenceService } from "../persistence/persistence.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration]
    }),
    MongooseModule.forFeature([{ name: Message.name, schema: MessagesSchema }]),
    SharedModule
  ],
  providers: [
    PersistenceService,
    {
      provide: "OutboxContracts",
      useFactory: (config: ConfigService, persistence: PersistenceService) => {
        // Instantiate Outbox contract listeners for rollups that support outgoing communication
        return config.get<NetworkConfig[]>("networks.rollups")
          .filter(config => config.outgoing.supported)
          .map((config) => new OutboxContract(persistence, config));
      },
      inject: [ConfigService, PersistenceService]
    },
    {
      provide: "RollupStateContracts",
      useFactory: (config: ConfigService, persistence: PersistenceService) => {
        const l1RpcUrl = config.get<string>("networks.l1.executionNode.url");
        // Instantiate Rollup contract listeners for rollups that support outgoing communication
        return config.get<NetworkConfig[]>("networks.rollups")
          .filter(config => config.outgoing.supported)
          .map((config) => new RollupStateContract(persistence, config, l1RpcUrl));
      },
      inject: [ConfigService, PersistenceService]
    },
    {
      provide: "InboxContracts",
      useFactory: (signerService: SignerService, config: ConfigService, persistence: PersistenceService, eventEmitter: EventEmitter2) => {
        const l1RpcUrl = config.get<string>("networks.l1.executionNode.url");
        const networksConfig = config.get<NetworkConfig[]>("networks.rollups");
        return networksConfig.filter(config => config.incoming.supported)
          .map((config) => new InboxContract(persistence, signerService, config, l1RpcUrl, networksConfig, eventEmitter));
      },
      inject: [SignerService, ConfigService, PersistenceService, EventEmitter2]
    }
  ]
})
export class MessagesModule {
}
