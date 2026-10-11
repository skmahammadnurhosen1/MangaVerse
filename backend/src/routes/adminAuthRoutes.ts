import { Router } from 'express';
import { AdminAuthController } from '../controllers/adminAuthController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';
import { checkLoginRateLimit, rateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { loginSchema, changePasswordSchema } from '../validation/schemas.js';

const router = Router();

// Admin login (with 5-failure/10-min block)
router.post('/login', checkLoginRateLimit, validateBody(loginSchema), AdminAuthController.login);

// Admin logout
router.post('/logout', AdminAuthController.logout);

// Current admin profile
router.get('/me', requireAdmin, AdminAuthController.getMe);

// Admin change password
router.post(
  '/change-password',
  requireAdmin,
  rateLimiter('admin_pwd_change', 5, 3600000),
  validateBody(changePasswordSchema),
  AdminAuthController.changePassword
);

// Admin CSRF token retrieval
router.get('/csrf-token', AdminAuthController.getCsrfToken);

export default router;
