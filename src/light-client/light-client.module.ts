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

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration]
    }),
    EventEmitterModule.forRoot(),
    SharedModule
  ],
  controllers: [ApiController],
  providers: [BeaconService, ProverService, LightClientService, {
    provide: "LightClients",
    useFactory: (signer: SignerService, config: ConfigService, eventEmitter: EventEmitter2) => {
      // Instantiate LightClient contracts for rollups that support outgoing communication
      return config.get<NetworkConfig[]>("networks.rollups")
        .filter(config => config.outgoing.supported)
        .map(config => new LightClientContract(signer, config, eventEmitter));
    },
    inject: [SignerService, ConfigService, EventEmitter2]
  }]
})
export class LightClientModule {
}
