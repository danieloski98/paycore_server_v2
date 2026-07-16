import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import WelcomeUserEmail from 'src/common/templates/userAccountCreated.temlate';
import PasswordResetTemplate from 'src/common/templates/passwordReset.template';
import EmployeeWelcomeEmail, {
  EmployeeWelcomeEmailProps,
} from 'src/common/templates/employeeWelcome.template';
import LeaveStatusEmail from 'src/common/templates/leaveStatus.template';
import LeaveStartedEmail from 'src/common/templates/leaveStarted.template';
import LeaveEndedEmail from 'src/common/templates/leaveEnded.template';
import { LeaveStatus } from 'generated/prisma/enums';
import BankDetailsRequestTemplate from 'src/common/templates/bankDetailsRequest.template';

@Injectable()
export class EmailService {
  private logger = new Logger('EmailService');
  private resend;
  private supportEmail = 'paycoresupport@2ddevstudios.com';

  constructor(private configService: ConfigService) {
    this.resend = new Resend(this.configService.get('RESEND_KEY'));
  }

  async sendUserWelcomeMail({ email, name }: { email: string; name: string }) {
    try {
      // TODO - GENERATE THE LOGIN URL
      const { error, data } = await this.resend.emails.send({
        to: email,
        subject: 'Verify your email',
        from: this.supportEmail,
        react: WelcomeUserEmail({
          username: name,
          baseUrl: this.configService.get('APP_URL'),
        }),
      });
      this.logger.log(data);
      if (error) {
        console.log('-----ERROR-------');
        console.log(error);
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async sendEmployeeWelcomeMail(
    props: EmployeeWelcomeEmailProps & {
      email: string;
      employeeId: string;
      companyId: string;
    },
  ) {
    try {
      const { email, employeeId, companyId, ...rest } = props;
      // TODO - GENERATE THE LOGIN URL
      const { error, data } = await this.resend.emails.send({
        to: email,
        subject: 'Verify your email',
        from: this.supportEmail,
        react: EmployeeWelcomeEmail({
          ...rest,
          loginUrl: `${this.configService.get('FRONTEND_BASE_URL')}/employee-auth/setup?employeeId=${employeeId}&companyId${companyId}`,
          baseUrl: `${this.configService.get('APP_URL')}`,
        }),
      });
      this.logger.log(data);
      if (error) {
        console.log('-----ERROR-------');
        console.log(error);
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async adminPasswordResetEmail({
    email,
    name,
    adminId,
  }: {
    email: string;
    name: string;
    adminId: string;
  }) {
    try {
      const { error, data } = await this.resend.emails.send({
        to: email,
        subject: 'Password Reset Request',
        from: this.supportEmail,
        react: PasswordResetTemplate({
          name: name,
          url: `${this.configService.get('FRONTEND_BASE_URL')}/auth/reset-password?adminId=${adminId}`,
        }),
      });
      this.logger.log(data);
      if (error) {
        console.log('-----PASSWORD RESET ERROR-------');
        console.log(error);
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async userPasswordResetEmail({
    email,
    name,
    employeeId,
  }: {
    email: string;
    name: string;
    employeeId: string;
  }) {
    try {
      const { error, data } = await this.resend.emails.send({
        to: email,
        subject: 'Password Reset Request',
        from: this.supportEmail,
        react: PasswordResetTemplate({
          name: name,
          url: `${this.configService.get('FRONTEND_BASE_URL')}/employee/auth/reset-password?employeeId=${employeeId}`,
        }),
      });
      this.logger.log(data);
      if (error) {
        console.log('-----PASSWORD RESET ERROR-------');
        console.log(error);
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async sendLeaveStatusEmail({
    email,
    name,
    companyName,
    status,
    startDate,
    endDate,
    totalDays,
    description,
  }: {
    email: string;
    name: string;
    companyName: string;
    status: LeaveStatus;
    startDate?: Date;
    endDate?: Date;
    totalDays?: number;
    description?: string;
  }) {
    try {
      const statusText =
        status === LeaveStatus.ACCEPTED
          ? 'accepted'
          : status === LeaveStatus.REJECTED
            ? 'declined'
            : 'updated';
      const { error, data } = await this.resend.emails.send({
        to: email,
        subject: `Your leave request was ${statusText}`,
        from: this.supportEmail,
        react: LeaveStatusEmail({
          employeeName: name,
          companyName,
          status: status as unknown as 'ACCEPTED' | 'REJECTED' | 'PENDING',
          startDate: startDate ? new Date(startDate).toDateString() : undefined,
          endDate: endDate ? new Date(endDate).toDateString() : undefined,
          totalDays,
          description,
          baseUrl: `${this.configService.get('APP_URL')}`,
          supportEmail: this.supportEmail,
        }),
      });
      this.logger.log(data);
      if (error) {
        this.logger.error('Leave status email error', error);
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async sendLeaveStartedEmail({
    email,
    name,
    companyName,
    startDate,
    endDate,
    totalDays,
    description,
    type,
  }: {
    email: string;
    name: string;
    companyName: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    description: string;
    type: string;
  }) {
    try {
      const { error, data } = await this.resend.emails.send({
        to: email,
        subject: `Your leave starts today!`,
        from: this.supportEmail,
        react: LeaveStartedEmail({
          employeeName: name,
          companyName,
          startDate: new Date(startDate).toDateString(),
          endDate: new Date(endDate).toDateString(),
          totalDays,
          description,
          type,
          baseUrl: `${this.configService.get('APP_URL')}`,
          supportEmail: this.supportEmail,
        }),
      });
      this.logger.log(data);
      if (error) {
        this.logger.error('Leave started email error', error);
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async sendLeaveEndedEmail({
    email,
    name,
    companyName,
    startDate,
    endDate,
    totalDays,
    type,
  }: {
    email: string;
    name: string;
    companyName: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    type: string;
  }) {
    try {
      const { error, data } = await this.resend.emails.send({
        to: email,
        subject: `Welcome back! Your leave has ended`,
        from: this.supportEmail,
        react: LeaveEndedEmail({
          employeeName: name,
          companyName,
          startDate: new Date(startDate).toDateString(),
          endDate: new Date(endDate).toDateString(),
          totalDays,
          type,
          baseUrl: `${this.configService.get('APP_URL')}`,
          supportEmail: this.supportEmail,
        }),
      });
      this.logger.log(data);
      if (error) {
        this.logger.error('Leave ended email error', error);
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async sendBankDetailsRequestEmail({
    email,
    name,
    companyName,
  }: {
    email: string;
    name: string;
    companyName: string;
  }) {
    try {
      const { error, data } = await this.resend.emails.send({
        to: email,
        subject: 'Action Required: Add your bank details',
        from: this.supportEmail,
        react: BankDetailsRequestTemplate({
          name,
          companyName,
          url: `${this.configService.get('FRONTEND_BASE_URL')}/employee/dashboard`,
        }),
      });
      this.logger.log(data);
      if (error) {
        this.logger.error('Failed to send bank details request email', error);
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
