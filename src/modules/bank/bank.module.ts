import { Module } from '@nestjs/common';
import { BankController } from './bank.controller';
import { BankService } from './bank.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaystackService } from 'src/common/services/paystack/paystack.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [BankController],
  providers: [BankService, PrismaService, PaystackService],
})
export class BankModule {}
