import { Test, TestingModule } from '@nestjs/testing';
import { RollupListener } from './rollup-listener.service';

describe('RollupListener', () => {
  let service: RollupListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RollupListener],
    }).compile();

    service = module.get<RollupListener>(RollupListener);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
