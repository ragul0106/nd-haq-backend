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
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: 'https://your-frontend-domain.com', // Allow only specific origin in production
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Authorization',
      credentials: true,
      preflightContinue: false,    // NestJS will handle OPTIONS
      optionsSuccessStatus: 204,   // Successful preflight request status
      maxAge: 86400,               // Cache preflight request for 24 hours
    },
  });

  // Response handler
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Error handler
  app.useGlobalFilters(new GlobalExceptionFilter());
  // Serve static images
  app.use('/images', express.static(join(__dirname, '..', 'public', 'images')));
  // Log requests
  app.use(new LoggerMiddleware().use);
  console.log(`API is running on ${process.env.API_ENDPOINT_AGENT}, Port: ${process.env.PORT}`);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
