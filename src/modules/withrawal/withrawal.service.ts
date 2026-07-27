import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ReturnType } from 'src/common/returnType';
import { PaginatedQuery } from 'src/common/classes/PaginatedQuery';
import { PaginatedResponse } from 'src/common/classes/PagintedResponse';
import { WithdrawalRequestStatus, PaymentStatus, Prisma } from 'generated/prisma/client';
import { CreateWithdrawalRequestDto } from './dto/CreateWithdrawalRequestDto';
import { UpdateWithdrawalRequestDto } from './dto/UpdateWithdrawalRequestDto';
import { ChangeWithdrawalRequestStatusDto } from './dto/ChangeWithdrawalRequestStatusDto';
import { GetWithdrawalRequestsQueryDto } from './dto/GetWithdrawalRequestsQueryDto';
import { NotificationService } from 'src/common/services/notification/notification.service';
import { PaystackService } from 'src/common/services/paystack/paystack.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WithrawalService {
  private logger = new Logger(WithrawalService.name);

  constructor(
    private prismaService: PrismaService,
    private notificationService: NotificationService,
    private paystackService: PaystackService,
  ) {}

  /**
   * Create a new withdrawal request
   */
  async createWithdrawalRequest({
    employeeId,
    payload,
  }: {
    employeeId: string;
    payload: CreateWithdrawalRequestDto;
  }) {
    try {
      const employee = await this.prismaService.employee.findFirst({
        where: {
          id: employeeId,
          isActive: true,
          isDeleted: false,
        },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found or inactive');
      }

      const bankDetails = await this.prismaService.bankDetails.findFirst({
        where: {
          id: payload.bankId,
          employeeId,
          isDeleted: false,
        },
      });

      if (!bankDetails) {
        throw new NotFoundException('Bank details not found for this employee');
      }

      const withdrawalRequest = await this.prismaService.withdrawalRequest.create({
        data: {
          employeeId,
          amount: payload.amount,
          bankId: payload.bankId,
          status: WithdrawalRequestStatus.PENDING,
        },
        include: {
          Employee: true,
          bankDetails: true,
        },
      });

      // Create activity log
      if (employee.companyId) {
        await this.prismaService.activityLog.create({
          data: {
            type: 'WITHDRAWAL',
            action: 'WITHDRAWAL REQUESTED',
            description: `Withdrawal request of amount ${payload.amount} submitted by ${employee.firstName} ${employee.lastName}`,
            companyId: employee.companyId,
            employeeId,
          },
        });

        // Notify company
        try {
          await this.notificationService.sendCompanyNotification(
            employee.companyId,
            'New Withdrawal Request',
            `A withdrawal request of amount ${payload.amount} was submitted by ${employee.firstName} ${employee.lastName}.`,
          );
        } catch (notifyError) {
          this.logger.error('Failed to send company notification for withdrawal request', notifyError);
        }
      }

      return new ReturnType({
        message: 'Withdrawal request created successfully',
        success: true,
        data: withdrawalRequest,
      });
    } catch (error) {
      this.logger.error('Error creating withdrawal request:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('An error occurred while creating withdrawal request');
    }
  }

  /**
   * Get paginated withdrawal requests with filters by status, employeeId, and companyId
   */
  async getWithdrawalRequests(
    query: GetWithdrawalRequestsQueryDto,
    companyId?: string,
  ) {
    try {
      const { page, limit } = new PaginatedQuery(query.page, query.limit);

      const whereClause: Prisma.WithdrawalRequestWhereInput = {
        isDeleted: false,
      };

      if (query.status) {
        whereClause.status = query.status;
      }

      if (query.employeeId) {
        whereClause.employeeId = query.employeeId;
      }

      if (companyId) {
        whereClause.Employee = {
          companyId,
        };
      }

      const [withdrawalRequests, total] = await Promise.all([
        this.prismaService.withdrawalRequest.findMany({
          where: whereClause,
          include: {
            Employee: true,
            bankDetails: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prismaService.withdrawalRequest.count({
          where: whereClause,
        }),
      ]);

      const totalPages = Math.ceil(total / limit) || 1;

      return new PaginatedResponse({
        success: true,
        message: 'Withdrawal requests retrieved successfully',
        data: withdrawalRequests,
        total,
        page,
        totalPages,
        limit,
      });
    } catch (error) {
      this.logger.error('Error retrieving withdrawal requests:', error);
      throw new BadRequestException('An error occurred while retrieving withdrawal requests');
    }
  }

  /**
   * Get withdrawal request by ID
   */
  async getWithdrawalRequestById(id: string, companyId?: string) {
    try {
      const whereClause: Prisma.WithdrawalRequestWhereInput = {
        id,
        isDeleted: false,
      };

      if (companyId) {
        whereClause.Employee = {
          companyId,
        };
      }

      const withdrawalRequest = await this.prismaService.withdrawalRequest.findFirst({
        where: whereClause,
        include: {
          Employee: true,
          bankDetails: true,
        },
      });

      if (!withdrawalRequest) {
        throw new NotFoundException('Withdrawal request not found');
      }

      return new ReturnType({
        message: 'Withdrawal request retrieved successfully',
        success: true,
        data: withdrawalRequest,
      });
    } catch (error) {
      this.logger.error('Error retrieving withdrawal request:', error);
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('An error occurred while retrieving withdrawal request');
    }
  }

  /**
   * Update a withdrawal request
   */
  async updateWithdrawalRequest(
    id: string,
    payload: UpdateWithdrawalRequestDto,
    employeeId?: string,
  ) {
    try {
      const withdrawalRequest = await this.prismaService.withdrawalRequest.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!withdrawalRequest) {
        throw new NotFoundException('Withdrawal request not found');
      }

      if (employeeId && withdrawalRequest.employeeId !== employeeId) {
        throw new ForbiddenException('You are not authorized to update this withdrawal request');
      }

      if (withdrawalRequest.status !== WithdrawalRequestStatus.PENDING) {
        throw new BadRequestException('Only pending withdrawal requests can be updated');
      }

      if (payload.bankId) {
        const bankDetails = await this.prismaService.bankDetails.findFirst({
          where: {
            id: payload.bankId,
            employeeId: withdrawalRequest.employeeId,
            isDeleted: false,
          },
        });

        if (!bankDetails) {
          throw new NotFoundException('Bank details not found for employee');
        }
      }

      const updated = await this.prismaService.withdrawalRequest.update({
        where: { id },
        data: {
          ...(payload.amount !== undefined && { amount: payload.amount }),
          ...(payload.bankId && { bankId: payload.bankId }),
        },
        include: {
          Employee: true,
          bankDetails: true,
        },
      });

      return new ReturnType({
        message: 'Withdrawal request updated successfully',
        success: true,
        data: updated,
      });
    } catch (error) {
      this.logger.error('Error updating withdrawal request:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('An error occurred while updating withdrawal request');
    }
  }

  /**
   * Approve or Reject a withdrawal request
   */
  async changeWithdrawalRequestStatus(
    id: string,
    payload: ChangeWithdrawalRequestStatusDto,
    companyId?: string,
  ) {
    try {
      const whereClause: Prisma.WithdrawalRequestWhereInput = {
        id,
        isDeleted: false,
      };

      if (companyId) {
        whereClause.Employee = { companyId };
      }

      const withdrawalRequest = await this.prismaService.withdrawalRequest.findFirst({
        where: whereClause,
        include: {
          Employee: true,
          bankDetails: true,
        },
      });

      if (!withdrawalRequest) {
        throw new NotFoundException('Withdrawal request not found');
      }

      if (withdrawalRequest.status === payload.status) {
        throw new BadRequestException(`Withdrawal request is already ${payload.status}`);
      }

      let updated;

      if (payload.status === WithdrawalRequestStatus.APPROVED) {
        if (!withdrawalRequest.bankDetails) {
          throw new BadRequestException('Bank details missing for this withdrawal request');
        }

        const reference = `WITHDRAWAL-${uuidv4().replaceAll('-', '').slice(0, 10)}`;

        updated = await this.prismaService.$transaction(async (tx) => {
          // Check employee wallet
          const wallet = await tx.wallet.findFirst({
            where: {
              employeeId: withdrawalRequest.employeeId,
              isDeleted: false,
            },
          });

          if (!wallet || wallet.balance < withdrawalRequest.amount) {
            throw new BadRequestException('Insufficient employee wallet balance');
          }

          // 1. Deduct amount from user's wallet balance
          await tx.wallet.update({
            where: { id: wallet.id },
            data: {
              balance: { decrement: withdrawalRequest.amount },
            },
          });

          // 2. Create completed payment transaction record
          await tx.payment.create({
            data: {
              employeeId: withdrawalRequest.employeeId,
              walletId: wallet.id,
              amount: withdrawalRequest.amount,
              reference,
              status: PaymentStatus.COMPLETED,
            },
          });

          // 3. Update status to APPROVED
          const updatedRequest = await tx.withdrawalRequest.update({
            where: { id },
            data: {
              status: WithdrawalRequestStatus.APPROVED,
            },
            include: {
              Employee: true,
              bankDetails: true,
            },
          });

          // 4. Withdraw/transfer money from Paystack to employee bank account
          await this.paystackService.initiateSingleTransfer({
            amount: withdrawalRequest.amount,
            reference,
            narration: `Approved withdrawal request payout`,
            destinationBankCode: withdrawalRequest.bankDetails.bankCode,
            destinationAccountNumber: withdrawalRequest.bankDetails.accountNumber,
            destinationAccountName: withdrawalRequest.bankDetails.accountName,
            async: true,
          });

          return updatedRequest;
        });
      } else {
        updated = await this.prismaService.withdrawalRequest.update({
          where: { id },
          data: {
            status: payload.status,
          },
          include: {
            Employee: true,
            bankDetails: true,
          },
        });
      }

      // Log activity
      if (withdrawalRequest.Employee?.companyId) {
        await this.prismaService.activityLog.create({
          data: {
            type: 'WITHDRAWAL',
            action: `WITHDRAWAL REQUEST ${payload.status}`,
            description: `Withdrawal request of amount ${withdrawalRequest.amount} for ${withdrawalRequest.Employee.firstName} ${withdrawalRequest.Employee.lastName} was marked as ${payload.status}`,
            companyId: withdrawalRequest.Employee.companyId,
            employeeId: withdrawalRequest.employeeId,
          },
        });
      }

      // Notify employee
      try {
        await this.notificationService.sendEmployeeNotification(
          withdrawalRequest.employeeId,
          `Withdrawal Request ${payload.status}`,
          `Your withdrawal request of amount ${withdrawalRequest.amount} has been ${payload.status.toLowerCase()}.`,
        );
      } catch (notifyError) {
        this.logger.error('Failed to notify employee on status change', notifyError);
      }

      return new ReturnType({
        message: `Withdrawal request status updated to ${payload.status}`,
        success: true,
        data: updated,
      });
    } catch (error) {
      this.logger.error('Error changing withdrawal request status:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('An error occurred while changing withdrawal request status');
    }
  }

  /**
   * Delete a withdrawal request (soft delete)
   */
  async deleteWithdrawalRequest(id: string, employeeId?: string) {
    try {
      const withdrawalRequest = await this.prismaService.withdrawalRequest.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!withdrawalRequest) {
        throw new NotFoundException('Withdrawal request not found');
      }

      if (employeeId && withdrawalRequest.employeeId !== employeeId) {
        throw new ForbiddenException('You are not authorized to delete this withdrawal request');
      }

      await this.prismaService.withdrawalRequest.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return new ReturnType({
        message: 'Withdrawal request deleted successfully',
        success: true,
        data: null,
      });
    } catch (error) {
      this.logger.error('Error deleting withdrawal request:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('An error occurred while deleting withdrawal request');
    }
  }
}
