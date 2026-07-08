import { Test, TestingModule } from '@nestjs/testing';
import { UserAuthService } from './user-auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EMAIL_EXCLUDED, ENABLE_EMAIL_CHECK } from '../../common/constants';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword'),
  genSalt: jest.fn().mockResolvedValue('salt'),
  compare: jest.fn().mockImplementation((password, hashedPassword) => {
    return Promise.resolve(password === 'password123');
  }),
}));

jest.mock('../../common/constants', () => ({
  EMAIL_EXCLUDED: ['gmail.com', 'yahoo.com'],
  ENABLE_EMAIL_CHECK: true,
}));

describe('UserAuthService', () => {
  let service: UserAuthService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let prismaService: PrismaService;

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserAuthService>(UserAuthService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCompanyUser', () => {
    const mockCreateUserDto = {
      email: 'test@company.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: UserRole.ADMIN,
    };

    it('should successfully create a company user', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockCreateUserDto,
        id: '1',
        password: 'hashedPassword',
      });

      const result = await service.createCompanyUser({ payload: mockCreateUserDto });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.message).toBe('Account created');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(bcrypt.genSalt).toHaveBeenCalled();
    });

    it('should throw BadRequestException if email is already in use', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({ id: '1', email: mockCreateUserDto.email });

      await expect(service.createCompanyUser({ payload: mockCreateUserDto }))
        .rejects
        .toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email domain is excluded', async () => {
      const excludedEmail = `test@${EMAIL_EXCLUDED[0]}`;
      
      await expect(service.createCompanyUser({ 
        payload: { ...mockCreateUserDto, email: excludedEmail } 
      }))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('createCompanyUserWithCompanyId', () => {
    const mockCreateUserDto = {
      email: 'test@company.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      role: UserRole.ADMIN,
    };
    const mockCompanyId = 'company123';

    it('should successfully create a company user with company ID', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ id: mockCompanyId });
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockCreateUserDto,
        id: '1',
        companyId: mockCompanyId,
        password: 'hashedPassword',
      });

      const result = await service.createCompanyUserWithCompanyId({
        payload: mockCreateUserDto,
        companyId: mockCompanyId,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.companyId).toBe(mockCompanyId);
      expect(result.message).toBe('Account created');
      expect(bcrypt.hash).toHaveBeenCalled();
      expect(bcrypt.genSalt).toHaveBeenCalled();
    });

    it('should throw NotFoundException if company does not exist', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(service.createCompanyUserWithCompanyId({
        payload: mockCreateUserDto,
        companyId: mockCompanyId,
      }))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw BadRequestException if email is already in use in the company', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue({ id: mockCompanyId });
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: '1',
        email: mockCreateUserDto.email,
        companyId: mockCompanyId,
      });

      await expect(service.createCompanyUserWithCompanyId({
        payload: mockCreateUserDto,
        companyId: mockCompanyId,
      }))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('loginUser', () => {
    const mockLoginDto = {
      email: 'test@company.com',
      password: 'password123',
    };

    const mockUser = {
      id: '1',
      email: mockLoginDto.email,
      password: 'hashedPassword',
      companyId: 'company123',
    };

    const mockCompany = {
      id: 'company123',
      name: 'Test Company',
    };

    it('should successfully login user and return tokens', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.company.findUnique.mockResolvedValue(mockCompany);
      mockJwtService.signAsync.mockResolvedValue('mockToken');
      mockConfigService.get.mockReturnValue('jwtSecret');
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.loginUser({ payload: mockLoginDto });

      expect(result.success).toBe(true);
      expect(result.data.token).toBeDefined();
      expect(result.data.refreshToken).toBeDefined();
      expect(result.data.company).toBeDefined();
      expect(result.message).toBe('Login successful');
      expect(bcrypt.compare).toHaveBeenCalledWith(mockLoginDto.password, mockUser.password);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.loginUser({ payload: mockLoginDto }))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should throw BadRequestException if password does not match', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.loginUser({ 
        payload: { ...mockLoginDto, password: 'wrongPassword' } 
      }))
        .rejects
        .toThrow(BadRequestException);
    });
  });
});
