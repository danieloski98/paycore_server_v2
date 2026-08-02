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
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import * as userDecorator from '../../common/decorators/user/user.decorator';
import { UserAuthGuard } from '../../common/guards/user-auth/user-auth.guard';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth/employee-auth.guard';
import { WithrawalService } from './withrawal.service';
import { CreateWithdrawalRequestDto } from './dto/CreateWithdrawalRequestDto';
import { UpdateWithdrawalRequestDto } from './dto/UpdateWithdrawalRequestDto';
import { ChangeWithdrawalRequestStatusDto } from './dto/ChangeWithdrawalRequestStatusDto';
import { GetWithdrawalRequestsQueryDto } from './dto/GetWithdrawalRequestsQueryDto';
import { WithdrawalRequestStatus } from 'generated/prisma/client';

@ApiTags('Withdrawal Management')
@Controller('withrawal')
export class WithrawalController {
  constructor(private readonly withrawalService: WithrawalService) {}

  @Post()
  @UseGuards(EmployeeAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new withdrawal request' })
  @ApiBody({ type: CreateWithdrawalRequestDto })
  @ApiResponse({ status: 201, description: 'Withdrawal request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Employee or bank details not found' })
  async createWithdrawalRequest(
    @Body() payload: CreateWithdrawalRequestDto,
    @userDecorator.GetUser('id') employeeId: string,
  ) {
    return this.withrawalService.createWithdrawalRequest({ employeeId, payload });
  }

  @Get()
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated withdrawal requests with filters (by status, employeeId)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'status', required: false, enum: WithdrawalRequestStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'employeeId', required: false, type: String, description: 'Filter by employee ID' })
  async getWithdrawalRequests(
    @userDecorator.GetUser() user: userDecorator.UserDetails,
    @Query() query: GetWithdrawalRequestsQueryDto,
  ) {
    return this.withrawalService.getWithdrawalRequests(query, user?.companyId);
  }

  @Get('employee')
  @UseGuards(EmployeeAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated withdrawal requests for authenticated employee' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'status', required: false, enum: WithdrawalRequestStatus, description: 'Filter by status' })
  async getEmployeeWithdrawalRequests(
    @userDecorator.GetUser('id') employeeId: string,
    @Query() query: GetWithdrawalRequestsQueryDto,
  ) {
    query.employeeId = employeeId;
    return this.withrawalService.getWithdrawalRequests(query);
  }

  @Get(':id')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get withdrawal request by ID' })
  @ApiParam({ name: 'id', description: 'Withdrawal Request ID' })
  @ApiResponse({ status: 200, description: 'Withdrawal request retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Withdrawal request not found' })
  async getWithdrawalRequestById(
    @Param('id') id: string,
    @userDecorator.GetUser() user: userDecorator.UserDetails,
  ) {
    return this.withrawalService.getWithdrawalRequestById(id, user?.companyId);
  }

  @Patch(':id')
  @UseGuards(EmployeeAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a withdrawal request' })
  @ApiParam({ name: 'id', description: 'Withdrawal Request ID' })
  @ApiBody({ type: UpdateWithdrawalRequestDto })
  @ApiResponse({ status: 200, description: 'Withdrawal request updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or request is not pending' })
  @ApiResponse({ status: 404, description: 'Withdrawal request not found' })
  async updateWithdrawalRequest(
    @Param('id') id: string,
    @userDecorator.GetUser('id') employeeId: string,
    @Body() payload: UpdateWithdrawalRequestDto,
  ) {
    return this.withrawalService.updateWithdrawalRequest(id, payload, employeeId);
  }

  @Patch(':id/status')
  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or Reject a withdrawal request' })
  @ApiParam({ name: 'id', description: 'Withdrawal Request ID' })
  @ApiBody({ type: ChangeWithdrawalRequestStatusDto })
  @ApiResponse({ status: 200, description: 'Withdrawal request status updated successfully' })
  @ApiResponse({ status: 404, description: 'Withdrawal request not found' })
  async changeWithdrawalRequestStatus(
    @Param('id') id: string,
    @userDecorator.GetUser() user: userDecorator.UserDetails,
    @Body() payload: ChangeWithdrawalRequestStatusDto,
  ) {
    return this.withrawalService.changeWithdrawalRequestStatus(id, payload, user?.companyId);
  }

  @Delete(':id')
  @UseGuards(EmployeeAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a withdrawal request' })
  @ApiParam({ name: 'id', description: 'Withdrawal Request ID' })
  @ApiResponse({ status: 200, description: 'Withdrawal request deleted successfully' })
  @ApiResponse({ status: 404, description: 'Withdrawal request not found' })
  async deleteWithdrawalRequest(
    @Param('id') id: string,
    @userDecorator.GetUser('id') employeeId: string,
  ) {
    return this.withrawalService.deleteWithdrawalRequest(id, employeeId);
  }
}
