import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service';
import { PayslipStatus, PaymentStatus, PayrollStatus } from 'generated/prisma/enums';
import { PaystackService } from '../../../services/paystack/paystack.service';
import { NotificationService } from '../../../services/notification/notification.service';
import { EmailService } from '../../../services/email/email.service';

@Processor('payslip-processing')
@Injectable()
export class PayslipsProcessingService extends WorkerHost {
  private readonly logger = new Logger(PayslipsProcessingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
    private readonly notificationService: NotificationService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  private async checkAndSetPayrollStatus(
    payrollId: string,
    companyId: string,
    tx: any = this.prisma,
  ) {
    const remainingPendingCount = await tx.payslip.count({
      where: {
        payrollId,
        isDeleted: false,
        status: PayslipStatus.PENDING,
      },
    });

    if (remainingPendingCount === 0) {
      const failedCount = await tx.payslip.count({
        where: {
          payrollId,
          isDeleted: false,
          status: PayslipStatus.FAILED,
        },
      });

      const finalStatus =
        failedCount > 0 ? PayrollStatus.FAILED : PayrollStatus.COMPLETED;

      await tx.payroll.update({
        where: { id: payrollId },
        data: { status: finalStatus },
      });

      await tx.activityLog.create({
        data: {
          type: 'PAYROLL',
          action:
            finalStatus === PayrollStatus.FAILED
              ? 'PAYROLL FAILED'
              : 'PAYROLL COMPLETED',
          description:
            finalStatus === PayrollStatus.FAILED
              ? `Payroll processing finished with ${failedCount} failed payslip(s). Payroll marked as failed.`
              : `All payslips processed for payroll. Payroll marked as completed.`,
          companyId,
        },
      });

      this.logger.log(
        `All payslips processed. Payroll ${payrollId} marked as ${finalStatus}.`,
      );
    }
  }

  private async handlePayslipFailure(
    payslip: {
      id: string;
      payrollId: string;
      companyId: string;
      Employee?: { firstName: string; lastName: string } | null;
    },
    reason: string,
  ) {
    await this.prisma.payslip.update({
      where: { id: payslip.id },
      data: { status: PayslipStatus.FAILED },
    });

    const employeeName = payslip.Employee
      ? `${payslip.Employee.firstName} ${payslip.Employee.lastName}`
      : 'Employee';

    // Send notification to company
    try {
      await this.notificationService.sendCompanyNotification(
        payslip.companyId,
        'PAYSLIP PROCESSING FAILED',
        `Payslip for ${employeeName} failed to process. Reason: ${reason}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send company notification for payslip ${payslip.id}`,
        error,
      );
    }

    // Send email to company
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: payslip.companyId },
        include: { User: true },
      });

      if (company?.User?.email) {
        await this.emailService.sendPayslipFailedEmail({
          email: company.User.email,
          adminName: `${company.User.firstName} ${company.User.lastName}`,
          companyName: company.name,
          employeeName,
          reason,
          payslipId: payslip.id,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send failure email for payslip ${payslip.id}`,
        error,
      );
    }

    // Check if all payslips for payroll are done, update payroll status if needed
    try {
      await this.checkAndSetPayrollStatus(
        payslip.payrollId,
        payslip.companyId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update payroll status for payslip failure ${payslip.id}`,
        error,
      );
    }
  }

  async process(job: Job<{ payslipId: string }>) {
    if (job.name !== 'process-payslip') {
      this.logger.warn(`Received unknown job name: ${job.name}`);
      return;
    }

    const { payslipId } = job.data;
    this.logger.log(`Processing payslip job: ${payslipId}`);

    // Fetch payslip and related bank details
    const payslip = await this.prisma.payslip.findFirst({
      where: { id: payslipId, isDeleted: false },
      include: { Employee: true },
    });

    if (!payslip) {
      this.logger.error(`Payslip not found for id: ${payslipId}`);
      return;
    }


    try {
      // compute total earnings and deductions for this payslip (by payroll and employee)
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

      // const totalEarnings = earnAgg._sum?.amount ?? 0;
      // const totalDeductions = dedAgg._sum?.amount ?? 0;
      const payoutAmount = payslip?.netSalary

      // check company wallet balance before proceeding
      const wallet = await this.prisma.wallet.findFirst({
        where: { companyId: payslip.companyId, isDeleted: false },
      });

      if (!wallet || wallet.balance < payoutAmount) {
        const reason = `Insufficient wallet balance: required ${payoutAmount} NGN, available ${wallet?.balance ?? 0} NGN`;
        this.logger.error(
          `Insufficient wallet balance for company ${payslip.companyId}: required ${payoutAmount}, available ${wallet?.balance ?? 0}`,
        );
        await this.handlePayslipFailure(payslip, reason);
        return;
      }

      // Debit company wallet, credit employee wallet, create payment, and update payslip status inside a transaction
      await this.prisma.$transaction(async (tx) => {
        // 1. Decrement company wallet balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: payoutAmount },
          },
        });

        // 2. Find or create employee wallet
        let employeeWallet = await tx.wallet.findFirst({
          where: { employeeId: payslip.employeeId, isDeleted: false },
        });

        if (!employeeWallet) {
          employeeWallet = await tx.wallet.create({
            data: {
              employeeId: payslip.employeeId,
              balance: 0.0,
              currency: 'NGN',
              walletType: 'EMPLOYEE',
            },
          });
        }

        // 3. Increment employee wallet balance
        await tx.wallet.update({
          where: { id: employeeWallet.id },
          data: {
            balance: { increment: payoutAmount },
          },
        });

        // 4. Create completed payment record for this transfer
        await tx.payment.create({
          data: {
            companyId: payslip.companyId,
            employeeId: payslip.employeeId,
            walletId: employeeWallet.id,
            amount: payoutAmount,
            reference: `PAY-${payslipId}-${Date.now()}`,
            status: PaymentStatus.COMPLETED,
          },
        });

        // 5. Update payslip status to PAID
        await tx.payslip.update({
          where: { id: payslipId },
          data: { status: PayslipStatus.PAID, paymentDate: new Date() },
        });

        // 6. Create activity log for the company
        await tx.activityLog.create({
          data: {
            type: 'PAYSLIP',
            action: 'PAYSLIP PAID',
            description: `Salary payslip for ${payslip.Employee.firstName} ${payslip.Employee.lastName} was processed and wallet credited with ${payoutAmount} NGN`,
            companyId: payslip.companyId,
            employeeId: payslip.employeeId,
          },
        });

        // 7. Check if this is the last pending payslip for the payroll and update payroll status (COMPLETED or FAILED)
        await this.checkAndSetPayrollStatus(payslip.payrollId, payslip.companyId, tx);
      });

      this.logger.log(`Payslip processed and employee wallet credited successfully: ${payslipId}`);
    } catch (error) {
      this.logger.error(`Failed to process payslip ${payslipId}`, error);
      await this.handlePayslipFailure(
        payslip,
        error instanceof Error ? error.message : 'Unexpected processing error',
      );
    }
  }
}
