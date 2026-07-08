import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({
    example: 'Orion',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Orion',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'Orion',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }: { value: string }) => value.toLowerCase())
  email: string;

  @ApiProperty({
    example: 'Orion',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 'Orion',
  })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({
    example: 'Orion',
  })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({
    example: 1_000_000,
  })
  @IsNumber()
  @IsNotEmpty()
  salary: number;

  @ApiProperty({
    example: '2-2-2026',
  })
  @IsString()
  @IsNotEmpty()
  startDate: string;
}
