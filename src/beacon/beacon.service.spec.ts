import { Test, TestingModule } from '@nestjs/testing';
import { BeaconService } from './beacon.service';
import { ConfigModule } from "@nestjs/config";

describe('BeaconService', () => {
  let service: BeaconService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [BeaconService],
    }).compile();

    service = module.get<BeaconService>(BeaconService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
