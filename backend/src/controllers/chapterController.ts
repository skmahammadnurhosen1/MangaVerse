import { Request, Response } from 'express';
import { Chapter } from '../models/Chapter.js';
import { Manga } from '../models/Manga.js';
import { ReadingProgress } from '../models/ReadingProgress.js';

export class ChapterController {
  /**
   * Retrieves chapter detail and image page list for the Manga Reader.
   */
  static async getChapterDetail(req: Request, res: Response): Promise<void> {
    const { mangaSlug, chapterNumber } = req.params;
    const num = parseFloat(String(chapterNumber));

    if (isNaN(num)) {
      res.status(400).json({ error: 'Invalid chapter number' });
      return;
    }

    const manga = await Manga.findOne({ slug: mangaSlug, isPublished: true });
    if (!manga) {
      res.status(404).json({ error: 'Manga not found' });
      return;
    }

    const chapter = await Chapter.findOne({
      mangaId: manga._id,
      chapterNumber: num,
      publicationStatus: 'published',
    });

    if (!chapter) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    // Find previous and next chapters
    const [prevChapter, nextChapter, allChapters] = await Promise.all([
      Chapter.findOne({
        mangaId: manga._id,
        chapterNumber: { $lt: num },
        publicationStatus: 'published',
      })
        .sort({ chapterNumber: -1 })
        .select('chapterNumber title')
        .lean(),

      Chapter.findOne({
        mangaId: manga._id,
        chapterNumber: { $gt: num },
        publicationStatus: 'published',
      })
        .sort({ chapterNumber: 1 })
        .select('chapterNumber title')
        .lean(),

      Chapter.find({
        mangaId: manga._id,
        publicationStatus: 'published',
      })
        .select('chapterNumber title')
        .sort({ chapterNumber: -1 })
        .lean(),
    ]);

    // Format pages with secure file streaming URLs
    const pages = (chapter.pages || [])
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map((p) => ({
        pageNumber: p.pageNumber,
        imageUrl: `/api/files/${p.fileId}`,
      }));

    // Check user's saved reading progress if authenticated
    let userProgress = null;
    if (req.user) {
      const progress = await ReadingProgress.findOne({
        userId: req.user._id,
        mangaId: manga._id,
      }).lean();
      userProgress = progress;
    }

    res.json({
      manga: {
        id: manga._id,
        title: manga.title,
        slug: manga.slug,
        status: manga.status,
      },
      chapter: {
        id: chapter._id,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        volume: chapter.volume,
        pages,
        downloadAvailable: chapter.downloadAvailable || !!chapter.pdfFileId,
        publishedAt: chapter.publishedAt,
      },
      navigation: {
        previous: prevChapter ? { chapterNumber: prevChapter.chapterNumber, title: prevChapter.title } : null,
        next: nextChapter ? { chapterNumber: nextChapter.chapterNumber, title: nextChapter.title } : null,
        allChapters: allChapters.map((c) => ({ chapterNumber: c.chapterNumber, title: c.title })),
      },
      userProgress,
    });
  }

  /**
   * Saves reading progress for authenticated user.
   */
  static async saveReadingProgress(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required to save progress' });
      return;
    }

    const { mangaId, chapterId, chapterNumber, lastPage, completed } = req.body;

    const existing = await ReadingProgress.findOne({
      userId: req.user._id,
      mangaId,
    });

    if (existing) {
      // Avoid overwriting more recent progress with stale requests
      const isMoreRecent =
        chapterNumber > existing.chapterNumber ||
        (chapterNumber === existing.chapterNumber && lastPage >= existing.lastPage) ||
        (Boolean(completed) && !existing.completed);

      if (isMoreRecent) {
        existing.chapterId = chapterId;
        existing.chapterNumber = chapterNumber;
        existing.lastPage = lastPage;
        existing.completed = Boolean(completed);
        await existing.save();
      }
      res.json({ message: 'Progress updated', progress: existing });
    } else {
      const progress = new ReadingProgress({
        userId: req.user._id,
        mangaId,
        chapterId,
        chapterNumber,
        lastPage,
        completed: !!completed,
      });
      await progress.save();
      res.json({ message: 'Progress saved', progress });
    }
  }
}
