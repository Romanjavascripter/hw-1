import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { MulterError } from 'multer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let details: any = null;

    if (exception instanceof HttpException) {
      // Ошибки NestJS (включая ошибки валидации 400 и 404)
      status = exception.getStatus();
      const response = exception.getResponse();

      // Если это ошибка валидации (class-validator), сохраняем массив ошибок
      if (typeof response === 'object' && response !== null) {
        message = (response as any).message || exception.message;
        details = (response as any).error;
      } else {
        message = response as string;
      }
    } else if (exception instanceof MulterError) {
      status =
        exception.code === 'LIMIT_FILE_SIZE'
          ? HttpStatus.PAYLOAD_TOO_LARGE
          : HttpStatus.BAD_REQUEST;
      message =
        exception.code === 'LIMIT_FILE_SIZE'
          ? 'File too large (max 10MB)'
          : exception.message;
    } else if (exception instanceof Error) {
      message = 'Internal server error';
      details = exception.message;
    }

    const request = ctx.getRequest();
    const response = ctx.getResponse();

    if (status >= 500) {
      this.logger.error(
        {
          path: request.url,
          method: request.method,
          status,
          error: exception instanceof Error ? exception.message : exception,
          stack: exception instanceof Error ? exception.stack : undefined,
        },
        'Unhandled exception occurred',
      );
    } else {
      this.logger.warn(
        { path: request.url, method: request.method, status, message },
        'Client error',
      );
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
      ...(details && status >= 500 ? {} : { details }),
    };

    httpAdapter.reply(response, errorResponse, status);
  }
}
