import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateEmployeePasswordDto {
    @ApiProperty({
        example: 'verysecurepassword'
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}