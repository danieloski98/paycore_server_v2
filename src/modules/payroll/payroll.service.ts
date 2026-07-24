import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { NotificationService } from 'src/common/services/notification/notification.service';
import { CreatePayrollDto } from './dto/CreatePayrollDto';
import { AddEmployeesToPayrollDto } from './dto/AddEmployeesToPayrollDto';
import { CompanyService } from '../company/company.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IEvent } from 'src/common/events';
import { CreatePayslipDto } from 'src/common/events/payslips/dto/CreatePayslipDto';
import { ReturnType } from 'src/common/returnType';
import { getMonthName } from 'src/utils/payrollDayUtils';
import { PaginatedQuery } from 'src/common/classes/PaginatedQuery';
import { PaginatedResponse } from 'src/common/classes/PagintedResponse';
import { PayrollStatus, PayslipStatus } from 'generated/prisma/enums';
import { CreateEarningDto } from './dto/CreateEarningDto';
import { CreateDeductionDto } from './dto/CreateDeductionDto';

@Injectable()
export class PayrollService {
  private logger = new Logger(PayrollService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notificationService: NotificationService,
    private companyService: CompanyService,
    private eventEmitterService: EventEmitter2,
    @InjectQueue('payslip-processing')
    private readonly payslipProcessingQueue: Queue,
  ) { }

