import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let EC = 0;
    let EM = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        EM = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as {
          EC?: number;
          EM?: string;
          message?: string | string[];
        };

        if (
          typeof responseObj.EC === 'number' &&
          typeof responseObj.EM === 'string'
        ) {
          EC = responseObj.EC;
          EM = responseObj.EM;
        } else if (Array.isArray(responseObj.message)) {
          EM = responseObj.message.join(', ');
        } else if (typeof responseObj.message === 'string') {
          EM = responseObj.message;
        }
      }
    } else if (exception instanceof Error) {
      EM = exception.message;
    }

    console.error(`${request.method} ${request.url} - ${status} - ${EM}`);

    response.status(status).json({
      statusCode: status,
      EC,
      EM,
      data: null,
    });
  }
}
