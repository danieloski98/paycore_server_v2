import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
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
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/CreateEmployee.dto';
import { CreateManyEmployeesDto } from './dto/CreateManyEmployees.dto';
import { UpdateEmployeeDto } from './dto/UpdateEmployee.dto';
import { UserAuthGuard } from '../../common/guards/user-auth/user-auth.guard';
import { LoginEmployeeDto } from './dto/LoginEmployee.dto';
import { CreatePasswordDto } from './dto/CreatePassword.dto';
import { EmployeeAuthGuard } from 'src/common/guards/employee-auth/employee-auth.guard';
import { GeneralAuthGuardGuard } from 'src/common/guards/general-auth-guard/general-auth-guard.guard';

@ApiTags('Employees')
@Controller('employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) { }

  @Post('login')
  @ApiOperation({ summary: 'Login employee and get authentication tokens' })
  @ApiResponse({
    status: 400,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found',
  })
  async loginEmployee(@Body() payload: LoginEmployeeDto) {
    return this.employeeService.loginEmployee({ payload });
  }

  @Post()
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  // @Roles(UserRole.ADMIN, UserRole.HR)
  @ApiOperation({ summary: 'Create a new employee' })
  @ApiResponse({ status: 201, description: 'Employee created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or email already exists',
  })
  @ApiResponse({ status: 404, description: 'Company not found' })
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @GetUser('companyId') companyId: string,
  ) {
    return this.employeeService.createEmployee({
      companyID: companyId,
      payload: createEmployeeDto,
    });
  }

  @Post('bulk')
  @UseGuards(UserAuthGuard)
  @ApiOperation({ summary: 'Create multiple employees at once' })
  @ApiResponse({ status: 201, description: 'Employees created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or duplicate emails found',
  })
  @UseGuards(UserAuthGuard)
  @ApiResponse({ status: 404, description: 'Company not found' })
  async createManyEmployees(
    @Body() createManyEmployeesDto: CreateManyEmployeesDto,
    @GetUser('companyId') companyId: string,
  ) {
    if (!companyId) {
      throw new UnauthorizedException(
        'Not authorized to carry out this function',
      );
    }
    return this.employeeService.createManyEmployees({
      companyID: companyId,
      payload: createManyEmployeesDto,
    });
  }

  @Get(':id')
  @UseGuards(EmployeeAuthGuard)
  @ApiOperation({ summary: 'Get an employee by ID' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getEmployeeById(
    @Param('id') id: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.employeeService.getEmployeeById(id);
  }

  @Get()
  @UseGuards(UserAuthGuard)
  @ApiOperation({ summary: 'Get paginated list of employees' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (1-based)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for filtering employees',
    type: String,
  })
  @ApiQuery({
    name: 'companyId',
    required: false,
    description: 'Search term for filtering employees',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Employees retrieved successfully' })
  async getCompanyEmployees(
    @Query('companyId') companyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.employeeService.getCompanyEmployees({
      companyId,
      page: page ? Number(page ?? 1) : 1,
      limit: limit ? Number(limit ?? 10) : 10,
      search: search as string,
    });
  }

  @Patch(':id')
  @UseGuards(GeneralAuthGuardGuard)
  @ApiOperation({ summary: 'Update an employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or email already exists',
  })
  @ApiQuery({
    name: 'companyId',
    required: false,
    description: 'Company ID',
    type: String,
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async updateEmployee(
    @Param('id') id: string,
    @Body() updateData: UpdateEmployeeDto,
    @Query('companyId') queryCompanyId: string,
  ) {
    return this.employeeService.updateEmployee(id, queryCompanyId, updateData);
  }

  @Delete(':id')
  @UseGuards(UserAuthGuard)
  @ApiOperation({ summary: 'Soft delete an employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee deleted successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async softDeleteEmployee(
    @Param('id') id: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.employeeService.softDeleteEmployee(id, companyId);
  }

  @Delete(':id/permanent')
  @UseGuards(UserAuthGuard)
  @ApiOperation({ summary: 'Permanently delete an employee' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Employee permanently deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async deleteEmployee(
    @Param('id') id: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.employeeService.deleteEmployee(id, companyId);
  }

  @Get(':id/standalone-items')
  @UseGuards(GeneralAuthGuardGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get standalone earnings and deductions for an employee',
  })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Standalone items retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getEmployeeStandaloneItems(
    @Param('id') employeeId: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.employeeService.getEmployeeStandaloneItems(
      employeeId,
      companyId,
    );
  }

  @Delete(':id/earnings/:earningId')
  @UseGuards(EmployeeAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an employee earning' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiParam({ name: 'earningId', description: 'Earning ID' })
  @ApiResponse({ status: 200, description: 'Earning deleted successfully' })
  @ApiResponse({ status: 404, description: 'Earning or employee not found' })
  async deleteEmployeeEarning(
    @Param('id') employeeId: string,
    @Param('earningId') earningId: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.employeeService.deleteEmployeeEarning(
      earningId,
      employeeId,
      companyId,
    );
  }

  @Delete(':id/deductions/:deductionId')
  @UseGuards(EmployeeAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an employee deduction' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiParam({ name: 'deductionId', description: 'Deduction ID' })
  @ApiResponse({ status: 200, description: 'Deduction deleted successfully' })
  @ApiResponse({ status: 404, description: 'Deduction or employee not found' })
  async deleteEmployeeDeduction(
    @Param('id') employeeId: string,
    @Param('deductionId') deductionId: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.employeeService.deleteEmployeeDeduction(
      deductionId,
      employeeId,
      companyId,
    );
  }

  @Post(':id/password')
  @ApiOperation({
    summary: 'Create or update employee password',
    description:
      'Sets a new password for an employee. The password must be at least 8 characters long and must match the confirmation password.',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    type: 'string',
    required: true,
  })
  @ApiBody({
    type: CreatePasswordDto,
    description: 'Password and confirmation password',
    examples: {
      example1: {
        value: {
          password: 'Verysecurepassword123',
          confirmPassword: 'Verysecurepassword123',
        },
        summary: 'Valid password creation',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password created successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Passwords do not match or password is too short',
  })
  @ApiResponse({
    status: 404,
    description: 'Employee not found or is inactive',
  })
  async createEmployeePassword(
    @Param('id') employeeId: string,
    @Body() payload: CreatePasswordDto,
  ) {
    return this.employeeService.createEmployeePassword({ employeeId, payload });
  }

  @Get('company/all')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a paginated list of employees for a company' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Employees retrieved successfully' })
  async getEmployeesByCompany(
    @GetUser('companyId') companyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.employeeService.getEmployeesByCompanyId({
      companyId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });
  }

  @Get('company/:id')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an employee by ID for a company' })
  @ApiParam({ name: 'id', description: 'Employee ID' })
  @ApiResponse({ status: 200, description: 'Employee retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getEmployeeByCompany(
    @Param('id') employeeId: string,
    @GetUser('companyId') companyId: string,
  ) {
    return this.employeeService.getEmployeeByCompanyId(employeeId, companyId);
  }
}
