import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { LeaveType } from 'generated/prisma/enums';

export class CreateLeaveDto {
  @ApiProperty({
    example: LeaveType.PATERNITY,
    description: 'Type of leave',
  })
  @IsEnum(LeaveType)
  @IsNotEmpty({ message: 'Leave type is required' })
  leaveType: LeaveType;

  @ApiProperty({
    example: '2023-01-01',
    description: 'Start date of leave',
  })
  @IsNotEmpty({ message: 'Start date is required' })
  @IsString({ message: 'Start date must be a date' })
  startDate: Date;

  @ApiProperty({
    example: '2023-01-01',
    description: 'End date of leave',
  })
  @IsNotEmpty({ message: 'End date is required' })
  @IsString({ message: 'End date must be a string' })
  endDate: string;

  @ApiProperty({
    example: 'Description of leave',
    description: 'Description of leave',
  })
  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description: string;
}
