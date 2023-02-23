import { Test, TestingModule } from '@nestjs/testing';
import { StateRelayerService } from './state-relayer.service';

describe('StateRelayerService', () => {
  let service: StateRelayerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StateRelayerService],
    }).compile();

    service = module.get<StateRelayerService>(StateRelayerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
