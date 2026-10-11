import { Router } from 'express';
import { CommentController } from '../controllers/commentController.js';
import { requireUser } from '../middleware/authMiddleware.js';
import { rateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { commentCreateSchema } from '../validation/schemas.js';

const router = Router();

// Public list of comments for a manga
router.get('/:mangaId', CommentController.getComments);

// Post a comment (authenticated)
router.post('/', requireUser, rateLimiter('comment', 20, 600000), validateBody(commentCreateSchema), CommentController.postComment);

// Report an offensive comment
router.post('/:commentId/report', rateLimiter('report', 30, 600000), CommentController.reportComment);

export default router;
