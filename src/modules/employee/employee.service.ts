import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/CreateEmployee.dto';
import { CreateManyEmployeesDto } from './dto/CreateManyEmployees.dto';
import { ReturnType } from '../../common/returnType';
import { PaginatedResponse } from '../../common/classes/PagintedResponse';
import { UpdateEmployeeDto } from './dto/UpdateEmployee.dto';
import { compare, hash, genSalt } from 'bcryptjs';
import { LoginEmployeeDto } from './dto/LoginEmployee.dto';
import { CreatePasswordDto } from './dto/CreatePassword.dto';
import { EmailService } from 'src/common/services/email/email.service';
import { UploadService } from 'src/common/services/upload/upload.service';
import { Employee, Prisma } from 'generated/prisma/client';

@Injectable()
export class EmployeeService {
  private logger = new Logger(EmployeeService.name);

  constructor(
    private databaseService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private uploadService: UploadService,
  ) { }

  private async enrichedEmployee(employee: Partial<Employee>) {
    let picture: any = null;
    if (employee?.picture) {
      picture = await this.uploadService.getFileInfo(employee.picture);
    }

    return {
      ...employee,
      password: undefined,
      picture,
    } as any;
  }

  /**
   * Check if an employee exists
   * @param employeeId - The ID of the employee
   * @param companyId - Optional company ID to check against
   * @returns The employee if found
   */
  async checkEmployeeExists(employeeId: string, companyId?: string) {
    try {
      const whereClause: Prisma.EmployeeWhereInput = {
        id: employeeId,
        isActive: true,
        isDeleted: false,
      };

      if (companyId) {
        whereClause.companyId = companyId;
      }

      const employee = await this.databaseService.employee.findFirst({
        where: whereClause,
      });

      if (!employee) {
        throw new NotFoundException('Employee not found or is inactive');
      }

      return employee;
    } catch (error: any) {
      this.logger.error(`Failed to check employee existence: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to check employee existence',
      );
    }
  }

  /**
   * Create a single employee
   * @param companyID - The ID of the company
   * @param payload - The employee data
   * @returns The created employee
   */
  async createEmployee({
    companyID,
    payload,
  }: {
    companyID: string;
    payload: CreateEmployeeDto;
  }) {
    try {
      // Check if company exists
      const company = await this.databaseService.company.findUnique({
        where: { id: companyID },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Check if email already exists
      const existingEmployee = await this.databaseService.employee.findFirst({
        where: {
          email: payload.email,
          companyId: companyID,
        },
      });

      if (existingEmployee) {
        throw new BadRequestException(
          'Employee with this email already exists',
        );
      }

      // Create employee
      const employee = await this.databaseService.employee.create({
        data: {
          ...payload,
          startDate: new Date(payload.startDate).toISOString(),
          companyId: companyID,
        },
      });

      // send out email
      await this.emailService.sendEmployeeWelcomeMail({
        email: employee.email,
        employeeId: employee.id,
        companyId: companyID,
        companyName: company.name,
      });

      const enrichedEmployee = await this.enrichedEmployee(employee);

      return new ReturnType({
        success: true,
        data: enrichedEmployee,
        message: 'Employee created successfully',
      });
    } catch (error: any) {
      this.logger.error(`Failed to create employee: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to create employee');
    }
  }

  /**
   * Create multiple employees
   * @param companyID - The ID of the company
   * @param payload - The array of employee data
   * @returns Array of created employees
   */
  async createManyEmployees({
    companyID,
    payload,
  }: {
    companyID: string;
    payload: CreateManyEmployeesDto;
  }) {
    try {
      // Check if company exists
      const company = await this.databaseService.company.findUnique({
        where: { id: companyID },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Check for duplicate emails
      const emails = payload.employees.map((emp) => emp.email);
      const existingEmployees = await this.databaseService.employee.findMany({
        where: {
          email: { in: emails },
          companyId: companyID,
        },
      });

      if (existingEmployees.length > 0) {
        const duplicateEmails = existingEmployees
          .map((emp) => emp.email)
          .join(', ');
        throw new BadRequestException(
          `Employees with these emails already exist: ${duplicateEmails}`,
        );
      }

      // Create employees in a transaction
      const createdEmployees = await this.databaseService.$transaction(
        payload.employees.map((employee) =>
          this.databaseService.employee.create({
            data: {
              ...employee,
              startDate: new Date(employee.startDate).toISOString(),
              companyId: companyID,
            },
          }),
        ),
      );

      // send out email to all employes
      await Promise.all(
        emails.map(async (email, index) => {
          const payload = {
            email,
            companyId: companyID,
            companyName: company.name,
            employeeId: createdEmployees[index].id,
          };
          return this.emailService.sendEmployeeWelcomeMail(payload);
        }),
      );

      const enrichedEmployees = await Promise.all(
        createdEmployees.map(
          async (employee) => await this.enrichedEmployee(employee),
        ),
      );

      return new ReturnType({
        success: true,
        data: enrichedEmployees,
        message: `${createdEmployees.length} employees created successfully`,
      });
    } catch (error: any) {
      this.logger.error(
        `Failed to create multiple employees: ${error.message}`,
      );
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to create employees');
    }
  }

  /**
   * Get an employee by ID
   * @param id - The ID of the employee
   * @returns The employee data
   */
  async getEmployeeById(id: string) {
    try {
      const employee = await this.databaseService.employee.findUnique({
        where: { id },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found');
      }

      const enrichedEmployee = await this.enrichedEmployee(
        employee as Partial<Employee>,
      );

      return new ReturnType({
        success: true,
        data: enrichedEmployee,
        message: 'Employee retrieved successfully',
      });
    } catch (error: any) {
      this.logger.error(`Failed to get employee: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to retrieve employee');
    }
  }

  /**
   * Get paginated employees for a company
   * @param companyId - The ID of the company
   * @param page - The page number (1-based)
   * @param limit - The number of items per page
   * @param search - Optional search term for filtering
   * @returns Paginated list of employees
   */
  async getCompanyEmployees({
    companyId,
    page = 1,
    limit = 10,
    search,
  }: {
    companyId: string;
    page: number;
    limit: number;
    search: string;
  }) {
    try {
      this.logger.error('LIMIT', limit);
      this.logger.error('PAGE', page);
      // Validate pagination parameters
      if (page < 1)
        throw new BadRequestException('Page number must be greater than 0');
      if (limit < 1)
        throw new BadRequestException('Limit must be greater than 0');
      if (limit > 100) throw new BadRequestException('Limit cannot exceed 100');

      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.EmployeeWhereInput = {
        companyId,
        isDeleted: false,
        OR: search
          ? [
            {
              firstName: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              lastName: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              position: {
                contains: search,
                mode: 'insensitive',
              },
            },

          ]
          : undefined,
      };

      // Get total count for pagination
      const total = await this.databaseService.employee.count({ where });

      // Get paginated employees
      const employees = await this.databaseService.employee.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          position: true,
          salary: true,
          startDate: true,
          createdAt: true,
          updatedAt: true,
          department: true,
        },
        skip,
        take: limit ?? 10,
        orderBy: {
          createdAt: 'desc',
        },
      });

      this.logger.fatal(employees);
      const enrichedEmployees = await Promise.all(
        employees.map(
          async (employee) => await this.enrichedEmployee(employee),
        ),
      );

      return new PaginatedResponse({
        success: true,
        data: enrichedEmployees,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        message: 'Employees retrieved successfully',
      });
    } catch (error: any) {
      this.logger.error(`Failed to get company employees: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to retrieve employees');
    }
  }

  /**
   * Update an employee's information
   * @param id - The ID of the employee to update
   * @param companyId - The ID of the company
   * @param updateData - The data to update
   * @returns The updated employee
   */
  async updateEmployee(
    id: string,
    companyId: string,
    updateData: UpdateEmployeeDto,
  ) {
    try {
      // Check if employee exists and belongs to the company
      const existingEmployee = await this.databaseService.employee.findFirst({
        where: {
          id,
          companyId,
          isActive: true,
        },
      });

      if (!existingEmployee) {
        throw new NotFoundException('Employee not found or is inactive');
      }

      // If email is being updated, check for duplicates
      if (updateData.email && updateData.email !== existingEmployee.email) {
        const emailExists = await this.databaseService.employee.findFirst({
          where: {
            email: updateData.email,
            companyId,
            id: { not: id },
          },
        });

        if (emailExists) {
          throw new BadRequestException('Email already exists in the company');
        }
      }

      // Update employee
      const updatedEmployee = await this.databaseService.employee.update({
        where: { id },
        data: {
          ...updateData,
          startDate: updateData.startDate
            ? new Date(updateData.startDate).toISOString()
            : undefined,
        },
      });

      const enrichedEmployee = await this.enrichedEmployee(updatedEmployee);

      return new ReturnType({
        success: true,
        data: enrichedEmployee,
        message: 'Employee updated successfully',
      });
    } catch (error: any) {
      this.logger.error(`Failed to update employee: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to update employee');
    }
  }

  /**
   * Mark an employee as inactive
   * @param id - The ID of the employee to deactivate
   * @param companyId - The ID of the company
   * @returns The deactivated employee
   */
  async deactivateEmployee(id: string, companyId: string) {
    try {
      // Check if employee exists and belongs to the company
      const existingEmployee = await this.databaseService.employee.findFirst({
        where: {
          id,
          companyId,
          isActive: true,
        },
      });

      if (!existingEmployee) {
        throw new NotFoundException(
          'Employee not found or is already inactive',
        );
      }

      // Mark employee as inactive
      const deactivatedEmployee = await this.databaseService.employee.update({
        where: { id },
        data: {
          isActive: false,
        },
      });

      const enrichedEmployee = await this.enrichedEmployee(deactivatedEmployee);

      return new ReturnType({
        success: true,
        data: enrichedEmployee,
        message: 'Employee deactivated successfully',
      });
    } catch (error: any) {
      this.logger.error(`Failed to deactivate employee: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to deactivate employee');
    }
  }

  /**
   * Soft delete an employee
   * @param id - The ID of the employee to delete
   * @param companyId - The ID of the company
   * @returns The soft deleted employee
   */
  async softDeleteEmployee(id: string, companyId: string) {
    try {
      // Check if employee exists and belongs to the company
      const existingEmployee = await this.databaseService.employee.findFirst({
        where: {
          id,
          companyId,
          isActive: true,
          isDeleted: false,
        },
      });

      if (!existingEmployee) {
        throw new NotFoundException(
          'Employee not found or is already inactive',
        );
      }

      // Soft delete employee
      const deletedEmployee = await this.databaseService.employee.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date().toISOString(),
          isDeleted: true,
        },
      });


      return new ReturnType({
        success: true,
        data: null,
        message: 'Employee deleted successfully',
      });
    } catch (error: any) {
      this.logger.error(`Failed to delete employee: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete employee');
    }
  }

  /**
   * Permanently delete an employee
   * @param id - The ID of the employee to delete
   * @param companyId - The ID of the company
   * @returns Success message
   */
  async deleteEmployee(id: string, companyId: string) {
    try {
      // Check if employee exists and belongs to the company
      const existingEmployee = await this.databaseService.employee.findFirst({
        where: {
          id,
          companyId,
        },
      });

      if (!existingEmployee) {
        throw new NotFoundException('Employee not found');
      }

      // Hard delete employee
      await this.databaseService.employee.delete({
        where: { id },
      });

      return new ReturnType({
        success: true,
        message: 'Employee permanently deleted successfully',
        data: null,
      });
    } catch (error: any) {
      this.logger.error(`Failed to hard delete employee: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to permanently delete employee',
      );
    }
  }

  /**
   * Login an employee
   * @param payload - The login credentials
   * @returns The employee data with authentication tokens
   */
  async loginEmployee({ payload }: { payload: LoginEmployeeDto }) {
    try {
      const { email, password } = payload;

      // Find employee by email
      const employee = await this.databaseService.employee.findFirst({
        where: {
          email,
          isActive: true,
          isDeleted: false,
        },
        include: {
          Company: true,
        },
      });

      if (!employee) {
        throw new NotFoundException('Email or password not found!');
      }

      // Compare password
      if (!employee?.password) {
        throw new BadRequestException('You cannot login now, you have to complete your account setup');
      }
      const match = await compare(password, employee?.password as string);
      if (!match) {
        throw new BadRequestException('Email or password not found!');
      }

      // Create JWT tokens
      const token = await this.jwtService.signAsync(
        {
          email,
          employeeId: employee.id,
          companyId: employee.companyId,
          TYPE: 'EMPLOYEE',
        },
        {
          expiresIn: '1d',
          algorithm: 'HS256',
          secret: this.configService.get('JWT_SECRET'),
        },
      );

      const refreshToken = await this.jwtService.signAsync(
        {
          email,
          employeeId: employee.id,
          companyId: employee.companyId,
          TYPE: 'EMPLOYEE',
        },
        {
          expiresIn: '12m',
          algorithm: 'HS256',
          secret: this.configService.get('JWT_SECRET'),
        },
      );

      const enrichedEmployee = await this.enrichedEmployee(employee);

      return new ReturnType({
        success: true,
        message: 'Login successful',
        data: {
          ...enrichedEmployee,
          token,
          refreshToken,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to login employee: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to login employee');
    }
  }

  /**
   * Create or update an employee's password
   * @param employeeId - The ID of the employee
   * @param payload - The password data
   * @returns Success message
   */
  async createEmployeePassword({
    employeeId,
    payload,
  }: {
    employeeId: string;
    payload: CreatePasswordDto;
  }) {
    try {
      // Check if employee exists
      const employee = await this.databaseService.employee.findFirst({
        where: {
          id: employeeId,
          isActive: true,
          isDeleted: false,
        },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found or is inactive');
      }

      // Validate passwords match
      if (payload.password !== payload.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }

      // Hash the password
      const salt = await genSalt();
      const hashedPassword = await hash(payload.password, salt);

      // Update employee with new password
      await this.databaseService.employee.update({
        where: { id: employeeId },
        data: {
          password: hashedPassword,
        },
      });

      return new ReturnType({
        success: true,
        message: 'Password created successfully',
        data: null,
      });
    } catch (error: any) {
      this.logger.error(`Failed to create employee password: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Failed to create employee password',
      );
    }
  }

  /**
   * Get an employee's earnings and deductions not tied to a payroll
   * @param employeeId - The ID of the employee
   * @param companyId - The ID of the company
   * @returns The standalone earnings and deductions
   */
  async getEmployeeStandaloneItems(employeeId: string, companyId: string) {
    try {
      // Check if employee exists and belongs to the company
      const employee = await this.databaseService.employee.findFirst({
        where: {
          id: employeeId,
          companyId,
          isActive: true,
          isDeleted: false,
        },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found or is inactive');
      }

      // Fetch standalone earnings
      const earnings = await this.databaseService.earning.findMany({
        where: {
          employeeId,
          payrollId: null,
          isDeleted: false,
        },
      });

      // Fetch standalone deductions
      const deductions = await this.databaseService.deduction.findMany({
        where: {
          employeeId,
          payrollId: null,
          isDeleted: false,
        },
      });

      return new ReturnType({
        success: true,
        message: 'Standalone earnings and deductions retrieved successfully',
        data: {
          earnings,
          deductions,
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to get standalone items: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to retrieve standalone items',
      );
    }
  }

  /**
   * Delete an employee's standalone earning
   * @param earningId - The ID of the earning
   * @param employeeId - The ID of the employee
   * @param companyId - The ID of the company
   * @returns Success message
   */
  async deleteEmployeeEarning(
    earningId: string,
    employeeId: string,
    companyId: string,
  ) {
    try {
      // Check if employee exists and belongs to the company
      const employee = await this.databaseService.employee.findFirst({
        where: {
          id: employeeId,
          companyId,
          isActive: true,
          isDeleted: false,
        },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found or is inactive');
      }

      // Check if earning exists and belongs to the employee
      const earning = await this.databaseService.earning.findFirst({
        where: {
          id: earningId,
          employeeId,
          isDeleted: false,
        },
      });

      if (!earning) {
        throw new NotFoundException('Earning not found');
      }

      // Soft delete earning
      await this.databaseService.earning.update({
        where: { id: earningId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return new ReturnType({
        success: true,
        message: 'Earning deleted successfully',
        data: null,
      });
    } catch (error: any) {
      this.logger.error(`Failed to delete earning: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete earning');
    }
  }

  /**
   * Delete an employee's standalone deduction
   * @param deductionId - The ID of the deduction
   * @param employeeId - The ID of the employee
   * @param companyId - The ID of the company
   * @returns Success message
   */
  async deleteEmployeeDeduction(
    deductionId: string,
    employeeId: string,
    companyId: string,
  ) {
    try {
      // Check if employee exists and belongs to the company
      const employee = await this.databaseService.employee.findFirst({
        where: {
          id: employeeId,
          companyId,
          isActive: true,
          isDeleted: false,
        },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found or is inactive');
      }

      // Check if deduction exists and belongs to the employee
      const deduction = await this.databaseService.deduction.findFirst({
        where: {
          id: deductionId,
          employeeId,
          isDeleted: false,
        },
      });

      if (!deduction) {
        throw new NotFoundException('Deduction not found');
      }

      // Soft delete deduction
      await this.databaseService.deduction.update({
        where: { id: deductionId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return new ReturnType({
        success: true,
        message: 'Deduction deleted successfully',
        data: null,
      });
    } catch (error: any) {
      this.logger.error(`Failed to delete deduction: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to delete deduction');
    }
  }

  /**
   * Get a paginated list of employees for a company
   * @param companyId - The ID of the company
   * @param page - Page number
   * @param limit - Number of records per page
   * @returns Paginated list of employees
   */
  async getEmployeesByCompanyId({
    companyId,
    page = 1,
    limit = 10,
  }: {
    companyId: string;
    page: number;
    limit: number;
  }) {
    try {
      const skip = (page - 1) * limit;

      const [employees, total] = await this.databaseService.$transaction([
        this.databaseService.employee.findMany({
          where: { companyId, isDeleted: false },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.databaseService.employee.count({
          where: { companyId, isDeleted: false },
        }),
      ]);

      const enrichedEmployees = await Promise.all(
        employees.map((emp) => this.enrichedEmployee(emp)),
      );

      return new PaginatedResponse({
        success: true,
        data: enrichedEmployees,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        message: 'Employees retrieved successfully',
      });
    } catch (error: any) {
      this.logger.error(`Failed to get company employees: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve employees');
    }
  }

  /**
   * Get an employee by ID for a company
   * @param employeeId - The ID of the employee
   * @param companyId - The ID of the company
   * @returns The employee data
   */
  async getEmployeeByCompanyId(employeeId: string, companyId: string) {
    try {
      const employee = await this.databaseService.employee.findFirst({
        where: {
          id: employeeId,
          companyId,
          isDeleted: false,
        },
      });

      if (!employee) {
        throw new NotFoundException('Employee not found in this company');
      }

      const enrichedEmployee = await this.enrichedEmployee(employee);

      return new ReturnType({
        success: true,
        data: enrichedEmployee,
        message: 'Employee retrieved successfully',
      });
    } catch (error: any) {
      this.logger.error(`Failed to get employee: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to retrieve employee');
    }
  }
}
