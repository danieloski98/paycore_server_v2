import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { LeaveStatus } from 'generated/prisma/enums';

export class ChangeLeaveStatusDto {
  @ApiProperty({
    example: LeaveStatus.ACCEPTED,
    description: 'New status for the leave request',
    enum: LeaveStatus,
  })
  @IsEnum(LeaveStatus)
  @IsNotEmpty({ message: 'Status is required' })
  status: LeaveStatus;
}