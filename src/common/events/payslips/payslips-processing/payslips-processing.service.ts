import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { PayslipStatus, PaymentStatus } from 'generated/prisma/enums';
import { PaystackService } from 'src/common/services/paystack/paystack.service';

@Processor('payslip-processing')
@Injectable()
export class PayslipsProcessingService extends WorkerHost {
  private readonly logger = new Logger(PayslipsProcessingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
  ) {
    super();
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

    const bankDetails = await this.prisma.bankDetails.findFirst({
      where: { id: payslip.bankId, isDeleted: false },
    });

    if (!bankDetails) {
      this.logger.error(`Bank details not found for payslip: ${payslipId}`);
      await this.prisma.payslip.update({
        where: { id: payslipId },
        data: { status: PayslipStatus.FAILED },
      });
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

      const totalEarnings = earnAgg._sum?.amount ?? 0;
      const totalDeductions = dedAgg._sum?.amount ?? 0;
      const payoutAmount = payslip.netSalary + totalEarnings - totalDeductions;

      // check company wallet balance before proceeding
      const wallet = await this.prisma.wallet.findFirst({
        where: { companyId: payslip.companyId, isDeleted: false },
      });

      if (!wallet || wallet.balance < payoutAmount) {
        this.logger.error(
          `Insufficient wallet balance for company ${payslip.companyId}: required ${payoutAmount}, available ${wallet?.balance ?? 0}`,
        );
        await this.prisma.payslip.update({
          where: { id: payslipId },
          data: { status: PayslipStatus.FAILED },
        });
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
      });

      this.logger.log(`Payslip processed and employee wallet credited successfully: ${payslipId}`);
    } catch (error) {
      this.logger.error(`Failed to process payslip ${payslipId}`, error);
      await this.prisma.payslip.update({
        where: { id: payslipId },
        data: { status: PayslipStatus.FAILED },
      });
    }
  }
}
