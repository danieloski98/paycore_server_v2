import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/user/user.decorator';
import { UserAuthGuard } from '../../common/guards/user-auth/user-auth.guard';
import { PayrollService } from './payroll.service';
import { PaginatedQuery } from '../../common/classes/PaginatedQuery';
import { EmployeeAuthGuard } from 'src/common/guards/employee-auth/employee-auth.guard';

@ApiTags('Payslips Management')
@Controller('payslips')
export class PayslipsController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific payslip by ID' })
  @ApiParam({ name: 'id', description: 'Payslip ID' })
  @ApiResponse({ status: 200, description: 'Payslip retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payslip not found' })
  async getPayslipsById(
    @Param('id') payslipId: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.payrollService.getPayslipsById(payslipId);
  }

  @Get('employee/:employeeId')
  @UseGuards(EmployeeAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated payslips for a specific employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Payslips retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getPayslipsByEmployeeId(
    @Param('employeeId') employeeId: string,
    @Query() query: PaginatedQuery,
    @GetUser('companyId') companyId: string,
  ) {
    const paginatedQuery = new PaginatedQuery(query.page, query.limit);
    return this.payrollService.getPayslipsByEmployeeId(employeeId, paginatedQuery);
  }
}