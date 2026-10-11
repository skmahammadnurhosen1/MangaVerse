import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

async function bootstrap() {
  try {
    console.log(`[MangaVerse] Starting backend server in '${env.NODE_ENV}' mode...`);

    // Connect to MongoDB Atlas
    if (env.MONGODB_URI) {
      await connectDB();
    } else {
      console.warn('[MangaVerse] Warning: MONGODB_URI not set. Running without active database connection.');
    }

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`[MangaVerse] Server listening on port ${env.PORT}`);
      console.log(`[MangaVerse] Allowed frontend origins: ${env.FRONTEND_ORIGINS.join(', ')}`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      console.log(`[MangaVerse] Received ${signal}. Closing server gracefully...`);
      server.close(async () => {
        console.log('[MangaVerse] HTTP server closed.');
        try {
          await disconnectDB();
          console.log('[MangaVerse] Database connection terminated.');
          process.exit(0);
        } catch (err) {
          console.error('[MangaVerse] Error during database shutdown:', err);
          process.exit(1);
        }
      });

      // Force exit after 10s if graceful shutdown hangs
      setTimeout(() => {
        console.error('[MangaVerse] Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('[MangaVerse] Fatal startup failure:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

bootstrap();
