import { Injectable } from '@nestjs/common';
import { MessageRelayerService } from './message-relayer/message-relayer.service';
import { StateRelayerService } from './state-relayer/state-relayer.service';

@Injectable()
export class AppService {
  constructor(
    private readonly messageRelayService: MessageRelayerService,
    private readonly stateRelayService: StateRelayerService,
  ) {
    this.messageRelayService.init();
    this.stateRelayService.init();
  }
}
