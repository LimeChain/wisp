import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { BeaconService } from "./beacon/beacon.service";
import { LightClientService } from "./light-client.service";
import { ProverService } from "./prover/prover.service";
import { ApiController } from "./api.controller";

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [ApiController],
  providers: [BeaconService, ProverService, LightClientService],
})
export class LightClientModule {}
