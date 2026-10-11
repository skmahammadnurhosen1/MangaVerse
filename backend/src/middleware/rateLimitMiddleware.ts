import { Request, Response, NextFunction } from 'express';
import { RateLimitService } from '../services/rateLimitService.js';
import { env } from '../config/env.js';

export function getClientIp(req: Request): string {
  if (env.TRUST_PROXY) {
    return req.ip || req.socket.remoteAddress || '127.0.0.1';
  }
  // In untrusted proxy mode, never blindly trust X-Forwarded-For
  return req.socket.remoteAddress || '127.0.0.1';
}

/**
 * Middleware executed before login endpoints to verify that the requesting IP
 * or account has not exceeded failed attempts.
 */
export async function checkLoginRateLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  const ip = getClientIp(req);
  const isAdmin = req.originalUrl?.includes('/admin') || req.baseUrl?.includes('/admin') || req.path?.includes('/admin');

  const ipKeysToCheck = isAdmin
    ? [`admin_login:ip:${ip}`, `login:ip:${ip}`]
    : [`login:ip:${ip}`];

  for (const ipKey of ipKeysToCheck) {
    const ipCheck = await RateLimitService.isKeyBlocked(ipKey);
    if (ipCheck.isBlocked) {
      res.setHeader('Retry-After', ipCheck.retryAfterSeconds.toString());
      res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: ipCheck.retryAfterSeconds,
      });
      return;
    }
  }

  // If email is provided in body, check account throttle
  if (req.body && typeof req.body.email === 'string') {
    const emailNorm = req.body.email.trim().toLowerCase();
    const accKeysToCheck = isAdmin
      ? [`admin_login:acc:${emailNorm}`, `login:acc:${emailNorm}`]
      : [`login:acc:${emailNorm}`];

    for (const accKey of accKeysToCheck) {
      const accCheck = await RateLimitService.isKeyBlocked(accKey);
      if (accCheck.isBlocked) {
        res.setHeader('Retry-After', accCheck.retryAfterSeconds.toString());
        res.status(429).json({
          error: 'Too many requests. Please try again later.',
          retryAfter: accCheck.retryAfterSeconds,
        });
        return;
      }
    }
  }

  next();
}

/**
 * Generic endpoint rate limiter factory.
 */
export function rateLimiter(prefix: string, maxRequests: number, windowMs: number) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = getClientIp(req);
    const key = `${prefix}:${ip}`;

    const result = await RateLimitService.checkGeneralLimit(key, maxRequests, windowMs);
    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfterSeconds.toString());
      res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: result.retryAfterSeconds,
      });
      return;
    }

    next();
  };
}
