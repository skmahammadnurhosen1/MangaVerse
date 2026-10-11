import { Request, Response } from 'express';
import { Comment } from '../models/Comment.js';

export class CommentController {
  /**
   * Retrieves approved comments for a manga.
   */
  static async getComments(req: Request, res: Response): Promise<void> {
    const { mangaId } = req.params;

    const comments = await Comment.find({
      mangaId,
      status: 'approved',
    })
      .populate('userId', 'username role')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const items = comments.map((c) => {
      const user = c.userId as any;
      return {
        id: c._id,
        content: c.content,
        rating: c.rating,
        createdAt: c.createdAt,
        user: {
          id: user?._id,
          username: user?.username || 'Reader',
          role: user?.role || 'user',
        },
      };
    });

    res.json({ comments: items });
  }

  /**
   * Posts a comment (authenticated user only).
   */
  static async postComment(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required to post comments' });
      return;
    }

    const { mangaId, chapterId, content, rating } = req.body;

    const newComment = new Comment({
      mangaId,
      chapterId: chapterId || null,
      userId: req.user._id,
      content: content.trim(),
      rating: rating ? Math.min(5, Math.max(1, rating)) : null,
      status: 'approved',
    });

    await newComment.save();

    res.status(201).json({
      message: 'Comment posted',
      comment: {
        id: newComment._id,
        content: newComment.content,
        rating: newComment.rating,
        createdAt: newComment.createdAt,
        user: {
          id: req.user._id,
          username: req.user.username,
          role: req.user.role,
        },
      },
    });
  }

  /**
   * Reports a comment for moderation review.
   */
  static async reportComment(req: Request, res: Response): Promise<void> {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    comment.reportCount += 1;
    if (comment.reportCount >= 3) {
      // Temporarily mark pending for review if repeatedly reported
      comment.status = 'pending';
    }
    await comment.save();

    res.json({ message: 'Comment has been reported for review' });
  }
}
