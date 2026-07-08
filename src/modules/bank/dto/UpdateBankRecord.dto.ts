import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateBankRecordDto {
    @ApiProperty({
        example: '2072726231'
    })
    @IsString()
    @IsOptional()
    accountNumber: string;

    @ApiProperty({
        example: '033'
    })
    @IsString()
    @IsOptional()
    bankCode: string;

    @ApiProperty({
        example: '2072726231'
    })
    @IsString()
    @IsOptional()
    accountName: string;

    @ApiProperty({
        example: '2072726231'
    })
    @IsString()
    @IsOptional()
    bankName: string;

}