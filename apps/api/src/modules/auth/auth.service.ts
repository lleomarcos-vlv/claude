import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { DomainError, ErrorCode, UserRole } from '@jardimja/shared';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { LoginDto, RegisterDto } from './dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new DomainError(ErrorCode.CONFLICT, 'E-mail já cadastrado.');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role ?? UserRole.CLIENT,
      },
    });
    return this.issueTokens(user.id, user.email, user.role as UserRole);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { gardenerProfile: { select: { id: true } } },
    });
    if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new DomainError(ErrorCode.UNAUTHORIZED, 'Credenciais inválidas.');
    }
    return this.issueTokens(user.id, user.email, user.role as UserRole, user.gardenerProfile?.id);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string; role: UserRole; gardenerId?: string }>(
        refreshToken,
        { secret: this.config.get<string>('jwt.secret') },
      );
      return this.issueTokens(payload.sub, payload.email, payload.role, payload.gardenerId);
    } catch {
      throw new DomainError(ErrorCode.UNAUTHORIZED, 'Refresh token inválido ou expirado.');
    }
  }

  private async issueTokens(sub: string, email: string, role: UserRole, gardenerId?: string) {
    const payload = { sub, email, role, gardenerId };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.config.get<number>('jwt.accessTtl'),
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: this.config.get<number>('jwt.refreshTtl'),
    });
    return { accessToken, refreshToken, user: { id: sub, email, role, gardenerId } };
  }
}
