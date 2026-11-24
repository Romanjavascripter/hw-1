import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CronJob } from 'cron';

@Injectable()
export class AvatarCleanupScheduler implements OnModuleInit {
  private readonly logger = new Logger(AvatarCleanupScheduler.name);

  constructor(
    @InjectQueue('avatar-cleanup') private cleanupQueue: Queue,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronExpression = this.configService.get<string>(
      'AVATAR_CLEANUP_CRON',
      '0 3 * * *',
    );

    const job = new CronJob(cronExpression, async () => {
      this.logger.log('⏰ Время чистить аватары! Ставлю задачу в очередь...');
      await this.cleanupQueue.add('clean-old-avatars', { triggeredBy: 'cron' });
    });

    this.schedulerRegistry.addCronJob('avatar-cleanup-job', job);
    job.start();

    this.logger.log(
      `📅 Задача очистки аватаров запущена по расписанию: ${cronExpression}`,
    );
  }
}
