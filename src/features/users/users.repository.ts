import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IUsersRepository } from './users.repository.interface.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity.js';
import { DataSource, ILike, QueryFailedError, Repository } from 'typeorm';
import { Transfer } from './entity/transfer.entity.js';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Decimal } from 'decimal.js';
import { Avatar } from './entity/avatar.entity.js';
import { ActiveUserResponse } from './dto/active-user-response.interface.js';

export type PublicUser = Pick<User, 'id' | 'login' | 'age'>;

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectRepository(Transfer)
    private readonly transferRepo: Repository<Transfer>,
    private readonly dataSource: DataSource,
    @InjectPinoLogger(UsersRepository.name)
    private readonly logger: PinoLogger,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.repo.findOne({ where: { login } });
  }

  async create(data: Partial<User>): Promise<User> {
    return this.repo.save(data);
  }

  async findByLoginWithPassword(login: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.login=:login', { login })
      .getOne();
  }
  async update(id: string, data: Partial<User>): Promise<User | null> {
    try {
      await this.repo.update(id, data);
      return this.findById(id);
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const pgError = error.driverError as { code?: string; column?: string };
        if (pgError.code === '23505') {
          throw new ConflictException(
            'User with this login or email already exists',
          );
        }
        if (pgError.code === '23502') {
          throw new BadRequestException(
            `Field "${pgError.column ?? 'unknown'}" cannot be null`,
          );
        }
      }
      throw error;
    }
  }
  async delete(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.softDelete(User, id);
      await manager.softDelete(Avatar, { userId: id });
    });
  }

  async findAll(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{ items: PublicUser[]; total: number }> {
    const { page, limit, search } = params;
    const [items, total] = await this.repo.findAndCount({
      select: ['id', 'login', 'age'],
      where: search ? { login: ILike(`%${search}%`) } : {},
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  async findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.refreshTokenHash')
      .where('user.id=:id', { id })
      .getOne();
  }

  async updateRefreshTokenHash(id: string, hash: string | null): Promise<void> {
    await this.repo.update(id, { refreshTokenHash: hash });
  }

  async rotateRefreshTokenHash(
    id: string,
    oldHash: string,
    newHash: string,
  ): Promise<boolean> {
    const result = await this.repo.update(
      { id, refreshTokenHash: oldHash },
      { refreshTokenHash: newHash },
    );
    return (result.affected ?? 0) === 1;
  }

  async findActiveUsers(
    minAge: number,
    maxAge: number,
  ): Promise<ActiveUserResponse[]> {
    this.logger.info(`Ищем активных юзеров от ${minAge} до ${maxAge} лет...`);

    const startTime = Date.now();

    const sql = `
        SELECT DISTINCT ON (u.id)
          u.id, u.login, u.age, u.description,
          a.id AS "avatarId", a."objectKey" AS "avatarKey", a."createdAt" AS "avatarCreatedAt"
        FROM users u
        JOIN avatars a ON u.id = a.user_id AND a."deletedAt" IS NULL
        WHERE u."deletedAt" IS NULL
          AND u.description IS NOT NULL AND TRIM(u.description) <> ''
          AND u.age BETWEEN $1 AND $2
          AND (SELECT COUNT(*) FROM avatars a2 WHERE a2.user_id = u.id AND a2."deletedAt" IS NULL) > 2
        ORDER BY u.id, a."createdAt" DESC;
      `;

    const result = await this.dataSource.query<ActiveUserResponse[]>(sql, [
      minAge,
      maxAge,
    ]);

    const time = Date.now() - startTime;
    this.logger.info(`Найдено ${result.length} юзеров за ${time} мс`);

    return result;
  }
  async transferMoney(params: {
    senderId: string;
    receiverId: string;
    amount: string;
    idempotencyKey: string;
    newSenderBalance: string;
    newReceiverBalance: string;
  }) {
    const {
      senderId,
      receiverId,
      amount,
      idempotencyKey,
      newSenderBalance,
      newReceiverBalance,
    } = params;

    const [firstId, secondId] = [senderId, receiverId].sort();

    try {
      return await this.dataSource.transaction(async (manager) => {
        const firstUser = await manager.findOne(User, {
          where: { id: firstId },
          lock: { mode: 'pessimistic_write' },
        });

        const secondUser = await manager.findOne(User, {
          where: { id: secondId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!firstUser || !secondUser) {
          throw new NotFoundException('User is not found');
        }

        const sender = firstId === senderId ? firstUser : secondUser;
        const receiver = firstId === receiverId ? firstUser : secondUser;

        sender.balance = newSenderBalance;
        receiver.balance = newReceiverBalance;

        const transferRecord = manager.create(Transfer, {
          senderId,
          receiverId,
          amount,
          senderBalanceAfter: newSenderBalance,
          idempotencyKey,
        });

        await manager.save(transferRecord);
        await manager.save([sender, receiver]);

        return { success: true, newBalance: newSenderBalance };
      });
    } catch (error: unknown) {
      if (error instanceof QueryFailedError) {
        const pgError = error.driverError as { code?: string };

        if (pgError.code === '23505') {
          const concurrentTransfer = await this.transferRepo.findOne({
            where: { idempotencyKey },
          });

          if (!concurrentTransfer) {
            throw new Error('Transfer record not found after unique violation');
          }

          if (
            !new Decimal(concurrentTransfer.amount).equals(amount) ||
            concurrentTransfer.receiverId !== receiverId
          ) {
            throw new ConflictException(
              'Idempotency-Key reused with different payload',
            );
          }

          return {
            success: true,
            newBalance: concurrentTransfer.senderBalanceAfter,
            idempotentReplay: true,
          };
        }
      }

      throw error;
    }
  }
  async findIdWithPassword(id: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id=:id', { id })
      .getOne();
  }
  async findTransferByKey(idempotencyKey: string): Promise<Transfer | null> {
    return this.transferRepo.findOne({ where: { idempotencyKey } });
  }
}
