// src/logger.ts
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
const logDir = path.resolve(__dirname, '..', 'logs');
export let logger: winston.Logger;

try {
    const transport = new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
      zippedArchive: false,
    });
  
    logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(
          ({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`
        )
      ),
      transports: [transport],
    });
  
    logger.info('Winston logger initialized successfully');
  
  } catch (err) {
    console.error('Error setting up logger:', err);
  }
    