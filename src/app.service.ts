import { Injectable } from '@nestjs/common';
import { LightClientRelayService } from './light-client-relayer/light-client-relayer.service';
import { MessageRelayerService } from './message-relayer/message-relayer.service';
import { StateRelayerService } from './state-relayer/state-relayer.service';

@Injectable()
export class AppService {
  constructor(
    private readonly messageRelayService: MessageRelayerService,
    private readonly stateRelayService: StateRelayerService,
    private readonly lightClientRelayService: LightClientRelayService,
  ) {
    this.messageRelayService.init();
    this.stateRelayService.init();
    this.lightClientRelayService.init();
  }
}
