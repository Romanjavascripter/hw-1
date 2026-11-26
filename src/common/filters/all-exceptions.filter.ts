import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';
import { MulterError } from 'multer';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';

interface ErrorResponseBody {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    @InjectPinoLogger(AllExceptionsFilter.name)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let details: unknown = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const errorRes = res as ErrorResponseBody;
        message = errorRes.message || exception.message;
        details = errorRes.error;
      }
    } else if (exception instanceof MulterError) {
      status =
        exception.code === 'LIMIT_FILE_SIZE'
          ? HttpStatus.PAYLOAD_TOO_LARGE
          : HttpStatus.BAD_REQUEST;

      const maxBytes = this.configService.get<number>(
        'AVATAR_MAX_BYTES',
        10485760,
      );
      const maxMB = Math.round(maxBytes / 1024 / 1024);

      message =
        exception.code === 'LIMIT_FILE_SIZE'
          ? `File too large (max ${maxMB}MB)`
          : exception.message;
    } else if (exception instanceof Error) {
      details = exception.message;
    }

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
      ...(details && status < 500 ? { details } : {}),
    };

    httpAdapter.reply(response, errorResponse, status);
  }
}
