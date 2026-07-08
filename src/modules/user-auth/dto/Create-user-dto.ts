import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from "class-validator";
import { UserRole } from "generated/prisma/enums";

export class CreateUserDto {
    @ApiProperty({
        example: 'Daniel'
    })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({
        example: 'Johnson'
    })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({
        example: 'Daniel'
    })
    @IsString()
    @IsNotEmpty()
    @IsEmail()
    @Transform(({ value }: { value: string}) => value.toLowerCase())
    email: string;

    @ApiProperty({
        example: '+2348044645758'
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(11)    
    phone: string;

    @ApiProperty({
        example: 'Verysecurepassword'
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        example: UserRole.SUPER_ADMIN,
    })
    @IsEnum(UserRole)
    @IsNotEmpty()
    role: UserRole;
}