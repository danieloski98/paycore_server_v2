import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { UserAuthGuard } from '../../common/guards/user-auth/user-auth.guard';
import { ReturnType } from '../../common/returnType';

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
}
