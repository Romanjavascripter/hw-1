import { Injectable, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CronJob } from 'cron';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class AvatarCleanupScheduler implements OnModuleInit {
  constructor(
    @InjectQueue('avatar-cleanup') private cleanupQueue: Queue,
    @InjectPinoLogger(AvatarCleanupScheduler.name)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronExpression = this.configService.getOrThrow<string>(
      'AVATAR_CLEANUP_CRON',
    );

    const job = new CronJob(cronExpression, async () => {
      try {
        this.logger.info('Время чистить аватары! Ставлю задачу в очередь...');

        await this.cleanupQueue.add('clean-old-avatars', {
          triggeredBy: 'cron',
        });

        this.logger.info('Задача очистки успешно добавлена в очередь');
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Ошибка при добавлении задачи в очередь: ${msg}`);
      }
    });

    this.schedulerRegistry.addCronJob('avatar-cleanup-job', job);
    job.start();

    this.logger.info(
      `📅 Задача очистки аватаров запущена по расписанию: ${cronExpression}`,
    );
  }
}
