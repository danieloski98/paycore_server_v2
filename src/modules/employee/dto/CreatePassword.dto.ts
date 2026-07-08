import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreatePasswordDto {
    @ApiProperty({
        example: 'Verysecurepassword123',
        description: 'New password for the employee'
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    password: string;

    @ApiProperty({
        example: 'Verysecurepassword123',
        description: 'Confirmation of the new password'
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8)
    confirmPassword: string;
} 