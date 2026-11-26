import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Queue } from 'bullmq';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin/cleanup')
export class AvatarCleanupController {
  constructor(@InjectQueue('avatar-cleanup') private cleanupQueue: Queue) {}
  @Post('avatars')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Вручную запустить очистку старых аватаров' })
  async triggerCleanup() {
    const job = await this.cleanupQueue.add('cleanup-old-avatars', {
      triggeredBy: 'manual',
    });
    return {
      message: 'Cleanup task added to queue',
      jobId: job.id,
    };
  }
}
