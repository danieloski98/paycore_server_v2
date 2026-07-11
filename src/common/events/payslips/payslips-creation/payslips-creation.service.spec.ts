import { Test, TestingModule } from '@nestjs/testing';
import { PayslipsCreationService } from './payslips-creation.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { NotificationService } from 'src/common/services/notification/notification.service';
import { EmailService } from 'src/common/services/email/email.service';

describe('PayslipsCreationService', () => {
  let service: PayslipsCreationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayslipsCreationService,
        {
          provide: PrismaService,
          useValue: {
            employee: { findMany: jest.fn() },
            payroll: { delete: jest.fn() },
            $transaction: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            sendCompanyNotification: jest.fn(),
            sendEmployeeNotification: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendBankDetailsRequestEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PayslipsCreationService>(PayslipsCreationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
