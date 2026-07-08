import { Body, Controller, Post, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserAuthService } from './user-auth.service';
import { CreateUserDto } from './dto/Create-user-dto';
import { LoginDto } from './dto/Login-dto';
import { PasswordResetDto } from './dto/PasswordReset-dto';
import { ChangePasswordDto } from './dto/ChangePassword-dto';
import { ReturnType } from 'src/common/returnType';
import { UserAuthGuard } from 'src/common/guards/user-auth/user-auth.guard';
import { GetUser } from 'src/common/decorators/user/user.decorator';
import * as browser from 'generated/prisma/browser';

@ApiTags('Company User Authentication')
@Controller('user-auth')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @Post('create-company-user')
  @ApiOperation({ summary: 'Create a new company user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: ReturnType,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Email already in use or invalid email domain',
  })
  async createCompanyUser(@Body() payload: CreateUserDto) {
    return this.userAuthService.createCompanyUser({ payload });
  }

  @UseGuards(UserAuthGuard)
  @ApiBearerAuth()
  @Post('create-company-user/:companyId')
  @ApiOperation({ summary: 'Create a new user for a specific company' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully created for the company',
    type: ReturnType,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Email already in use or invalid email domain',
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  async createCompanyUserWithCompanyId(
    @Body() payload: CreateUserDto,
    @Param('companyId') companyId: string,
    @GetUser() user: browser.User,
  ) {
    return this.userAuthService.createCompanyUserWithCompanyId({
      payload,
      companyId,
    });
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user and get authentication tokens' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: ReturnType,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid credentials',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async loginUser(@Body() payload: LoginDto) {
    return this.userAuthService.loginUser({ payload });
  }

  @Post('password-reset')
  @ApiOperation({ summary: 'Initiate password reset for a user or employee' })
  @ApiBody({ type: PasswordResetDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent successfully',
    type: ReturnType,
  })
  @ApiResponse({
    status: 404,
    description: 'User or employee not found',
  })
  async passwordReset(@Body() payload: PasswordResetDto) {
    return this.userAuthService.passwordReset({
      email: payload.email,
      type: payload.type,
    });
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password for a user or employee' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: ReturnType,
  })
  @ApiResponse({
    status: 404,
    description: 'User or employee not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (e.g., password too short)',
  })
  async changePassword(@Body() payload: ChangePasswordDto) {
    return this.userAuthService.changePassword({
      userId: payload.userId,
      newPassword: payload.newPassword,
      type: payload.type,
    });
  }
}
