import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { BeaconService } from "./beacon/beacon.service";
import { LightClientService } from "./light-client.service";
import { ProverService } from "./prover/prover.service";
import { ApiController } from "./api.controller";
import { ContractsService } from "./contracts/contracts.service";

@Module({
  imports: [ConfigModule],
  controllers: [ApiController],
  providers: [BeaconService, ProverService, LightClientService, ContractsService],
})
export class LightClientModule {}
