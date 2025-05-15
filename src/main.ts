import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './utils/interceptor/error.interceptor';
import { ResponseInterceptor } from './utils/interceptor/response.interceptor';
import { join } from 'path';
import { LoggerMiddleware } from './logger.middleware';
import * as express from 'express';

import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    cors: {
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    },
  });

  //response handler
  app.useGlobalInterceptors(new ResponseInterceptor());

  //error handler
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.use('/images', express.static(join(__dirname, '..', 'public', 'images')));
  app.use(new LoggerMiddleware().use);
  console.log(process.env.API_ENDPOINT_AGENT,"process.env.PORT");
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
