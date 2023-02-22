import { Module } from '@nestjs/common';
import { ContractService } from './contracts/contracts.service';
import { MessageRelayerService } from './message-relayer.service';

@Module({
  providers: [MessageRelayerService, ContractService],
})
export class MessageRelayerModule {}
