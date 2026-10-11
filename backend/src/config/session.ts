import session from 'express-session';
import MongoStore from 'connect-mongo';
import { env } from './env.js';

const isProd = env.NODE_ENV === 'production';

// Cookie names with __Host- prefix in production
export const USER_COOKIE_NAME = isProd ? '__Host-mv_user' : 'mv_user';
export const ADMIN_COOKIE_NAME = isProd ? '__Host-mv_admin' : 'mv_admin';

export function createUserSessionMiddleware() {
  const useMongoStore = Boolean(env.MONGODB_URI && env.NODE_ENV !== 'test');
  const store = useMongoStore
    ? MongoStore.create({
        mongoUrl: env.MONGODB_URI,
        collectionName: 'sessions_user',
        ttl: Math.floor(env.USER_SESSION_MAX_AGE_MS / 1000),
        autoRemove: 'native',
        crypto: {
          secret: env.USER_SESSION_SECRET,
        },
      })
    : undefined;

  return session({
    name: USER_COOKIE_NAME,
    secret: env.USER_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    rolling: true, // Reset expiration on activity
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'lax' : 'lax',
      path: '/',
      maxAge: env.USER_SESSION_MAX_AGE_MS,
    },
  });
}

export function createAdminSessionMiddleware() {
  const useMongoStore = Boolean(env.MONGODB_URI && env.NODE_ENV !== 'test');
  const store = useMongoStore
    ? MongoStore.create({
        mongoUrl: env.MONGODB_URI,
        collectionName: 'sessions_admin',
        ttl: Math.floor(env.ADMIN_SESSION_MAX_AGE_MS / 1000),
        autoRemove: 'native',
        crypto: {
          secret: env.ADMIN_SESSION_SECRET,
        },
      })
    : undefined;

  return session({
    name: ADMIN_COOKIE_NAME,
    secret: env.ADMIN_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'lax' : 'lax',
      path: '/',
      maxAge: env.ADMIN_SESSION_MAX_AGE_MS, // Stricter session lifetime
    },
  });
}
