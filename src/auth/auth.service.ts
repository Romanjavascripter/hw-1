import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { IUsersRepository } from '../features/users/users.repository.interface.js';
import { User } from '../features/users/entity/user.entity.js';
import { CreateUserDto } from '../features/users/dto/create-user.dto.js';
import { JwtPayload } from './jwt-payload.interface.js';
import { PasswordHasherService } from './password-hasher.service.js';
import { TokenService } from './token.service.js';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { UniqueViolationError } from '../features/users/errors/unique-violation.error.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepo: IUsersRepository,
    private readonly tokens: TokenService,
    private readonly passwordHasher: PasswordHasherService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async issueTokens(user: User, expectedHash?: string) {
    const pair = this.tokens.generatePair(user);
    const newHash = this.tokens.hash(pair.refresh_token);

    if (expectedHash !== undefined) {
      const rotated = await this.usersRepo.rotateRefreshTokenHash(
        user.id,
        expectedHash,
        newHash,
      );
      if (!rotated)
        throw new UnauthorizedException('Refresh token already used');
    } else {
      await this.usersRepo.updateRefreshTokenHash(user.id, newHash);
    }

    const { password: _password, refreshTokenHash: _hash, ...safeUser } = user;
    return {
      ...pair,
      user: safeUser,
    };
  }

  async register(createUserDto: CreateUserDto) {
    const hashedpassword = await this.passwordHasher.hash(
      createUserDto.password,
    );

    const userData: Partial<User> = {
      login: createUserDto.login,
      email: createUserDto.email,
      password: hashedpassword,
      age: createUserDto.age,
      description: createUserDto.description,
    };

    try {
      const newUser = await this.usersRepo.create(userData);
      const version =
        (await this.cacheManager.get<number>('users:list:version')) ?? 1;
      await this.cacheManager.set('users:list:version', version + 1, 0);

      return await this.issueTokens(newUser);
    } catch (error: unknown) {
      if (error instanceof UniqueViolationError) {
        throw new ConflictException('User already exists');
      }
      throw error;
    }
  }

  async login(user: User) {
    return this.issueTokens(user);
  }

  async refresh(user: User) {
    if (!user.refreshTokenHash)
      throw new UnauthorizedException(
        'Session expired. Please log in again data',
      );
    return this.issueTokens(user, user.refreshTokenHash);
  }

  async logout(userId: string): Promise<void> {
    await this.usersRepo.updateRefreshTokenHash(userId, null);
  }
}
