import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireUser } from '../middleware/authMiddleware.js';
import { checkLoginRateLimit, rateLimiter } from '../middleware/rateLimitMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../validation/schemas.js';

const router = Router();

// Public registration (rate-limited: max 10 attempts per hour per IP)
router.post('/register', rateLimiter('register', 10, 3600000), validateBody(registerSchema), AuthController.register);

// User login (with 5-failure/10-min block)
router.post('/login', checkLoginRateLimit, validateBody(loginSchema), AuthController.login);

// Logout
router.post('/logout', AuthController.logout);

// Current user profile
router.get('/me', AuthController.getMe);

// Authenticated password change
router.post(
  '/change-password',
  requireUser,
  rateLimiter('pwd_change', 5, 3600000),
  validateBody(changePasswordSchema),
  AuthController.changePassword
);

// CSRF Token retrieval
router.get('/csrf-token', AuthController.getCsrfToken);

export default router;
