import { InternalServerErrorException } from '@nestjs/common';

export class RemoveException extends InternalServerErrorException {
  constructor(message: string) {
    super(`Failed to remove file from S3: ${message}`);
  }
}
