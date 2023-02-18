import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppService } from "./app.service";
import { BeaconService } from "./beacon/beacon.service";
import { ProverService } from "./prover/prover.service";
import { LightClientService } from "./light-client/light-client.service";
import { ApiController } from "./api.controller";

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [ApiController],
  providers: [AppService, BeaconService, LightClientService, ProverService],
})
export class AppModule {
}
