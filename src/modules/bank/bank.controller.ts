import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BankService } from './bank.service';
import { ValidateBankDto } from './dto/ValidateBank.dto';
import { CreateBankRecordDto } from './dto/CreateBankRecord.dto';
import { UpdateBankRecordDto } from './dto/UpdateBankRecord.dto';
import { GetEmployee } from '../../common/decorators/employee/employee.decorator';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth/employee-auth.guard';
import { PaginatedQuery } from '../../common/classes/PaginatedQuery';

@ApiTags('Bank')
@Controller('bank')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Get()
  @ApiOperation({ summary: 'Get all banks from paystack' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of all available banks from Monnify',
    schema: {
      properties: {
        message: { type: 'string' },
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              bankCode: { type: 'string' },
              bankName: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async getBanks() {
    return await this.bankService.getBanks();
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a bank account' })
  @ApiResponse({
    status: 200,
    description: 'Returns the validated bank account details',
    schema: {
      properties: {
        message: { type: 'string' },
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            accountName: { type: 'string' },
            accountNumber: { type: 'string' },
            bankCode: { type: 'string' },
          },
        },
      },
    },
  })
  async validateBank(@Body() payload: ValidateBankDto) {
    return await this.bankService.validateBank({ payload });
  }

  @Get('employee')
  @UseGuards(EmployeeAuthGuard)
  @ApiOperation({
    summary: 'Get paginated bank records for the authenticated employee',
  })
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
  @ApiResponse({
    status: 200,
    description: 'Employee banks retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async getEmployeeBanks(
    @GetEmployee('id') userId: string,
    @Query() query: PaginatedQuery,
  ) {
    const paginatedQuery = new PaginatedQuery(query.page, query.limit);
    return await this.bankService.getEmployeeBanks(userId, paginatedQuery);
  }

  @Post()
  @UseGuards(EmployeeAuthGuard)
  @ApiOperation({ summary: 'Create a new bank record' })
  @ApiResponse({
    status: 201,
    description: 'Returns the created bank record',
    schema: {
      properties: {
        message: { type: 'string' },
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            accountName: { type: 'string' },
            accountNumber: { type: 'string' },
            bankCode: { type: 'string' },
            bankName: { type: 'string' },
            isPrimary: { type: 'boolean' },
            employeeId: { type: 'string' },
          },
        },
      },
    },
  })
  async createBankRecord(
    @Body() payload: CreateBankRecordDto,
    @GetEmployee('id') userId: string,
  ) {
    return await this.bankService.createBankRecord({ payload, userId });
  }

  @Put(':bankId/primary')
  @UseGuards(EmployeeAuthGuard)
  @ApiOperation({ summary: 'Mark a bank record as primary' })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated bank record marked as primary',
    schema: {
      properties: {
        message: { type: 'string' },
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            isPrimary: { type: 'boolean' },
          },
        },
      },
    },
  })
  async markBankAsPrimary(
    @Param('bankId') bankId: string,
    @GetEmployee('id') userId: string,
  ) {
    return await this.bankService.markBankAsPrimary({ bankId, userId });
  }

  @Put(':bankId')
  @UseGuards(EmployeeAuthGuard)
  @ApiOperation({ summary: 'Update a bank record' })
  @ApiResponse({
    status: 200,
    description: 'Returns the updated bank record',
    schema: {
      properties: {
        message: { type: 'string' },
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            accountName: { type: 'string' },
            accountNumber: { type: 'string' },
            bankCode: { type: 'string' },
            bankName: { type: 'string' },
          },
        },
      },
    },
  })
  async updateBankRecord(
    @Param('bankId') bankId: string,
    @Body() payload: UpdateBankRecordDto,
    @GetEmployee('id') userId: string,
  ) {
    return await this.bankService.updateBankRecord({ bankId, userId, payload });
  }

  @Delete(':bankId')
  @UseGuards(EmployeeAuthGuard)
  @ApiOperation({ summary: 'Soft delete a bank record' })
  @ApiResponse({
    status: 200,
    description: 'Returns the soft deleted bank record',
    schema: {
      properties: {
        message: { type: 'string' },
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            isDeleted: { type: 'boolean' },
          },
        },
      },
    },
  })
  async softDeleteBankRecord(
    @Param('bankId') bankId: string,
    @GetEmployee('id') userId: string,
  ) {
    return await this.bankService.softDeleteBankRecord({ bankId, userId });
  }
}
