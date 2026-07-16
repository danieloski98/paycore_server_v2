import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { PaystackService } from 'src/common/services/paystack/paystack.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [WalletController],
  providers: [
    WalletService,
    PrismaService,
    PaystackService,
    ConfigService,
  ],
})
export class WalletModule {}
