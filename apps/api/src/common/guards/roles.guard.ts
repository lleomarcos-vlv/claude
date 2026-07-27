import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DomainError, ErrorCode, type UserRole } from '@jardimja/shared';
import { ROLES_KEY } from '../decorators/current-user.decorator.js';
import type { AuthUser } from '../decorators/current-user.decorator.js';

/** Enforces `@Roles(...)` metadata against the authenticated user's role. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!user) throw new DomainError(ErrorCode.UNAUTHORIZED, 'Autenticação necessária.');
    if (!required.includes(user.role)) {
      throw new DomainError(ErrorCode.FORBIDDEN, 'Permissão insuficiente para esta ação.');
    }
    return true;
  }
}
