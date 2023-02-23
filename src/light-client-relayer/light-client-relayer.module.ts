import { Module } from '@nestjs/common';
import { ContractService } from './contracts/contracts.service';
import { LightClientRelayService } from './light-client-relayer.service';

@Module({
  providers: [LightClientRelayService, ContractService],
})
export class LightClientRelayerModule {}
