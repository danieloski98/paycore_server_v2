import { Test, TestingModule } from '@nestjs/testing';
import { PayslipsProcessingService } from './payslips-processing.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { PaystackService } from '../../../services/paystack/paystack.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { EmailService } from '../../../services/email/email.service';

describe('PayslipsProcessingService', () => {
  let service: PayslipsProcessingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayslipsProcessingService,
        {
          provide: PrismaService,
          useValue: {
            payslip: { findFirst: jest.fn(), update: jest.fn() },
            bankDetails: { findFirst: jest.fn() },
            earning: { aggregate: jest.fn() },
            deduction: { aggregate: jest.fn() },
            wallet: { findFirst: jest.fn(), update: jest.fn() },
            company: { findUnique: jest.fn() },
            $transaction: jest.fn(),
          },
        },
        {
          provide: PaystackService,
          useValue: {},
        },
        {
          provide: NotificationService,
          useValue: {
            sendCompanyNotification: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendPayslipFailedEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PayslipsProcessingService>(PayslipsProcessingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
