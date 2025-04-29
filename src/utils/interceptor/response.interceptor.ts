// src/common/interceptors/response.interceptor.ts

import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
  } from '@nestjs/common';
  import { Observable, map } from 'rxjs';
  
  @Injectable()
  export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
        map((data) => {
          const ctx = context.switchToHttp();
          const response = ctx.getResponse();
          const request = ctx.getRequest();
  
          const message = request?.message || 'Request successful';
          const now = Math.floor(Date.now() / 1000);
  
          return {
            version: '1.0.0',
            ts: now,
            result: {
              data,
            },
            message,
            status: 'success',
            responseCode: response.statusCode || 200,
          };
        }),
      );
    }
  }
  