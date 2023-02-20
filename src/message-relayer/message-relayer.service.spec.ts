import { Test, TestingModule } from '@nestjs/testing';
import { MessageRelayerService } from './message-relayer.service';

describe('MessageRelayerService', () => {
  let service: MessageRelayerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageRelayerService],
    }).compile();

    service = module.get<MessageRelayerService>(MessageRelayerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
