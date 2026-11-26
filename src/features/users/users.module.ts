import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entity/user.entity.js';
import { IUsersRepository } from './users.repository.interface.js';
import { UsersRepository } from './users.repository.js';
import { ProfileController } from './profile.controller.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { Transfer } from './entity/transfer.entity.js';
import { PasswordHasherService } from '../../auth/password-hasher.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([User, Transfer])],
  controllers: [ProfileController, UsersController],
  providers: [
    { provide: IUsersRepository, useClass: UsersRepository },
    UsersService,
    PasswordHasherService,
  ],
  exports: [IUsersRepository],
})
export class UsersModule {}
