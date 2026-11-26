import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
import type { StringValue } from 'ms';
import { hashToken } from './hash-token.js';
import { JwtPayload } from './jwt-payload.interface.js';
import { User } from '../features/users/entity/user.entity.js';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

type ExpiresIn = number | StringValue;

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private getSecret(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) throw new Error(`Missing env ${key}`);
    return value;
  }

  private getExpiresIn(key: string): ExpiresIn {
    const raw = this.configService.get<string>(key);
    if (!raw) throw new Error(`Missing env ${key}`);
    return /^\d+$/.test(raw) ? Number(raw) : (raw as StringValue);
  }

  generatePair(user: User): TokenPair {
    const payload: JwtPayload = { sub: user.id, login: user.login };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.getSecret('JWT_ACCESS_SECRET'),
      expiresIn: this.getExpiresIn('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = this.jwtService.sign(
      { ...payload, jti: randomUUID() },
      {
        secret: this.getSecret('JWT_REFRESH_SECRET'),
        expiresIn: this.getExpiresIn('JWT_REFRESH_EXPIRES_IN'),
      },
    );

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  async verifyAccess(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.getSecret('JWT_ACCESS_SECRET'),
    });
  }

  async verifyRefresh(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.getSecret('JWT_REFRESH_SECRET'),
    });
  }

  hash(token: string): string {
    return hashToken(token);
  }
}
