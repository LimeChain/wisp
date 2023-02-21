import { Module } from '@nestjs/common';
import { ConfigModule } from "@nestjs/config";
import { BeaconService } from "./beacon/beacon.service";
import { LightClientService } from "./light-client.service";
import { ProverService } from "./prover/prover.service";
import { ApiController } from "./api.controller";
import { BroadcastService } from "./broadcast/broadcast.service";

@Module({
  imports: [ConfigModule],
  controllers: [ApiController],
  providers: [BeaconService, ProverService, LightClientService, BroadcastService],
})
export class LightClientModule {}
