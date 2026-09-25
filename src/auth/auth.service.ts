import { ConflictException, Injectable } from '@nestjs/common';
import { IUsersRepository } from '../features/users/users.repository.interface.js';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../features/users/entity/user.entity.js';
import { CreateUserDto } from '../features/users/dto/create-user.dto.js';
import * as bcrypt from 'bcrypt';

const UNIQUE_VIOLATION = '23505';
@Injectable()
export class AuthService {
  
  constructor(
    private readonly usersRepo: IUsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private generateTokens(user: User) {
    const payload = { sub: user.id, login: user.login };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });
    return { access_token: accessToken, refresh_token: refreshToken };
  }
  private buildAuthResponse(user: User) {
    const tokens = this.generateTokens(user);
    const { password: _password, ...safeUser } = user;
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
      return this.buildAuthResponse(newUser)
    } catch (error:any) {
      if (error?.code === UNIQUE_VIOLATION) {
        throw new ConflictException('User already exists');
      }
      throw error;
    }
  }
  async login(user:User){
    return this.buildAuthResponse(user)
  }

  async refresh(user:User){
    return this.buildAuthResponse(user)
  }
}
