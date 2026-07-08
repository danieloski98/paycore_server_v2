import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserType } from './PasswordReset-dto'; // Re-using UserType enum

export class ChangePasswordDto {
  @ApiProperty({
    description: 'The ID of the user or employee',
    example: 'clxko5g3r0000c8uvb9z3a1j2',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'The new password for the account',
    example: 'NewSecurePassword123!',
    minLength: 8,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;

  @ApiProperty({
    description: 'The type of account for password change',
    enum: UserType,
    example: UserType.USER,
  })
  @IsNotEmpty()
  @IsEnum(UserType)
  @IsString()
  type: UserType;
}