import { Test, TestingModule } from '@nestjs/testing';
import { WithrawalService } from './withrawal.service';

describe('WithrawalService', () => {
  let service: WithrawalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WithrawalService],
    }).compile();

    service = module.get<WithrawalService>(WithrawalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
