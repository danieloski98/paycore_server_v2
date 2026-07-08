import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { EarningType } from 'generated/prisma/enums';

export class CreateEarningDto {
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ enum: EarningType })
  @IsEnum(EarningType)
  @IsNotEmpty()
  type: EarningType;

  @ApiProperty({ example: 'Performance bonus', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
