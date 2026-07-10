import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DepartmentService } from './department.service';
import { UserAuthGuard } from 'src/common/guards/user-auth/user-auth.guard';
import { GetUser } from 'src/common/decorators/user/user.decorator';
import { CreateDepartmentDto } from './dto/create-department-dto';

@ApiTags('Departments')
@Controller('departments')
@UseGuards(UserAuthGuard)
@ApiBearerAuth()
export class DepartmentController {
    constructor(private readonly departmentService: DepartmentService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new department' })
    @ApiResponse({ status: 201, description: 'Department created successfully' })
    @ApiResponse({ status: 400, description: 'Department already exists' })
    async createDepartment(
        @Body() createDepartmentDto: CreateDepartmentDto,
        @GetUser('companyId') companyId: string,
    ) {
        return this.departmentService.createDepartment({ companyId, data: createDepartmentDto });
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a department' })
    @ApiResponse({ status: 200, description: 'Department updated successfully' })
    @ApiResponse({ status: 404, description: 'Department not found' })
    async updateDepartment(
        @Param('id') departmentId: string,
        @Body() updateDepartmentDto: CreateDepartmentDto,
        @GetUser('companyId') companyId: string,
    ) {
        return this.departmentService.updateDepartment({ companyId, departmentId, data: updateDepartmentDto });
    }

    @Get()
    @ApiOperation({ summary: 'Get paginated list of company departments' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Departments retrieved successfully' })
    async getCompanyDepartments(
        @GetUser('companyId') companyId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.departmentService.getCompanyDepartments({ 
            companyId, 
            page: page ? Number(page) : 1, 
            limit: limit ? Number(limit) : 20 
        });
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a department' })
    @ApiResponse({ status: 200, description: 'Department deleted successfully' })
    @ApiResponse({ status: 404, description: 'Department not found' })
    async deleteDepartment(
        @Param('id') departmentId: string,
        @GetUser('companyId') companyId: string,
    ) {
        return this.departmentService.deleteDepartment({ companyId, departmentId });
    }
}
