import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { S3Module } from './providers/s3/s3.module.js';
import { AvatarsModule } from './features/avatars/avatars.module.js';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { AvatarCleanupModule } from './features/avatar-cleanup/avatar-cleanup.module.js';
import { Redis } from 'ioredis';
import { randomUUID } from 'node:crypto';
import { ClsModule } from 'nestjs-cls';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),

    BullModule.forRootAsync({
      inject: ['BULL_REDIS_CLIENT'],
      useFactory: (redisConnection: Redis) => {
        return {
          connection: redisConnection,
        };
      },
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [createKeyv(config.getOrThrow<string>('REDIS_URL'))],
        ttl: config.get<number>('CACHE_TTL_MS', 30_000),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: ['dist/migrations/*.js'],
        migrationsRun: true,
      }),
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: any) => req.headers['x-request-id'] || randomUUID(),
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req, res) => {
          const id = req.headers['x-request-id'] || randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },

        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'password',
          '*.password',
          '*.refreshTokenHash',
        ],
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    AuthModule,
    S3Module,
    AvatarsModule,
    AvatarCleanupModule,
  ],
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
})
export class AppModule implements OnApplicationShutdown {
  constructor(
    @Inject('BULL_REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  async onApplicationShutdown() {
    await this.redisClient.quit();
    console.log('🔌 Redis (BullMQ) connection closed gracefully.');
  }
}
