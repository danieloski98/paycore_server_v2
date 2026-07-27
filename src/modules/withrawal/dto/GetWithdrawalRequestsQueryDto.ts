import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WithdrawalRequestStatus } from 'generated/prisma/enums';

export class GetWithdrawalRequestsQueryDto {
  @ApiPropertyOptional({ description: 'Page number (default: 1)', example: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page (default: 10)', example: 10 })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by withdrawal request status',
    enum: WithdrawalRequestStatus,
  })
  @IsOptional()
  @IsEnum(WithdrawalRequestStatus)
  status?: WithdrawalRequestStatus;

  @ApiPropertyOptional({ description: 'Filter by Employee ID' })
  @IsOptional()
  @IsString()
  employeeId?: string;
}
