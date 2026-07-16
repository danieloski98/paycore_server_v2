import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ReturnType } from 'src/common/returnType';
import { PaystackService } from 'src/common/services/paystack/paystack.service';
import { RequestPayoutDto } from './dto/RequestPayout.dto';
import { PaymentStatus } from 'generated/prisma/enums';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  private logger = new Logger(WalletService.name);
  constructor(
    private prismaService: PrismaService,
    private paystackService: PaystackService,
  ) {}

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

  async getEmployeeWallet(employeeId: string) {
    try {
      const wallet = await this.prismaService.wallet.findFirst({
        where: {
          employeeId,
          isDeleted: false,
        },
      });

      if (!wallet) {
        // create new wallet for employee
        const newWallet = await this.prismaService.wallet.create({
          data: {
            employeeId,
            balance: 0.0,
            currency: 'NGN',
            walletType: 'EMPLOYEE',
          },
        });

        return new ReturnType({
          message: 'Wallet',
          success: true,
          data: newWallet,
        });
      }
      return new ReturnType({
        message: 'Wallet',
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

  async requestPayout(employeeId: string, payload: RequestPayoutDto) {
    const { amount, bankDetailsId } = payload;
    try {
      // 1. Fetch employee's wallet
      const wallet = await this.prismaService.wallet.findFirst({
        where: {
          employeeId,
          isDeleted: false,
        },
      });

      if (!wallet || wallet.balance < amount) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      // 2. Fetch destination bank details
      let bankDetails;
      if (bankDetailsId) {
        bankDetails = await this.prismaService.bankDetails.findFirst({
          where: {
            id: bankDetailsId,
            employeeId,
            isDeleted: false,
          },
        });
      } else {
        bankDetails = await this.prismaService.bankDetails.findFirst({
          where: {
            employeeId,
            isPrimary: true,
            isDeleted: false,
          },
        });
      }

      if (!bankDetails) {
        throw new NotFoundException('Destination bank details not found');
      }

      const charge = amount * 0.003; // 0.3% charge
      const netTransferAmount = amount - charge;

      if (netTransferAmount <= 0) {
        throw new BadRequestException('Payout amount is too small');
      }

      const reference = `PAYOUT-${uuidv4().replaceAll('-', '').slice(0, 10)}`;

      // Execute DB updates and transfer in a transaction
      await this.prismaService.$transaction(async (tx) => {
        // Double check wallet balance inside transaction for safety
        const txWallet = await tx.wallet.findFirst({
          where: { id: wallet.id },
        });

        if (!txWallet || txWallet.balance < amount) {
          throw new BadRequestException('Insufficient wallet balance');
        }

        // Debit the wallet by the gross amount
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: amount },
          },
        });

        // Create completed payment transaction record
        await tx.payment.create({
          data: {
            employeeId,
            walletId: wallet.id,
            amount,
            charge,
            reference,
            status: PaymentStatus.COMPLETED,
          },
        });

        // Disburse the net amount to the employee's bank account via Paystack
        await this.paystackService.initiateSingleTransfer({
          amount: netTransferAmount,
          reference,
          narration: `Wallet payout withdrawal`,
          destinationBankCode: bankDetails.bankCode,
          destinationAccountNumber: bankDetails.accountNumber,
          destinationAccountName: bankDetails.accountName,
          async: true,
        });
      });

      return new ReturnType({
        success: true,
        message: 'Payout request completed successfully',
        data: {
          amount,
          charge,
          netAmount: netTransferAmount,
          reference,
        },
      });
    } catch (error) {
      this.logger.error('Payout request failed:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error?.message || 'An error occurred while processing the payout request',
      );
    }
  }
}
