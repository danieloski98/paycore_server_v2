import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateDepartmentDto {
    @ApiProperty({
        example: 'HR'
    })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value.trim().charAt(0).toUpperCase() + value.slice(1).toLowerCase())
    name: string;
}