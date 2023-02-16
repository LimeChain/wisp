import { Module } from '@nestjs/common';
import { ApiController } from './api.controller';
import { AppService } from './app.service';
import { ProverService } from './prover/prover.service';
import { ConfigModule } from '@nestjs/config';
import { BeaconService } from './beacon/beacon.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [ApiController],
  providers: [AppService, ProverService, BeaconService],
})
export class AppModule {}
