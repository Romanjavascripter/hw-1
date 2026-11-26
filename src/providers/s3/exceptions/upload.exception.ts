import { InternalServerErrorException } from '@nestjs/common';

export class UploadException extends InternalServerErrorException {
  constructor() {
    super(`Failed to upload file. Please try again later.`);
  }
}
