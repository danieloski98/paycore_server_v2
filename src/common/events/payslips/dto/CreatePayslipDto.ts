export class CreatePayslipDto {
  employeeIds: string[];
  companyId: string;
  payrollId: string;
  isExistingPayroll?: boolean;

  constructor({ employeeIds, companyId, payrollId, isExistingPayroll }: CreatePayslipDto) {
    this.companyId = companyId;
    this.employeeIds = employeeIds;
    this.payrollId = payrollId;
    this.isExistingPayroll = isExistingPayroll;
  }
}
