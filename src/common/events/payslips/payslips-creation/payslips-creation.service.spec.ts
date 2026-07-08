import { Test, TestingModule } from '@nestjs/testing';
import { PayslipsCreationService } from './payslips-creation.service';

describe('PayslipsCreationService', () => {
  let service: PayslipsCreationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayslipsCreationService],
    }).compile();

    service = module.get<PayslipsCreationService>(PayslipsCreationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
