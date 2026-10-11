import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Chapter } from '../models/Chapter.js';
import { Manga } from '../models/Manga.js';
import { uploadBufferToGridFS, deleteGridFSFile } from '../services/gridfsService.js';
import { generateChapterPdf } from '../services/pdfService.js';
import { AuditLog } from '../models/AuditLog.js';
import { getClientIp } from '../middleware/rateLimitMiddleware.js';

export class AdminChapterController {
  /**
   * Lists chapters for a given manga.
   */
  static async listChapters(req: Request, res: Response): Promise<void> {
    const { mangaId } = req.params;

    const chapters = await Chapter.find({ mangaId })
      .sort({ chapterNumber: -1 })
      .lean();

    const items = chapters.map((c) => ({
      ...c,
      id: c._id,
      pageCount: c.pages ? c.pages.length : 0,
      hasPdf: !!c.pdfFileId,
    }));

    res.json({ chapters: items });
  }

  /**
   * Creates a new chapter.
   */
  static async createChapter(req: Request, res: Response): Promise<void> {
    const { mangaId, chapterNumber, title, volume, publicationStatus } = req.body;

    const existing = await Chapter.findOne({ mangaId, chapterNumber });
    if (existing) {
      res.status(409).json({ error: `Chapter ${chapterNumber} already exists for this manga.` });
      return;
    }

    const chapter = new Chapter({
      mangaId,
      chapterNumber,
      title: title || '',
      volume: volume || null,
      publicationStatus: publicationStatus || 'published',
      publishedAt: new Date(),
    });

    await chapter.save();

    // Update manga's updatedAt
    await Manga.findByIdAndUpdate(mangaId, { updatedAt: new Date() });

    if (req.admin) {
      await AuditLog.create({
        adminId: req.admin._id,
        adminUsername: req.admin.username,
        action: 'CREATE_CHAPTER',
        targetType: 'CHAPTER',
        targetId: chapter._id.toString(),
        details: { mangaId, chapterNumber },
        ipAddress: getClientIp(req),
      });
    }

    res.status(201).json({ message: 'Chapter created successfully', chapter });
  }

  /**
   * Bulk uploads pages into GridFS and appends or sets pages on chapter.
   */
  static async uploadPages(req: Request, res: Response): Promise<void> {
    const { chapterId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No page files were provided.' });
      return;
    }

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    // Determine starting page number
    let currentMaxPage = 0;
    if (chapter.pages && chapter.pages.length > 0) {
      currentMaxPage = Math.max(...chapter.pages.map((p) => p.pageNumber));
    }

    const newPages: { pageNumber: number; fileId: mongoose.Types.ObjectId }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const pageNumber = currentMaxPage + i + 1;
      const fileId = await uploadBufferToGridFS(
        file.buffer,
        `ch${chapter.chapterNumber}_p${pageNumber}`,
        file.mimetype,
        req.admin?.username || 'admin'
      );
      newPages.push({ pageNumber, fileId });
    }

    chapter.pages.push(...newPages);
    await chapter.save();

    res.json({
      message: `${files.length} page(s) uploaded successfully`,
      totalPages: chapter.pages.length,
      pages: chapter.pages,
    });
  }

  /**
   * Updates chapter details and/or reorders page items.
   */
  static async updateChapter(req: Request, res: Response): Promise<void> {
    const { chapterId } = req.params;
    const { title, volume, publicationStatus, pages } = req.body;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    if (title !== undefined) chapter.title = title;
    if (volume !== undefined) chapter.volume = volume;
    if (publicationStatus !== undefined) chapter.publicationStatus = publicationStatus;

    // Handle page reordering and clean up orphaned removed page files
    if (Array.isArray(pages)) {
      const newFileIdStrings = new Set(pages.map((p: any) => p.fileId?.toString()));
      const orphanedPages = (chapter.pages || []).filter((p) => p.fileId && !newFileIdStrings.has(p.fileId.toString()));
      for (const orphan of orphanedPages) {
        if (orphan.fileId) {
          await deleteGridFSFile(orphan.fileId as mongoose.Types.ObjectId);
        }
      }

      chapter.pages = pages.map((p: any, index: number) => ({
        pageNumber: index + 1,
        fileId: new mongoose.Types.ObjectId(p.fileId),
      }));
    }

    await chapter.save();
    res.json({ message: 'Chapter updated successfully', chapter });
  }

  /**
   * Generates or regenerates downloadable PDF for the chapter.
   */
  static async generatePdf(req: Request, res: Response): Promise<void> {
    const { chapterId } = req.params;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    const manga = await Manga.findById(chapter.mangaId);
    if (!manga) {
      res.status(404).json({ error: 'Manga not found' });
      return;
    }

    if (!chapter.pages || chapter.pages.length === 0) {
      res.status(400).json({ error: 'Cannot compile PDF for chapter with no pages uploaded.' });
      return;
    }

    // Delete previous PDF if existed
    if (chapter.pdfFileId) {
      await deleteGridFSFile(chapter.pdfFileId as mongoose.Types.ObjectId);
    }

    const result = await generateChapterPdf({
      title: chapter.title,
      mangaTitle: manga.title,
      chapterNumber: chapter.chapterNumber,
      pages: chapter.pages,
    });

    chapter.pdfFileId = result.pdfFileId;
    chapter.downloadAvailable = true;
    chapter.downloadSize = result.size;
    await chapter.save();

    res.json({
      message: 'Chapter PDF successfully compiled and stored in GridFS',
      size: result.size,
      downloadUrl: `/api/manga/${manga.slug}/chapters/${chapter.chapterNumber}/download`,
    });
  }

  /**
   * Deletes chapter and cleans up all GridFS assets.
   */
  static async deleteChapter(req: Request, res: Response): Promise<void> {
    const { chapterId } = req.params;

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      res.status(404).json({ error: 'Chapter not found' });
      return;
    }

    // Clean up GridFS files
    if (chapter.pdfFileId) {
      await deleteGridFSFile(chapter.pdfFileId as mongoose.Types.ObjectId);
    }
    for (const page of chapter.pages) {
      if (page.fileId) {
        await deleteGridFSFile(page.fileId as mongoose.Types.ObjectId);
      }
    }

    await Chapter.findByIdAndDelete(chapterId);

    if (req.admin) {
      await AuditLog.create({
        adminId: req.admin._id,
        adminUsername: req.admin.username,
        action: 'DELETE_CHAPTER',
        targetType: 'CHAPTER',
        targetId: chapterId,
        details: { chapterNumber: chapter.chapterNumber },
        ipAddress: getClientIp(req),
      });
    }

    res.json({ message: 'Chapter and all page assets deleted successfully' });
  }
}
