import { Test, TestingModule } from '@nestjs/testing';
import { PayslipsProcessingService } from './payslips-processing.service';

describe('PayslipsProcessingService', () => {
  let service: PayslipsProcessingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayslipsProcessingService],
    }).compile();

    service = module.get<PayslipsProcessingService>(PayslipsProcessingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
