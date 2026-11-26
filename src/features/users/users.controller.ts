import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { FindUsersDto } from './dto/find-users.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActiveUsersQueryDto } from './dto/active-users-query.dto.js';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiResponse({ status: 200, description: 'Страница пользователей' })
  @ApiResponse({ status: 401, description: 'Нужен access-токен' })
  @ApiOperation({
    summary: 'Список пользователей с пагинацией и поиском по логину',
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  async findUsers(@Query() dto: FindUsersDto) {
    return this.usersService.findUsers(dto);
  }
  @Get('active')
  @UseGuards(JwtAuthGuard)
  @ApiQuery({ name: 'minAge', type: Number, example: 18 })
  @ApiQuery({ name: 'maxAge', type: Number, example: 30 })
  async getActiveUsers(@Query() query: ActiveUsersQueryDto) {
    return this.usersService.findActiveUsers(query.minAge, query.maxAge);
  }
}
