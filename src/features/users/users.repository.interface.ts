import { ActiveUserResponse } from './dto/active-user-response.interface.js';
import { Transfer } from './entity/transfer.entity.js';
import { User } from './entity/user.entity.js';

export type PublicUser = Pick<User, 'id' | 'login' | 'age'>;

export abstract class IUsersRepository {
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract findByLogin(login: string): Promise<User | null>;
  abstract findByLoginWithPassword(login: string): Promise<User | null>;
  abstract update(id: string, data: Partial<User>): Promise<User | null>;
  abstract delete(id: string): Promise<void>;
  abstract create(data: Partial<User>): Promise<User>;
  abstract findAll(params: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<{
    items: PublicUser[];
    total: number;
  }>;
  abstract findByIdWithRefreshToken(id: string): Promise<User | null>;
  abstract updateRefreshTokenHash(
    id: string,
    hash: string | null,
  ): Promise<void>;
  abstract rotateRefreshTokenHash(
    id: string,
    oldHash: string,
    newHash: string,
  ): Promise<boolean>;
  abstract findActiveUsers(
    minAge: number,
    maxAge: number,
  ): Promise<ActiveUserResponse[]>;
  abstract transferMoney(params: {
    senderId: string;
    receiverId: string;
    amount: string;
    idempotencyKey: string;
    newSenderBalance: string;
    newReceiverBalance: string;
  }): Promise<{ newBalance: string }>;
  abstract findIdWithPassword(id: string): Promise<User | null>;
  abstract findTransferByKey(idempotencyKey: string): Promise<Transfer | null>;
}
