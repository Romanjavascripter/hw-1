import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  PayloadTooLargeException,
} from '@nestjs/common';
import { MulterError } from 'multer';
import { Response } from 'express';

@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    if (exception.code === 'LIMIT_FILE_SIZE') {
      const errorResponse = new PayloadTooLargeException(
        'Файл слишком большой. Максимальный размер — 10 МБ.',
      );
      response
        .status(HttpStatus.PAYLOAD_TOO_LARGE)
        .json(errorResponse.getResponse());
    } else {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Ошибка загрузки: ${exception.message}`,
      });
    }
  }
}
