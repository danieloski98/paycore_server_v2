import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreatePaymentDto } from './dto/CreatePayment.dto';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError } from 'rxjs';
import { ReturnType } from 'src/common/returnType';
import { WalletService } from '../wallet/wallet.service';
import { PaystackService } from 'src/common/services/paystack/paystack.service';
import { PaginatedQuery } from 'src/common/classes/PaginatedQuery';
import { PaginatedResponse } from 'src/common/classes/PagintedResponse';
import { PaymentStatus } from 'generated/prisma/enums';

@Injectable()
export class PaymentService {
  private logger = new Logger(PaymentService.name);
  constructor(
    private databaseService: PrismaService,
    private walletService: WalletService,
    private paystackService: PaystackService,
  ) { }

  async createPayment(companyId: string, createPaymentDto: CreatePaymentDto) {
    try {
      const id = `TRN-${uuidv4().replaceAll('-', '').slice(0, 10)}`;
      const wallet = await this.databaseService.wallet.findFirst({
        where: {
          companyId,
        },
      });

      if (!wallet) {
        throw new NotFoundError('Company Wallet not found');
      }

      // Get company details with creator information
      const company = await this.databaseService.company.findUnique({
        where: {
          id: companyId,
        },
        include: {
          User: true,
        },
      });

      if (!company) {
        throw new NotFoundError('Company not found');
      }

      const record = await this.databaseService.payment.create({
        data: {
          walletId: wallet?.id,
          amount: createPaymentDto.amount,
          reference: id,
          companyId,
        },
      });

      return new ReturnType({
        data: record,
        message: 'Payment created successfully',
        success: true,
      });
    } catch (error) {
      this.logger.error(error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        'An error occured, while trying to create a Payment record',
      );
    }
  }

  async validatePayment(companyId: string, transactionReference: string, userId?: string) {
    try {
      this.logger.debug(
        'Validating payment with reference:',
        transactionReference,
      );
      this.logger.debug('companyId', companyId);
      const response =
        await this.paystackService.validateTransaction(transactionReference);

      if (!response.data.status) {
        throw new BadRequestException(response.message);
      }

      const wallet = await this.walletService.getWallet(companyId);

      if (!wallet) {
        throw new NotFoundError('Company Wallet not found');
      }
      // update the company wallet value
      await this.databaseService.wallet.update({
        where: {
          id: wallet.data.id,
        },
        data: {
          balance: { increment: Number(response.data.amount / 100) },
        },
      });

      // mark the transaction as paid
      await this.databaseService.payment.updateMany({
        where: {
          reference: transactionReference,
        },
        data: {
          status: PaymentStatus.COMPLETED,
        },
      });

      // create activity log for the company
      let actorName = 'System';
      if (userId) {
        const user = await this.databaseService.user.findUnique({
          where: { id: userId },
        });
        if (user) {
          actorName = `${user.firstName} ${user.lastName}`;
        }
      }
      const amountFunded = Number(response.data.amount / 100);
      await this.databaseService.activityLog.create({
        data: {
          type: 'WALLET',
          action: 'WALLET FUNDED',
          description: `Company wallet funded with ${amountFunded} NGN by ${actorName}`,
          companyId,
          actorId: userId || null,
        },
      });

      return new ReturnType({
        data: response.data,
        message: 'Payment validated',
        success: true,
      });
    } catch (error) {
      this.logger.error(error);
      if (
        error instanceof NotAcceptableException ||
        error instanceof BadGatewayException
      )
        throw error;
      throw new BadRequestException(
        'An error occured, while trying to validate a Payment record',
      );
    }
  }

  async getCompanyPayments(
    companyId: string,
    query: PaginatedQuery,
  ): Promise<PaginatedResponse<any>> {
    try {
      const { page = 1, limit = 10 } = query;
      if (page < 1) throw new BadRequestException('Page number must be >= 1');
      if (limit < 1) throw new BadRequestException('Limit must be >= 1');
      const skip = (page - 1) * limit;

      const where = {
        companyId,
        isDeleted: false,
        status: {
          in: [PaymentStatus.FAILED, PaymentStatus.COMPLETED],
        },
      };

      const [payments, total] = await Promise.all([
        this.databaseService.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.databaseService.payment.count({ where }),
      ]);

      this.logger.debug('payments', payments);

      return new PaginatedResponse({
        success: true,
        message: 'Company payments retrieved successfully',
        data: payments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      this.logger.error('Error getting payments by company ID:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        'An error occurred while retrieving company payments',
      );
    }
  }

  async getEmployeePayments(
    employeeId: string,
    query: PaginatedQuery,
  ): Promise<PaginatedResponse<any>> {
    try {
      const { page = 1, limit = 10 } = query;
      if (page < 1) throw new BadRequestException('Page number must be >= 1');
      if (limit < 1) throw new BadRequestException('Limit must be >= 1');
      const skip = (page - 1) * limit;

      const where = {
        employeeId,
        isDeleted: false,
        status: {
          in: [PaymentStatus.FAILED, PaymentStatus.COMPLETED, PaymentStatus.PENDING],
        },
      };

      const [payments, total] = await Promise.all([
        this.databaseService.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.databaseService.payment.count({ where }),
      ]);

      return new PaginatedResponse({
        success: true,
        message: 'Employee payments retrieved successfully',
        data: payments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      this.logger.error('Error getting payments by employee ID:', error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        'An error occurred while retrieving employee payments',
      );
    }
  }
}
