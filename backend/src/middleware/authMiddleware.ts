import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User.js';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      admin?: IUser;
    }
  }
}

/**
 * Middleware ensuring a regular active user is authenticated in the user session.
 */
export async function requireUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ error: 'Account not found' });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({ error: 'Account is suspended' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication check failed' });
  }
}

/**
 * Middleware ensuring an active administrator is authenticated in the admin session.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const adminId = req.session?.adminId;
  if (!adminId) {
    res.status(401).json({ error: 'Administrative authorization required' });
    return;
  }

  try {
    const admin = await User.findById(adminId);
    if (!admin) {
      req.session.destroy(() => {});
      res.status(401).json({ error: 'Admin account not found' });
      return;
    }

    // Must have role === 'admin' and active status
    if (admin.role !== 'admin') {
      res.status(403).json({ error: 'Insufficient permissions: Admin role required' });
      return;
    }

    if (admin.status !== 'active') {
      res.status(403).json({ error: 'Admin account is suspended' });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Admin authorization check failed' });
  }
}

/**
 * Optional user middleware: if user session exists, attach user to req.user without rejecting if unauthenticated.
 */
export async function optionalUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const userId = req.session?.userId;
  if (userId) {
    try {
      const user = await User.findById(userId);
      if (user && user.status === 'active') {
        req.user = user;
      }
    } catch {
      // Ignore
    }
  }
  next();
}
