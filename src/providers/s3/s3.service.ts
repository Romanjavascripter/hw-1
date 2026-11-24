import { Inject, Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class S3Service extends IFileService {
  private readonly logger = new Logger(S3Service.name);
  private readonly bucketName: string;

  constructor(
    @Inject('S3_CLIENT') private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {
    super();
    this.bucketName = this.configService.getOrThrow<string>('S3_BUCKET');
  }

  async uploadFile(dto: UploadFilePayloadDto): Promise<UploadFileResultDto> {
    const { folder, file, name } = dto;
    const path = `${folder}/${name}`;

    this.logger.log(`📁 Beginning of uploading file to bucket: ${path}`);

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: path,
          Body: file.buffer,
          ContentType: file.mimetype, // Сюда мы передадим тип, проверенный по магии байт
        }),
      );

      this.logger.log('✅ Uploading was successful');
      return { path }; // Возвращаем путь (ключ), который пойдет в БД
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown S3 upload error';
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`❌ File upload error with path: ${path}`, stack);
      throw new UploadException(message);
    }
  }

  async removeFile(dto: RemoveFilePayloadDto): Promise<void> {
    const { path } = dto;

    this.logger.log(`🗑️ Beginning of removing file from bucket: ${path}`);

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: path,
        }),
      );
      this.logger.log('✅ Removing was successful');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown S3 remove error';
      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`❌ File remove error with path: ${path}`, stack);
      throw new RemoveException(message);
    }
  }
}
