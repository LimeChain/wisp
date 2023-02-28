import { Test, TestingModule } from '@nestjs/testing';
import { LightClientListener } from './light-client-listener.service';

describe('LightClientListener', () => {
  let service: LightClientListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LightClientListener],
    }).compile();

    service = module.get<LightClientListener>(LightClientListener);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
