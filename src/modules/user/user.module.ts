import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UploadService } from 'src/common/services/upload/upload.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, UploadService],
})
export class UserModule {}
