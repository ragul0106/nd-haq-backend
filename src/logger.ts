// src/logger.ts
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';

const logDir = 'logs';

const transport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '20m',
  maxFiles: '30d', // Keep logs for 30 days
});

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`,
    ),
  ),
  transports: [transport],
});
