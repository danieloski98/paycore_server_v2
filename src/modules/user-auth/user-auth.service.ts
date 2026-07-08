import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, genSalt, compare } from 'bcryptjs';
import { CreateUserDto } from './dto/Create-user-dto';
import { EMAIL_EXCLUDED, ENABLE_EMAIL_CHECK } from '../../common/constants';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReturnType } from '../../common/returnType';
import { LoginDto } from './dto/Login-dto';
import { EmailService } from 'src/common/services/email/email.service';
import { NotificationService } from 'src/common/services/notification/notification.service';
import { EmployeeService } from '../employee/employee.service';

@Injectable()
export class UserAuthService {
  private logger = new Logger(UserAuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private databaseService: PrismaService,
    private emailService: EmailService,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
  ) { }

  async createCompanyUser({ payload }: { payload: CreateUserDto }) {
    try {
      const { email, password, phone, ...rest } = payload;
      if (ENABLE_EMAIL_CHECK) {
        const emailType = email.split('@')[1];
        if (EMAIL_EXCLUDED.includes(emailType)) {
          throw new BadRequestException(
            `You must use a dedicated email address`,
          );
        }
      }

      // check email
      const emailInUse = await this.databaseService.user.findFirst({
        where: {
          email,
        },
      });

      if (emailInUse) {
        throw new BadRequestException(
          `${email} is already in use by another company user!`,
        );
      }

      // check password
      const salt = await genSalt();
      const hashedPassword = await hash(password, salt);

      // TODO - send verification email
      const newRecord = await this.databaseService.user.create({
        data: {
          ...rest,
          password: hashedPassword,
          email,
        },
      });

      // send email
      await this.emailService.sendUserWelcomeMail({
        email: payload?.email,
        name: `${payload.firstName} ${payload.lastName}`,
      });

      return new ReturnType({
        success: true,
        data: newRecord,
        message: 'Account created',
      });
    } catch (error) {
      this.logger.error(error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error);
    }
  }

  async createCompanyUserWithCompanyId({
    payload,
    companyId,
  }: {
    payload: CreateUserDto;
    companyId: string;
  }) {
    try {
      const { email, password, ...rest } = payload;
      if (ENABLE_EMAIL_CHECK) {
        const emailType = email.split('@')[1];
        if (EMAIL_EXCLUDED.includes(emailType)) {
          throw new BadRequestException(
            `You must use a dedicated email address`,
          );
        }
      }

      // find company
      const company = await this.databaseService.company.findUnique({
        where: {
          id: companyId,
        },
      });

      if (!company) {
        throw new NotFoundException(
          `Company with ID - ${companyId} not found!`,
        );
      }

      // check email
      const emailInUse = await this.databaseService.user.findFirst({
        where: {
          email,
          companyId,
        },
      });

      if (emailInUse) {
        throw new BadRequestException(
          `${email} is already in use by another user in this company!`,
        );
      }

      // check password
      const salt = await genSalt();
      const hashedPassword = await hash(password, salt);

      // TODO - send verification email
      const newRecord = await this.databaseService.user.create({
        data: {
          ...rest,
          password: hashedPassword,
          email,
          companyId,
        },
      });

      // send out notification to the company
      await this.databaseService.notification.create({
        data: {
          title: 'New Member added!',
          message: `A new member ${newRecord.firstName} ${newRecord.lastName} has been added to the company workspace`,
          companyId: newRecord.companyId,
        },
      });

      return new ReturnType({
        success: true,
        data: newRecord,
        message: 'Account created',
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(error);
    }
  }

  async loginUser({ payload }: { payload: LoginDto }) {
    try {
      const { email, password } = payload;
      const account = await this.databaseService.user.findFirst({
        where: {
          email,
        },
      });

      if (!account) {
        throw new NotFoundException('Email or password not found!');
      }

      // compare password
      const match = await compare(password, account.password);
      if (!match) {
        throw new BadRequestException('Email or password not found!');
      }

      // create jwt token
      const token = await this.jwtService.signAsync(
        { email, companyId: account.companyId, TYPE: 'USER' },
        {
          expiresIn: '1d',
          algorithm: 'HS256',
          secret: this.configService.get('JWT_SECRET'),
        },
      );
      const refreshToken = await this.jwtService.signAsync(
        { email, companyId: account.companyId, TYPE: 'USER' },
        {
          expiresIn: '12m',
          algorithm: 'HS256',
          secret: this.configService.get('JWT_SECRET'),
        },
      );

      // get company details
      const company = await this.databaseService.company.findUnique({
        where: {
          id: account?.companyId as string,
        },
      });

      return new ReturnType({
        success: true,
        message: 'Login successful',
        data: {
          ...account,
          company,
          token,
          refreshToken,
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      console.log(error);
      throw new InternalServerErrorException(error);
    }
  }

  async passwordReset({
    email,
    type,
  }: {
    email: string;
    type: 'USER' | 'EMPLOYEE';
  }) {
    try {
      if (type === 'EMPLOYEE') {
        const employee = await this.databaseService.employee.findFirst({
          where: {
            email,
          },
        });

        if (!employee) {
          throw new NotFoundException('Employee with this email not found');
        }

        // send out the email
        await this.emailService.userPasswordResetEmail({
          email: employee?.email,
          name: `${employee.firstName} ${employee.lastName}`,
          employeeId: employee.id,
        });

        return new ReturnType({
          message: 'Email sent!',
          success: true,
          data: null,
        });
      } else {
        const user = await this.databaseService.user.findFirst({
          where: {
            email,
          },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        await this.emailService.adminPasswordResetEmail({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          adminId: user.id,
        });
        return new ReturnType({
          message: 'Email sent!',
          success: true,
          data: null,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email for ${type} ${email}:`,
        error,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while processing the password reset request.',
      );
    }
  }

  async changePassword({
    userId,
    newPassword,
    type,
  }: {
    userId: string;
    newPassword: string;
    type: 'USER' | 'EMPLOYEE';
  }) {
    try {
      const salt = await genSalt();
      const hashedPassword = await hash(newPassword, salt);

      if (type === 'EMPLOYEE') {
        const employee = await this.databaseService.employee.findUnique({
          where: { id: userId },
        });

        if (!employee) {
          throw new NotFoundException(`Employee with ID ${userId} not found`);
        }

        await this.databaseService.employee.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
      } else {
        const user = await this.databaseService.user.findUnique({
          where: { id: userId },
        });

        if (!user) {
          throw new NotFoundException(`User with ID ${userId} not found`);
        }

        await this.databaseService.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
      }

      return new ReturnType({
        success: true,
        message: 'Password changed successfully',
        data: null,
      });
    } catch (error) {
      this.logger.error(
        `Failed to change password for ${type} ID ${userId}:`,
        error,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while changing the password.',
      );
    }
  }
}
