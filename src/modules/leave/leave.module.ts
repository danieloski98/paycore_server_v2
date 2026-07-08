import { Module } from '@nestjs/common';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { EmployeeService } from '../employee/employee.service';
import { EmailService } from 'src/common/services/email/email.service';
import { UploadService } from 'src/common/services/upload/upload.service';
import { NotificationService } from 'src/common/services/notification/notification.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [LeaveController],
  providers: [
    LeaveService,
    PrismaService,
    EmployeeService,
    EmailService,
    NotificationService,
    UploadService,
  ],
})
export class LeaveModule {}
