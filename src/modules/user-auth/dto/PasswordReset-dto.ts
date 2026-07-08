import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum UserType {
  USER = 'USER',
  EMPLOYEE = 'EMPLOYEE',
}

export class PasswordResetDto {
  @ApiProperty({
    description: 'The email address of the user or employee',
    example: 'user@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The type of account for password reset',
    enum: UserType,
    example: UserType.USER,
  })
  @IsNotEmpty()
  @IsEnum(UserType)
  @IsString()
  type: UserType;
}