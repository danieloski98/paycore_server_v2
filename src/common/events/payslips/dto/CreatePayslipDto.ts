export class CreatePayslipDto {
  employeeIds: string[];
  companyId: string;
  payrollId: string;

  constructor({ employeeIds, companyId, payrollId }: CreatePayslipDto) {
    this.companyId = companyId;
    this.employeeIds = employeeIds;
    this.payrollId = payrollId;
  }
}
