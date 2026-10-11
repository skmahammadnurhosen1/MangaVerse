import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { hashPassword, verifyPassword, dummyVerify } from '../services/argonService.js';
import { RateLimitService } from '../services/rateLimitService.js';
import { getClientIp } from '../middleware/rateLimitMiddleware.js';
import { ADMIN_COOKIE_NAME } from '../config/session.js';
import { AuditLog } from '../models/AuditLog.js';
import { getOrCreateCsrfToken } from '../middleware/csrfMiddleware.js';

export class AdminAuthController {
  /**
   * Admin login with strict admin role verification and separate admin session.
   */
  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const ip = getClientIp(req);
    const ipKey = `admin_login:ip:${ip}`;
    const generalIpKey = `login:ip:${ip}`;
    const accountKey = `admin_login:acc:${normalizedEmail}`;
    const generalAccKey = `login:acc:${normalizedEmail}`;

    const admin = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

    // Generic error message if user does not exist or is NOT an admin
    if (!admin || admin.role !== 'admin') {
      await dummyVerify(password);
      await RateLimitService.recordFailedLogin(ipKey);
      await RateLimitService.recordFailedLogin(generalIpKey);
      await RateLimitService.recordFailedLogin(accountKey);
      await RateLimitService.recordFailedLogin(generalAccKey);

      res.status(401).json({ error: 'Invalid administrative credentials.' });
      return;
    }

    if (admin.status !== 'active') {
      await dummyVerify(password);
      res.status(403).json({ error: 'Administrative account is inactive or suspended.' });
      return;
    }

    const isValid = await verifyPassword(admin.passwordHash, password);
    if (!isValid) {
      await RateLimitService.recordFailedLogin(ipKey);
      await RateLimitService.recordFailedLogin(generalIpKey);
      await RateLimitService.recordFailedLogin(accountKey);
      await RateLimitService.recordFailedLogin(generalAccKey);

      res.status(401).json({ error: 'Invalid administrative credentials.' });
      return;
    }

    // Clear failed attempts
    await RateLimitService.clearFailedLogins(ipKey);
    await RateLimitService.clearFailedLogins(generalIpKey);
    await RateLimitService.clearFailedLogins(accountKey);
    await RateLimitService.clearFailedLogins(generalAccKey);

    // Regenerate admin session
    req.session.regenerate(async (err) => {
      if (err) {
        res.status(500).json({ error: 'Admin session error' });
        return;
      }

      req.session.adminId = admin._id.toString();
      req.session.role = 'admin';
      const csrfToken = getOrCreateCsrfToken(req, res);

      // Log successful admin login
      try {
        await AuditLog.create({
          adminId: admin._id,
          adminUsername: admin.username,
          action: 'ADMIN_LOGIN',
          targetType: 'SYSTEM',
          details: { ip },
          ipAddress: ip,
          userAgent: req.headers['user-agent'] || '',
        });
      } catch {
        // Non-blocking
      }

      res.json({
        message: 'Admin authentication successful',
        csrfToken,
        admin: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
        },
      });
    });
  }

  /**
   * Admin logout.
   */
  static async logout(req: Request, res: Response): Promise<void> {
    const adminId = req.session?.adminId;
    if (adminId) {
      try {
        await AuditLog.create({
          adminId,
          adminUsername: 'admin',
          action: 'ADMIN_LOGOUT',
          targetType: 'SYSTEM',
          ipAddress: getClientIp(req),
        });
      } catch {}
    }

    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'Admin logout failed' });
        return;
      }
      res.clearCookie(ADMIN_COOKIE_NAME);
      res.json({ message: 'Admin logged out successfully' });
    });
  }

  /**
   * Returns current authenticated admin profile.
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    const adminId = req.session?.adminId;
    if (!adminId) {
      res.status(401).json({ error: 'Not authenticated as admin' });
      return;
    }

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin' || admin.status !== 'active') {
      res.status(401).json({ error: 'Session invalid or insufficient permissions' });
      return;
    }

    res.json({
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  }

  /**
   * Admin password change requiring current password verification.
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    const adminId = req.session?.adminId;
    if (!adminId) {
      res.status(401).json({ error: 'Administrative session required' });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    const admin = await User.findById(adminId).select('+passwordHash');
    if (!admin || admin.role !== 'admin') {
      res.status(404).json({ error: 'Admin account not found' });
      return;
    }

    const isCurrentValid = await verifyPassword(admin.passwordHash, currentPassword);
    if (!isCurrentValid) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    admin.passwordHash = await hashPassword(newPassword);
    await admin.save();

    await AuditLog.create({
      adminId: admin._id,
      adminUsername: admin.username,
      action: 'ADMIN_CHANGE_PASSWORD',
      targetType: 'USER',
      targetId: admin._id.toString(),
      ipAddress: getClientIp(req),
    });

    req.session.regenerate((err) => {
      if (err) {
        res.status(500).json({ error: 'Session renewal error' });
        return;
      }
      req.session.adminId = admin._id.toString();
      req.session.role = 'admin';
      const csrfToken = getOrCreateCsrfToken(req, res);
      res.json({ message: 'Administrator password updated successfully', csrfToken });
    });
  }

  /**
   * Retrieves CSRF token for the administrative session.
   */
  static async getCsrfToken(req: Request, res: Response): Promise<void> {
    const csrfToken = getOrCreateCsrfToken(req, res);
    res.json({ csrfToken });
  }
}
