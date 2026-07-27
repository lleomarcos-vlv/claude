import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { UserRole } from '@jardimja/shared';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  gardenerId?: string;
}

/** Injects the authenticated user (populated by JwtStrategy) into a handler. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const req = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
  return req.user;
});

export const ROLES_KEY = 'roles';
/** Restrict a route to one or more roles (enforced by RolesGuard). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const IS_PUBLIC_KEY = 'isPublic';
/** Mark a route as accessible without authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
