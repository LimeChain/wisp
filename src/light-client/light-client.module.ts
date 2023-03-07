import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BeaconService } from "./beacon/beacon.service";
import { LightClientService } from "./light-client.service";
import { ProverService } from "./prover/prover.service";
import { ApiController } from "./api.controller";
import configuration, { NetworkConfig } from "../configuration";
import { SharedModule } from "../shared/shared.module";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { LightClientContract } from "./light-client-contract";
import { SignerService } from "../shared/signer.service";
import { PersistenceModule } from "../persistence/persistence.module";
import { PersistenceService } from "../persistence/persistence.service";

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    PersistenceModule,
    SharedModule
  ],
  controllers: [ApiController],
  providers: [BeaconService, ProverService, LightClientService, {
    provide: "LightClients",
    useFactory: (persistence: PersistenceService, signer: SignerService, config: ConfigService, eventEmitter: EventEmitter2) => {
      const l1RpcUrl = config.get<string>("networks.l1.executionNode.url");
      // Instantiate LightClient contracts for rollups that support outgoing communication
      return config.get<NetworkConfig[]>("networks.rollups")
        .filter(config => config.outgoing.supported)
        .map(config => new LightClientContract(persistence, signer, config, eventEmitter, l1RpcUrl));
    },
    inject: [PersistenceService, SignerService, ConfigService, EventEmitter2]
  }]
})
export class LightClientModule {
}
