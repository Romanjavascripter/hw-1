import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { AvatarCleanupService } from './avatar-cleanup.service.js';
import { Job } from 'bullmq';
export interface CleanupJobData {
  triggeredBy: 'cron' | 'manual';
}

export interface CleanupJobResult {
  deletedCount: number;
  failedCount: number;
}
@Processor('avatar-cleanup')
export class AvatarCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(AvatarCleanupProcessor.name);
  constructor(private readonly cleanupService: AvatarCleanupService) {
    super();
  }
  async process(
    job: Job<CleanupJobData, CleanupJobResult, string>,
  ): Promise<CleanupJobResult> {
    this.logger.log(` Начинаю обработку задачи: ${job.name}`);

    try {
      const result = await this.cleanupService.cleanOldAvatars();
      this.logger.log(`✅ Очистка завершена. Удалено: ${result.deletedCount}`);
      return result;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`❌ Ошибка при очистке аватаров: ${msg}`);
      throw error;
    }
  }
}
