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


      // prepare payslip data
      this.logger.debug('PREPARING PAYSLIP DATA');
      const payslipData = employees.map((emp) => ({
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
      const earningsData = employees.map((emp) => ({
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
