import { Test, TestingModule } from '@nestjs/testing';
import { ProverService } from './prover.service';
import { ConfigModule, ConfigService } from "@nestjs/config";

describe('ProverService', () => {
  let service: ProverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [ProverService],
    }).compile();

    service = module.get<ProverService>(ProverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
