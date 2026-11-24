import { UnsupportedMediaTypeException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import { memoryStorage } from 'multer';

export const avatarMulterOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      return callback(
        new UnsupportedMediaTypeException('Only JPEG and PNG are allowed'),
        false,
      );
    }
    callback(null, true);
  },
};
