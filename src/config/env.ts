import * as dotenv from 'dotenv';

// Load .env once when this file is imported
dotenv.config();

export const env = process.env;
