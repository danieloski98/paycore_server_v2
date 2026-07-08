import { Module } from '@nestjs/common';
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { EmailService } from 'src/common/services/email/email.service';
import { NotificationService } from 'src/common/services/notification/notification.service';
import { EmployeeService } from '../employee/employee.service';
import { UploadService } from 'src/common/services/upload/upload.service';

@Module({
  controllers: [UserAuthController],
  providers: [
    UserAuthService,
    JwtService,
    ConfigService,
    PrismaService,
    EmailService,
    NotificationService,
    EmployeeService,
    UploadService,
  ],
})
export class UserAuthModule {}
