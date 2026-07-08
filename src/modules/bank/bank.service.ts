import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReturnType } from '../../common/returnType';
import { PaginatedQuery } from '../../common/classes/PaginatedQuery';
import { PaginatedResponse } from '../../common/classes/PagintedResponse';
import { ValidateBankDto } from './dto/ValidateBank.dto';
import { CreateBankRecordDto } from './dto/CreateBankRecord.dto';
import { UpdateBankRecordDto } from './dto/UpdateBankRecord.dto';
import { PaystackService } from 'src/common/services/paystack/paystack.service';

@Injectable()
export class BankService {
  private logger = new Logger(BankService.name);

  constructor(
    private databaseService: PrismaService,
    private paytsackService: PaystackService,
  ) {}

  async getBanks() {
    try {
      const banks = await this.paytsackService.getBanks();

      return new ReturnType({
        message: 'All banks',
        success: true,
        data: banks.data,
      });
    } catch (error) {
      this.logger.error('An error occured while fetching the banks', error);
      throw new InternalServerErrorException(error);
    }
  }

  async getEmployeeBanks(
    userId: string,
    query: PaginatedQuery,
  ): Promise<PaginatedResponse<any>> {
    try {
      const { page = 1, limit = 10 } = query;
      if (page < 1) throw new BadRequestException('Page number must be >= 1');
      if (limit < 1) throw new BadRequestException('Limit must be >= 1');
      const skip = (page - 1) * limit;

      const user = await this.databaseService.employee.findFirst({
        where: {
          id: userId,
          isDeleted: false,
          isActive: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Employee not found!');
      }

      const where = {
        employeeId: userId,
        isDeleted: false,
      };

      const [banks, total] = await Promise.all([
        this.databaseService.bankDetails.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.databaseService.bankDetails.count({ where }),
      ]);

      return new PaginatedResponse({
        success: true,
        message: 'Employee banks retrieved successfully',
        data: banks,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      this.logger.error('An error occurred while retrieving employee banks', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to retrieve employee banks');
    }
  }

  async validateBank({ payload }: { payload: ValidateBankDto }) {
    try {
      const response = await this.paytsackService.validateBank({
        accountNumber: payload.accountNumber,
        bankCode: payload.bankCode,
      });
      return new ReturnType({
        message: 'Bank validated',
        success: true,
        data: response?.data,
      });
    } catch (error) {
      this.logger.error('An error occured while fetching the banks', error);
      throw new InternalServerErrorException(error);
    }
  }

  async createBankRecord({
    payload,
    userId,
  }: {
    payload: CreateBankRecordDto;
    userId: string;
  }) {
    try {
      // get the user
      const user = await this.databaseService.employee.findUnique({
        where: {
          id: userId,
          isDeleted: false,
          isActive: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Empployee not found!');
      }

      // get the default bank
      const bank = await this.databaseService.bankDetails.findFirst({
        where: {
          employeeId: userId,
          isPrimary: true,
        },
      });

      if (!bank) {
        const newBank = await this.databaseService.bankDetails.create({
          data: {
            accountName: payload.accountName,
            accountNumber: payload.accountNumber,
            bankCode: payload.bankCode,
            bankName: payload.bankName,
            employeeId: userId,
            isPrimary: true,
          },
        });

        return new ReturnType({
          message: 'Bank added',
          success: true,
          data: newBank,
        });
      } else {
        const newBank = await this.databaseService.bankDetails.create({
          data: {
            accountName: payload.accountName,
            accountNumber: payload.accountNumber,
            bankCode: payload.bankCode,
            bankName: payload.bankName,
            employeeId: userId,
            isPrimary: false,
          },
        });

        return new ReturnType({
          message: 'Bank added',
          success: true,
          data: newBank,
        });
      }
    } catch (error) {
      this.logger.error('An error occured while fetching the banks', error);
      throw new InternalServerErrorException(error);
    }
  }

  async markBankAsPrimary({
    bankId,
    userId,
  }: {
    bankId: string;
    userId: string;
  }) {
    try {
      // First check if the bank exists and belongs to the user
      const bank = await this.databaseService.bankDetails.findFirst({
        where: {
          id: bankId,
          employeeId: userId,
          isDeleted: false,
        },
      });

      if (!bank) {
        throw new NotFoundException('Bank record not found!');
      }

      // Update all banks to non-primary
      await this.databaseService.bankDetails.updateMany({
        where: {
          employeeId: userId,
          isDeleted: false,
        },
        data: {
          isPrimary: false,
        },
      });

      // Set the selected bank as primary
      const updatedBank = await this.databaseService.bankDetails.update({
        where: {
          id: bankId,
        },
        data: {
          isPrimary: true,
        },
      });

      return new ReturnType({
        message: 'Bank marked as primary',
        success: true,
        data: updatedBank,
      });
    } catch (error) {
      this.logger.error(
        'An error occurred while marking bank as primary',
        error,
      );
      throw new InternalServerErrorException(error);
    }
  }

  async updateBankRecord({
    bankId,
    userId,
    payload,
  }: {
    bankId: string;
    userId: string;
    payload: UpdateBankRecordDto;
  }) {
    try {
      // Check if the bank exists and belongs to the user
      const bank = await this.databaseService.bankDetails.findFirst({
        where: {
          id: bankId,
          employeeId: userId,
          isDeleted: false,
        },
      });

      if (!bank) {
        throw new NotFoundException('Bank record not found!');
      }

      // Update the bank record
      const updatedBank = await this.databaseService.bankDetails.update({
        where: {
          id: bankId,
        },
        data: {
          ...payload,
        },
      });

      return new ReturnType({
        message: 'Bank record updated successfully',
        success: true,
        data: updatedBank,
      });
    } catch (error) {
      this.logger.error('An error occurred while updating bank record', error);
      throw new InternalServerErrorException(error);
    }
  }

  async softDeleteBankRecord({
    bankId,
    userId,
  }: {
    bankId: string;
    userId: string;
  }) {
    try {
      // Check if the bank exists and belongs to the user
      const bank = await this.databaseService.bankDetails.findFirst({
        where: {
          id: bankId,
          employeeId: userId,
          isDeleted: false,
        },
      });

      if (!bank) {
        throw new NotFoundException('Bank record not found!');
      }

      // If this is the primary bank, we should prevent deletion
      if (bank.isPrimary) {
        throw new InternalServerErrorException(
          'Cannot delete primary bank account. Please set another bank as primary first.',
        );
      }

      // Soft delete the bank record
      const deletedBank = await this.databaseService.bankDetails.update({
        where: {
          id: bankId,
        },
        data: {
          isDeleted: true,
        },
      });

      return new ReturnType({
        message: 'Bank record deleted successfully',
        success: true,
        data: deletedBank,
      });
    } catch (error) {
      this.logger.error('An error occurred while deleting bank record', error);
      throw new InternalServerErrorException(error);
    }
  }
}
