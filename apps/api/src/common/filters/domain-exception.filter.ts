import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { DomainError, httpStatusFor } from '@jardimja/shared';
import type { Response } from 'express';

/**
 * Maps our typed `DomainError`s (and Nest `HttpException`s) onto a stable error
 * envelope: `{ code, message, details }`. Codes come from the shared taxonomy so
 * clients can branch on them.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof DomainError) {
      res.status(httpStatusFor[exception.code]).json({
        code: exception.code,
        message: exception.message,
        details: exception.details,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      res.status(status).json({
        code: mapHttpStatus(status),
        message: typeof body === 'string' ? body : (body as { message?: unknown }).message,
        details: typeof body === 'object' ? body : undefined,
      });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    res.status(500).json({ code: 'INTERNAL', message: 'Erro interno inesperado.' });
  }
}

function mapHttpStatus(status: number): string {
  switch (status) {
    case 400:
      return 'VALIDATION';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'FORBIDDEN';
    case 404:
      return 'NOT_FOUND';
    case 409:
      return 'CONFLICT';
    case 429:
      return 'RATE_LIMITED';
    default:
      return 'INTERNAL';
  }
}
