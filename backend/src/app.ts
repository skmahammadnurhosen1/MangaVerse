import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { isDbConnected } from './config/db.js';
import { createUserSessionMiddleware, createAdminSessionMiddleware } from './config/session.js';
import { csrfProtection, getOrCreateCsrfToken } from './middleware/csrfMiddleware.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import mangaRoutes from './routes/mangaRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import fileRoutes from './routes/fileRoutes.js';

export function createApp(): Express {
  const app = express();

  // Reverse proxy configuration
  if (env.TRUST_PROXY) {
    app.set('trust proxy', 1);
  }

  // Security Headers via Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: ["'self'", ...env.FRONTEND_ORIGINS],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // Strict CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps or curl) in development/test
        if (!origin) {
          if (env.NODE_ENV !== 'production') return callback(null, true);
          return callback(null, true);
        }
        if (env.FRONTEND_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin '${origin}' not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Accept'],
      exposedHeaders: ['Retry-After'],
      maxAge: 86400,
    })
  );

  // Request body parsing with strict size limits
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  // Mount isolated Admin session on /api/admin
  const adminSession = createAdminSessionMiddleware();
  app.use('/api/admin', adminSession);

  // Mount User session on all other /api routes
  const userSession = createUserSessionMiddleware();
  app.use('/api', (req, res, next) => {
    if (req.path.startsWith('/admin')) {
      return next();
    }
    return userSession(req, res, next);
  });

  // CSRF Protection for state-changing requests
  app.use('/api', csrfProtection);

  // Global CSRF Token endpoint
  app.get('/api/csrf-token', (req, res) => {
    const csrfToken = getOrCreateCsrfToken(req, res);
    res.json({ csrfToken });
  });

  // Public Health Checks (without leaking internal details)
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'MangaVerse Backend',
    });
  });

  app.get('/api/health/ready', (_req, res) => {
    const dbStatus = isDbConnected();
    if (!dbStatus) {
      res.status(503).json({
        status: 'unready',
        database: 'disconnected',
      });
      return;
    }
    res.json({
      status: 'ready',
      database: 'connected',
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin/auth', adminAuthRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/manga', mangaRoutes);
  app.use('/api/library', libraryRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/files', fileRoutes);

  // 404 handler for unmatched routes
  app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}
