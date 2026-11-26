import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { TokenService } from './token.service.js';
import { PasswordHasherService } from './password-hasher.service.js';
import { IUsersRepository } from '../features/users/users.repository.interface.js';
import { UniqueViolationError } from '../features/users/errors/unique-violation.error.js';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersRepo = {
    create: vi.fn(),
    updateRefreshTokenHash: vi.fn(),
    rotateRefreshTokenHash: vi.fn(),
  };

  const mockTokenService = {
    generatePair: vi.fn(),
    hash: vi.fn(),
    verifyAccess: vi.fn(),
    verifyRefresh: vi.fn(),
  };

  const mockHasher = {
    hash: vi.fn(),
  };

  const mockCache = {
    get: vi.fn(),
    set: vi.fn(),
  };

  const baseUser = {
    id: 'user-1',
    login: 'alice',
    email: 'a@a.com',
    password: 'hashed-password',
    refreshTokenHash: null,
    age: 20,
    description: null,
  };

  const basePair = {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    mockTokenService.generatePair.mockReturnValue(basePair);
    mockTokenService.hash.mockImplementation((t: string) => `hash(${t})`);
    mockHasher.hash.mockResolvedValue('hashed-password');
    mockCache.get.mockResolvedValue(1);
    mockCache.set.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: IUsersRepository, useValue: mockUsersRepo },
        { provide: TokenService, useValue: mockTokenService },
        { provide: PasswordHasherService, useValue: mockHasher },
        { provide: CACHE_MANAGER, useValue: mockCache },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('В ответе register нет поля password', async () => {
    mockUsersRepo.create.mockResolvedValue({ ...baseUser });
    mockUsersRepo.updateRefreshTokenHash.mockResolvedValue(undefined);

    const result = await service.register({
      login: 'alice',
      email: 'a@a.com',
      password: 'plain',
      age: 20,
      description: null,
    } as any);

    expect(result.user).not.toHaveProperty('password');
  });

  it('превращает UniqueViolationError в ConflictException', async () => {
    mockUsersRepo.create.mockRejectedValue(new UniqueViolationError('login'));

    await expect(
      service.register({
        login: 'alice',
        email: 'a@a.com',
        password: 'plain',
        age: 20,
        description: null,
      } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('сохраняет пароль в виде bcrypt-хеша, а не открытым текстом', async () => {
    mockUsersRepo.create.mockResolvedValue({ ...baseUser });
    mockUsersRepo.updateRefreshTokenHash.mockResolvedValue(undefined);

    await service.register({
      login: 'alice',
      email: 'a@a.com',
      password: 'plain-secret',
      age: 20,
      description: null,
    } as any);

    expect(mockHasher.hash).toHaveBeenCalledWith('plain-secret');
    expect(mockUsersRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ password: 'hashed-password' }),
    );
  });

  it('register сохраняет хэш рефреша, а не сам токен', async () => {
    mockUsersRepo.create.mockResolvedValue({ ...baseUser });
    mockUsersRepo.updateRefreshTokenHash.mockResolvedValue(undefined);

    await service.register({
      login: 'alice',
      email: 'a@a.com',
      password: 'plain',
      age: 20,
      description: null,
    } as any);

    expect(mockTokenService.hash).toHaveBeenCalledWith('refresh-token');
    expect(mockUsersRepo.updateRefreshTokenHash).toHaveBeenCalledWith(
      'user-1',
      'hash(refresh-token)',
    );
  });

  it('refresh ротирует хэш: старый хэш → хэш нового токена', async () => {
    mockUsersRepo.rotateRefreshTokenHash.mockResolvedValue(true);

    const user = { ...baseUser, refreshTokenHash: 'old-hash' };
    await service.refresh(user as any);

    expect(mockUsersRepo.rotateRefreshTokenHash).toHaveBeenCalledWith(
      'user-1',
      'old-hash',
      'hash(refresh-token)',
    );
  });

  it('refresh кидает UnauthorizedException, если rotateRefreshTokenHash вернул false', async () => {
    mockUsersRepo.rotateRefreshTokenHash.mockResolvedValue(false);

    const user = { ...baseUser, refreshTokenHash: 'old-hash' };
    await expect(service.refresh(user as any)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('в ответе нет поля refreshTokenHash', async () => {
    mockUsersRepo.create.mockResolvedValue({ ...baseUser });
    mockUsersRepo.updateRefreshTokenHash.mockResolvedValue(undefined);

    const result = await service.register({
      login: 'alice',
      email: 'a@a.com',
      password: 'plain',
      age: 20,
      description: null,
    } as any);

    expect(result.user).not.toHaveProperty('refreshTokenHash');
  });

  it('logout терминирует старый хеш', async () => {
    mockUsersRepo.updateRefreshTokenHash.mockResolvedValue(undefined);

    await service.logout('user-1');

    expect(mockUsersRepo.updateRefreshTokenHash).toHaveBeenCalledWith(
      'user-1',
      null,
    );
  });
});