  async createPayroll(companyId: string, payload: CreatePayrollDto, userId?: string) {
    try {
      await this.companyService.checkCompany(companyId);
      // verify employee exists
      const findEmployee = await this.prisma.employee.findMany({
        where: {
          id: { in: payload.employeeIds },
          companyId,
          isDeleted: false,
          isActive: true,
        },
      });

      if (findEmployee.length !== payload.employeeIds.length) {
        throw new BadRequestException(
          'One or more employees not found or are inactive',
        );
      }

      // create the payroll
      this.logger.debug('CREATING PAYROLL', payload);
      const newPayroll = await this.prisma.payroll.create({
        data: {
          month: payload.month,
          year: payload.year,
          name: payload.name,
          companyId,
        },
      });

      // off load process to event
      this.eventEmitterService.emit(
        IEvent.PAYSIPLS_CREATION,
        new CreatePayslipDto({
          companyId,
          payrollId: newPayroll.id,
          employeeIds: payload.employeeIds,
        }),
      );

      // create activity log for the company
      let actorName = 'System';
      if (userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (user) {
          actorName = `${user.firstName} ${user.lastName}`;
        }
      }

      await this.prisma.activityLog.create({
        data: {
          type: 'PAYROLL',
          action: 'PAYROLL CREATED',
          description: `Payroll "${payload.name}" for ${getMonthName(payload.month)} ${payload.year} was created by ${actorName}`,
          companyId,
          actorId: userId || null,
        },
      });

      await this.notificationService.sendCompanyNotification(
        companyId,
        'PAYROLL CREATED',
        `A new payroll has been created for ${getMonthName(payload.month)} ${payload.year}`,
      );

      return new ReturnType({
        message:
          'Payroll is currently been processed, check back in few minutes',
        success: true,
        data: null,
      });
    } catch (error) {
      this.logger.error(error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException('An error occured while creating payload');
    }
  }

  async getPayrollByCompanyId(companyId: string, query: PaginatedQuery) {
    try {
      this.logger.error('Company ID:', companyId);
      await this.companyService.checkCompany(companyId);
      const { page = 1, limit = 10 } = query;

      const payrolls = await this.prisma.payroll.findMany({
        where: {
          companyId,
          isDeleted: false,
        },
        include: {
          Payslip: {
            select: {
              id: true,
              status: true,
              netSalary: true,
            },
          },
          _count: {
            select: {
              Payslip: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const total = await this.prisma.payroll.count({
        where: {
          companyId,
          isDeleted: false,
        },
      });

      return new PaginatedResponse({
        message: 'Payrolls retrieved successfully',
        success: true,
        data: payrolls,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      this.logger.error('Error getting payrolls by company ID:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        'An error occurred while retrieving payrolls',
      );
    }
  }

  async getPayrollById(payrollId: string) {
    try {
      const payroll = await this.prisma.payroll.findFirst({
        where: {
          id: payrollId,
          isDeleted: false,
        },
        include: {
          Company: {
            select: {
              id: true,
              name: true,
            },
          },
          Payslip: {
            include: {
              Bank: {
                select: {
                  id: true,
                  bankName: true,
                  accountNumber: true,
                },
              },
              Employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  position: true,
                  department: true,
                  bankAccount: true,
                },
              },
            },
          },
          _count: {
            select: {
              Payslip: true,
            },
          },
        },
      });

      if (!payroll) {
        throw new NotFoundException('Payroll not found');
      }

      return new ReturnType({
        message: 'Payroll retrieved successfully',
        success: true,
        data: payroll,
      });
    } catch (error) {
      this.logger.error('Error getting payroll by ID:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        'An error occurred while retrieving payroll',
      );
    }
  }

  async getPayslipsByPayrollId(payrollId: string, query: PaginatedQuery) {
    try {
      const { page, limit } = query;

      // Check if payroll exists
      const payroll = await this.prisma.payroll.findFirst({
        where: {
          id: payrollId,
          isDeleted: false,
        },
      });

      if (!payroll) {
        throw new NotFoundException('Payroll not found');
      }

      const payslips = await this.prisma.payslip.findMany({
        where: {
          payrollId,
          isDeleted: false,
        },
        include: {
          Employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              position: true,
              department: true,
            },
          },
          Payroll: {
            select: {
              id: true,
              name: true,
              month: true,
              year: true,
              status: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const enriched = await Promise.all(
        payslips.map(async (p) => {
          const [earnAgg, dedAgg] = await Promise.all([
            this.prisma.earning.aggregate({
              where: {
                isDeleted: false,
                OR: [{ payrollId }, { employeeId: p.employeeId }],
              },
              _sum: { amount: true },
            }),
            this.prisma.deduction.aggregate({
              where: {
                isDeleted: false,
                OR: [{ payrollId }, { employeeId: p.employeeId }],
              },
              _sum: { amount: true },
            }),
          ]);
          const totalEarnings = earnAgg._sum?.amount ?? 0;
          const totalDeductions = dedAgg._sum?.amount ?? 0;
          return { ...p, totalEarnings, totalDeductions };
        }),
      );

      const total = await this.prisma.payslip.count({
        where: {
          payrollId,
          isDeleted: false,
        },
      });

      return new PaginatedResponse({
        message: 'Payslips retrieved successfully',
        success: true,
        data: enriched,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      this.logger.error('Error getting payslips by payroll ID:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        'An error occurred while retrieving payslips',
      );
    }
  }

  async getDetailedPayslipsByPayrollId(
    payrollId: string,
    query: PaginatedQuery,
  ) {
    try {
      const { page, limit } = query;

      // Check if payroll exists
      const payroll = await this.prisma.payroll.findFirst({
        where: {
          id: payrollId,
          isDeleted: false,
        },
      });

      if (!payroll) {
        throw new NotFoundException('Payroll not found');
      }

      const payslips = await this.prisma.payslip.findMany({
        where: {
          payrollId,
          isDeleted: false,
        },
        include: {
          Employee: true,
          Bank: true,
          Company: true,
          Payroll: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const enrichedPayslips = await Promise.all(
        payslips.map(async (payslip) => {
          const [earnings, deductions] = await Promise.all([
            this.prisma.earning.findMany({
              where: {
                isDeleted: false,
                OR: [
                  { payrollId: payslip.payrollId },
                  { employeeId: payslip.employeeId },
                ],
              },
            }),
            this.prisma.deduction.findMany({
              where: {
                isDeleted: false,
                OR: [
                  { payrollId: payslip.payrollId },
                  { employeeId: payslip.employeeId },
                ],
              },
            }),
          ]);

          const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
          const totalDeductions = deductions.reduce(
            (sum, d) => sum + d.amount,
            0,
          );
          const payoutAmount =
            payslip.netSalary + totalEarnings - totalDeductions;

          return {
            ...payslip,
            earnings,
            deductions,
            totalEarnings,
            totalDeductions,
            payoutAmount,
          };
        }),
      );

      const total = await this.prisma.payslip.count({
        where: {
          payrollId,
          isDeleted: false,
        },
      });

      return new PaginatedResponse({
        message: 'Detailed payslips retrieved successfully',
        success: true,
        data: enrichedPayslips,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      this.logger.error('Error getting detailed payslips by payroll ID:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        'An error occurred while retrieving detailed payslips',
      );
    }
  }

  async getPayslipsById(payslipId: string) {
    try {
      const payslip = await this.prisma.payslip.findFirst({
        where: {
          id: payslipId,
          isDeleted: false,
        },
        include: {
          Employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              position: true,
              department: true,
              salary: true,
            },
          },
          Payroll: {
            select: {
              id: true,
              name: true,
              month: true,
              year: true,
              status: true,
            },
          },
          Company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!payslip) {
        throw new NotFoundException('Payslip not found');
      }

      const [earnAgg, dedAgg] = await Promise.all([
        this.prisma.earning.aggregate({
          where: {
            isDeleted: false,
            OR: [
              { payrollId: payslip.payrollId },
              { employeeId: payslip.employeeId },
            ],
          },
          _sum: { amount: true },
        }),
        this.prisma.deduction.aggregate({
          where: {
            isDeleted: false,
            OR: [
              { payrollId: payslip.payrollId },
              { employeeId: payslip.employeeId },
            ],
          },
          _sum: { amount: true },
        }),
      ]);
      const totalEarnings = earnAgg._sum?.amount ?? 0;
      const totalDeductions = dedAgg._sum?.amount ?? 0;

      return new ReturnType({
        message: 'Payslip retrieved successfully',
        success: true,
        data: { ...payslip, totalEarnings, totalDeductions },
      });
    } catch (error) {
      this.logger.error('Error getting payslip by ID:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        'An error occurred while retrieving payslip',
      );
    }
  }

  async getPayslipsByEmployeeId(employeeId: string, query: PaginatedQuery) {
    try {
      const { page, limit } = query;

      // Check if employee exists
      const employee = await this.prisma.employee.findFirst({
        where: {
          id: employeeId,
          isDeleted: false,
        },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }



      const payslips = await this.prisma.payslip.findMany({
        where: {
          employeeId,
          isDeleted: false,
        },
        include: {
          Payroll: {
            select: {
              id: true,
              name: true,
              month: true,
              year: true,
              status: true,
            },
          },
          Company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const enriched = await Promise.all(
        payslips.map(async (p) => {
          const [earnAgg, dedAgg] = await Promise.all([
            this.prisma.earning.aggregate({
              where: {
                isDeleted: false,
                OR: [
                  { payrollId: p.payrollId },
                  { employeeId },
                ],
              },
              _sum: { amount: true },
            }),
            this.prisma.deduction.aggregate({
              where: {
                isDeleted: false,
                OR: [
                  { payrollId: p.payrollId },
                  { employeeId },
                ],
              },
              _sum: { amount: true },
            }),
          ]);
          const totalEarnings = earnAgg._sum?.amount ?? 0;
          const totalDeductions = dedAgg._sum?.amount ?? 0;
          return { ...p, totalEarnings, totalDeductions };
        }),
      );

      const total = await this.prisma.payslip.count({
        where: {
          employeeId,
          isDeleted: false,
        },
      });

      return new PaginatedResponse({
        message: 'Employee payslips retrieved successfully',
        success: true,
        data: enriched,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      this.logger.error('Error getting payslips by employee ID:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        'An error occurred while retrieving employee payslips',
      );
    }
  }

  async addEarningToEmployee(
    companyId: string,
    employeeId: string,
    payload: CreateEarningDto,
  ) {
    try {
      await this.companyService.checkCompany(companyId);

      const employee = await this.prisma.employee.findFirst({
        where: { id: employeeId, companyId, isDeleted: false, isActive: true },
      });
      if (!employee) throw new NotFoundException('Employee not found');
      const payslip = await this.prisma.payslip.findFirst({
        where: { employeeId, isDeleted: false },
      });
      if (!payslip)
        throw new BadRequestException('Employee has no payslip for this payroll');
      const earning = await this.prisma.earning.create({
        data: {
          amount: payload.amount,
          type: payload.type,
          description: payload.description,
          employeeId,
        },
      });
      return new ReturnType({
        message: 'Earning created successfully',
        success: true,
        data: earning,
      });
    } catch (error) {
      this.logger.error('Error creating earning for employee:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException('An error occurred while creating earning');
    }
  }

  async addEarningToPayroll(
    companyId: string,
    payrollId: string,
    payload: CreateEarningDto,
  ) {
    try {
      await this.companyService.checkCompany(companyId);
      const payroll = await this.prisma.payroll.findFirst({
        where: { id: payrollId, companyId, isDeleted: false },
      });
      if (!payroll) throw new NotFoundException('Payroll not found');
      const payslips = await this.prisma.payslip.findMany({
        where: { payrollId, isDeleted: false },
        select: { employeeId: true },
      });
      if (payslips.length === 0)
        throw new BadRequestException('No payslips found for this payroll');
      await this.prisma.earning.createMany({
        data: payslips.map((p) => ({
          amount: payload.amount,
          type: payload.type,
          description: payload.description,
          employeeId: p.employeeId,
          payrollId,
        })),
      });
      return new ReturnType({
        message: 'Earnings created for payroll successfully',
        success: true,
        data: { count: payslips.length },
      });
    } catch (error) {
      this.logger.error('Error creating earnings for payroll:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException('An error occurred while creating earnings');
    }
  }

  async addDeductionToEmployee(
    companyId: string,
    employeeId: string,
    payload: CreateDeductionDto,
  ) {
    try {
      await this.companyService.checkCompany(companyId);

      const employee = await this.prisma.employee.findFirst({
        where: { id: employeeId, companyId, isDeleted: false, isActive: true },
      });
      if (!employee) throw new NotFoundException('Employee not found');
      const payslip = await this.prisma.payslip.findFirst({
        where: { employeeId, isDeleted: false },
      });
      if (!payslip)
        throw new BadRequestException('Employee has no payslip for this payroll');
      const deduction = await this.prisma.deduction.create({
        data: {
          amount: payload.amount,
          type: payload.type,
          description: payload.description,
          employeeId,
        },
      });
      return new ReturnType({
        message: 'Deduction created successfully',
        success: true,
        data: deduction,
      });
    } catch (error) {
      this.logger.error('Error creating deduction for employee:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException('An error occurred while creating deduction');
    }
  }

  async addDeductionToPayroll(
    companyId: string,
    payrollId: string,
    payload: CreateDeductionDto,
  ) {
    try {
      await this.companyService.checkCompany(companyId);
      const payroll = await this.prisma.payroll.findFirst({
        where: { id: payrollId, companyId, isDeleted: false },
      });
      if (!payroll) throw new NotFoundException('Payroll not found');
      const payslips = await this.prisma.payslip.findMany({
        where: { payrollId, isDeleted: false },
        select: { employeeId: true },
      });
      if (payslips.length === 0)
        throw new BadRequestException('No payslips found for this payroll');
      await this.prisma.deduction.createMany({
        data: payslips.map((p) => ({
          amount: payload.amount,
          type: payload.type,
          description: payload.description,
          employeeId: p.employeeId,
          payrollId,
        })),
      });
      return new ReturnType({
        message: 'Deductions created for payroll successfully',
        success: true,
        data: { count: payslips.length },
      });
    } catch (error) {
      this.logger.error('Error creating deductions for payroll:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException('An error occurred while creating deductions');
    }
  }

  async getEarningsByEmployeeId(
    companyId: string,
    employeeId: string,
    query: PaginatedQuery,
  ) {
    try {
      await this.companyService.checkCompany(companyId);
      const employee = await this.prisma.employee.findFirst({
        where: { id: employeeId, companyId, isDeleted: false },
      });
      if (!employee) throw new NotFoundException('Employee not found');
      const { page = 1, limit = 10 } = query;
      const earnings = await this.prisma.earning.findMany({
        where: { employeeId, isDeleted: false },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      const total = await this.prisma.earning.count({
        where: { employeeId, isDeleted: false },
      });
      return new PaginatedResponse({
        message: 'Earnings retrieved successfully',
        success: true,
        data: earnings,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      this.logger.error('Error getting earnings by employee:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('An error occurred while retrieving earnings');
    }
  }

  async getEarningsByPayrollId(
    companyId: string,
    payrollId: string,
    query: PaginatedQuery,
  ) {
    try {
      await this.companyService.checkCompany(companyId);
      const payroll = await this.prisma.payroll.findFirst({
        where: { id: payrollId, companyId, isDeleted: false },
      });
      if (!payroll) throw new NotFoundException('Payroll not found');
      const { page = 1, limit = 10 } = query;
      const earnings = await this.prisma.earning.findMany({
        where: { payrollId, isDeleted: false },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      const total = await this.prisma.earning.count({
        where: { payrollId, isDeleted: false },
      });
      return new PaginatedResponse({
        message: 'Earnings retrieved successfully',
        success: true,
        data: earnings,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      this.logger.error('Error getting earnings by payroll:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('An error occurred while retrieving earnings');
    }
  }

  async getDeductionsByEmployeeId(
    companyId: string,
    employeeId: string,
    query: PaginatedQuery,
  ) {
    try {
      await this.companyService.checkCompany(companyId);
      const employee = await this.prisma.employee.findFirst({
        where: { id: employeeId, companyId, isDeleted: false },
      });
      if (!employee) throw new NotFoundException('Employee not found');
      const { page = 1, limit = 10 } = query;
      const deductions = await this.prisma.deduction.findMany({
        where: { employeeId, isDeleted: false },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      const total = await this.prisma.deduction.count({
        where: { employeeId, isDeleted: false },
      });
      return new PaginatedResponse({
        message: 'Deductions retrieved successfully',
        success: true,
        data: deductions,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      this.logger.error('Error getting deductions by employee:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('An error occurred while retrieving deductions');
    }
  }

  async getDeductionsByPayrollId(
    companyId: string,
    payrollId: string,
    query: PaginatedQuery,
  ) {
    try {
      await this.companyService.checkCompany(companyId);
      const payroll = await this.prisma.payroll.findFirst({
        where: { id: payrollId, companyId, isDeleted: false },
      });
      if (!payroll) throw new NotFoundException('Payroll not found');
      const { page = 1, limit = 10 } = query;
      const deductions = await this.prisma.deduction.findMany({
        where: { payrollId, isDeleted: false },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      const total = await this.prisma.deduction.count({
        where: { payrollId, isDeleted: false },
      });
      return new PaginatedResponse({
        message: 'Deductions retrieved successfully',
        success: true,
        data: deductions,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      this.logger.error('Error getting deductions by payroll:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException('An error occurred while retrieving deductions');
    }
  }

  async startProcessingPayroll(payrollId: string, companyId: string, userId?: string) {
    try {
      await this.companyService.checkCompany(companyId);

      const payroll = await this.prisma.payroll.findFirst({
        where: {
          id: payrollId,
          companyId,
          isDeleted: false,
        },
      });

      if (!payroll) {
        throw new NotFoundException('Payroll not found');
      }

      if (payroll.status !== PayrollStatus.PENDING) {
        throw new BadRequestException(
          `Cannot start processing payroll with status: ${payroll.status}`,
        );
      }

      const updatedPayroll = await this.prisma.payroll.update({
        where: {
          id: payrollId,
        },
        data: {
          status: PayrollStatus.PROCESSING,
        },
      });

      // start adding the payslips to the queue for processing
      const payslips = await this.prisma.payslip.findMany({
        where: { payrollId, isDeleted: false, status: PayslipStatus.PENDING },
        select: { id: true },
      });

      if (payslips.length === 0) {
        throw new BadRequestException('No payslips found to process');
      }

      // compute total amount to be paid for all pending payslips in this payroll
      const totalAgg = await this.prisma.payslip.aggregate({
        where: { payrollId, isDeleted: false, status: PayslipStatus.PENDING },
        _sum: { netSalary: true },
      });
      const totalAmount = totalAgg._sum?.netSalary ?? 0;

      // check company wallet balance
      const wallet = await this.prisma.wallet.findFirst({
        where: { companyId, isDeleted: false },
      });

      if (!wallet || wallet.balance < totalAmount) {
        throw new BadRequestException(
          `Insufficient wallet balance to process payroll. Required: ${totalAmount}, Available: ${wallet?.balance ?? 0}`,
        );
      }

      for (const slip of payslips) {
        await this.payslipProcessingQueue.add('process-payslip', {
          payslipId: slip.id,
        });
      }

      // create activity log for the company
      let actorName = 'System';
      if (userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (user) {
          actorName = `${user.firstName} ${user.lastName}`;
        }
      }

      await this.prisma.activityLog.create({
        data: {
          type: 'PAYROLL',
          action: 'PAYROLL PROCESSING STARTED',
          description: `Processing started for payroll "${payroll.name}" by ${actorName}`,
          companyId,
          actorId: userId || null,
        },
      });

      await this.notificationService.sendCompanyNotification(
        companyId,
        'PAYROLL PROCESSING STARTED',
        `Processing has started for ${payroll.name}`,
      );

      return new ReturnType({
        message: 'Payroll processing queued successfully',
        success: true,
        data: { ...updatedPayroll, queued: payslips.length },
      });
    } catch (error) {
      this.logger.error('Error starting payroll processing:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        'An error occurred while starting payroll processing',
      );
    }
  }

  async editPayroll(
    payrollId: string,
    companyId: string,
    updateData: Partial<CreatePayrollDto>,
  ) {
    try {
      await this.companyService.checkCompany(companyId);

      const payroll = await this.prisma.payroll.findFirst({
        where: {
          id: payrollId,
          companyId,
          isDeleted: false,
        },
      });

      if (!payroll) {
        throw new NotFoundException('Payroll not found');
      }

      if (payroll.status === PayrollStatus.COMPLETED) {
        throw new BadRequestException('Cannot edit a completed payroll');
      }

      // Check for duplicate payroll if month/year is being updated
      if (updateData.month !== undefined || updateData.year !== undefined) {
        const month = updateData.month ?? payroll.month;
        const year = updateData.year ?? payroll.year;

        const existingPayroll = await this.prisma.payroll.findFirst({
          where: {
            companyId,
            month,
            year,
            isDeleted: false,
            NOT: {
              id: payrollId,
            },
          },
        });

        if (existingPayroll) {
          throw new BadRequestException(
            `A payroll for ${getMonthName(month)} ${year} already exists`,
          );
        }
      }

      const updatedPayroll = await this.prisma.payroll.update({
        where: {
          id: payrollId,
        },
        data: {
          name: updateData.name,
          month: updateData.month,
          year: updateData.year,
        },
      });

      await this.notificationService.sendCompanyNotification(
        companyId,
        'PAYROLL UPDATED',
        `Payroll ${updatedPayroll.name} has been updated`,
      );

      return new ReturnType({
        message: 'Payroll updated successfully',
        success: true,
        data: updatedPayroll,
      });
    } catch (error) {
      this.logger.error('Error updating payroll:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException('An error occurred while updating payroll');
    }
  }

  async deletePayroll(payrollId: string, companyId: string) {
    try {
      await this.companyService.checkCompany(companyId);

      const payroll = await this.prisma.payroll.findFirst({
        where: {
          id: payrollId,
          companyId,
          isDeleted: false,
        },
      });

      if (!payroll) {
        throw new NotFoundException('Payroll not found');
      }

      if (payroll.status === PayrollStatus.PROCESSING) {
        throw new BadRequestException(
          'Cannot delete a payroll that is currently being processed',
        );
      }

      // Soft delete the payroll and its payslips
      await this.prisma.$transaction(async (tx) => {
        // Soft delete payroll
        await tx.payroll.update({
          where: {
            id: payrollId,
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });

        // Soft delete associated payslips
        await tx.payslip.updateMany({
          where: {
            payrollId,
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
      });

      await this.notificationService.sendCompanyNotification(
        companyId,
        'PAYROLL DELETED',
        `Payroll ${payroll.name} has been deleted`,
      );

      return new ReturnType({
        message: 'Payroll deleted successfully',
        success: true,
        data: null,
      });
    } catch (error) {
      this.logger.error('Error deleting payroll:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException('An error occurred while deleting payroll');
    }
  }

  async deletePayrollEarning(
    companyId: string,
    payrollId: string,
    earningId: string,
  ) {
    try {
      await this.companyService.checkCompany(companyId);

      const payroll = await this.prisma.payroll.findFirst({
        where: {
          id: payrollId,
          companyId,
          isDeleted: false,
        },
      });

      if (!payroll) {
        throw new NotFoundException('Payroll not found');
      }

      if (payroll.status === PayrollStatus.PROCESSING) {
        throw new BadRequestException(
          'Cannot delete earning from a payroll that is currently being processed',
        );
      }

      const earning = await this.prisma.earning.findFirst({
        where: {
          id: earningId,
          payrollId,
          isDeleted: false,
        },
      });

      if (!earning) {
        throw new NotFoundException('Earning not found in this payroll');
      }

      await this.prisma.earning.update({
        where: { id: earningId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return new ReturnType({
        message: 'Earning deleted successfully from payroll',
        success: true,
        data: null,
      });
    } catch (error) {
      this.logger.error('Error deleting payroll earning:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        'An error occurred while deleting payroll earning',
      );
    }
  }

  async deletePayrollDeduction(
    companyId: string,
    payrollId: string,
    deductionId: string,
  ) {
    try {
      await this.companyService.checkCompany(companyId);

      const payroll = await this.prisma.payroll.findFirst({
        where: {
          id: payrollId,
          companyId,
          isDeleted: false,
        },
      });

      if (!payroll) {
        throw new NotFoundException('Payroll not found');
      }

      if (payroll.status === PayrollStatus.PROCESSING) {
        throw new BadRequestException(
          'Cannot delete deduction from a payroll that is currently being processed',
        );
      }

      const deduction = await this.prisma.deduction.findFirst({
        where: {
          id: deductionId,
          payrollId,
          isDeleted: false,
        },
      });

      if (!deduction) {
        throw new NotFoundException('Deduction not found in this payroll');
      }

      await this.prisma.deduction.update({
        where: { id: deductionId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return new ReturnType({
        message: 'Deduction deleted successfully from payroll',
        success: true,
        data: null,
      });
    } catch (error) {
      this.logger.error('Error deleting payroll deduction:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        'An error occurred while deleting payroll deduction',
      );
    }
  }

  async addEmployeesToPayroll(
    companyId: string,
    payrollId: string,
    payload: AddEmployeesToPayrollDto,
  ) {
    try {
      await this.companyService.checkCompany(companyId);

      const payroll = await this.prisma.payroll.findFirst({
        where: {
          id: payrollId,
          companyId,
          isDeleted: false,
        },
      });

      if (!payroll) {
        throw new NotFoundException('Payroll not found');
      }

      if (
        payroll.status === PayrollStatus.COMPLETED ||
        payroll.status === PayrollStatus.PROCESSING
      ) {
        throw new BadRequestException(
          'Cannot add employees to a payroll that is processing or completed',
        );
      }

      const findEmployees = await this.prisma.employee.findMany({
        where: {
          id: { in: payload.employeeIds },
          companyId,
          isDeleted: false,
          isActive: true,
        },
      });

      if (findEmployees.length !== payload.employeeIds.length) {
        throw new BadRequestException(
          'One or more employees not found or are inactive',
        );
      }

      const existingPayslips = await this.prisma.payslip.findMany({
        where: {
          payrollId,
          employeeId: { in: payload.employeeIds },
        },
      });

      if (existingPayslips.length > 0) {
        throw new BadRequestException(
          'One or more employees are already added to this payroll',
        );
      }

      this.eventEmitterService.emit(
        IEvent.PAYSIPLS_CREATION,
        new CreatePayslipDto({
          companyId,
          payrollId: payroll.id,
          employeeIds: payload.employeeIds,
          isExistingPayroll: true,
        }),
      );

      await this.notificationService.sendCompanyNotification(
        companyId,
        'PAYROLL UPDATED',
        `Employees have been added to payroll ${payroll.name}`,
      );

      return new ReturnType({
        message:
          'Employees are being added to the payroll, payslips are being created',
        success: true,
        data: null,
      });
    } catch (error) {
      this.logger.error('Error adding employees to payroll:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        'An error occurred while adding employees to payroll',
      );
    }
  }

  async restartPayslip(companyId: string, payslipId: string) {
    try {
      await this.companyService.checkCompany(companyId);

      const payslip = await this.prisma.payslip.findFirst({
        where: {
          id: payslipId,
          companyId,
          isDeleted: false,
        },
      });

      if (!payslip) {
        throw new NotFoundException('Payslip not found');
      }

      if (payslip.status !== PayslipStatus.FAILED) {
        throw new BadRequestException('Only failed payslips can be restarted');
      }

      await this.prisma.payslip.update({
        where: { id: payslipId },
        data: { status: PayslipStatus.PENDING },
      });

      await this.payslipProcessingQueue.add('process-payslip', {
        payslipId: payslip.id,
      });

      return new ReturnType({
        success: true,
        message: 'Payslip processing restarted successfully',
        data: payslip,
      });
    } catch (error) {
      this.logger.error(`Error restarting payslip ${payslipId}:`, error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('An error occurred while restarting payslip');
    }
  }
}
