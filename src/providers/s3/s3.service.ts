import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

import { IFileService } from './adapter.js';
import { UploadFilePayloadDto } from './dto/upload-file-payload.dto.js';
import { UploadFileResultDto } from './dto/upload-file-result.dto.js';
import { RemoveFilePayloadDto } from './dto/remove-file-payload.dto.js';
import { UploadException } from './exceptions/upload.exception.js';
import { RemoveException } from './exceptions/remove.exception.js';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Injectable()
export class S3Service implements OnApplicationShutdown {
  private readonly bucketName: string;

  constructor(
    @Inject('S3_CLIENT') private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
    @InjectPinoLogger(S3Service.name) private readonly logger: PinoLogger,
  ) {}

  async uploadFile(dto: UploadFilePayloadDto): Promise<UploadFileResultDto> {
    const { folder, file, name } = dto;
    const path = `${folder}/${name}`;

    this.logger.info(`Beginning of uploading file to bucket: ${path}`);

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: path,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      this.logger.info('Uploading was successful');
      return { path };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown S3 upload error';
      this.logger.error({ path, error: message }, '❌ File upload error');
      throw new UploadException();
    }
  }

  async removeFile(dto: RemoveFilePayloadDto): Promise<void> {
    const { path } = dto;

    this.logger.info(`Beginning of removing file from bucket: ${path}`);

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: path,
        }),
      );
      this.logger.info('Removing was successful');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown S3 remove error';
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`File remove error with path: ${path}`, stack);
      throw new RemoveException(message);
    }
  }

  async onApplicationShutdown() {
    this.s3Client.destroy();
  }
}
