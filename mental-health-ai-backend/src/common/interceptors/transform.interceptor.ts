import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE } from '../decorators/response-message.decorator';

export interface ResponseFormat<T> {
  statusCode: number;
  EC: number;
  EM: string;
  message?: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ResponseFormat<T>
> {
  constructor(private reflector?: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseFormat<T>> {
    return next.handle().pipe(
      map((responseData: unknown) => {
        const response = context
          .switchToHttp()
          .getResponse<{ statusCode: number }>();
        const statusCode = response.statusCode;

        const customMessage = this.reflector?.get<string>(
          RESPONSE_MESSAGE,
          context.getHandler(),
        );

        const isEnvelope = (
          value: unknown,
        ): value is { EC: number; EM: string; data?: T } & Record<
          string,
          unknown
        > => {
          return (
            !!value &&
            typeof value === 'object' &&
            'EC' in value &&
            'EM' in value &&
            typeof (value as { EC?: unknown }).EC === 'number' &&
            typeof (value as { EM?: unknown }).EM === 'string'
          );
        };

        if (isEnvelope(responseData)) {
          const { EC, EM, data, ...restData } = responseData;

          const responsePayload = (
            data !== undefined ? data : (restData as unknown)
          ) as T;

          return {
            statusCode,
            EC,
            EM,
            message: customMessage || EM,
            data: responsePayload,
          };
        }

        return {
          statusCode,
          EC: 1,
          EM: customMessage || 'Success',
          message: customMessage || 'Success',
          data: responseData as T,
        };
      }),
    );
  }
}
