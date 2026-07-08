import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginEmployeeDto {
    @ApiProperty({
        example: 'employee@company.com',
        description: 'Employee email address'
    })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @Transform(({ value }: { value: string}) => value.toLowerCase())
    email: string;

    @ApiProperty({
        example: 'Verysecurepassword',
        description: 'Employee password'
    })
    @IsString()
    @IsNotEmpty()
    password: string;
} 