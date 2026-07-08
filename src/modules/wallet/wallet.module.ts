import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Module({
  controllers: [WalletController],
  providers: [WalletService, PrismaService,],
})
export class WalletModule {}
