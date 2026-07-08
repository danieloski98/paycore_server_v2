import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCompanyDto } from './dto/Create-compnay-dto';
import { ReturnType } from 'src/common/returnType';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompanyService {
  private logger = new Logger(CompanyService.name);

  constructor(
    private databaseService: PrismaService,
    private configService: ConfigService,
  ) {}

  async checkCompany(id: string) {
    const company = await this.databaseService.company.findUnique({
      where: {
        id,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async createCompany({
    payload,
    userId,
  }: {
    payload: CreateCompanyDto;
    userId: string;
  }) {
    try {
      const userExists = await this.databaseService.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!userExists) {
        throw new NotFoundException('User not found');
      }

      // create company account
      let newCompany = await this.databaseService.company.create({
        data: {
          ...payload,
          creatorId: userId,
        },
      });

      await this.databaseService.user.update({
        where: {
          id: userId,
        },
        data: {
          companyId: newCompany.id,
        },
      });

      // TODO - send out email

      let item = {
        ...newCompany,
        logo: await this.databaseService.file.findUnique({
          where: {
            id: newCompany.logo,
          },
        }),
      };

      // create wallet for the company
      await this.databaseService.wallet.create({
        data: {
          companyId: newCompany.id,
          balance: 0.0,
        },
      });

      return new ReturnType({
        success: true,
        data: {
          ...item,
        },
        message: 'Company created!',
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(error);
    }
  }

  /**
   * Get a company by its ID
   * @param id - The ID of the company to retrieve
   * @returns The company data with its logo and users
   */
  async getCompanyById(id: string) {
    try {
      const company = await this.databaseService.company.findUnique({
        where: { id },
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Get logo separately if it exists
      const logo = company.logo
        ? await this.databaseService.file.findUnique({
            where: { id: company.logo },
          })
        : null;

      return new ReturnType({
        success: true,
        data: {
          ...company,
          logo,
        },
        message: 'Company retrieved successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to retrieve company');
    }
  }

  /**
   * Update a company's information
   * @param id - The ID of the company to update
   * @param payload - The data to update the company with
   * @returns The updated company data
   */
  async updateCompany(id: string, payload: UpdateCompanyDto) {
    try {
      // Check if company exists
      const companyExists = await this.databaseService.company.findUnique({
        where: { id },
      });

      if (!companyExists) {
        throw new NotFoundException('Company not found');
      }

      // Update company
      const updatedCompany = await this.databaseService.company.update({
        where: { id },
        data: payload,
      });

      // Get logo separately if it exists
      const logo = updatedCompany.logo
        ? await this.databaseService.file.findUnique({
            where: { id: updatedCompany.logo },
          })
        : null;

      return new ReturnType({
        success: true,
        data: {
          ...updatedCompany,
          logo,
        },
        message: 'Company updated successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to update company');
    }
  }
}
