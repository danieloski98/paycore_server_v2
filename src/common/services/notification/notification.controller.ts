import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get('employee/:employeeId')
  @ApiOperation({
    summary: 'Get notifications for a specific employee',
    description: 'Retrieves paginated notifications for a specific employee',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'The ID of the employee',
    type: 'string',

  })
  @ApiQuery({
    name: 'skip',
    description: 'Number of records to skip',
    required: false,
    type: 'number',
  })
  @ApiQuery({
    name: 'take',
    description: 'Number of records to take',
    required: false,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of notifications for the employee',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have required role',
  })
  async getEmployeeNotifications(
    @Param('employeeId') employeeId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.notificationService.getEmployeeNotifications(
      employeeId,
      skip,
      take,
    );
  }

  @Get('company/:companyId')
  @ApiOperation({
    summary: 'Get notifications for a company',
    description: 'Retrieves paginated notifications for a specific company',
  })
  @ApiParam({
    name: 'companyId',
    description: 'The ID of the company',
    type: 'string',
  })
  @ApiQuery({
    name: 'skip',
    description: 'Number of records to skip',
    required: false,
    type: 'number',
  })
  @ApiQuery({
    name: 'take',
    description: 'Number of records to take',
    required: false,
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of notifications for the company',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have required role',
  })
  async getCompanyNotifications(
    @Param('companyId') companyId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.notificationService.getCompanyNotifications(
      companyId,
      skip,
      take,
    );
  }

  @Get('employee/:employeeId/unread/count')
  @ApiOperation({
    summary: 'Get unread notifications count for an employee',
    description:
      'Returns the count of unread notifications for a specific employee',
  })
  @ApiParam({
    name: 'employeeId',
    description: 'The ID of the employee',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the count of unread notifications',
    type: 'number',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have required role',
  })
  async getUnreadNotificationsCount(
    @Param('employeeId') employeeId: string,
  ) {
    return this.notificationService.getUnreadNotificationsCount(employeeId);
  }

  @Get('company/:companyId/unread/count')
  @ApiOperation({
    summary: 'Get unread notifications count for a company',
    description:
      'Returns the count of unread notifications for a specific company',
  })
  @ApiParam({
    name: 'companyId',
    description: 'The ID of the company',
    type: 'string',

  })
  @ApiResponse({
    status: 200,
    description: 'Returns the count of unread notifications',
    type: 'number',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - User is not authenticated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have required role',
  })
  async getCompanyUnreadNotificationsCount(
    @Param('companyId') companyId: string,
  ) {
    return this.notificationService.getCompanyUnreadNotificationsCount(
      companyId,
    );
  }

  @Patch(':notificationId/read')
  @ApiOperation({
    summary: 'Mark a notification as read',
    description: 'Marks a specific notification as read by its ID',
  })
  @ApiParam({
    name: 'notificationId',
    description: 'The ID of the notification to mark as read',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification successfully marked as read',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async markNotificationAsRead(
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.markNotificationAsRead(notificationId);
  }

  @Delete(':notificationId')
  @ApiOperation({
    summary: 'Delete a notification',
    description: 'Soft deletes a specific notification by its ID',
  })
  @ApiParam({
    name: 'notificationId',
    description: 'The ID of the notification to delete',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Notification not found',
  })
  async deleteNotification(
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.deleteNotification(notificationId);
  }
}
