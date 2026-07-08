import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
     @ApiProperty({
        example: 'Daniel'
    })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @Transform(({ value }: { value: string}) => value.toLowerCase())
    email: string;

    @ApiProperty({
        example: 'Verysecurepassword'
    })
    @IsString()
    @IsNotEmpty()
    password: string;

}