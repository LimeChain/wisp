import { Test, TestingModule } from '@nestjs/testing';
import { LightClientService } from './light-client.service';

describe('LightClientService', () => {
  let service: LightClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LightClientService],
    }).compile();

    service = module.get<LightClientService>(LightClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
