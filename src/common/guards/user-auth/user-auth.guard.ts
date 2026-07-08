import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from 'src/common/prisma/prisma.service';

interface UserTokenPayload {
  email: string;
  companyId: string | null;
  TYPE: 'USER';
  iat?: number;
  exp?: number;
}

@Injectable()
export class UserAuthGuard implements CanActivate {
  private logger = new Logger(UserAuthGuard.name);
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private databaseService: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const auth = req.headers['authorization'];
    if (!auth) throw new UnauthorizedException('Missing authorization header');

    const [bearer, token] = auth.split(' ');
    if (!token || bearer?.toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    let validatedToken: UserTokenPayload;
    try {
      validatedToken = await this.jwtService.verifyAsync<UserTokenPayload>(
        token,
        {
          secret: this.configService.get<string>('JWT_SECRET'),
        },
      );
      this.logger.log(`Validated token: ${JSON.stringify(validatedToken)}`);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (validatedToken.TYPE !== 'USER') {
      throw new UnauthorizedException('Wrong token type for this guard');
    }

    try {
      const user = await this.databaseService.user.findFirst({
        where: {
          email: validatedToken.email,
          companyId: validatedToken.companyId,
          isDeleted: false,
          isActive: true,
        },
        select: {
          id: true,
          companyId: true,
          email: true,
          emailVerified: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      if (!user) return false;

      req['user'] = user;
      return true;
    } catch (err) {
      throw new InternalServerErrorException('Failed to validate user');
    }
  }
}
