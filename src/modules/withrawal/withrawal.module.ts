import { Module } from '@nestjs/common';
import { WithrawalController } from './withrawal.controller';
import { WithrawalService } from './withrawal.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { NotificationService } from 'src/common/services/notification/notification.service';
import { EmailService } from 'src/common/services/email/email.service';
import { PaystackService } from 'src/common/services/paystack/paystack.service';

@Module({
  controllers: [WithrawalController],
  providers: [
    WithrawalService,
    PrismaService,
    NotificationService,
    EmailService,
    PaystackService,
  ],
  exports: [WithrawalService],
})
export class WithrawalModule {}
