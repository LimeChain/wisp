import { Module } from '@nestjs/common';
import { MessageRelayerService } from './message-relayer.service';

@Module({
  providers: [MessageRelayerService]
})
export class MessageRelayerModule {}
