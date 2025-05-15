// src/config/env.ts
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'), // Adjust path to point to actual .env file
});

export const env = process.env;
