import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateWithdrawalRequestDto {
  @ApiPropertyOptional({ example: 6000, description: 'Amount for withdrawal request' })
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Amount must be greater than 0' })
  amount?: number;

  @ApiPropertyOptional({ example: 'bank_details_id_123', description: 'Bank details ID for the withdrawal request' })
  @IsOptional()
  @IsString()
  bankId?: string;
}
