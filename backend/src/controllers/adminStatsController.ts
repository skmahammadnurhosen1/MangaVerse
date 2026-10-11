import { Request, Response } from 'express';
import { Manga } from '../models/Manga.js';
import { Chapter } from '../models/Chapter.js';
import { User } from '../models/User.js';
import { Comment } from '../models/Comment.js';
import { AuditLog } from '../models/AuditLog.js';

export class AdminStatsController {
  /**
   * Retrieves real operational statistics from the database.
   */
  static async getOverviewStats(_req: Request, res: Response): Promise<void> {
    const [
      totalManga,
      totalChapters,
      totalUsers,
      totalComments,
      viewsAggregate,
      recentManga,
      recentChapters,
      recentAuditLogs,
    ] = await Promise.all([
      Manga.countDocuments(),
      Chapter.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Comment.countDocuments(),
      Manga.aggregate([{ $group: { _id: null, totalViews: { $sum: '$viewCount' } } }]),
      Manga.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title slug coverImageId status viewCount createdAt')
        .lean(),
      Chapter.find()
        .populate('mangaId', 'title slug')
        .sort({ publishedAt: -1 })
        .limit(5)
        .select('chapterNumber title mangaId publicationStatus publishedAt')
        .lean(),
      AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    const totalViews = viewsAggregate.length > 0 ? viewsAggregate[0].totalViews : 0;

    res.json({
      stats: {
        totalManga,
        totalChapters,
        totalUsers,
        totalComments,
        totalViews,
      },
      recentManga: recentManga.map((m) => ({
        ...m,
        coverUrl: m.coverImageId ? `/api/files/${m.coverImageId}` : '/images/hero-character.jpg',
      })),
      recentChapters,
      recentAuditLogs,
    });
  }
}
