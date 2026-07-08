import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReturnType } from '../../common/returnType';
import { UpdateUserDto } from './dto/update-user.dto';
import { UploadService } from 'src/common/services/upload/upload.service';
import { User } from 'generated/prisma/client';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);

  constructor(
    private databaseService: PrismaService,
    private uploadService: UploadService,
  ) {}

  private async enrichUser(user: Partial<User>) {
    try {
      let profilePicture: any = null;
      if (user?.picture) {
        profilePicture = await this.uploadService.getFileInfo(user.picture);
      }

      return {
        ...user,
        profilePicture,
      } as any;
    } catch (error) {
      this.logger.error('Failed to enrich user', error);
      throw new InternalServerErrorException('Failed to enrich user');
    }
  }

  /**
   * Get a user by their ID
   * @param id - The ID of the user to retrieve
   * @returns The user data
   */
  async getUserById(id: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id, isDeleted: false },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          picture: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const enrichedUser = await this.enrichUser(user);

      return new ReturnType({
        success: true,
        data: enrichedUser,
        message: 'User retrieved successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  /**
   * Get all users in a company
   * @param companyId - The ID of the company
   * @returns Array of users in the company
   */
  async getUsersByCompanyId(companyId: string) {
    try {
      const users = await this.databaseService.user.findMany({
        where: {
          companyId,
          deletedAt: null, // Only get non-deleted users
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          picture: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const enrichedUsers = await Promise.all(
        users.map(async (item) => await this.enrichUser(item)),
      );

      return new ReturnType({
        success: true,
        data: enrichedUsers,
        message: 'Users retrieved successfully',
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve users');
    }
  }

  /**
   * Soft delete a user
   * @param id - The ID of the user to delete
   * @returns The deleted user data
   */
  async softDeleteUser(id: string) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.deletedAt) {
        throw new BadRequestException('User is already deleted');
      }

      const deletedUser = await this.databaseService.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          deletedAt: true,
        },
      });

      return new ReturnType({
        success: true,
        data: deletedUser,
        message: 'User deleted successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to delete user');
    }
  }

  /**
   * Update a user's information
   * @param id - The ID of the user to update
   * @param payload - The data to update the user with
   * @returns The updated user data
   */
  async updateUser(id: string, payload: UpdateUserDto) {
    try {
      const user = await this.databaseService.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.deletedAt) {
        throw new BadRequestException('Cannot update a deleted user');
      }

      const updatedUser = await this.databaseService.user.update({
        where: { id },
        data: payload,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          companyId: true,
          updatedAt: true,
          picture: true,
        },
      });

      const enrichedUser = await this.enrichUser(updatedUser);

      return new ReturnType({
        success: true,
        data: enrichedUser,
        message: 'User updated successfully',
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to update user');
    }
  }
}
