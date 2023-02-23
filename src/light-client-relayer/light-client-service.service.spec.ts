import { Test, TestingModule } from '@nestjs/testing';
import { LightClientRelayService } from './light-client-service.service';

describe('LightClientRelayService', () => {
  let service: LightClientRelayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LightClientRelayService],
    }).compile();

    service = module.get<LightClientRelayService>(LightClientRelayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
