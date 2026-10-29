import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { User } from './entity/user.entity.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@ApiTags('profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly usersService: UsersService) {}

  @ApiResponse({ status: 200, description: 'Данные владельца токена' })
  @ApiOperation({ summary: 'Профиль пользователя' })
  @Get('my')
  async myProfile(@Request() req: { user: User }) {
    return req.user;
  }

  @ApiResponse({ status: 200, description: 'Обновлённые данные' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 409, description: 'Логин или email уже заняты' })
  @ApiOperation({ summary: 'Изменение данных пользователя' })
  @Patch('my')
  async updateUser(@Request() req: { user: User }, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.id, dto);
  }

  @ApiResponse({ status: 204, description: 'Удалён' })
  @ApiOperation({ summary: 'Мягкое удаление своего аккаунта' })
  @Delete('my')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Request() req: { user: User }) {
    await this.usersService.delete(req.user.id);
  }
}
