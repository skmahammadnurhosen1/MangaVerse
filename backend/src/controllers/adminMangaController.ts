import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Manga } from '../models/Manga.js';
import { Chapter } from '../models/Chapter.js';
import { uploadBufferToGridFS, deleteGridFSFile } from '../services/gridfsService.js';
import { AuditLog } from '../models/AuditLog.js';
import { getClientIp } from '../middleware/rateLimitMiddleware.js';

export class AdminMangaController {
  /**
   * Admin list of all manga with publication status and chapter counts.
   */
  static async listManga(req: Request, res: Response): Promise<void> {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const [total, mangaList] = await Promise.all([
      Manga.countDocuments(),
      Manga.find()
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const mangaIds = mangaList.map((m) => m._id);
    const chapterCounts = await Chapter.aggregate([
      { $match: { mangaId: { $in: mangaIds } } },
      { $group: { _id: '$mangaId', count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    chapterCounts.forEach((c) => countMap.set(c._id.toString(), c.count));

    const items = mangaList.map((m) => ({
      ...m,
      coverUrl: m.coverImageId ? `/api/files/${m.coverImageId}` : '/images/hero-character.jpg',
      chapterCount: countMap.get(m._id.toString()) || 0,
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
   * Retrieves single manga by ID for administration.
   */
  static async getManga(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const manga = await Manga.findById(id);

    if (!manga) {
      res.status(404).json({ error: 'Manga not found' });
      return;
    }

    res.json({
      manga: {
        ...manga.toObject(),
        coverUrl: manga.coverImageId ? `/api/files/${manga.coverImageId}` : '/images/hero-character.jpg',
        bannerUrl: manga.bannerImageId ? `/api/files/${manga.bannerImageId}` : '/images/banner-swordsman.jpg',
      },
    });
  }

  /**
   * Creates new manga record.
   */
  static async createManga(req: Request, res: Response): Promise<void> {
    const existing = await Manga.findOne({ slug: req.body.slug });
    if (existing) {
      res.status(409).json({ error: 'A manga with this slug already exists. Please choose a unique slug.' });
      return;
    }

    const manga = new Manga(req.body);
    await manga.save();

    if (req.admin) {
      await AuditLog.create({
        adminId: req.admin._id,
        adminUsername: req.admin.username,
        action: 'CREATE_MANGA',
        targetType: 'MANGA',
        targetId: manga._id.toString(),
        details: { title: manga.title, slug: manga.slug },
        ipAddress: getClientIp(req),
      });
    }

    res.status(201).json({ message: 'Manga created successfully', manga });
  }

  /**
   * Updates existing manga record.
   */
  static async updateManga(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    if (req.body.slug) {
      const existing = await Manga.findOne({ slug: req.body.slug, _id: { $ne: id } });
      if (existing) {
        res.status(409).json({ error: 'Another manga with this slug already exists.' });
        return;
      }
    }

    const updated = await Manga.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) {
      res.status(404).json({ error: 'Manga not found' });
      return;
    }

    if (req.admin) {
      await AuditLog.create({
        adminId: req.admin._id,
        adminUsername: req.admin.username,
        action: 'UPDATE_MANGA',
        targetType: 'MANGA',
        targetId: updated._id.toString(),
        details: { title: updated.title },
        ipAddress: getClientIp(req),
      });
    }

    res.json({ message: 'Manga updated successfully', manga: updated });
  }

  /**
   * Deletes manga and cleans up all associated GridFS assets (cover, banner, chapters, chapter pages).
   */
  static async deleteManga(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const manga = await Manga.findById(id);
    if (!manga) {
      res.status(404).json({ error: 'Manga not found' });
      return;
    }

    // 1. Delete cover and banner images from GridFS
    if (manga.coverImageId) {
      await deleteGridFSFile(manga.coverImageId as mongoose.Types.ObjectId);
    }
    if (manga.bannerImageId) {
      await deleteGridFSFile(manga.bannerImageId as mongoose.Types.ObjectId);
    }

    // 2. Find and delete all chapters and chapter pages
    const chapters = await Chapter.find({ mangaId: manga._id });
    for (const chapter of chapters) {
      if (chapter.pdfFileId) {
        await deleteGridFSFile(chapter.pdfFileId as mongoose.Types.ObjectId);
      }
      for (const page of chapter.pages) {
        if (page.fileId) {
          await deleteGridFSFile(page.fileId as mongoose.Types.ObjectId);
        }
      }
    }
    await Chapter.deleteMany({ mangaId: manga._id });

    // 3. Delete manga document
    await Manga.findByIdAndDelete(id);

    if (req.admin) {
      await AuditLog.create({
        adminId: req.admin._id,
        adminUsername: req.admin.username,
        action: 'DELETE_MANGA',
        targetType: 'MANGA',
        targetId: id,
        details: { title: manga.title },
        ipAddress: getClientIp(req),
      });
    }

    res.json({ message: 'Manga and all associated files deleted successfully' });
  }

  /**
   * Uploads and attaches a cover image to a manga.
   */
  static async uploadCover(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No cover image file uploaded' });
      return;
    }

    const manga = await Manga.findById(id);
    if (!manga) {
      res.status(404).json({ error: 'Manga not found' });
      return;
    }

    // Upload to GridFS
    const fileId = await uploadBufferToGridFS(
      file.buffer,
      `${manga.slug}-cover`,
      file.mimetype,
      req.admin?.username || 'admin'
    );

    // Delete old cover from GridFS if existed
    if (manga.coverImageId) {
      await deleteGridFSFile(manga.coverImageId as mongoose.Types.ObjectId);
    }

    manga.coverImageId = fileId;
    await manga.save();

    res.json({
      message: 'Cover image uploaded successfully',
      coverImageId: fileId,
      coverUrl: `/api/files/${fileId}`,
    });
  }

  /**
   * Toggles publication status.
   */
  static async togglePublish(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const manga = await Manga.findById(id);
    if (!manga) {
      res.status(404).json({ error: 'Manga not found' });
      return;
    }

    manga.isPublished = !manga.isPublished;
    await manga.save();

    res.json({ message: `Manga ${manga.isPublished ? 'published' : 'unpublished'}`, isPublished: manga.isPublished });
  }
}
