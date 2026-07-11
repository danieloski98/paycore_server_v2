import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class AddEmployeesToPayrollDto {
  @ApiProperty({
    example: ['123', '456'],
    description: 'the ids of the employees to add to the payroll',
  })
  @IsNotEmpty()
  @IsArray()
  employeeIds: string[];
}
