import { createParamDecorator, ExecutionContext, Logger } from '@nestjs/common';

export interface UserDetails {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    companyId: string;
}

export const GetUser = createParamDecorator(
    (data: keyof UserDetails | undefined, ctx: ExecutionContext) => {
        const logger = new Logger("GetUserDecorator");
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            return null;
        }

        // If a specific property is requested, return that property
        if (data) {
            logger.debug("USER DETAILS");
            logger.debug(user);
            return user[data];
        }
        // Otherwise return the entire user object
        logger.debug("USER DETAILS");
        logger.debug(user);
        return user;
    },
);
