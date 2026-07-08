import { Module } from '@nestjs/common';
import { PayrollController } from './payroll.controller';
import { PayslipsController } from './payslips.controller';
import { PayrollService } from './payroll.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from 'src/common/services/notification/notification.service';
import { CompanyService } from '../company/company.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  controllers: [PayrollController, PayslipsController],
  providers: [
    PayrollService,
    PrismaService,
    JwtService,
    ConfigService,
    NotificationService,
    CompanyService,
  ],
  imports: [
    BullModule.registerQueue({
      name: 'payslip-processing',
    }),
  ],
})
export class PayrollModule {}
