import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserAuthGuard } from 'src/common/guards/user-auth/user-auth.guard';
import { ReturnType } from 'src/common/returnType';
import { GetUser } from 'src/common/decorators/user/user.decorator';
import { EmployeeAuthGuard } from 'src/common/guards/employee-auth/employee-auth.guard';
import { GeneralAuthGuardGuard } from 'src/common/guards/general-auth-guard/general-auth-guard.guard';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get(':companyId')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get company analytics overview' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
    type: ReturnType,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Error occurred while fetching analytics',
  })
  async getCompanyAnalytics(@Param('companyId') companyId: string) {
    return this.analyticsService.getCompanyAnalytics(companyId);
  }

  @Get('leave/:companyId')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get company leave analytics (total/approved/rejected/pending)',
  })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Leave analytics retrieved successfully',
    type: ReturnType,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Error occurred while fetching leave analytics',
  })
  async getCompanyLeaveAnalytics(@Param('companyId') companyId: string) {
    return this.analyticsService.getCompanyLeaveAnalytics(companyId);
  }

  @Get('leave/employee/:employeeId')
  @UseGuards(GeneralAuthGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get leave analytics for an employee (total/approved/rejected/pending)' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee leave analytics retrieved successfully', type: ReturnType })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getEmployeeLeaveAnalytics(@Param('employeeId') employeeId: string) {
    return this.analyticsService.getEmplyeeLeaveAnalytics(employeeId);
  }

  @Get('dashboard/employee/:employeeId')
  @UseGuards(GeneralAuthGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard analytics for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee dashboard analytics retrieved successfully', type: ReturnType })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getEmployeeDashboardAnalytics(@Param('employeeId') employeeId: string) {
    return this.analyticsService.getEmployeeDashboardAnalytics(employeeId);
  }

  @Get('payslips/active/:companyId')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get active payroll payslips analytics (processed/pending/failed)',
  })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Active payroll payslips analytics retrieved successfully',
    type: ReturnType,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Error occurred while fetching active payroll payslips analytics',
  })
  async getActivePayrollPayslipsAnalytics(
    @Param('companyId') companyId: string,
  ) {
    return this.analyticsService.getActivePayrollPayslipsAnalytics(companyId);
  }

  @Get('payslips/:payrollId')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get payslips analytics for a specific payroll (processed/pending/failed)',
  })
  @ApiParam({ name: 'payrollId', description: 'Payroll ID' })
  @ApiResponse({
    status: 200,
    description: 'Payroll payslips analytics retrieved successfully',
    type: ReturnType,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({ status: 404, description: 'Payroll not found' })
  async getPayrollPayslipsAnalytics(
    @Param('payrollId') payrollId: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.analyticsService.getPayrollPayslipsAnalytics(
      payrollId,
      companyId,
    );
  }
}
