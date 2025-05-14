import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './utils/interceptor/error.interceptor';
import { ResponseInterceptor } from './utils/interceptor/response.interceptor';
import { join } from 'path';
import { LoggerMiddleware } from './logger.middleware';
import * as express from 'express';
import * as dotenv from 'dotenv';
dotenv.config();

console.log('API_ENDPOINT_AGENT from .env:', process.env.API_ENDPOINT_AGENT);
async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    cors: {
      origin: '*', // or ['http://localhost:3000', 'https://yourdomain.com']
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
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
