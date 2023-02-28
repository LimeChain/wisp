import { Test, TestingModule } from '@nestjs/testing';
import { MessageListener } from './message-listener.service';

describe('MessageListener', () => {
  let service: MessageListener;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MessageListener],
    }).compile();

    service = module.get<MessageListener>(MessageListener);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
