import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';

// Extend express-session declaration
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    adminId?: string;
    role?: string;
    csrfToken?: string;
  }
}

export const CSRF_COOKIE_NAME = env.NODE_ENV === 'production' ? '__Host-mv_csrf' : 'mv_csrf';

/**
 * Extracts origin safely from request headers without throwing on invalid URLs.
 */
export function getOriginFromHeaders(req: Request): string | undefined {
  if (req.headers.origin) {
    try {
      return new URL(req.headers.origin).origin;
    } catch {
      return typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
    }
  }
  if (req.headers.referer) {
    try {
      return new URL(req.headers.referer).origin;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

/**
 * Generates or retrieves existing CSRF token for the current session or cookie context.
 */
export function getOrCreateCsrfToken(req: Request, res?: Response): string {
  let token = req.session?.csrfToken;

  if (!token) {
    const cookieToken = req.cookies?.[CSRF_COOKIE_NAME] || req.cookies?.['mv_csrf'] || req.cookies?.['__Host-mv_csrf'];
    if (cookieToken && typeof cookieToken === 'string' && /^[0-9a-fA-F]{64}$/.test(cookieToken)) {
      token = cookieToken;
    }
  }

  if (!token) {
    token = crypto.randomBytes(32).toString('hex');
  }

  if (req.session) {
    req.session.csrfToken = token;
  }

  if (res && !res.headersSent) {
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  return token;
}

/**
 * CSRF Protection Middleware for state-changing HTTP methods.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Safe HTTP methods pass through
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // 1. Origin / Referer check in production
  const origin = getOriginFromHeaders(req);
  if (origin && !env.FRONTEND_ORIGINS.includes(origin)) {
    res.status(403).json({ error: 'CSRF check failed: Untrusted Origin' });
    return;
  }

  // In test environment, allow test bypass if specified
  if (env.NODE_ENV === 'test' && req.headers['x-test-bypass-csrf'] === 'true') {
    return next();
  }

  // 2. Token verification
  const clientToken = (req.headers['x-csrf-token'] as string) || req.body?._csrf;
  if (!clientToken || typeof clientToken !== 'string') {
    res.status(403).json({ error: 'CSRF token missing or session expired' });
    return;
  }

  const validTokens: string[] = [];
  if (req.session?.csrfToken) {
    validTokens.push(req.session.csrfToken);
  }
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME] || req.cookies?.['mv_csrf'] || req.cookies?.['__Host-mv_csrf'];
  if (cookieToken && typeof cookieToken === 'string') {
    validTokens.push(cookieToken);
  }

  if (validTokens.length === 0) {
    res.status(403).json({ error: 'CSRF token missing or session expired' });
    return;
  }

  const clientBuffer = Buffer.from(clientToken);
  let isValid = false;

  for (const expected of validTokens) {
    const expectedBuffer = Buffer.from(expected);
    if (clientBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(clientBuffer, expectedBuffer)) {
      isValid = true;
      break;
    }
  }

  if (!isValid) {
    res.status(403).json({ error: 'Invalid CSRF token' });
    return;
  }

  next();
}
