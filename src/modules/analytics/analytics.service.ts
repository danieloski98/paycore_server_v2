import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { ReturnType } from 'src/common/returnType';
import { tryCatch } from 'bullmq';
import { LeaveStatus, PayrollStatus, PayslipStatus } from 'generated/prisma/enums';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getCompanyAnalytics(companyId: string) {
    try {
      const [
        totalEmployees,
        activePayroll,
        lastPayroll,
        totalLeaves,
        pendingLeaves,
        approvedLeaves,
        totalPayrolls,
      ] =
        await Promise.all([
          this.prisma.employee.count({
            where: { companyId, isDeleted: false },
          }),
          this.prisma.payroll.findFirst({
            where: { companyId, isDeleted: false, status: PayrollStatus.PROCESSING },
            orderBy: { updatedAt: 'desc' },
          }),
          this.prisma.payroll.findFirst({
            where: { companyId, isDeleted: false },
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.leave.count({
            where: { companyId, isDeleted: false },
          }),
          this.prisma.leave.count({
            where: { companyId, isDeleted: false, Status: LeaveStatus.PENDING },
          }),
          this.prisma.leave.count({
            where: { companyId, isDeleted: false, Status: LeaveStatus.ACCEPTED },
          }),
          this.prisma.payroll.count({
            where: { companyId, isDeleted: false },
          }),
        ]);

      const now = new Date();
      const currMonth = now.getMonth() + 1; // 1-12
      const nextPayrollMonth = (currMonth % 12) + 1; // 1-12
      const activePayrollMonth = activePayroll?.month ?? null;

      return new ReturnType({
        message: 'Company analytics retrieved successfully',
        success: true,
        data: {
          totalEmployees,
          totalPayrolls,
          activePayroll: activePayroll ?? null,
          lastPayroll: lastPayroll ?? null,
          activePayrollMonth,
          nextPayrollMonth,
          totalLeaveRequests: totalLeaves,
          pendingLeaveRequests: pendingLeaves,
          approvedLeaveRequests: approvedLeaves,
        },
      });
    } catch (error) {
      this.logger.error('Error fetching company analytics', error);
      throw error;
    }
  }

  async getCompanyLeaveAnalytics(companyId: string) {
    try {
      const [
        totalLeaves,
        approvedLeaves,
        rejectedLeaves,
        pendingLeaves,
      ] = await Promise.all([
        this.prisma.leave.count({
          where: { companyId, isDeleted: false },
        }),
        this.prisma.leave.count({
          where: {
            companyId,
            isDeleted: false,
            Status: LeaveStatus.ACCEPTED,
          },
        }),
        this.prisma.leave.count({
          where: {
            companyId,
            isDeleted: false,
            Status: LeaveStatus.REJECTED,
          },
        }),
        this.prisma.leave.count({
          where: {
            companyId,
            isDeleted: false,
            Status: LeaveStatus.PENDING,
          },
        }),
      ]);

      return new ReturnType({
        message: 'Company leave analytics retrieved successfully',
        success: true,
        data: {
          totalLeaveRequests: totalLeaves,
          approvedLeaveRequests: approvedLeaves,
          rejectedLeaveRequests: rejectedLeaves,
          pendingLeaveRequests: pendingLeaves,
        },
      });
    } catch (error) {
      this.logger.error('Error fetching company leave analytics', error);
      throw error;
    }
  }

  async getActivePayrollPayslipsAnalytics(companyId: string) {
    try {
      const activePayroll = await this.prisma.payroll.findFirst({
        where: { companyId, isDeleted: false, status: PayrollStatus.PROCESSING },
        orderBy: { updatedAt: 'desc' },
      });

      if (!activePayroll) {
        return new ReturnType({
          message: 'No active payroll found for company',
          success: true,
          data: {
            activePayroll: null,
            processedPayslipsCount: 0,
            pendingPayslipsCount: 0,
            failedPayslipsCount: 0,
          },
        });
      }

      const [processedPayslipsCount, pendingPayslipsCount, failedPayslipsCount] = await Promise.all([
        this.prisma.payslip.count({
          where: { payrollId: activePayroll.id, isDeleted: false, status: PayslipStatus.PAID },
        }),
        this.prisma.payslip.count({
          where: { payrollId: activePayroll.id, isDeleted: false, status: PayslipStatus.PENDING },
        }),
        this.prisma.payslip.count({
          where: { payrollId: activePayroll.id, isDeleted: false, status: PayslipStatus.FAILED },
        }),
      ]);

      return new ReturnType({
        message: 'Active payroll payslips analytics retrieved successfully',
        success: true,
        data: {
          activePayroll,
          processedPayslipsCount,
          pendingPayslipsCount,
          failedPayslipsCount,
        },
      });
    } catch (error) {
      this.logger.error('Error fetching active payroll payslips analytics', error);
      throw error;
    }
  }

  async getPayrollPayslipsAnalytics(payrollId: string, companyId: string) {
    try {
      const payroll = await this.prisma.payroll.findFirst({
        where: { id: payrollId, companyId, isDeleted: false },
      });

      if (!payroll) {
        throw new NotFoundException('Payroll not found for company');
      }

      const [processedPayslipsCount, pendingPayslipsCount, failedPayslipsCount] = await Promise.all([
        this.prisma.payslip.count({
          where: { payrollId, isDeleted: false, status: PayslipStatus.PAID },
        }),
        this.prisma.payslip.count({
          where: { payrollId, isDeleted: false, status: PayslipStatus.PENDING },
        }),
        this.prisma.payslip.count({
          where: { payrollId, isDeleted: false, status: PayslipStatus.FAILED },
        }),
      ]);

      return new ReturnType({
        message: 'Payroll payslips analytics retrieved successfully',
        success: true,
        data: {
          payroll,
          processedPayslipsCount,
          pendingPayslipsCount,
          failedPayslipsCount,
        },
      });
    } catch (error) {
      this.logger.error('Error fetching payroll payslips analytics', error);
      throw error;
    }
  }

  async getEmplyeeLeaveAnalytics(employeeId: string) {
    try {
      const [totalLeaves, approvedLeaves, rejectedLeaves, pendingLeaves] = await Promise.all([
        this.prisma.leave.count({
          where: { employeeId, isDeleted: false },
        }),
        this.prisma.leave.count({
          where: {
            employeeId,
            isDeleted: false,
            Status: LeaveStatus.ACCEPTED,
          },
        }),
        this.prisma.leave.count({
          where: {
            employeeId,
            isDeleted: false,
            Status: LeaveStatus.REJECTED,
          },
        }),
        this.prisma.leave.count({
          where: {
            employeeId,
            isDeleted: false,
            Status: LeaveStatus.PENDING,
          },
        }),
      ]);

      return new ReturnType({
        message: 'Employee leave analytics retrieved successfully',
        success: true,
        data: {
          totalLeaveRequests: totalLeaves,
          approvedLeaveRequests: approvedLeaves,
          rejectedLeaveRequests: rejectedLeaves,
          pendingLeaveRequests: pendingLeaves,
        },
      });
    } catch (error) {
      this.logger.error('Error fetching employee leave analytics', error);
      throw error;
    }
  }

  async getEmployeeDashboardAnalytics(employeeId: string) {
    try {
      // get the total paid payslip for the emloyee, there netpay, next paydate, bank account
      const [totalPaidPayslip, netPay, bankAccount, totalLeaveRequests] = await Promise.all([
        this.prisma.payslip.count({
          where: { employeeId, isDeleted: false, status: PayslipStatus.PAID },
        }),
        this.prisma.employee.findFirst({
          where: { id: employeeId, isDeleted: false },
          select: { salary: true,  },
        }),
        this.prisma.bankDetails.findFirst({
          where: { id: employeeId, isDeleted: false , isPrimary: true },
        }),
        this.prisma.leave.count({
          where: {
            employeeId,
            isDeleted: false,
          }
        })
      ]);

      return new ReturnType({
        message: 'Employee dashboard analytics retrieved successfully',
        success: true,
        data: {
          totalPaidPayslip,
          netPay,
          bankAccount,
          totalLeaveRequests,
        },
      });

      // get the 
    } catch (error) {
      this.logger.error('Error fetching employee dashboard analytics', error);
      throw error;
    }
  }
}
