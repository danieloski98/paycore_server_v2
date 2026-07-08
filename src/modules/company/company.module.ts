import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [CompanyController],
  providers: [CompanyService, PrismaService, ConfigService, ]
})
export class CompanyModule {}
