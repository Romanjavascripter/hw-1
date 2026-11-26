import { Inject, Module, OnApplicationShutdown, Logger } from '@nestjs/common';
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
import { ClsModule, ClsService } from 'nestjs-cls';
import { InjectPinoLogger, LoggerModule, PinoLogger } from 'nestjs-pino';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { envSchema } from './config/env.validation.js';
import databaseConfig from './config/database.config.js';
import jwtConfig from './config/jwt.config.js';
import { RedisModule } from './providers/redis/redis.module.js';
import { Request } from 'express';
import { IncomingMessage, ServerResponse } from 'node:http';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
      load: [databaseConfig, jwtConfig],
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    BullModule.forRootAsync({
      imports: [RedisModule],
      inject: ['BULL_REDIS_CLIENT'],
      useFactory: (redisConnection: Redis) => ({
        connection: redisConnection,
      }),
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [createKeyv(config.getOrThrow<string>('REDIS_URL'))],
        ttl: config.getOrThrow<number>('CACHE_TTL_MS'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.getOrThrow<string>('DB_HOST'),
        port: config.getOrThrow<number>('DB_PORT'),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),
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
        idGenerator: (req: Request) => {
          const header = req.headers['x-request-id'];
          const id = Array.isArray(header) ? header[0] : header;
          return id ?? randomUUID();
        },
      },
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService, ClsService],
      useFactory: (config: ConfigService, cls: ClsService) => ({
        pinoHttp: {
          genReqId: (req: IncomingMessage, res: ServerResponse) => {
            const header = req.headers['x-request-id'];
            const headerId = Array.isArray(header) ? header[0] : header;
            const id = cls.getId() || headerId || randomUUID();
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
            config.get('NODE_ENV') !== 'production'
              ? { target: 'pino-pretty' }
              : undefined,
        },
      }),
    }),
    AuthModule,
    S3Module,
    AvatarsModule,
    AvatarCleanupModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements OnApplicationShutdown {
  private readonly logger = new Logger(AppModule.name);
  constructor(
    @Inject('BULL_REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  async onApplicationShutdown() {
    await this.redisClient.quit();
    this.logger.log('Redis (BullMQ) connection closed gracefully.');
  }
}
