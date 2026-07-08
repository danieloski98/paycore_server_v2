import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DeductionType } from 'generated/prisma/enums';

export class CreateDeductionDto {
  @ApiProperty({ example: 1500 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ enum: DeductionType })
  @IsEnum(DeductionType)
  @IsNotEmpty()
  type: DeductionType;

  @ApiProperty({ example: 'Health insurance', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
