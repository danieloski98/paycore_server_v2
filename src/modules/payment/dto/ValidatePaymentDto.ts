import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ValidatePayment {
  @IsString()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @IsString()
  @ApiProperty({ description: 'Transaction reference' })
  reference: string;
}
