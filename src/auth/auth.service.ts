import { ConflictException, Injectable } from '@nestjs/common';
import { IUsersRepository } from '../features/users/users.repository.interface.js';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../features/users/entity/user.entity.js';
import { CreateUserDto } from '../features/users/dto/create-user.dto.js';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { hashToken } from './hash-token.js';
import { JwtPayload } from './jwt-payload.interface.js';

const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === UNIQUE_VIOLATION
  );
}

@Injectable()
export class AuthService {
  
  constructor(
    private readonly usersRepo: IUsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private generateTokens(user: User) {
    const payload: JwtPayload = { sub: user.id, login: user.login };  
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
    const refreshToken = this.jwtService.sign({...payload, jti:randomUUID()}, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
    return { access_token: accessToken, refresh_token: refreshToken };
  }
  private async issueTokens(user: User) {
    const tokens = this.generateTokens(user);
    await this.usersRepo.updateRefreshTokenHash(
      user.id,
      hashToken(tokens.refresh_token)
    )
    const { password: _password, refreshTokenHash: _hash, ...safeUser } = user;
    return {
      ...tokens,
      user: safeUser,
    };
  }
  async register(createUserDto: CreateUserDto) {
    const hashedpassword = await bcrypt.hash(createUserDto.password, 10);

    const userData: Partial<User> = {
      login: createUserDto.login,
      email: createUserDto.email,
      password: hashedpassword,
      age: createUserDto.age,
      description: createUserDto.description,
    };
    try {
      const newUser = await this.usersRepo.create(userData);
      return await this.issueTokens(newUser)
    } catch (error:unknown) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('User already exists');
      }
      throw error;
    }
  }
  async login(user:User){
    return this.issueTokens(user)
  }

  async refresh(user:User){
    return this.issueTokens(user)
  }

  async logout(userId:string):Promise<void>{
    await this.usersRepo.updateRefreshTokenHash(userId, null)
  }
}
