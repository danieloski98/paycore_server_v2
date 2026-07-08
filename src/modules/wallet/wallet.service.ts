import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ReturnType } from 'src/common/returnType';

@Injectable()
export class WalletService {
  private logger = new Logger(WalletService.name);
  constructor(private prismaService: PrismaService) {}

  async getWallet(companyId: string) {
    try {
      const wallet = await this.prismaService.wallet.findFirst({
        where: {
          companyId,
          isDeleted: false,
        },
      });

      if (!wallet) {
        // create new wallet
        const wallet = await this.prismaService.wallet.create({
          data: {
            companyId,
            balance: 0.0,
            currency: 'NGN',
          },
        });

        return new ReturnType({
          message: 'Wallet',
          success: true,
          data: wallet,
        });
      }
      return new ReturnType({
        message: 'Wallet ',
        success: true,
        data: wallet,
      });
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException(
        'An error occured while getting the wallet',
      );
    }
  }
}
