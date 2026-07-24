import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber, IsDateString } from "class-validator";

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
    picture: string;

    @ApiProperty({
        example: 'Orion'
    })
    @IsString()
    @IsOptional()
    department: string;

    @ApiProperty({
        example: 1_000_000,
    })
    @IsNumber()
    @IsOptional()
    salary: number;

    @ApiProperty({
        example: '2026-02-02'
    })
    @IsDateString()
    @IsOptional()
    startDate: string;

}