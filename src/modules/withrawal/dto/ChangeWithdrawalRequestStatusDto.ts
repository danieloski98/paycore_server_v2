import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { WithdrawalRequestStatus } from 'generated/prisma/enums';

export class ChangeWithdrawalRequestStatusDto {
  @ApiProperty({
    example: WithdrawalRequestStatus.APPROVED,
    description: 'New status for the withdrawal request',
    enum: WithdrawalRequestStatus,
  })
  @IsEnum(WithdrawalRequestStatus)
  @IsNotEmpty({ message: 'Status is required' })
  status: WithdrawalRequestStatus;
}
