import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestPayoutDto {
  @ApiProperty({ description: 'Amount to withdraw (payout) in NGN' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Optional Bank Details ID', required: false })
  @IsString()
  @IsOptional()
  bankDetailsId?: string;
}
