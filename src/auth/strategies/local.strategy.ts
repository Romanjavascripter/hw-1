import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { IUsersRepository } from '../../features/users/users.repository.interface.js';
import { PasswordHasherService } from '../password-hasher.service.js';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersRepo: IUsersRepository,
    private passwordHasher: PasswordHasherService,
  ) {
    super({
      usernameField: 'login',
      passwordField: 'password',
    });
  }

  async validate(login: string, password: string) {
    const user = await this.usersRepo.findByLoginWithPassword(login);
    if (!user) {
      throw new UnauthorizedException('Invalid data');
    }
    const isValid = await this.passwordHasher.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid data');
    }
    return user;
  }
}
