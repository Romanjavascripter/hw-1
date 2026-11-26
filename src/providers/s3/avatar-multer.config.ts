import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import { memoryStorage } from 'multer';
import { UnsupportedMediaTypeException } from '@nestjs/common';

export const getAvatarMulterOptions = (maxBytes: number): MulterOptions => ({
  storage: memoryStorage(),
  limits: {
    fileSize: maxBytes,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      return cb(
        new UnsupportedMediaTypeException('Only JPEG and PNG are allowed'),
        false,
      );
    }
    cb(null, true);
  },
});
