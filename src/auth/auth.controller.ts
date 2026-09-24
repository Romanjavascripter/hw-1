import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CreateUserDto } from '../features/users/dto/create-user.dto.js';
import { User } from '../features/users/entity/user.entity.js';
import { LocalAuthGuard } from './guards/local-auth.guard.js';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard.js';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({ status: 201, description: 'Успешная регистрация' })
  @ApiResponse({ status: 400, description: 'Данные не прошли валидацию' })
  @ApiResponse({ status: 409, description: 'Логин или email уже заняты' })
  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Успешно' })
  @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
  @ApiOperation({ summary: 'Вход по логину и паролю' })
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: { user: User }) {
    return this.authService.login(req.user);
  }
  @ApiBody({ type: RefreshDto })
  @ApiResponse({ status: 200, description: 'Выдана новая пара токенов' })
  @ApiResponse({ status: 401, description: 'Refresh-токен недействителен или истёк' })
  @ApiOperation({ summary: 'Обновление пары токенов по рефреш-токену' })
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  async refresh(@Request() req: { user: User }) {
    return this.authService.refresh(req.user);
  }
}
