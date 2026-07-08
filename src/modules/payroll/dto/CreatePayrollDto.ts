import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreatePayrollDto {
  @ApiProperty({
    example: 'August Payroll',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 8,
    description: '0-11 for the months',
  })
  @Min(0)
  @Max(11)
  @IsNumber()
  @IsNotEmpty()
  month: number;

  @ApiProperty({
    example: 2025,
    description: 'the year of the payroll',
  })
  @IsNumber()
  @IsNotEmpty()
  year: number;

  @ApiProperty({
    example: ['123', '456'],
    description: 'the ids of the employees to be paid',
  })
  @IsNotEmpty()
  @IsArray()
  employeeIds: string[];
}
