import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { FindUsersDto } from './dto/find-users.dto.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

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
}
