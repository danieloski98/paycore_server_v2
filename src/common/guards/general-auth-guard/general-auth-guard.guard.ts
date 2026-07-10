import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class GeneralAuthGuardGuard implements CanActivate {
  private logger = new Logger(GeneralAuthGuardGuard.name);
  constructor(private jwtService: JwtService, private configService: ConfigService, private databaseService: PrismaService) { }
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const req: Request = context.switchToHttp().getRequest();

    const [bearer, token] = req.headers['authorization'] ? req.headers['authorization'].split(" ") as string[] : [undefined, undefined];

    if (!bearer || !token) {
      return false;
    }

    // validate token
    const validatedToken: { email: string, companyId: string, TYPE: 'EMPLOYEE' | 'USER' } = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get('JWT_SECRET'),
    });

    if (validatedToken.TYPE === 'EMPLOYEE') {
      const user = await this.databaseService.employee.findFirst({
        where: {
          AND: [
            { email: validatedToken?.email },
            { companyId: validatedToken?.companyId },
          ]
        },
        select: {
          id: true,
          companyId: true,
          email: true,
          emailVerified: true,
          firstName: true,
          lastName: true,
        }
      });

      if (!user) {
        return false;
      }

      req['user'] = user;
      return true;
    }

    if (validatedToken.TYPE === 'USER') {
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
    }
    throw new UnauthorizedException('You are not authorized to take this action')
  }
}
