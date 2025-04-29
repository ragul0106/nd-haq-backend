import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './utils/interceptor/error.interceptor';
import { ResponseInterceptor } from './utils/interceptor/response.interceptor';

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
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
