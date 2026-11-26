import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Module({
  providers: [
    {
      provide: 'BULL_REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          maxRetriesPerRequest: null,
        });
      },
    },
  ],
  exports: ['BULL_REDIS_CLIENT'],
})
export class RedisModule {}
