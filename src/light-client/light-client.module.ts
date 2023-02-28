import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { BeaconService } from "./beacon/beacon.service";
import { LightClientService } from "./light-client.service";
import { ProverService } from "./prover/prover.service";
import { ApiController } from "./api.controller";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { NetworkConfig } from "../configuration";
import { LightClientContract } from "./light-client-contract";

@Module({
  imports: [ConfigModule, EventEmitterModule.forRoot()],
  controllers: [ApiController],
  providers: [BeaconService, ProverService, LightClientService, {
    provide: "LightClients",
    useFactory: (config: ConfigService, eventEmitter: EventEmitter2) => {
      return config.get<NetworkConfig[]>("lightClient.networks")
        .map((networkConfig: NetworkConfig) => new LightClientContract(networkConfig, eventEmitter));
    },
    inject: [ConfigService, EventEmitter2]
  }]
})
export class LightClientModule {}
