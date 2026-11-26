import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AvatarsService } from './avatars.service.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '../users/entity/user.entity.js';
import { AvatarValidationPipe } from '../../providers/s3/avatar-validation.pipe.js';

@ApiTags('avatars')
@ApiBearerAuth()
@Controller('avatars')
@UseGuards(JwtAuthGuard)
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Request() req: { user: User },
    @UploadedFile(AvatarValidationPipe) file: Express.Multer.File,
  ) {
    return this.avatarsService.upload(req.user.id, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Request() req: { user: User },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.avatarsService.remove(req.user.id, id);
  }
}
