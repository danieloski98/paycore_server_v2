-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "charge" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "employeeId" TEXT,
ALTER COLUMN "companyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
