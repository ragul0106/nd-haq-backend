import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, body, headers } = req;
    console.log(`[${new Date().toISOString()}] ${method} ${originalUrl}`);
    console.log('Headers:', headers);
    console.log('Query:', req.query);
    //log current time
    console.log('Current Time:', new Date().toISOString());
    console.log('Body:', body);

    next();
  }
}
