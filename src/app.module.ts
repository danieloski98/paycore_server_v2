import 'dotenv/config';
import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EmailService } from './common/services/email/email.service';
import { PrismaService } from './common/prisma/prisma.service';
import { OtpService } from './common/services/otp/otp.service';
import { PayslipsProcessingService } from './common/events/payslips/payslips-processing/payslips-processing.service';
import { PayslipsCreationService } from './common/events/payslips/payslips-creation/payslips-creation.service';
import { PaystackService } from './common/services/paystack/paystack.service';
import { NotificationService } from './common/services/notification/notification.service';
import { UserAuthModule } from './modules/user-auth/user-auth.module';
import { EmployeeModule } from './modules/employee/employee.module';
import { UserModule } from './modules/user/user.module';
import { CompanyModule } from './modules/company/company.module';
import { BankModule } from './modules/bank/bank.module';
import { LeaveModule } from './modules/leave/leave.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { JwtModule } from '@nestjs/jwt';
import { createKeyv } from '@keyv/redis';
import { TransactionModule } from './modules/transaction/transaction.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { PaymentModule } from './modules/payment/payment.module';
import { UploadModule } from './common/services/upload/upload.module';
import { DepartmentModule } from './modules/department/department.module';


const logger = new Logger();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => ({
        stores: [createKeyv(`${configService.get('REDIS_URL')}`)],
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        connection: {
          url: config.get('REDIS_URL'),
          reconnectOnError: true,
          failoverDetector: true,
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'payslip-creation',
    }),
    BullModule.registerQueue({
      name: 'payslip-processing',
    }),
    BullModule.registerQueue({
      name: 'BullQueue_payslip-processing',
    }),
    EventEmitterModule.forRoot({
      global: true,
    }),
    UserAuthModule,
    EmployeeModule,
    UserModule,
    CompanyModule,
    BankModule,
    LeaveModule,
    WalletModule,
    TransactionModule,
    PayrollModule,
    PaymentModule,
    UploadModule,
    DepartmentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    EmailService,
    PrismaService,
    OtpService,
    PayslipsProcessingService,
    PayslipsCreationService,
    PaystackService,
    NotificationService,
  ],
})
export class AppModule { }
