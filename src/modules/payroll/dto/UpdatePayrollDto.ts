import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdatePayrollDto {
  @ApiProperty({
    example: 'August Payroll Updated',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 8,
    description: '0-11 for the months',
    required: false,
  })
  @Min(0)
  @Max(11)
  @IsNumber()
  @IsOptional()
  month?: number;

  @ApiProperty({
    example: 2025,
    description: 'the year of the payroll',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  year?: number;
}