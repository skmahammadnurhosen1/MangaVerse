import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  // Redact all sensitive fields before logging
  const isProd = env.NODE_ENV === 'production';
  const statusCode = err.status || err.statusCode || 500;

  // Log error safely without dumping session secrets or user credentials
  console.error(`[Error] ${statusCode} - ${err.message || 'Internal Server Error'}`);

  if (!isProd && err.stack) {
    console.error(err.stack);
  }

  // Handle MongoDB duplicate key error safely
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    res.status(409).json({
      error: `A record with this ${field} already exists.`,
    });
    return;
  }

  // Handle Mongoose cast error
  if (err.name === 'CastError') {
    res.status(400).json({
      error: `Invalid identifier format for field '${err.path}'`,
    });
    return;
  }

  // Generic sanitized message in production
  const responseMessage =
    statusCode >= 500 && isProd
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: responseMessage,
    ...(isProd ? {} : { stack: err.stack }),
  });
}
