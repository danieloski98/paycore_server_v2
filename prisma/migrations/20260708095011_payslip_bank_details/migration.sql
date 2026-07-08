-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "BankDetails"("id") ON DELETE CASCADE ON UPDATE CASCADE;
