import dotenv from 'dotenv';
import path from 'path';

// Load .env if present
dotenv.config();

export interface AppEnv {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGODB_URI: string;
  FRONTEND_ORIGINS: string[];
  USER_SESSION_SECRET: string;
  ADMIN_SESSION_SECRET: string;
  GRIDFS_BUCKET_NAME: string;
  TRUST_PROXY: boolean;
  USER_SESSION_MAX_AGE_MS: number;
  ADMIN_SESSION_MAX_AGE_MS: number;
  MAX_UPLOAD_FILE_SIZE_MB: number;
  MAX_CHAPTER_PAGES: number;
}

function parseEnv(): AppEnv {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  const isProd = nodeEnv === 'production';

  const port = parseInt(process.env.PORT || '5000', 10);
  const mongoUri = process.env.MONGODB_URI || '';

  const rawOrigins = process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173';
  const frontendOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

  const userSecret = process.env.USER_SESSION_SECRET || (isProd ? '' : 'dev_user_session_secret_at_least_32_chars_long_12345');
  const adminSecret = process.env.ADMIN_SESSION_SECRET || (isProd ? '' : 'dev_admin_session_secret_at_least_32_chars_long_12345');

  // Enforce production security check
  if (isProd) {
    const missing: string[] = [];
    if (!process.env.MONGODB_URI) missing.push('MONGODB_URI');
    if (!process.env.USER_SESSION_SECRET || process.env.USER_SESSION_SECRET.length < 32) {
      missing.push('USER_SESSION_SECRET (must be >= 32 characters)');
    }
    if (!process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET.length < 32) {
      missing.push('ADMIN_SESSION_SECRET (must be >= 32 characters)');
    }
    if (!process.env.FRONTEND_ORIGINS) missing.push('FRONTEND_ORIGINS');

    if (missing.length > 0) {
      throw new Error(`Production Configuration Error: Missing or invalid required environment variables: ${missing.join(', ')}`);
    }
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: isNaN(port) ? 5000 : port,
    MONGODB_URI: mongoUri,
    FRONTEND_ORIGINS: frontendOrigins,
    USER_SESSION_SECRET: userSecret,
    ADMIN_SESSION_SECRET: adminSecret,
    GRIDFS_BUCKET_NAME: process.env.GRIDFS_BUCKET_NAME || 'mangaFiles',
    TRUST_PROXY: process.env.TRUST_PROXY === 'true',
    USER_SESSION_MAX_AGE_MS: parseInt(process.env.USER_SESSION_MAX_AGE_MS || '604800000', 10), // 7 days
    ADMIN_SESSION_MAX_AGE_MS: parseInt(process.env.ADMIN_SESSION_MAX_AGE_MS || '86400000', 10), // 24 hours
    MAX_UPLOAD_FILE_SIZE_MB: parseInt(process.env.MAX_UPLOAD_FILE_SIZE_MB || '25', 10),
    MAX_CHAPTER_PAGES: parseInt(process.env.MAX_CHAPTER_PAGES || '150', 10),
  };
}

export const env = parseEnv();
