import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateCompanyDto {
    @ApiProperty({
        example: 'The chiefs place'
    })
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }:{ value: string}) => value.toLowerCase())
    name: string;

    @ApiProperty({
        example: 'RC84394839'
    })
    @IsString()
    @IsNotEmpty()
    RCNumber: string

    @ApiProperty({
        example: 'No. 2 herbert marcaluy road',
    })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({
        example: 'IT / Software'
    })
    @IsString()
    @IsNotEmpty()
    industry: string;

    @ApiProperty({
        example: 'IT / Software'
    })
    @IsString()
    @IsNotEmpty()
    logo: string;
}