import { Injectable } from '@nestjs/common';
import { MessageRelayerService } from './message-relayer/message-relayer.service';

@Injectable()
export class AppService {
  constructor(private readonly messageRelayService: MessageRelayerService) {
    this.messageRelayService.init();
  }
}
