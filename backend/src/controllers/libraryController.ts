import { Request, Response } from 'express';
import { Bookmark, BookmarkStatus } from '../models/Bookmark.js';
import { ReadingProgress } from '../models/ReadingProgress.js';

export class LibraryController {
  /**
   * Retrieves the authenticated user's bookmarks.
   */
  static async getBookmarks(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { status } = req.query;
    const filter: Record<string, unknown> = { userId: req.user._id };

    if (status && typeof status === 'string') {
      filter.status = status;
    }

    const bookmarks = await Bookmark.find(filter)
      .populate('mangaId', 'title slug coverImageId rating genres status author')
      .sort({ updatedAt: -1 })
      .lean();

    const items = bookmarks
      .filter((b) => b.mangaId)
      .map((b) => {
        const manga = b.mangaId as any;
        return {
          id: b._id,
          status: b.status,
          updatedAt: b.updatedAt,
          manga: {
            id: manga._id,
            title: manga.title,
            slug: manga.slug,
            coverUrl: manga.coverImageId ? `/api/files/${manga.coverImageId}` : '/images/hero-character.jpg',
            rating: manga.rating,
            genres: manga.genres,
            status: manga.status,
            author: manga.author,
          },
        };
      });

    res.json({ items });
  }

  /**
   * Adds or updates a bookmark for a manga.
   */
  static async setBookmark(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { mangaId, status } = req.body;

    const bookmark = await Bookmark.findOneAndUpdate(
      { userId: req.user._id, mangaId },
      { status: status as BookmarkStatus },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Bookmark updated', bookmark });
  }

  /**
   * Removes a bookmark.
   */
  static async removeBookmark(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { mangaId } = req.params;

    await Bookmark.deleteOne({ userId: req.user._id, mangaId });
    res.json({ message: 'Bookmark removed' });
  }

  /**
   * Retrieves reading history with chapter and progress.
   */
  static async getReadingHistory(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const progressList = await ReadingProgress.find({ userId: req.user._id })
      .populate('mangaId', 'title slug coverImageId status author')
      .populate('chapterId', 'chapterNumber title')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const items = progressList
      .filter((p) => p.mangaId)
      .map((p) => {
        const manga = p.mangaId as any;
        const chapter = p.chapterId as any;
        return {
          id: p._id,
          chapterNumber: p.chapterNumber,
          lastPage: p.lastPage,
          completed: p.completed,
          updatedAt: p.updatedAt,
          manga: {
            id: manga._id,
            title: manga.title,
            slug: manga.slug,
            coverUrl: manga.coverImageId ? `/api/files/${manga.coverImageId}` : '/images/hero-character.jpg',
            status: manga.status,
            author: manga.author,
          },
          chapterTitle: chapter?.title || `Chapter ${p.chapterNumber}`,
        };
      });

    res.json({ items });
  }
}
