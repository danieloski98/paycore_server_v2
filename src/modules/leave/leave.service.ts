import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateLeaveDto } from './dto/CreateLeaveDto';
import { EmployeeService } from '../employee/employee.service';
import { LeaveStatus, LeaveType } from 'generated/prisma/enums';
import { ReturnType } from 'src/common/returnType';
import { PaginatedQuery } from 'src/common/classes/PaginatedQuery';
import { PaginatedResponse } from 'src/common/classes/PagintedResponse';
import { EmailService } from 'src/common/services/email/email.service';
import { NotificationService } from 'src/common/services/notification/notification.service';

@Injectable()
export class LeaveService {
  private logger = new Logger(LeaveService.name);
  constructor(
    private prismaService: PrismaService,
    private employeeService: EmployeeService,
    private emailService: EmailService,
    private notificationService: NotificationService,
  ) { }

  async createLeave({
    employeeId,
    payload,
  }: {
    employeeId: string;
    payload: CreateLeaveDto;
  }) {
    try {
      const employee =
        await this.employeeService.checkEmployeeExists(employeeId);
      const leave = await this.prismaService.leave.create({
        data: {
          employeeId: employeeId,
          totalDays: this.calculateTotalDays(
            payload.startDate,
            payload.endDate,
          ),
          description: payload.description,
          endDate: new Date(payload.endDate),
          startDate: new Date(payload.startDate),
          type: payload.leaveType,
          Status: LeaveStatus.PENDING,
          companyId: employee.companyId,
        },
      });

      // Send company notification about new leave request
      try {
        const title = 'New leave request submitted';
        const message = `A new leave request has been submitted by ${employee.firstName} ${employee.lastName} from ${new Date(payload.startDate).toDateString()} to ${new Date(payload.endDate).toDateString()} for ${this.calculateTotalDays(payload.startDate, payload.endDate)} day(s).`;
        if (employee.companyId) {
          await this.notificationService.sendCompanyNotification(
            employee.companyId,
            title,
            message,
          );
        }
      } catch (notifyError) {
        this.logger.error('Failed to send company notification for new leave', notifyError);
      }

      return new ReturnType({
        message: 'Your leave request has been submitted',
        success: true,
        data: leave,
      });
    } catch (error) {
      this.logger.error(error);
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        'An error occured while creating your leave request',
      );
    }
  }

  async getLeavesByemployeeId(employeeId: string, query: PaginatedQuery) {
    try {
      const { page, limit } = query;
      await this.employeeService.checkEmployeeExists(employeeId);
      const leaves = await this.prismaService.leave.findMany({
        where: {
          employeeId: employeeId,
        },
        include: {
          Employee: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await this.prismaService.leave.count({
        where: {
          employeeId: employeeId,
        },
      });
      return new PaginatedResponse({
        message: 'Leaves retrieved successfully',
        success: true,
        data: leaves,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) { }
  }
  async getLeavesByCompanyId(companyId: string, query: PaginatedQuery) {
    try {
      const { page, limit } = query;
      const leaves = await this.prismaService.leave.findMany({
        where: {
          companyId: companyId,
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
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });
      const total = await this.prismaService.leave.count({
        where: {
          companyId: companyId,
          isDeleted: false,
        },
      });
      return new PaginatedResponse({
        message: 'Company leaves retrieved successfully',
        success: true,
        data: leaves,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      this.logger.error('Error getting leaves by company ID:', error);
      throw error;
    }
  }

  async getLeaveById(leaveId: string) {
    try {
      const leave = await this.prismaService.leave.findFirst({
        where: {
          id: leaveId,
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
        },
      });

      if (!leave) {
        return new ReturnType({
          message: 'Leave not found',
          success: false,
          data: null,
        });
      }

      return new ReturnType({
        message: 'Leave retrieved successfully',
        success: true,
        data: leave,
      });
    } catch (error) {
      this.logger.error('Error getting leave by ID:', error);
      throw error;
    }
  }

  async changeLeaveStatus(leaveId: string, status: LeaveStatus) {
    try {
      const existingLeave = await this.prismaService.leave.findFirst({
        where: {
          id: leaveId,
          isDeleted: false,
        },
      });

      if (!existingLeave) {
        return new ReturnType({
          message: 'Leave not found',
          success: false,
          data: null,
        });
      }

      const updatedLeave = await this.prismaService.leave.update({
        where: {
          id: leaveId,
        },
        data: {
          Status: status,
          updatedAt: new Date(),
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
        },
      });

      // Send leave status email to employee (non-blocking of main update)
      try {
        const company = await this.prismaService.company.findUnique({
          where: { id: existingLeave.companyId },
          select: { name: true },
        });
        const employeeName = `${updatedLeave.Employee.firstName} ${updatedLeave.Employee.lastName}`.trim();
        await this.emailService.sendLeaveStatusEmail({
          email: updatedLeave.Employee.email,
          name: employeeName || updatedLeave.Employee.firstName || 'Employee',
          companyName: company?.name || 'Your Company',
          status,
          startDate: updatedLeave.startDate,
          endDate: updatedLeave.endDate as unknown as Date,
          totalDays: updatedLeave.totalDays,
          description: updatedLeave.description,
        });
      } catch (emailError) {
        this.logger.error('Failed to send leave status email', emailError);
      }

      return new ReturnType({
        message: `Leave status updated to ${status.toLowerCase()} successfully`,
        success: true,
        data: updatedLeave,
      });
    } catch (error) {
      this.logger.error('Error changing leave status:', error);
      throw error;
    }
  }

  calculateTotalDays(startDate: Date, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays;
  }
}
