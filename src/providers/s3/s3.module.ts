import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Service } from './s3.service.js';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'S3_CLIENT',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new S3Client({
          endpoint: configService.getOrThrow<string>('S3_ENDPOINT'),
          region: configService.get<string>('S3_REGION', 'us-east-1'),
          forcePathStyle: true,
          credentials: {
            accessKeyId: configService.getOrThrow<string>('S3_ACCESS_KEY'),
            secretAccessKey: configService.getOrThrow<string>('S3_SECRET_KEY'),
          },
        });
      },
    },
    S3Service,
  ],
  exports: [S3Service],
})
export class S3Module {}
