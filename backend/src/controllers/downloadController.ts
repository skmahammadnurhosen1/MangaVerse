import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Chapter } from '../models/Chapter.js';
import { Manga } from '../models/Manga.js';
import { openDownloadStream, getFileInfo } from '../services/gridfsService.js';
import { generateChapterPdf } from '../services/pdfService.js';

export class DownloadController {
  /**
   * Downloads high quality chapter PDF document.
   */
  static async downloadChapterPdf(req: Request, res: Response): Promise<void> {
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

    const safeFilename = `${manga.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Ch${chapter.chapterNumber}.pdf`;

    try {
      let pdfFileId = chapter.pdfFileId;

      // If PDF file has not been compiled yet, compile it now
      if (!pdfFileId && chapter.pages && chapter.pages.length > 0) {
        const generated = await generateChapterPdf({
          title: chapter.title,
          mangaTitle: manga.title,
          chapterNumber: chapter.chapterNumber,
          pages: chapter.pages,
        });

        chapter.pdfFileId = generated.pdfFileId;
        chapter.downloadAvailable = true;
        chapter.downloadSize = generated.size;
        await chapter.save();

        pdfFileId = generated.pdfFileId;
      }

      if (!pdfFileId) {
        res.status(404).json({ error: 'Download is not available for this chapter yet.' });
        return;
      }

      // Check if file exists in GridFS
      const fileInfo = await getFileInfo(pdfFileId as mongoose.Types.ObjectId);
      if (!fileInfo) {
        res.status(404).json({ error: 'File asset not found in storage.' });
        return;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      if (fileInfo.length) {
        res.setHeader('Content-Length', fileInfo.length.toString());
      }

      const stream = openDownloadStream(pdfFileId as mongoose.Types.ObjectId);
      stream.on('error', (err) => {
        console.error('[Download] Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream PDF download' });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error('[Download] Generation or streaming error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to prepare chapter PDF for download' });
      }
    }
  }
}
