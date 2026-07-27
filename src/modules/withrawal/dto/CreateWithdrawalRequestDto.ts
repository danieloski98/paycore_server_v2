import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateWithdrawalRequestDto {
  @ApiProperty({ example: 5000, description: 'Amount for withdrawal request' })
  @IsNumber()
  @Min(1, { message: 'Amount must be greater than 0' })
  @IsNotEmpty({ message: 'Amount is required' })
  amount: number;

  @ApiProperty({ example: 'bank_details_id_123', description: 'Bank details ID for the withdrawal request' })
  @IsString()
  @IsNotEmpty({ message: 'Bank ID is required' })
  bankId: string;
}
