import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash, genSalt } from 'bcryptjs';

import { EmployeeService } from './employee.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReturnType } from '../../common/returnType';
import { PaginatedResponse } from '../../common/classes/PagintedResponse';
import { Company, Employee } from '@prisma/client';
import { UpdateEmployeeDto } from './dto/UpdateEmployee.dto';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn()
}));

describe('EmployeeService', () => {
  let service: EmployeeService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockEmployee: Employee = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    position: 'Developer',
    department: 'IT',
    salary: 50000,
    startDate: new Date(),
    companyId: '1',
    isActive: true,
    isDeleted: false,
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    address: 'efefe',
    bankAccount: 'ini00303',
    deletedAt: null,
    emailVerified: true,
    picture: 'sdkfpqdfne',
    taxId: 'efefwf'
  };

  const mockCompany: Company = {
    id: '1',
    name: 'Test Company',
    address: 'no 2',
    createdAt: new Date(),
    creatorId: '23455',
    deletedAt: null,
    updatedAt: new Date(),
    industry: 'AI',
    isActive: true,
    isDeleted: false,
    logo: 'kenrofneo4',
    phone: '08093938493',
    RCNumber: 'pnpppjpo',
    taxId: 'eirfp4p4pf24'
  };

  const mockPrismaService = {
    employee: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      delete: jest.fn()
    },
    company: {
      findUnique: jest.fn(),
      findFirst: jest.fn()
    },
    $transaction: jest.fn()
  };

  const mockJwtService = {
    signAsync: jest.fn()
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret')
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        },
        {
          provide: JwtService,
          useValue: mockJwtService
        },
        {
          provide: ConfigService,
          useValue: mockConfigService
        }
      ]
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createEmployee', () => {
    const createEmployeeDto = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '1234567890',
      position: 'Developer',
      department: 'IT',
      salary: 50000,
      startDate: new Date().toISOString()
    };

    it('should create an employee successfully', async () => {
      jest.spyOn(prismaService.company, 'findUnique').mockResolvedValue(mockCompany);
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.employee, 'create').mockResolvedValue(mockEmployee);

      const result = await service.createEmployee({
        companyID: '1',
        payload: createEmployeeDto
      });

      expect(result).toBeInstanceOf(ReturnType);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmployee);
    });

    it('should throw NotFoundException when company not found', async () => {
      jest.spyOn(prismaService.company, 'findUnique').mockResolvedValue(null);

      await expect(
        service.createEmployee({
          companyID: '1',
          payload: createEmployeeDto
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when email already exists', async () => {
      jest.spyOn(prismaService.company, 'findUnique').mockResolvedValue(mockCompany);
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(mockEmployee);

      await expect(
        service.createEmployee({
          companyID: '1',
          payload: createEmployeeDto
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEmployeeById', () => {
    it('should return an employee by id for a company', async () => {
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(mockEmployee);

      const result = await service.getEmployeeById('1', '1');

      expect(result).toBeInstanceOf(ReturnType);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmployee);
      expect(prismaService.employee.findFirst).toHaveBeenCalledWith({
        where: { id: '1', companyId: '1', isDeleted: false }
      });
    });

    it('should throw NotFoundException when employee not found', async () => {
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(null);

      await expect(service.getEmployeeById('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCompanyEmployees', () => {
    const mockEmployees = [mockEmployee];
    const mockTotal = 1;

    it('should return paginated employees', async () => {
      jest.spyOn(prismaService.employee, 'count').mockResolvedValue(mockTotal);
      jest.spyOn(prismaService.employee, 'findMany').mockResolvedValue(mockEmployees);

      const result = await service.getCompanyEmployees({
        companyId: '1',
        page: 1,
        limit: 10,
        search: ''
      });

      expect(result).toBeInstanceOf(PaginatedResponse);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockEmployees);
      expect(result.data?.total).toBe(mockTotal);
    });

    it('should throw BadRequestException for invalid pagination parameters', async () => {
      await expect(
        service.getCompanyEmployees({ companyId: '1', page: 0, limit: 10, search: '' })
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getCompanyEmployees({ companyId: '1', page: 1, limit: 0, search: '' })
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.getCompanyEmployees({ companyId: '1', page: 1, limit: 101, search: '' })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateEmployee', () => {
    const updateEmployeeDto: UpdateEmployeeDto = {
      firstName: 'John Updated',
      email: 'john.updated@example.com',
      department: 'dwdw',
      lastName: 'john',
      phone: '09059594030',
      position: 'efefe',
      salary: 340493,
      startDate: null
    };

    it('should update an employee successfully', async () => {
      const updatedEmployee = { ...mockEmployee, ...updateEmployeeDto };
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(mockEmployee);
      jest.spyOn(prismaService.employee, 'update').mockResolvedValue(updatedEmployee as any);

      const result = await service.updateEmployee('1', '1', updateEmployeeDto);

      expect(result).toBeInstanceOf(ReturnType);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedEmployee);
    });

    it('should throw NotFoundException when employee not found', async () => {
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(null);

      await expect(service.updateEmployee('1', '1', updateEmployeeDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deactivateEmployee', () => {
    it('should deactivate an employee successfully', async () => {
      const deactivatedEmployee = { ...mockEmployee, isActive: false };
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(mockEmployee);
      jest.spyOn(prismaService.employee, 'update').mockResolvedValue(deactivatedEmployee);

      const result = await service.deactivateEmployee('1', '1');

      expect(result).toBeInstanceOf(ReturnType);
      expect(result.success).toBe(true);
      expect(result.data.isActive).toBe(false);
    });

    it('should throw NotFoundException when employee not found', async () => {
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(null);

      await expect(service.deactivateEmployee('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDeleteEmployee', () => {
    it('should soft delete an employee successfully', async () => {
      const deletedEmployee = { ...mockEmployee, isActive: false, isDeleted: true };
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(mockEmployee);
      jest.spyOn(prismaService.employee, 'update').mockResolvedValue(deletedEmployee);

      const result = await service.softDeleteEmployee('1', '1');

      expect(result).toBeInstanceOf(ReturnType);
      expect(result.success).toBe(true);
      expect(result.data.isDeleted).toBe(true);
      expect(result.data.isActive).toBe(false);
    });

    it('should throw NotFoundException when employee not found', async () => {
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(null);

      await expect(service.softDeleteEmployee('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEmployee', () => {
    it('should permanently delete an employee successfully', async () => {
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(mockEmployee);
      jest.spyOn(prismaService.employee, 'delete').mockResolvedValue(mockEmployee);

      const result = await service.deleteEmployee('1', '1');

      expect(result).toBeInstanceOf(ReturnType);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Employee permanently deleted successfully');
      expect(prismaService.employee.delete).toHaveBeenCalledWith({
        where: { id: '1' }
      });
    });

    it('should throw NotFoundException when employee not found', async () => {
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(null);

      await expect(service.deleteEmployee('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getEmployeeStandaloneItems', () => {
    it('should return standalone earnings and deductions successfully', async () => {
      const mockEarnings = [{ id: 'e1', amount: 100, employeeId: '1', payrollId: null }];
      const mockDeductions = [{ id: 'd1', amount: 50, employeeId: '1', payrollId: null }];

      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(mockEmployee);
      (prismaService.employee as any).findMany = jest.fn(); // Safety for earning/deduction
      
      // Mocking the prisma calls for earning and deduction
      (prismaService as any).earning = { findMany: jest.fn().mockResolvedValue(mockEarnings) };
      (prismaService as any).deduction = { findMany: jest.fn().mockResolvedValue(mockDeductions) };

      const result = await service.getEmployeeStandaloneItems('1', '1');

      expect(result).toBeInstanceOf(ReturnType);
      expect(result.success).toBe(true);
      expect(result.data.earnings).toEqual(mockEarnings);
      expect(result.data.deductions).toEqual(mockDeductions);
    });

    it('should throw NotFoundException when employee not found', async () => {
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(null);

      await expect(service.getEmployeeStandaloneItems('1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEmployeeEarning', () => {
    it('should delete earning successfully', async () => {
      const mockEarning = { id: 'e1', employeeId: '1', isDeleted: false };
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(mockEmployee);
      (prismaService as any).earning = {
        findFirst: jest.fn().mockResolvedValue(mockEarning),
        update: jest.fn().mockResolvedValue({ ...mockEarning, isDeleted: true })
      };

      const result = await service.deleteEmployeeEarning('e1', '1', '1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Earning deleted successfully');
    });

    it('should throw NotFoundException when earning not found', async () => {
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(mockEmployee);
      (prismaService as any).earning = { findFirst: jest.fn().mockResolvedValue(null) };

      await expect(service.deleteEmployeeEarning('e1', '1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEmployeeDeduction', () => {
    it('should delete deduction successfully', async () => {
      const mockDeduction = { id: 'd1', employeeId: '1', isDeleted: false };
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(mockEmployee);
      (prismaService as any).deduction = {
        findFirst: jest.fn().mockResolvedValue(mockDeduction),
        update: jest.fn().mockResolvedValue({ ...mockDeduction, isDeleted: true })
      };

      const result = await service.deleteEmployeeDeduction('d1', '1', '1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Deduction deleted successfully');
    });

    it('should throw NotFoundException when deduction not found', async () => {
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(mockEmployee);
      (prismaService as any).deduction = { findFirst: jest.fn().mockResolvedValue(null) };

      await expect(service.deleteEmployeeDeduction('d1', '1', '1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('loginEmployee', () => {
    const loginDto = {
      email: 'john@example.com',
      password: 'password123'
    };

    beforeEach(() => {
      (compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce('mock-token')
        .mockResolvedValueOnce('mock-refresh-token');
    });

    it('should login employee successfully', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue({
        ...mockEmployee,
        company: mockCompany
      });

      const result = await service.loginEmployee({ payload: loginDto });

      expect(mockPrismaService.employee.findFirst).toHaveBeenCalledWith({
        where: {
          email: loginDto.email,
          isActive: true,
          isDeleted: false
        },
        include: {
          company: true
        }
      });
      expect(compare).toHaveBeenCalledWith(loginDto.password, mockEmployee.password);
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toBeInstanceOf(ReturnType);
      expect(result.success).toBe(true);
      expect(result.data.token).toBe('mock-token');
      expect(result.data.refreshToken).toBe('mock-refresh-token');
    });

    it('should throw NotFoundException when employee not found', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue(null);

      await expect(service.loginEmployee({ payload: loginDto }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when password is incorrect', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue(mockEmployee);
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(service.loginEmployee({ payload: loginDto }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('createEmployeePassword', () => {
    const passwordDto = {
      password: 'newPassword123',
      confirmPassword: 'newPassword123'
    };

    beforeEach(() => {
      (genSalt as jest.Mock).mockResolvedValue('mock-salt');
      (hash as jest.Mock).mockResolvedValue('hashed-password');
    });

    it('should create employee password successfully', async () => {
      mockPrismaService.employee.findFirst.mockResolvedValue(mockEmployee);
      mockPrismaService.employee.update.mockResolvedValue({
        ...mockEmployee,
        password: 'hashed-password'
      });

      const result = await service.createEmployeePassword({
        employeeId: '1',
        payload: passwordDto
      });

      expect(mockPrismaService.employee.findFirst).toHaveBeenCalledWith({
        where: {
          id: '1',
          isActive: true,
          isDeleted: false
        }
      });
      expect(genSalt).toHaveBeenCalled();
      expect(hash).toHaveBeenCalledWith(passwordDto.password, 'mock-salt');
      expect(mockPrismaService.employee.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { password: 'hashed-password' }
      });
      expect(result).toBeInstanceOf(ReturnType);
      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException when passwords do not match', async () => {
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(mockEmployee);

      await expect(
        service.createEmployeePassword({
          employeeId: '1',
          payload: { ...passwordDto, confirmPassword: 'different' }
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when employee not found', async () => {
      jest.spyOn(prismaService.employee, 'findFirst').mockResolvedValue(null);

      await expect(
        service.createEmployeePassword({
          employeeId: '1',
          payload: passwordDto
        })
      ).rejects.toThrow(NotFoundException);
    });
  });
});
