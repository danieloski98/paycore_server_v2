import { BadGatewayException, CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class EmployeeAuthGuard implements CanActivate {
  private logger = new Logger(EmployeeAuthGuard.name);
  constructor(private jwtService: JwtService, private configService: ConfigService, private databaseService: PrismaService) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean>  {
   try {
    const req: Request = context.switchToHttp().getRequest();

    const [bearer, token] = req.headers['authorization'] ? req.headers['authorization'].split(" ") as string[] : [undefined, undefined];

    if (!bearer || !token) {
      return false;
    }

    // validate token
    const validatedToken: { email: string, companyId: string, type: 'EMPLOYEE'} = await this.jwtService.verifyAsync(token, {
      secret: this.configService.get('JWT_SECRET'),
    });

    // get the user details
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
   } catch(error) {
      throw new BadGatewayException(error?.message);
   }
  }
}
