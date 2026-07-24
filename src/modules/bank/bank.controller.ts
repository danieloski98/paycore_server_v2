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
  constructor(private readonly bankService: BankService) { }

  @Get()
  @ApiOperation({ summary: 'Get all banks from paystack' })
  async getBanks() {
    return await this.bankService.getBanks();
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate a bank account' })
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
  async createBankRecord(
    @Body() payload: CreateBankRecordDto,
    @GetEmployee('id') userId: string,
  ) {
    return await this.bankService.createBankRecord({ payload, userId });
  }

  @Put(':bankId/primary')
  @UseGuards(EmployeeAuthGuard)
  @ApiOperation({ summary: 'Mark a bank record as primary' })
  async markBankAsPrimary(
    @Param('bankId') bankId: string,
    @GetEmployee('id') userId: string,
  ) {
    return await this.bankService.markBankAsPrimary({ bankId, userId });
  }

  @Put(':bankId')
  @UseGuards(EmployeeAuthGuard)
  @ApiOperation({ summary: 'Update a bank record' })
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
  async softDeleteBankRecord(
    @Param('bankId') bankId: string,
    @GetEmployee('id') userId: string,
  ) {
    return await this.bankService.softDeleteBankRecord({ bankId, userId });
  }
}
