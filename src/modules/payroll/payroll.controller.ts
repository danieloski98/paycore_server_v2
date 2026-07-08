import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
  ApiBody,
} from '@nestjs/swagger';
import { GetUser } from '../../common/decorators/user/user.decorator';
import { UserAuthGuard } from '../../common/guards/user-auth/user-auth.guard';
import { PayrollService } from './payroll.service';
import { CreatePayrollDto } from './dto/CreatePayrollDto';
import { UpdatePayrollDto } from './dto/UpdatePayrollDto';
import { PaginatedQuery } from '../../common/classes/PaginatedQuery';
import { CreateEarningDto } from './dto/CreateEarningDto';
import { CreateDeductionDto } from './dto/CreateDeductionDto';

@ApiTags('Payroll Management')
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post()
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new payroll' })
  @ApiBody({ type: CreatePayrollDto })
  @ApiResponse({ status: 201, description: 'Payroll created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or employees not found',
  })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async createPayroll(
    @Body() createPayrollDto: CreatePayrollDto,
    @GetUser('companyId') companyId: string,
  ) {
    return this.payrollService.createPayroll(companyId, createPayrollDto);
  }

  @Get('company')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated payrolls for a company' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({ status: 200, description: 'Payrolls retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async getPayrollsByCompanyId(
    @Query() query: PaginatedQuery,
    @GetUser('companyId') companyId: string,
  ) {
    const paginatedQuery = new PaginatedQuery(query.page, query.limit);
    return this.payrollService.getPayrollByCompanyId(companyId, paginatedQuery);
  }

  @Get(':id')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific payroll by ID' })
  @ApiParam({ name: 'id', description: 'Payroll ID' })
  @ApiResponse({ status: 200, description: 'Payroll retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payroll not found' })
  async getPayrollById(
    @Param('id') payrollId: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.payrollService.getPayrollById(payrollId);
  }

  @Get(':id/payslips')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated payslips for a specific payroll' })
  @ApiParam({ name: 'id', description: 'Payroll ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({ status: 200, description: 'Payslips retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payroll not found' })
  async getPayslipsByPayrollId(
    @Param('id') payrollId: string,
    @Query() query: PaginatedQuery,
    @GetUser('companyId') companyId: string,
  ) {
    const paginatedQuery = new PaginatedQuery(query.page, query.limit);
    return this.payrollService.getPayslipsByPayrollId(
      payrollId,
      paginatedQuery,
    );
  }

  @Patch(':id/start-processing')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start processing a payroll' })
  @ApiParam({ name: 'id', description: 'Payroll ID' })
  @ApiResponse({
    status: 200,
    description: 'Payroll processing started successfully',
  })
  @ApiResponse({ status: 400, description: 'Payroll is not in PENDING status' })
  @ApiResponse({ status: 404, description: 'Payroll not found' })
  async startProcessingPayroll(
    @Param('id') payrollId: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.payrollService.startProcessingPayroll(payrollId, companyId);
  }

  @Patch(':id')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a payroll' })
  @ApiParam({ name: 'id', description: 'Payroll ID' })
  @ApiBody({ type: UpdatePayrollDto })
  @ApiResponse({ status: 200, description: 'Payroll updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data or payroll cannot be edited',
  })
  @ApiResponse({ status: 404, description: 'Payroll not found' })
  async editPayroll(
    @Param('id') payrollId: string,
    @Body() updatePayrollDto: UpdatePayrollDto,
    @GetUser('companyId') companyId: string,
  ) {
    return this.payrollService.editPayroll(
      payrollId,
      companyId,
      updatePayrollDto,
    );
  }

  @Delete(':id')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a payroll (soft delete)' })
  @ApiParam({ name: 'id', description: 'Payroll ID' })
  @ApiResponse({ status: 200, description: 'Payroll deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Payroll cannot be deleted (currently processing)',
  })
  @ApiResponse({ status: 404, description: 'Payroll not found' })
  async deletePayroll(
    @Param('id') payrollId: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.payrollService.deletePayroll(payrollId, companyId);
  }

  @Post(':id/earnings')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create earning for all employees in a payroll' })
  @ApiParam({ name: 'id', description: 'Payroll ID' })
  @ApiBody({ type: CreateEarningDto })
  @ApiResponse({
    status: 201,
    description: 'Earnings created for payroll successfully',
  })
  async addEarningToPayroll(
    @Param('id') payrollId: string,
    @Body() dto: CreateEarningDto,
    @GetUser('companyId') companyId: string,
  ) {
    return this.payrollService.addEarningToPayroll(companyId, payrollId, dto);
  }

  @Get(':id/earnings')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List earnings for a payroll' })
  @ApiParam({ name: 'id', description: 'Payroll ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getEarningsByPayrollId(
    @Param('id') payrollId: string,
    @Query() query: PaginatedQuery,
    @GetUser('companyId') companyId: string,
  ) {
    const paginatedQuery = new PaginatedQuery(query.page, query.limit);
    return this.payrollService.getEarningsByPayrollId(
      companyId,
      payrollId,
      paginatedQuery,
    );
  }

  @Delete(':id/earnings/:earningId')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete earning from a payroll' })
  @ApiParam({ name: 'id', description: 'Payroll ID' })
  @ApiParam({ name: 'earningId', description: 'Earning ID' })
  @ApiResponse({
    status: 200,
    description: 'Earning deleted successfully from payroll',
  })
  async deletePayrollEarning(
    @Param('id') payrollId: string,
    @Param('earningId') earningId: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.payrollService.deletePayrollEarning(
      companyId,
      payrollId,
      earningId,
    );
  }

  @Get('earnings/employee/:employeeId')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List earnings for an employee across payrolls' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getEarningsByEmployeeId(
    @Param('employeeId') employeeId: string,
    @Query() query: PaginatedQuery,
    @GetUser('companyId') companyId: string,
  ) {
    const paginatedQuery = new PaginatedQuery(query.page, query.limit);
    return this.payrollService.getEarningsByEmployeeId(
      companyId,
      employeeId,
      paginatedQuery,
    );
  }

  @Post('earnings/employee/:employeeId')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create earning for a specific employee in a payroll',
  })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiBody({ type: CreateEarningDto })
  @ApiResponse({ status: 201, description: 'Earning created successfully' })
  async addEarningToEmployee(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateEarningDto,
    @GetUser('companyId') companyId: string,
  ) {
    return this.payrollService.addEarningToEmployee(
      companyId,
      employeeId,
      dto,
    );
  }

  @Post(':id/deductions')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create deduction for all employees in a payroll' })
  @ApiParam({ name: 'id', description: 'Payroll ID' })
  @ApiBody({ type: CreateDeductionDto })
  @ApiResponse({
    status: 201,
    description: 'Deductions created for payroll successfully',
  })
  async addDeductionToPayroll(
    @Param('id') payrollId: string,
    @Body() dto: CreateDeductionDto,
    @GetUser('companyId') companyId: string,
  ) {
    return this.payrollService.addDeductionToPayroll(companyId, payrollId, dto);
  }

  @Get(':id/deductions')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List deductions for a payroll' })
  @ApiParam({ name: 'id', description: 'Payroll ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDeductionsByPayrollId(
    @Param('id') payrollId: string,
    @Query() query: PaginatedQuery,
    @GetUser('companyId') companyId: string,
  ) {
    const paginatedQuery = new PaginatedQuery(query.page, query.limit);
    return this.payrollService.getDeductionsByPayrollId(
      companyId,
      payrollId,
      paginatedQuery,
    );
  }

  @Delete(':id/deductions/:deductionId')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete deduction from a payroll' })
  @ApiParam({ name: 'id', description: 'Payroll ID' })
  @ApiParam({ name: 'deductionId', description: 'Deduction ID' })
  @ApiResponse({
    status: 200,
    description: 'Deduction deleted successfully from payroll',
  })
  async deletePayrollDeduction(
    @Param('id') payrollId: string,
    @Param('deductionId') deductionId: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.payrollService.deletePayrollDeduction(
      companyId,
      payrollId,
      deductionId,
    );
  }

  @Post('deductions/employee/:employeeId')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create deduction for a specific employee in a payroll',
  })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiBody({ type: CreateDeductionDto })
  @ApiResponse({ status: 201, description: 'Deduction created successfully' })
  async addDeductionToEmployee(
    @Param('employeeId') employeeId: string,
    @Body() dto: CreateDeductionDto,
    @GetUser('companyId') companyId: string,
  ) {
    return this.payrollService.addDeductionToEmployee(
      companyId,
      employeeId,
      dto,
    );
  }

  @Get('deductions/employee/:employeeId')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List deductions for an employee across payrolls' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getDeductionsByEmployeeId(
    @Param('employeeId') employeeId: string,
    @Query() query: PaginatedQuery,
    @GetUser('companyId') companyId: string,
  ) {
    const paginatedQuery = new PaginatedQuery(query.page, query.limit);
    return this.payrollService.getDeductionsByEmployeeId(
      companyId,
      employeeId,
      paginatedQuery,
    );
  }
}
