/*
  Warnings:

  - A unique constraint covering the columns `[companyId]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeId]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('USER', 'EMPLOYEE');

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "employeeId" TEXT,
ADD COLUMN     "walletType" "WalletType" NOT NULL DEFAULT 'USER',
ALTER COLUMN "companyId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_companyId_key" ON "Wallet"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_employeeId_key" ON "Wallet"("employeeId");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
