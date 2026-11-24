import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Avatar } from '../users/entity/avatar.entity.js';
import { S3Service } from '../../providers/s3/s3.service.js';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { AvatarsRepository } from './avatars.repository.js';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
@Injectable()
export class AvatarsService {
  constructor(
    private readonly avatarsRepo: AvatarsRepository,
    private readonly s3Service: S3Service,
    private readonly dataSource: DataSource,
    @InjectPinoLogger(AvatarsService.name) private readonly logger: PinoLogger,
  ) {}

  async upload(userId: string, file: Express.Multer.File) {
    const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const key = `avatars/${userId}/${randomUUID()}.${ext}`;
    this.logger.info(
      { userId, size: file.size, mimetype: file.mimetype },
      ' Начинаю загрузку аватара',
    );
    await this.s3Service.uploadFile({
      folder: `avatars/${userId}`,
      name: key.split('/').pop()!,
      file: file,
    });

    try {
      return await this.dataSource.transaction(async (manager) => {
        await manager.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [
          userId,
        ]);
        const activeCount = await this.avatarsRepo.countActiveAvatars(
          userId,
          manager,
        );

        if (activeCount >= 5) {
          await this.s3Service.removeFile({ path: key }).catch(() => {});
          throw new ConflictException('Maximum 5 active avatars allowed');
        }
        const avatar = manager.create(Avatar, {
          userId,
          objectKey: key,
          mimeType: file.mimetype,
          size: file.size,
        });
        return manager.save(avatar);
      });
    } catch (error) {
      await this.s3Service.removeFile({ path: key }).catch(() => {});
      throw error;
    }
  }
  async remove(userId: string, id: string) {
    const avatar = await this.avatarsRepo.findByIdAndUserId(id, userId);
    if (!avatar) {
      throw new NotFoundException('Avatar not found');
    }
    await this.avatarsRepo.softDelete(id);

    this.s3Service
      .removeFile({ path: avatar.objectKey })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        this.logger.error(
          `Failed to delete file from S3: ${avatar.objectKey}`,
          message,
        );
      });

    return { success: true, id };
  }
}
