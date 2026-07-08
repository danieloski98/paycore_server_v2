import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ValidateBankDto {
    @ApiProperty({
        example: '2072726231'
    })
    @IsString()
    @IsNotEmpty()
    accountNumber: string;

    @ApiProperty({
        example: '033'
    })
    @IsString()
    @IsNotEmpty()
    bankCode: string;
}