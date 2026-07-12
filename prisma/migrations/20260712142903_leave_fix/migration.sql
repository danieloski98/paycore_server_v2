-- CreateEnum
CREATE TYPE "EmployeeLeaveStatus" AS ENUM ('ON_LEAVE', 'NOT_ON_LEAVE');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "leaveEndDate" TIMESTAMP(3),
ADD COLUMN     "leaveStartDate" TIMESTAMP(3),
ADD COLUMN     "leaveStatus" "EmployeeLeaveStatus" NOT NULL DEFAULT 'NOT_ON_LEAVE';
