import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { IEvent } from '../..';
import { CreatePayslipDto } from '../dto/CreatePayslipDto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { EarningType } from 'generated/prisma/enums';
import { NotificationService } from 'src/common/services/notification/notification.service';
import { EmailService } from 'src/common/services/email/email.service';

@Injectable()
export class PayslipsCreationService {
  private logger = new Logger(PayslipsCreationService.name);
  constructor(
    private prismaService: PrismaService,
    private notificationService: NotificationService,
    private emailService: EmailService,
  ) { }

  @OnEvent(IEvent.PAYSIPLS_CREATION)
  async payslipCreation(data: CreatePayslipDto) {
    try {
      this.logger.debug('PAYSLIP CREATION STARTED');
      // get all employees data
      const employees = await this.prismaService.employee.findMany({
        where: {
          id: { in: data.employeeIds },
          companyId: data.companyId,
          isDeleted: false,
          isActive: true,
        },
        include: {
          BankDetails: true,
          Company: true,
        },
      });

      // Find employees without a primary bank account
      const invalidEmployees = employees.filter((emp) => {
        return !emp.BankDetails.some((bank) => bank.isPrimary);
      });

      // Send notifications/emails to invalid employees
      for (const emp of invalidEmployees) {
        try {
          await this.notificationService.sendEmployeeNotification(
            emp.id,
            'BANK DETAILS REQUIRED',
            'Please add your primary bank account details to receive your payroll payments.',
          );

          await this.emailService.sendBankDetailsRequestEmail({
            email: emp.email,
            name: `${emp.firstName} ${emp.lastName}`,
            companyName: emp.Company.name,
          });
        } catch (error) {
          this.logger.error(
            `Failed to send bank details alert to employee ${emp.id}`,
            error,
          );
        }
      }

      // filter to employees with a primary bank account
      const validEmployees = employees.filter((emp) => {
        const primaryBank = emp.BankDetails.find((bank) => bank.isPrimary);
        if (!primaryBank) {
          this.logger.warn(
            `Employee ${emp.id} has no primary bank account. Skipping.`,
          );

          return false;
        }
        return true;
      });

      if (validEmployees.length === 0) {
        this.logger.error(
          `No valid employees with primary bank accounts for payroll ${data.payrollId}.`,
        );

        if (!data.isExistingPayroll) {
          await this.prismaService.payroll.delete({
            where: {
              id: data?.payrollId,
            },
          });

          try {
            await this.notificationService.sendCompanyNotification(
              data.companyId,
              'PAYROLL CANCELLED',
              'Payroll was cancelled as there was no valid employee with a bank account added',
            );
          } catch (notifyError) {
            this.logger.error(
              'Failed to send company notification for payroll cancellation',
              notifyError,
            );
          }
        }
        return;
      }

      // prepare payslip data
      this.logger.debug('PREPARING PAYSLIP DATA');
      const payslipData = validEmployees.map((emp) => ({
        employeeId: emp.id,
        payrollId: data?.payrollId,
        companyId: data.companyId,
        basicSalary: emp.salary,
        deductions: 0,
        allowances: 0,
        netSalary: 0,
        bankId: emp.BankDetails.find((bank) => bank.isPrimary)!.id,
      }));

      // create first earning
      this.logger.debug('PREPARING EARNING DATA');
      const earningsData = validEmployees.map((emp) => ({
        amount: emp.salary,
        type: EarningType.BASIC_SALARY,
        employeeId: emp.id,
        payrollId: data?.payrollId,
        description: 'Basic Salary',
      }));

      // create payslips and earnings in a transactions
      await this.prismaService.$transaction(async (tx) => {
        // create payslips
        this.logger.debug('CREATING PAYSLIPS');
        await tx.payslip.createMany({
          data: payslipData,
        });

        //create first earning
        this.logger.debug('CREATING EARNINGS');
        await tx.earning.createMany({
          data: earningsData,
        });
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
