import { Module } from '@nestjs/common';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { EmailService } from 'src/common/services/email/email.service';
import { UploadService } from 'src/common/services/upload/upload.service';

@Module({
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    ConfigService,
    PrismaService,
    EmailService,
    UploadService,
  ],
})
export class EmployeeModule {}
