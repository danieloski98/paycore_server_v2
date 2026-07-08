import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { MonnifyService } from 'src/common/services/monnify/monnify.service';
import { PayslipStatus } from 'generated/prisma/enums';

@Processor('payslip-processing')
@Injectable()
export class PayslipsProcessingService extends WorkerHost {
  private readonly logger = new Logger(PayslipsProcessingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly monnifyService: MonnifyService,
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

      // Send payment via Monnify disbursement
      const reference = `PAYSLIP-${payslipId}-${Date.now()}`;
      await this.monnifyService.initiateSingleTransfer({
        amount: payoutAmount,
        reference,
        narration: `Salary payment for payroll ${payslip.payrollId}`,
        destinationBankCode: bankDetails.bankCode,
        destinationAccountNumber: bankDetails.accountNumber,
        destinationAccountName: bankDetails.accountName,
        async: true,
      });

      // Update payslip status to PAID
      await this.prisma.payslip.update({
        where: { id: payslipId },
        data: { status: PayslipStatus.PAID, paymentDate: new Date() },
      });

      this.logger.log(`Payslip processed successfully: ${payslipId}`);
    } catch (error) {
      this.logger.error(`Failed to process payslip ${payslipId}`, error);
      await this.prisma.payslip.update({
        where: { id: payslipId },
        data: { status: PayslipStatus.FAILED },
      });
    }
  }
}
