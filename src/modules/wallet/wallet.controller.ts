import { Body, Controller, Get, Param, Post, UseGuards, UnauthorizedException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { UserAuthGuard } from '../../common/guards/user-auth/user-auth.guard';
import { EmployeeAuthGuard } from '../../common/guards/employee-auth/employee-auth.guard';
import { GetUser } from '../../common/decorators/user/user.decorator';
import { ReturnType } from '../../common/returnType';
import { RequestPayoutDto } from './dto/RequestPayout.dto';

@ApiTags('Wallet')
@Controller('wallet')
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get(':companyId')
  @UseGuards(UserAuthGuard)
  @ApiOperation({ summary: 'Get wallet for a company' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiResponse({
    status: 200,
    description: 'Wallet retrieved successfully',
    type: ReturnType,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Error occurred while getting the wallet',
  })
  async getWallet(@Param('companyId') companyId: string) {
    return this.walletService.getWallet(companyId);
  }

  @Get('employee/:employeeId')
  @UseGuards(EmployeeAuthGuard)
  @ApiOperation({ summary: 'Get wallet for an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee ID' })
  @ApiResponse({
    status: 200,
    description: 'Wallet retrieved successfully',
    type: ReturnType,
  })
  async getEmployeeWallet(
    @Param('employeeId') employeeId: string,
    @GetUser('id') authEmployeeId: string,
  ) {
    if (employeeId !== authEmployeeId) {
      throw new UnauthorizedException('Not authorized to view this wallet');
    }
    return this.walletService.getEmployeeWallet(employeeId);
  }

  @Post('payout')
  @UseGuards(EmployeeAuthGuard)
  @ApiOperation({ summary: 'Request wallet payout/withdrawal to bank account' })
  @ApiBody({ type: RequestPayoutDto })
  @ApiResponse({
    status: 201,
    description: 'Payout initiated successfully',
    type: ReturnType,
  })
  async requestPayout(
    @Body() requestPayoutDto: RequestPayoutDto,
    @GetUser('id') employeeId: string,
  ) {
    return this.walletService.requestPayout(employeeId, requestPayoutDto);
  }
}
