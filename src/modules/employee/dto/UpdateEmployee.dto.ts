import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateEmployeeDto {
    @ApiProperty({
        example: 'Orion'
    })
    @IsString()
    @IsOptional()
    firstName: string;

    @ApiProperty({
        example: 'Orion'
    })
    @IsString()
    @IsOptional()
    lastName: string;

    @ApiProperty({
        example: 'Orion'
    })
    @IsString()
    @IsOptional()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'Orion'
    })
    @IsString()
    @IsOptional()
    phone: string;

    @ApiProperty({
        example: 'Orion'
    })
    @IsString()
    @IsOptional()
    position: string;

    @ApiProperty({
        example: 'Orion'
    })
    @IsString()
    @IsOptional()
    department: string;

    @ApiProperty({
        example: 1_000_000,
    })
    @IsString()
    @IsOptional()
    salary: number;

    @ApiProperty({
        example: '2-2-2026'
    })
    @IsString()
    @IsOptional()
    startDate: string;

}