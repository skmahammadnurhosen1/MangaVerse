import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { getClientIp } from '../middleware/rateLimitMiddleware.js';

export class AdminUserController {
  /**
   * Lists registered users with pagination and search. Password hashes are never exposed.
   */
  static async listUsers(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, role, status } = req.query;
    const filter: Record<string, unknown> = {};

    if (role && ['user', 'admin'].includes(role as string)) {
      filter.role = role;
    }

    if (status && ['active', 'suspended'].includes(status as string)) {
      filter.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ username: { $regex: safe, $options: 'i' } }, { email: { $regex: safe, $options: 'i' } }];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select('username email role status createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  /**
   * Toggles or updates user status (active vs suspended).
   * Note: The public user-management API must never promote a regular user to administrator.
   */
  static async updateUserStatus(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      res.status(400).json({ error: "Invalid status. Allowed values are 'active' or 'suspended'." });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Prevent suspending the current admin account itself
    if (req.admin && req.admin._id.toString() === user._id.toString() && status === 'suspended') {
      res.status(400).json({ error: 'You cannot suspend your own administrative account.' });
      return;
    }

    user.status = status;
    await user.save();

    if (req.admin) {
      await AuditLog.create({
        adminId: req.admin._id,
        adminUsername: req.admin.username,
        action: 'UPDATE_USER_STATUS',
        targetType: 'USER',
        targetId: user._id.toString(),
        details: { username: user.username, newStatus: status },
        ipAddress: getClientIp(req),
      });
    }

    res.json({
      message: `User '${user.username}' status updated to ${status}`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  }
}
