import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department-dto';
import { tryCatch } from 'bullmq';
import { ReturnType } from 'src/common/returnType';
import { PaginatedResponse } from 'src/common/classes/PagintedResponse';

@Injectable()
export class DepartmentService {
    private logger = new Logger(DepartmentService.name);
    constructor(
        private readonly databaseService: PrismaService,
    ) { }

    async createDepartment({ companyId, data }: { companyId: string, data: CreateDepartmentDto }) {
        try {
            // first check if the name is already in use by this company
            const existingDepartment = await this.databaseService.department.findFirst({
                where: {
                    name: data.name,
                    companyId: companyId,
                },
            });

            if (existingDepartment) {
                throw new BadRequestException('Department already exists');
            }

            // create the department
            const department = await this.databaseService.department.create({
                data: {
                    name: data.name,
                    companyId: companyId,
                },
            });

            this.logger.log(`Department created: ${department.id}`);
            return new ReturnType({
                success: true,
                data: department,
                message: 'Department created successfully',
            });
        } catch (error) {
            this.logger.error(error);
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException('An error occured while creating the department', error);
        }
    }

    async updateDepartment({
        companyId,
        departmentId,
        data,
    }: {
        companyId: string;
        departmentId: string;
        data: CreateDepartmentDto;
    }) {
        try {
            // first check if the department exists
            const department = await this.databaseService.department.findFirst({
                where: {
                    id: departmentId,
                    companyId: companyId,
                },
            });

            if (!department) {
                throw new NotFoundException('Department not found');
            }

            // update the department
            const updatedDepartment = await this.databaseService.department.update({
                where: {
                    id: departmentId,
                },
                data: {
                    name: data.name,
                },
            });

            this.logger.log(`Department updated: ${updatedDepartment.id}`);
            return new ReturnType({
                success: true,
                data: updatedDepartment,
                message: 'Department updated successfully',
            });
        } catch (error) {
            this.logger.error(error);
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException('An error occured while updating the department', error);
        }
    }

    async getCompanyDepartments({
        companyId,
        page = 1,
        limit = 20,
    }: {
        companyId: string;
        page?: number;
        limit?: number;
    }) {
        try {
            const skip = (page - 1) * limit;
            const departments = await this.databaseService.department.findMany({
                where: {
                    companyId: companyId,
                    isDeleted: false,
                },
                skip,
                take: limit,
                select: {
                    name: true,
                    id: true,
                }
            });

            const total = await this.databaseService.department.count({
                where: {
                    companyId: companyId,
                    isDeleted: false,
                },
            });

            this.logger.log(`Departments fetched: ${departments.length}`);
            return new PaginatedResponse({
                message: 'Departments fetched successfully',
                data: departments,
                success: true,
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            });
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException('An error occured while fetching departments', error);
        }
    }

    async deleteDepartment({
        companyId,
        departmentId,
    }: {
        companyId: string;
        departmentId: string;
    }) {
        try {
            // first check if the department exists
            const department = await this.databaseService.department.findFirst({
                where: {
                    id: departmentId,
                    companyId: companyId,
                },
            });

            if (!department) {
                throw new NotFoundException('Department not found');
            }

            // delete the department
            const deletedDepartment = await this.databaseService.department.update({
                where: {
                    id: departmentId,
                },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                },
            });

            this.logger.log(`Department deleted: ${deletedDepartment.id}`);
            return new ReturnType({
                success: true,
                data: deletedDepartment,
                message: 'Department deleted successfully',
            });
        } catch (error) {
            this.logger.error(error);
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException('An error occured while deleting the department', error);
        }
    }
}
