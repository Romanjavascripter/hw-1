import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindUsersDto, PaginatedDto } from './dto/find-users.dto.js';
import { IUsersRepository } from './users.repository.interface.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User } from './entity/user.entity.js';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { TransferDto } from './dto/transfer.dto.js';
import { Decimal } from 'decimal.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Transfer } from './entity/transfer.entity.js';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ActiveUserResponse } from './dto/active-user-response.interface.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { PasswordHasherService } from '../../auth/password-hasher.service.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  private readonly inFlightRequests = new Map<string, Promise<unknown>>();
  private readonly cacheTtl: number;
  constructor(
    private config: ConfigService,
    private usersRepo: IUsersRepository,
    private passwordHasher: PasswordHasherService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(Transfer) private transferRepo: Repository<Transfer>,
    @InjectPinoLogger(UsersService.name) private logger: PinoLogger,
  ) {
    this.cacheTtl = Number(this.config.getOrThrow<number>('CACHE_TTL_MS'));
  }

  private getUsersListCacheKey(query: FindUsersDto, version: number): string {
    const { search = '', page = 1, limit = 10 } = query;
    return `users:list:v${version}:search=${search}:page=${page}:limit=${limit}`;
  }

  private async getListVersion(): Promise<number> {
    const v = await this.cacheManager.get<number>('users:list:version');
    return v ?? 1;
  }

  private async bumpListVersion(): Promise<void> {
    const v = await this.getListVersion();
    await this.cacheManager.set('users:list:version', v + 1, 0);
  }

  private async withSingleFlight<T>(
    key: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const existing = this.inFlightRequests.get(key);
    if (existing) {
      this.logger.info(`Single-flight: joining existing request for ${key}`);
      return existing as Promise<T>;
    }
    const promise = fn().finally(() => {
      this.inFlightRequests.delete(key);
    });
    this.inFlightRequests.set(key, promise);
    return promise;
  }

  async findUsers(query: FindUsersDto): Promise<PaginatedDto> {
    const version = await this.getListVersion();

    const cacheKey = this.getUsersListCacheKey(query, version);

    const cached = await this.cacheManager.get<PaginatedDto>(cacheKey);
    if (cached) {
      this.logger.debug(`🟢 Cache HIT: ${cacheKey}`);
      return cached;
    }
    this.logger.debug(`🔴 Cache MISS: ${cacheKey}`);

    const result = await this.withSingleFlight(cacheKey, async () => {
      const { search, page, limit } = query;
      const { items, total } = await this.usersRepo.findAll({
        page,
        limit,
        search,
      });
      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      } as PaginatedDto;
    });
    await this.cacheManager.set(cacheKey, result, this.cacheTtl);
    return result;
  }
  async getProfile(id: string) {
    const cacheKey = `user:profile:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      this.logger.debug(`🟢 Cache HIT: ${cacheKey}`);
      return cached;
    }
    this.logger.debug(`🔴 Cache MISS: ${cacheKey}`);

    const user = await this.withSingleFlight(cacheKey, async () => {
      return this.usersRepo.findById(id);
    });

    if (!user) throw new NotFoundException('User not found');

    const {
      password: _password,
      refreshTokenHash: _refreshTokenHash,
      ...safeUser
    } = user;

    await this.cacheManager.set(cacheKey, safeUser, this.cacheTtl);
    return safeUser;
  }

  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepo.update(id, dto);
    if (!user) {
      throw new NotFoundException('User is not found');
    }
    await this.cacheManager.del(`user:profile:${id}`);
    await this.bumpListVersion();

    return user;
  }

  async delete(id: string): Promise<void> {
    await this.usersRepo.delete(id);

    await this.cacheManager.del(`user:profile:${id}`);
    await this.bumpListVersion();
  }
  async findActiveUsers(
    minAge: number,
    maxAge: number,
  ): Promise<ActiveUserResponse[]> {
    const result = await this.usersRepo.findActiveUsers(minAge, maxAge);
    return result;
  }

  async transfer(senderId: string, dto: TransferDto, idempotencyKey: string) {
    const { receiverId, amount } = dto;
    this.logger.info(
      {
        senderId,
        receiverId: dto.receiverId,
        amount: dto.amount,
        idempotencyKey,
      },
      'Начинаю перевод денег',
    );

    if (!receiverId) throw new BadRequestException('Receiver ID is required');
    if (receiverId === senderId)
      throw new BadRequestException('Cannot transfer to yourself');

    const existing = await this.transferRepo.findOne({
      where: { idempotencyKey, senderId },
    });
    if (existing) {
      if (
        !new Decimal(existing.amount).equals(amount) ||
        existing.receiverId !== receiverId
      ) {
        throw new ConflictException(
          'Idempotency-Key reused with different payload',
        );
      }
      return {
        success: true,
        newBalance: existing.senderBalanceAfter,
        idempotentReplay: true,
      };
    }
    const sender = await this.usersRepo.findById(senderId);
    const receiver = await this.usersRepo.findById(receiverId);
    if (!sender || !receiver) throw new NotFoundException('User not found');

    const transferAmount = new Decimal(amount);
    const senderBalance = new Decimal(sender.balance);
    if (senderBalance.lessThan(transferAmount))
      throw new BadRequestException('Insufficient amount of money');
    const result = await this.usersRepo.transferMoney({
      senderId,
      receiverId,
      amount,
      idempotencyKey,
      newSenderBalance: senderBalance.minus(transferAmount).toFixed(2),
      newReceiverBalance: new Decimal(receiver.balance)
        .plus(transferAmount)
        .toFixed(2),
    });

    await this.cacheManager.del(`user:profile:${senderId}`);
    await this.cacheManager.del(`user:profile:${receiverId}`);

    this.logger.info(
      { senderId, receiverId, amount, newBalance: result.newBalance },
      '✅ Перевод успешно завершен',
    );

    return result;
  }
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findIdWithPassword(userId);
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await this.passwordHasher.compare(
      dto.oldPassword,
      user.password,
    );
    if (!isMatch)
      throw new BadRequestException('Current password is not correct');
    const newHash = await this.passwordHasher.hash(dto.newPassword);

    await this.usersRepo.update(userId, {
      password: newHash,
      refreshTokenHash: null,
    });
    return {
      success: true,
      message: 'Password updated successfully. Please log in again',
    };
  }
}
