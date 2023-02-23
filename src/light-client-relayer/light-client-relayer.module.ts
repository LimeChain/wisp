import { Module } from '@nestjs/common';
import { ContractService } from './contracts/contracts.service';
import { LightClientRelayService } from './light-client-service.service';

@Module({
  providers: [LightClientRelayService, ContractService],
})
export class LightClientRelayerModule {}
