import { Router } from 'express';
import { LibraryController } from '../controllers/libraryController.js';
import { requireUser } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { bookmarkSchema } from '../validation/schemas.js';

const router = Router();

// Protected user library endpoints
router.use(requireUser);

router.get('/bookmarks', LibraryController.getBookmarks);
router.post('/bookmarks', validateBody(bookmarkSchema), LibraryController.setBookmark);
router.delete('/bookmarks/:mangaId', LibraryController.removeBookmark);
router.get('/history', LibraryController.getReadingHistory);

export default router;
