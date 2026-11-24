import { InternalServerErrorException } from '@nestjs/common';

export class UploadException extends InternalServerErrorException {
  constructor(message: string) {
    super(`Failed to upload file to S3: ${message}`);
  }
}
