import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { PaystackService } from 'src/common/services/paystack/paystack.service';

@Module({
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PrismaService,
    WalletService,
    PaystackService,
  ],
})
export class PaymentModule {}
