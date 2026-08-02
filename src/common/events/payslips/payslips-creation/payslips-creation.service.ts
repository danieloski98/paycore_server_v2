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
          Earning: {
            where: { isDeleted: false },
          },
          Deduction: {
            where: { isDeleted: false },
          },
        },
      });

      // get payroll-level earnings and deductions
      const [payrollEarnings, payrollDeductions] = data?.payrollId
        ? await Promise.all([
            this.prismaService.earning.findMany({
              where: {
                payrollId: data.payrollId,
                isDeleted: false,
              },
            }),
            this.prismaService.deduction.findMany({
              where: {
                payrollId: data.payrollId,
                isDeleted: false,
              },
            }),
          ])
        : [[], []];

      // prepare payslip data
      this.logger.debug('PREPARING PAYSLIP DATA');
      const payslipData = employees.map((emp) => {
        const employeeEarnings = emp.Earning || [];
        const employeeDeductions = emp.Deduction || [];

        const relevantPayrollEarnings = payrollEarnings.filter(
          (pe) => !pe.employeeId || pe.employeeId === emp.id,
        );
        const relevantPayrollDeductions = payrollDeductions.filter(
          (pd) => !pd.employeeId || pd.employeeId === emp.id,
        );

        const allEarningsMap = new Map<string, number>();
        [...employeeEarnings, ...relevantPayrollEarnings].forEach((item) => {
          allEarningsMap.set(item.id, item.amount);
        });

        const allDeductionsMap = new Map<string, number>();
        [...employeeDeductions, ...relevantPayrollDeductions].forEach((item) => {
          allDeductionsMap.set(item.id, item.amount);
        });

        const allowances = Array.from(allEarningsMap.values()).reduce(
          (sum, amt) => sum + amt,
          0,
        );
        const deductions = Array.from(allDeductionsMap.values()).reduce(
          (sum, amt) => sum + amt,
          0,
        );
        const basicSalary = emp.salary;
        const netSalary = basicSalary + allowances - deductions;

        const primaryBank =
          emp.BankDetails.find((bank) => bank.isPrimary) || emp.BankDetails[0];

        return {
          employeeId: emp.id,
          payrollId: data?.payrollId,
          companyId: data.companyId,
          basicSalary,
          deductions,
          allowances,
          netSalary,
          bankId: primaryBank?.id,
        };
      });

      // create first earning
      this.logger.debug('PREPARING EARNING DATA');
      // const earningsData = employees.map((emp) => ({
      //   amount: emp.salary,
      //   type: EarningType.BASIC_SALARY,
      //   employeeId: emp.id,
      //   payrollId: data?.payrollId,
      //   description: 'Basic Salary',
      // }));

      // create payslips and earnings in a transactions
      await this.prismaService.$transaction(async (tx) => {
        // create payslips
        this.logger.debug('CREATING PAYSLIPS');
        await tx.payslip.createMany({
          data: payslipData,
        });

        //create first earning
        this.logger.debug('CREATING EARNINGS');
        // await tx.earning.createMany({
        //   data: earningsData,
        // });
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
