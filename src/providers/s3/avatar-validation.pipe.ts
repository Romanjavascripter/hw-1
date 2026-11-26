import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class AvatarValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const isJpeg =
      file.buffer[0] === 0xff &&
      file.buffer[1] === 0xd8 &&
      file.buffer[2] === 0xff;
    const isPng =
      file.buffer[0] === 0x89 &&
      file.buffer[1] === 0x50 &&
      file.buffer[2] === 0x4e &&
      file.buffer[3] === 0x47;

    if (!isJpeg && !isPng) {
      throw new BadRequestException('Invalid file content');
    }

    let realMimeType = '';
    if (isJpeg) {
      realMimeType = 'image/jpeg';
    } else if (isPng) {
      realMimeType = 'image/png';
    }

    return { ...file, mimetype: realMimeType };
  }
}
