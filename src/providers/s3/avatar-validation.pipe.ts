import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class AvatarValidationPipe implements PipeTransform {
  transform(file: Express.Multer.File) {
    // 1. Проверяем оба формата отдельно
    const isJpeg =
      file.buffer[0] === 0xff &&
      file.buffer[1] === 0xd8 &&
      file.buffer[2] === 0xff;
    const isPng =
      file.buffer[0] === 0x89 &&
      file.buffer[1] === 0x50 &&
      file.buffer[2] === 0x4e &&
      file.buffer[3] === 0x47;

    // 2. Если это НЕ JPEG и НЕ PNG — отсекаем
    if (!isJpeg && !isPng) {
      throw new BadRequestException('Invalid file content');
    }

    // 3. Присваиваем ПРАВИЛЬНЫЙ тип в зависимости от того, что нашли
    let realMimeType = '';
    if (isJpeg) {
      realMimeType = 'image/jpeg'; // <--- Теперь JPEG это JPEG
    } else if (isPng) {
      realMimeType = 'image/png'; // <--- А PNG это PNG
    }

    return { ...file, mimetype: realMimeType };
  }
}
