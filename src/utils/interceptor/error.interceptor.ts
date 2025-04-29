// src/common/filters/http-exception.filter.ts

import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
import { log } from 'console';
  
  @Catch()
  export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();      
      const status =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
  
      const message =
        exception instanceof HttpException
          ? exception.message
          : 'Internal server error';
  
      const now = Math.floor(Date.now() / 1000);
  
      const errorResponse = {
        version: '1.0.0',
        ts: now,
        result: {},
        message,
        status: 'error',
        responseCode: status,
      };
  
      response.status(status).json(errorResponse);
    }
  }
  