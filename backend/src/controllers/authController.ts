import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { hashPassword, verifyPassword, dummyVerify } from '../services/argonService.js';
import { RateLimitService } from '../services/rateLimitService.js';
import { getClientIp } from '../middleware/rateLimitMiddleware.js';
import { USER_COOKIE_NAME } from '../config/session.js';
import { getOrCreateCsrfToken } from '../middleware/csrfMiddleware.js';

export class AuthController {
  /**
   * Public user registration. Always assigns role: 'user'.
   */
  static async register(req: Request, res: Response): Promise<void> {
    const { username, email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    // Check if email or username already taken
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        res.status(409).json({ error: 'An account with this email address already exists.' });
        return;
      }
      res.status(409).json({ error: 'This username is already taken. Please choose another.' });
      return;
    }

    // Hash password with Argon2id
    const passwordHash = await hashPassword(password);

    // Create user with explicit normal user role
    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      status: 'active',
    });

    await newUser.save();

    // Automatically sign in upon registration
    req.session.regenerate((err) => {
      if (err) {
        res.status(500).json({ error: 'Session creation failed' });
        return;
      }
      req.session.userId = newUser._id.toString();
      req.session.role = 'user';
      const csrfToken = getOrCreateCsrfToken(req, res);

      res.status(201).json({
        message: 'Account created successfully',
        csrfToken,
        user: {
          id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        },
      });
    });
  }

  /**
   * User login with rolling rate limit throttling and dummy hash timing mitigation.
   */
  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const ip = getClientIp(req);
    const ipKey = `login:ip:${ip}`;
    const accountKey = `login:acc:${normalizedEmail}`;

    // Look up user including passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    if (!user) {
      // Execute dummy verify to avoid timing differences
      await dummyVerify(password);
      await RateLimitService.recordFailedLogin(ipKey);
      await RateLimitService.recordFailedLogin(accountKey);

      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (user.status !== 'active') {
      await dummyVerify(password);
      res.status(403).json({ error: 'This account has been suspended. Please contact support.' });
      return;
    }

    // Verify Argon2id password hash
    const isValid = await verifyPassword(user.passwordHash, password);
    if (!isValid) {
      await RateLimitService.recordFailedLogin(ipKey);
      await RateLimitService.recordFailedLogin(accountKey);

      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Clear failed login attempts upon success
    await RateLimitService.clearFailedLogins(ipKey);
    await RateLimitService.clearFailedLogins(accountKey);

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        res.status(500).json({ error: 'Session initialization error' });
        return;
      }

      req.session.userId = user._id.toString();
      req.session.role = user.role;
      const csrfToken = getOrCreateCsrfToken(req, res);

      res.json({
        message: 'Logged in successfully',
        csrfToken,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    });
  }

  /**
   * User logout and session destruction.
   */
  static async logout(req: Request, res: Response): Promise<void> {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'Logout failed' });
        return;
      }
      res.clearCookie(USER_COOKIE_NAME);
      res.json({ message: 'Logged out successfully' });
    });
  }

  /**
   * Retrieves current authenticated user.
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    if (!req.session?.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.session.userId);
    if (!user || user.status !== 'active') {
      res.status(401).json({ error: 'Session invalid or account suspended' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  }

  /**
   * Authenticated password change with current password verification.
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    const userId = req.session?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isCurrentValid = await verifyPassword(user.passwordHash, currentPassword);
    if (!isCurrentValid) {
      res.status(400).json({ error: 'Incorrect current password.' });
      return;
    }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    // Regenerate session after password change
    req.session.regenerate((err) => {
      if (err) {
        res.status(500).json({ error: 'Session update error' });
        return;
      }
      req.session.userId = user._id.toString();
      req.session.role = user.role;
      const csrfToken = getOrCreateCsrfToken(req, res);
      res.json({ message: 'Password updated successfully', csrfToken });
    });
  }

  /**
   * CSRF Token Endpoint.
   */
  static async getCsrfToken(req: Request, res: Response): Promise<void> {
    const csrfToken = getOrCreateCsrfToken(req, res);
    res.json({ csrfToken });
  }
}
