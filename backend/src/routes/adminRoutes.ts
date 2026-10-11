import { Router } from 'express';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { AdminStatsController } from '../controllers/adminStatsController.js';
import { AdminMangaController } from '../controllers/adminMangaController.js';
import { AdminChapterController } from '../controllers/adminChapterController.js';
import { AdminGenreController } from '../controllers/adminGenreController.js';
import { AdminUserController } from '../controllers/adminUserController.js';
import { AdminCommentController } from '../controllers/adminCommentController.js';
import { AdminSettingsController } from '../controllers/adminSettingsController.js';
import { uploadSingleImage, uploadMultipleChapterPages, verifyUploadedFilesContent } from '../middleware/uploadMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import {
  mangaCreateSchema,
  mangaUpdateSchema,
  chapterCreateSchema,
  chapterUpdateSchema,
  genreSchema,
  siteSettingsSchema,
} from '../validation/schemas.js';

const router = Router();

// Protect ALL routes below with strict admin authorization
router.use(requireAdmin);

// Dashboard Statistics
router.get('/stats', AdminStatsController.getOverviewStats);

// Manga Management
router.get('/manga', AdminMangaController.listManga);
router.get('/manga/:id', AdminMangaController.getManga);
router.post('/manga', validateBody(mangaCreateSchema), AdminMangaController.createManga);
router.put('/manga/:id', validateBody(mangaUpdateSchema), AdminMangaController.updateManga);
router.delete('/manga/:id', AdminMangaController.deleteManga);
router.post('/manga/:id/cover', uploadSingleImage, verifyUploadedFilesContent, AdminMangaController.uploadCover);
router.patch('/manga/:id/publish', AdminMangaController.togglePublish);

// Chapter Management
router.get('/manga/:mangaId/chapters', AdminChapterController.listChapters);
router.post('/chapters', validateBody(chapterCreateSchema), AdminChapterController.createChapter);
router.put('/chapters/:chapterId', validateBody(chapterUpdateSchema), AdminChapterController.updateChapter);
router.delete('/chapters/:chapterId', AdminChapterController.deleteChapter);
router.post('/chapters/:chapterId/pages', uploadMultipleChapterPages, verifyUploadedFilesContent, AdminChapterController.uploadPages);
router.post('/chapters/:chapterId/generate-pdf', AdminChapterController.generatePdf);

// Genre Management
router.get('/genres', AdminGenreController.listGenres);
router.post('/genres', validateBody(genreSchema), AdminGenreController.createGenre);
router.put('/genres/:id', validateBody(genreSchema), AdminGenreController.updateGenre);
router.delete('/genres/:id', AdminGenreController.deleteGenre);

// User Moderation
router.get('/users', AdminUserController.listUsers);
router.patch('/users/:userId/status', AdminUserController.updateUserStatus);

// Comment Moderation
router.get('/comments', AdminCommentController.listComments);
router.patch('/comments/:id/status', AdminCommentController.updateCommentStatus);
router.delete('/comments/:id', AdminCommentController.deleteComment);

// Website Settings
router.get('/settings', AdminSettingsController.getSettings);
router.put('/settings', validateBody(siteSettingsSchema), AdminSettingsController.updateSettings);

export default router;
