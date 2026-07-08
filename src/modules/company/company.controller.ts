import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/Create-compnay-dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
// import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
// import { GetUser } from '../../common/decorators/get-user.decorator';
import { ReturnType } from '../../common/returnType';

@ApiTags('Company')
@Controller('company')
@ApiBearerAuth()
export class CompanyController {
    constructor(private readonly companyService: CompanyService) {}

    @Post(':userId')
    @ApiParam({ name: 'userId', type: String })
    @ApiOperation({ summary: 'Create a new company' })
    @ApiResponse({
        status: 201,
        description: 'Company has been successfully created',
        type: ReturnType
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - Invalid input data'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token'
    })
    @ApiResponse({
        status: 404,
        description: 'User not found'
    })
    async createCompany(
        @Body() createCompanyDto: CreateCompanyDto,
        @Param('userId') userId: string,
    ) {
        return this.companyService.createCompany({
            payload: createCompanyDto,
            userId
        });
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get company by ID' })
    @ApiResponse({
        status: 200,
        description: 'Company has been successfully retrieved',
        type: ReturnType
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token'
    })
    @ApiResponse({
        status: 404,
        description: 'Company not found'
    })
    async getCompanyById(@Param('id') id: string) {
        return this.companyService.getCompanyById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update company information' })
    @ApiResponse({
        status: 200,
        description: 'Company has been successfully updated',
        type: ReturnType
    })
    @ApiResponse({
        status: 400,
        description: 'Bad request - Invalid input data'
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token'
    })
    @ApiResponse({
        status: 404,
        description: 'Company not found'
    })
    async updateCompany(
        @Param('id') id: string,
        @Body() updateCompanyDto: UpdateCompanyDto
    ) {
        return this.companyService.updateCompany(id, updateCompanyDto);
    }
}
