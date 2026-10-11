import { Request, Response } from 'express';
import { Manga } from '../models/Manga.js';
import { Chapter } from '../models/Chapter.js';
import { Genre } from '../models/Genre.js';
import { SiteSettings } from '../models/SiteSettings.js';
import { ReadingProgress } from '../models/ReadingProgress.js';

export class MangaController {
  /**
   * Public paginated manga catalog with filtering and sorting.
   */
  static async getMangaList(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(48, Math.max(1, parseInt(req.query.limit as string, 10) || 18));
    const skip = (page - 1) * limit;

    const { genre, status, sort, search } = req.query;

    const filter: Record<string, unknown> = { isPublished: true };

    if (genre && typeof genre === 'string') {
      filter.genres = { $in: [genre] };
    }

    if (status && ['ongoing', 'completed', 'hiatus'].includes(status as string)) {
      filter.status = status;
    }

    if (search && typeof search === 'string' && search.trim()) {
      filter.title = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    }

    // Sort order
    let sortOption: Record<string, 1 | -1> = { updatedAt: -1 };
    if (sort === 'popular') sortOption = { viewCount: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'title') sortOption = { title: 1 };
    else if (sort === 'oldest') sortOption = { createdAt: 1 };

    const [total, mangaList] = await Promise.all([
      Manga.countDocuments(filter),
      Manga.find(filter)
        .select('title slug coverImageId bannerImageId author genres status rating ratingCount viewCount updatedAt')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // Attach latest chapter number for each manga
    const mangaIds = mangaList.map((m) => m._id);
    const latestChapters = await Chapter.aggregate([
      { $match: { mangaId: { $in: mangaIds }, publicationStatus: 'published' } },
      { $sort: { chapterNumber: -1 } },
      { $group: { _id: '$mangaId', latestChapter: { $first: '$chapterNumber' }, latestUpdated: { $first: '$publishedAt' } } },
    ]);

    const chapterMap = new Map<string, { latestChapter: number; latestUpdated: Date }>();
    latestChapters.forEach((c) => chapterMap.set(c._id.toString(), { latestChapter: c.latestChapter, latestUpdated: c.latestUpdated }));

    const items = mangaList.map((m) => ({
      ...m,
      coverUrl: m.coverImageId ? `/api/files/${m.coverImageId}` : '/images/hero-character.jpg',
      latestChapter: chapterMap.get(m._id.toString())?.latestChapter ?? null,
      latestUpdated: chapterMap.get(m._id.toString())?.latestUpdated ?? m.updatedAt,
    }));

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  /**
   * Featured banners, Trending Now, Browse By Genre, and Latest Updates for Homepage.
   */
  static async getFeaturedAndTrending(_req: Request, res: Response): Promise<void> {
    const [trending, latestUpdates, featured, genres, settings] = await Promise.all([
      // Trending: Top 10 by views/rating
      Manga.find({ isPublished: true })
        .select('title slug coverImageId bannerImageId author genres status rating ratingCount viewCount')
        .sort({ viewCount: -1, rating: -1 })
        .limit(10)
        .lean(),

      // Latest Updates: Most recently updated chapters
      Chapter.find({ publicationStatus: 'published' })
        .populate('mangaId', 'title slug coverImageId genres status author')
        .sort({ publishedAt: -1 })
        .limit(12)
        .lean(),

      // Featured manga
      Manga.find({ isPublished: true, featured: true })
        .select('title slug originalTitle synopsis coverImageId bannerImageId author genres rating')
        .limit(5)
        .lean(),

      // Genres
      Genre.find().sort({ name: 1 }).lean(),

      // Public site settings
      SiteSettings.findOne().lean(),
    ]);

    // Format trending cards
    const trendingItems = trending.map((m, index) => ({
      ...m,
      rank: index + 1,
      coverUrl: m.coverImageId ? `/api/files/${m.coverImageId}` : '/images/hero-character.jpg',
      bannerUrl: m.bannerImageId ? `/api/files/${m.bannerImageId}` : '/images/banner-swordsman.jpg',
    }));

    // Format latest updates
    const updates = latestUpdates
      .filter((c) => c.mangaId)
      .map((c) => {
        const manga = c.mangaId as any;
        return {
          chapterId: c._id,
          chapterNumber: c.chapterNumber,
          chapterTitle: c.title,
          publishedAt: c.publishedAt,
          mangaId: manga._id,
          mangaTitle: manga.title,
          mangaSlug: manga.slug,
          coverUrl: manga.coverImageId ? `/api/files/${manga.coverImageId}` : '/images/hero-character.jpg',
          genres: manga.genres || [],
        };
      });

    res.json({
      siteSettings: {
        siteName: settings?.siteName || 'MangaVerse',
        siteDescription: settings?.siteDescription || 'Discover and read manga online',
        announcement: settings?.announcement || '',
        bannerImages: settings?.bannerImages || [],
      },
      featured: featured.map((m) => ({
        ...m,
        coverUrl: m.coverImageId ? `/api/files/${m.coverImageId}` : '/images/hero-character.jpg',
        bannerUrl: m.bannerImageId ? `/api/files/${m.bannerImageId}` : '/images/banner-heroine.jpg',
      })),
      trending: trendingItems,
      latestUpdates: updates,
      genres,
    });
  }

  /**
   * Detailed manga information by slug.
   */
  static async getMangaBySlug(req: Request, res: Response): Promise<void> {
    const { slug } = req.params;
    const manga = await Manga.findOne({ slug, isPublished: true });

    if (!manga) {
      res.status(404).json({ error: 'Manga not found' });
      return;
    }

    // Increment view count reliably
    await Manga.updateOne({ _id: manga._id }, { $inc: { viewCount: 1 } });

    // Fetch chapters
    const chapters = await Chapter.find({ mangaId: manga._id, publicationStatus: 'published' })
      .select('chapterNumber title volume publishedAt downloadAvailable downloadSize')
      .sort({ chapterNumber: -1 })
      .lean();

    // Related manga by matching genres
    const related = await Manga.find({
      _id: { $ne: manga._id },
      isPublished: true,
      genres: { $in: manga.genres },
    })
      .select('title slug coverImageId rating genres')
      .limit(6)
      .lean();

    // Check user's saved reading progress if authenticated
    let userProgress = null;
    if (req.user) {
      userProgress = await ReadingProgress.findOne({
        userId: req.user._id,
        mangaId: manga._id,
      }).lean();
    }

    res.json({
      manga: {
        ...manga.toObject(),
        coverUrl: manga.coverImageId ? `/api/files/${manga.coverImageId}` : '/images/hero-character.jpg',
        bannerUrl: manga.bannerImageId ? `/api/files/${manga.bannerImageId}` : '/images/banner-swordsman.jpg',
      },
      chapters: chapters.map((c) => ({
        ...c,
        id: c._id,
      })),
      related: related.map((r) => ({
        ...r,
        coverUrl: r.coverImageId ? `/api/files/${r.coverImageId}` : '/images/hero-character.jpg',
      })),
      userProgress,
    });
  }

  /**
   * Public list of genres.
   */
  static async getGenres(_req: Request, res: Response): Promise<void> {
    const genres = await Genre.find().sort({ name: 1 }).lean();
    res.json({ genres });
  }

  /**
   * Fast debounced search suggestions.
   */
  static async search(req: Request, res: Response): Promise<void> {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query) {
      res.json({ results: [] });
      return;
    }

    const safeRegex = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const results = await Manga.find({
      isPublished: true,
      $or: [
        { title: { $regex: safeRegex, $options: 'i' } },
        { author: { $regex: safeRegex, $options: 'i' } },
        { artist: { $regex: safeRegex, $options: 'i' } },
      ],
    })
      .select('title slug coverImageId author genres rating')
      .limit(10)
      .lean();

    res.json({
      results: results.map((r) => ({
        ...r,
        coverUrl: r.coverImageId ? `/api/files/${r.coverImageId}` : '/images/hero-character.jpg',
      })),
    });
  }
}
