import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'John',
  })
  firstName?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'Doe',
  })
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({
    example: 'john.doe@example.com',
  })
  email?: string;

  // @IsOptional()
  // @IsEnum(UserRole)
  // role?: UserRole;
}
