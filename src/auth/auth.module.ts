import { Module } from '@nestjs/common';
import { UsersModule } from '../features/users/users.module.js';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PasswordHasherService } from './password-hasher.service.js';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PasswordHasherService,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    JwtRefreshStrategy,
    JwtAuthGuard,
  ],
  exports: [AuthService, JwtAuthGuard, PassportModule],
})
export class AuthModule {}
