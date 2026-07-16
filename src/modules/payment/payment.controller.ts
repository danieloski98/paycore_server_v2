import { Body, Controller, Get, Param, Post, UseGuards, Query, UnauthorizedException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/CreatePayment.dto';
import { UserAuthGuard } from '../../common/guards/user-auth/user-auth.guard';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth/employee-auth.guard';
import { GetUser } from '../../common/decorators/user/user.decorator';
import { ReturnType } from '../../common/returnType';
import { ValidatePayment } from './dto/ValidatePaymentDto';
import { PaginatedQuery } from '../../common/classes/PaginatedQuery';

@ApiTags('Payment')
@Controller('payment')
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post(':companyId')
  @UseGuards(UserAuthGuard)
  @ApiOperation({ summary: 'Create a new payment record' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment record created successfully',
    type: ReturnType,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Company wallet not found',
  })
  @ApiResponse({
    status: 502,
    description: 'Bad gateway - Error occurred while creating payment record',
  })
  async createPayment(
    @Param('companyId') companyId: string,
    @Body() createPaymentDto: CreatePaymentDto,
    @GetUser() user: any,
  ) {
    return this.paymentService.createPayment(companyId, createPaymentDto);
  }

  @Post('validate/status')
  @UseGuards(UserAuthGuard)
  @ApiOperation({ summary: 'Validate a payment transaction' })
  @ApiBody({ type: ValidatePayment })
  @ApiResponse({
    status: 200,
    description: 'Payment validated successfully',
    type: ReturnType,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Payment record not found or payment not completed',
  })
  @ApiResponse({
    status: 502,
    description: 'Bad gateway - Error occurred while validating payment',
  })
  async validatePayment(
    @Body() validatePaymentDto: ValidatePayment,
    @GetUser('id') userId: string,
  ) {
    console.log(validatePaymentDto);
    return this.paymentService.validatePayment(
      validatePaymentDto.companyId,
      validatePaymentDto.reference,
      userId,
    );
  }

  @Get('company/:companyId')
  @UseGuards(UserAuthGuard)
  @ApiOperation({ summary: 'Get company payments that are completed or failed' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Company payments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing token' })
  async getCompanyPayments(
    @Param('companyId') companyId: string,
    @Query() query: PaginatedQuery,
  ) {
    const paginated = new PaginatedQuery(query.page, query.limit);
    return this.paymentService.getCompanyPayments(companyId, paginated);
  }

  @Get('employee/:employeeId')
  @UseGuards(EmployeeAuthGuard)
  @ApiOperation({ summary: 'Get employee payments (transactions)' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Employee payments retrieved successfully' })
  async getEmployeePayments(
    @Param('employeeId') employeeId: string,
    @GetUser('id') authEmployeeId: string,
    @Query() query: PaginatedQuery,
  ) {
    if (employeeId !== authEmployeeId) {
      throw new UnauthorizedException('Not authorized to view these transactions');
    }
    const paginated = new PaginatedQuery(query.page, query.limit);
    return this.paymentService.getEmployeePayments(employeeId, paginated);
  }
}
