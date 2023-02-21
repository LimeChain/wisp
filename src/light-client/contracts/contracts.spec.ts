import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';

describe('Contracts', () => {
  let provider: ContractsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContractsService],
    }).compile();

    provider = module.get<ContractsService>(ContractsService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
