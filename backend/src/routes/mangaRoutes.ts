import { Router } from 'express';
import { MangaController } from '../controllers/mangaController.js';
import { ChapterController } from '../controllers/chapterController.js';
import { DownloadController } from '../controllers/downloadController.js';
import { requireUser, optionalUser } from '../middleware/authMiddleware.js';
import { rateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { readingProgressSchema } from '../validation/schemas.js';

const router = Router();

// Catalog list
router.get('/', MangaController.getMangaList);

// Home sections (featured, trending, updates, genres)
router.get('/home', MangaController.getFeaturedAndTrending);

// Debounced live search
router.get('/search', rateLimiter('search', 120, 60000), MangaController.search);

// Genres list
router.get('/genres', MangaController.getGenres);

// Save reading progress
router.post('/progress', requireUser, validateBody(readingProgressSchema), ChapterController.saveReadingProgress);

// Manga details by slug
router.get('/:slug', optionalUser, MangaController.getMangaBySlug);

// Chapter reader details
router.get('/:mangaSlug/chapters/:chapterNumber', optionalUser, ChapterController.getChapterDetail);

// Chapter PDF download stream (rate-limited)
router.get('/:mangaSlug/chapters/:chapterNumber/download', rateLimiter('download', 30, 600000), DownloadController.downloadChapterPdf);

export default router;
