import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReturnType } from 'src/common/returnType';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Send a notification to a specific employee
   */
  async sendEmployeeNotification(
    employeeId: string,
    title: string,
    message: string,
  ): Promise<ReturnType> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          title,
          message,
          employeeId,
        },
      });

      return new ReturnType({
        success: true,
        data: notification,
        message: 'Notification sent to employee',
      });
    } catch (error) {
      throw new BadRequestException('Failed to send employee notification');
    }
  }

  /**
   * Send a notification to all employees in a company
   */
  async sendCompanyNotification(
    companyId: string,
    title: string,
    message: string,
  ): Promise<ReturnType> {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          title,
          message,
          companyId,
        },
      });

      return new ReturnType({
        success: true,
        data: notification,
        message: 'Notification sent to company',
      });
    } catch (error) {
      throw new BadRequestException('Failed to send company notification');
    }
  }

  /**
   * Get all notifications for a specific employee
   */
  async getEmployeeNotifications(
    employeeId: string,
    skip = 1,
    take = 10,
  ): Promise<ReturnType> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          employeeId,
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      });

      return new ReturnType({
        success: true,
        data: notifications,
        message: 'Employee notifications retrieved',
      });
    } catch (error) {
      throw new BadRequestException('Failed to retrieve employee notifications');
    }
  }

  /**
   * Get all notifications for a company
   */
  async getCompanyNotifications(
    companyId: string,
    skip = 1,
    take = 10,
  ): Promise<ReturnType> {
    try {
      const notifications = await this.prisma.notification.findMany({
        where: {
          companyId,
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take,
      });

      return new ReturnType({
        success: true,
        data: notifications,
        message: 'Company notifications retrieved',
      });
    } catch (error) {
      throw new BadRequestException('Failed to retrieve company notifications');
    }
  }

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<ReturnType> {
    try {
      const existing = await this.prisma.notification.findFirst({
        where: {
          id: notificationId,
          isDeleted: false,
        },
      });

      if (!existing) {
        throw new NotFoundException('Notification not found');
      }

      const updated = await this.prisma.notification.update({
        where: {
          id: notificationId,
        },
        data: {
          isRead: true,
        },
      });

      return new ReturnType({
        success: true,
        data: updated,
        message: 'Notification marked as read',
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to mark notification as read');
    }
  }

  /**
   * Delete a notification (soft delete)
   */
  async deleteNotification(notificationId: string): Promise<ReturnType> {
    try {
      const existing = await this.prisma.notification.findFirst({
        where: {
          id: notificationId,
          isDeleted: false,
        },
      });

      if (!existing) {
        throw new NotFoundException('Notification not found');
      }

      const deleted = await this.prisma.notification.update({
        where: {
          id: notificationId,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return new ReturnType({
        success: true,
        data: deleted,
        message: 'Notification deleted',
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException('Failed to delete notification');
    }
  }

  /**
   * Get unread notifications count for an employee
   */
  async getUnreadNotificationsCount(employeeId: string): Promise<ReturnType> {
    try {
      const count = await this.prisma.notification.count({
        where: {
          employeeId,
          isRead: false,
          isDeleted: false,
        },
      });

      return new ReturnType({
        success: true,
        data: count,
        message: 'Unread notifications count retrieved',
      });
    } catch (error) {
      throw new BadRequestException('Failed to get unread notifications count');
    }
  }

  /**
   * Get unread notifications count for a company
   */
  async getCompanyUnreadNotificationsCount(companyId: string): Promise<ReturnType> {
    try {
      const count = await this.prisma.notification.count({
        where: {
          companyId,
          isRead: false,
          isDeleted: false,
        },
      });

      return new ReturnType({
        success: true,
        data: count,
        message: 'Company unread notifications count retrieved',
      });
    } catch (error) {
      throw new BadRequestException('Failed to get company unread notifications count');
    }
  }

  /**
   * Mark all notifications for an employee as read
   */
  async markAllEmployeeNotificationsAsRead(employeeId: string): Promise<ReturnType> {
    try {
      const result = await this.prisma.notification.updateMany({
        where: { employeeId, isDeleted: false, isRead: false },
        data: { isRead: true },
      });

      return new ReturnType({
        success: true,
        data: result,
        message: 'All employee notifications marked as read',
      });
    } catch (error) {
      throw new BadRequestException('Failed to mark all notifications as read');
    }
  }
}
