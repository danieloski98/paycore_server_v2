import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateEmployeeDto } from './CreateEmployee.dto';

export class CreateManyEmployeesDto {
  @ApiProperty({
    description: 'Array of employees to create',
    type: [CreateEmployeeDto],
    example: [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+1234567890',
        position: 'Software Engineer',
        department: 'Engineering',
        startDate: '2026-02-02',
        salary: 1_000_000,
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        phone: '+1987654321',
        position: 'Product Manager',
        department: 'Product',
        startDate: '2026-02-02',
        salary: 1_000_000,
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one employee must be provided' })
  @ValidateNested({ each: true })
  @Type(() => CreateEmployeeDto)
  employees: CreateEmployeeDto[];
}
