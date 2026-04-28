import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

function normalizeMessage(payload: unknown): string | string[] {
  if (typeof payload === 'string') return payload;
  if (Array.isArray(payload)) return payload.map((item) => (typeof item === 'string' ? item : 'Ошибка запроса'));
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (Array.isArray(record.message)) {
      return record.message.map((item) => (typeof item === 'string' ? item : 'Ошибка запроса'));
    }
    if (typeof record.error === 'string') return record.error;
  }
  return 'Ошибка запроса';
}

function normalizeCode(status: number, message: string | string[]) {
  const source = Array.isArray(message) ? message.join(' ') : message;
  const base = source
    .toUpperCase()
    .replace(/[^A-ZА-Я0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);

  if (base) return base;

  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return 'BAD_REQUEST';
    case HttpStatus.UNAUTHORIZED:
      return 'UNAUTHORIZED';
    case HttpStatus.FORBIDDEN:
      return 'FORBIDDEN';
    case HttpStatus.NOT_FOUND:
      return 'NOT_FOUND';
    default:
      return 'INTERNAL_SERVER_ERROR';
  }
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let rawPayload: unknown = 'Внутренняя ошибка сервера';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      rawPayload = exception.getResponse();
    } else if (exception instanceof Error) {
      rawPayload = exception.message || rawPayload;
    }

    const message = normalizeMessage(rawPayload);

    response.status(status).json({
      statusCode: status,
      code: normalizeCode(status, message),
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
