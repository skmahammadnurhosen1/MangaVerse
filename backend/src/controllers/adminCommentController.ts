import { Request, Response } from 'express';
import { Comment } from '../models/Comment.js';

export class AdminCommentController {
  static async listComments(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const { status } = req.query;
    const filter: Record<string, unknown> = {};
    if (status && ['approved', 'pending', 'hidden', 'deleted'].includes(status as string)) {
      filter.status = status;
    }

    const [total, comments] = await Promise.all([
      Comment.countDocuments(filter),
      Comment.find(filter)
        .populate('userId', 'username email')
        .populate('mangaId', 'title slug')
        .sort({ reportCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  static async updateCommentStatus(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'pending', 'hidden', 'deleted'].includes(status)) {
      res.status(400).json({ error: 'Invalid comment status' });
      return;
    }

    const comment = await Comment.findByIdAndUpdate(id, { status }, { new: true });
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    res.json({ message: 'Comment status updated', comment });
  }

  static async deleteComment(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await Comment.findByIdAndDelete(id);
    res.json({ message: 'Comment deleted successfully' });
  }
}
