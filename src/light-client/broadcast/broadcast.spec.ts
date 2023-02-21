import { Test, TestingModule } from '@nestjs/testing';
import { BroadcastService } from './broadcast.service';

describe('Broadcast', () => {
  let provider: BroadcastService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BroadcastService],
    }).compile();

    provider = module.get<BroadcastService>(BroadcastService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
