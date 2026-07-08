import {
  Body,
  Controller,
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
import * as userDecorator from '../../common/decorators/user/user.decorator';
import { UserAuthGuard } from '../../common/guards/user-auth/user-auth.guard';
import { LeaveService } from './leave.service';
import { CreateLeaveDto } from './dto/CreateLeaveDto';
import { ChangeLeaveStatusDto } from './dto/ChangeLeaveStatusDto';
import { PaginatedQuery } from '../../common/classes/PaginatedQuery';
import { EmployeeAuthGuard } from 'src/common/guards/employee-auth/employee-auth.guard';

@ApiTags('Leave Management')
@Controller('leave')
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Post()
  @UseGuards(EmployeeAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new leave request' })
  @ApiBody({ type: CreateLeaveDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async createLeave(
    @Body() payload: CreateLeaveDto,
    @userDecorator.GetUser('id') employeeId: string,
  ) {
    return this.leaveService.createLeave({ employeeId, payload });
  }

  @Get('company')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all leaves for a company with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (default: 10)',
    type: Number,
  })
  async getLeavesByCompanyId(
    @userDecorator.GetUser() user: userDecorator.UserDetails,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const query = new PaginatedQuery(page, limit);
    return this.leaveService.getLeavesByCompanyId(user.companyId, query);
  }

  @Get('employee/:employeeId')
  @UseGuards(EmployeeAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get leaves for a specific employee with pagination',
  })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page (default: 10)',
    type: Number,
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getLeavesByEmployeeId(
    @Param('employeeId') employeeId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const query = new PaginatedQuery(page, limit);
    return this.leaveService.getLeavesByemployeeId(employeeId, query);
  }

  @Get(':id')
  // @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific leave by ID' })
  @ApiParam({ name: 'id', description: 'Leave ID' })
  @ApiResponse({ status: 404, description: 'Leave not found' })
  async getLeaveById(@Param('id') leaveId: string) {
    return this.leaveService.getLeaveById(leaveId);
  }

  @Patch(':id/status')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the status of a leave request' })
  @ApiParam({ name: 'id', description: 'Leave ID' })
  @ApiBody({ type: ChangeLeaveStatusDto })
  @ApiResponse({ status: 400, description: 'Invalid status value' })
  @ApiResponse({ status: 404, description: 'Leave not found' })
  async changeLeaveStatus(
    @Param('id') leaveId: string,
    @Body() payload: ChangeLeaveStatusDto,
  ) {
    return this.leaveService.changeLeaveStatus(leaveId, payload.status);
  }
}
