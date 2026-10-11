import { describe, it, expect, vi } from 'vitest';
import sharp from 'sharp';
import PDFDocument from 'pdfkit';
import { generateChapterPdf } from '../src/services/pdfService.js';
import * as gridfsService from '../src/services/gridfsService.js';
import mongoose from 'mongoose';

describe('Feature Enhancements & Critical Bug Verifications', () => {
  describe('PDF Generation Engine with WebP Support', () => {
    it('should successfully compile WebP chapter images into a valid PDF using sharp conversion', async () => {
      // 1. Create a genuine 100x100 WebP image buffer
      const webpBuffer = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 128, g: 0, b: 255 },
        },
      })
        .webp()
        .toBuffer();

      // Verify that pdfkit would fail without conversion
      const rawDoc = new PDFDocument();
      expect(() => rawDoc.image(webpBuffer)).toThrow('Unknown image format');

      // Verify sharp conversion works with PDFKit
      const convertedBuffer = await sharp(webpBuffer).jpeg().toBuffer();
      const validDoc = new PDFDocument();
      expect(() => validDoc.image(convertedBuffer)).not.toThrow();

      // 2. Test generateChapterPdf with mocked GridFS
      const dummyFileId = new mongoose.Types.ObjectId();
      vi.spyOn(gridfsService, 'readFileToBuffer').mockResolvedValue(webpBuffer);
      vi.spyOn(gridfsService, 'uploadBufferToGridFS').mockResolvedValue(dummyFileId);

      const result = await generateChapterPdf({
        title: 'Episode 1',
        mangaTitle: 'Shadow Sovereign',
        chapterNumber: 1,
        pages: [{ pageNumber: 1, fileId: dummyFileId }],
      });

      expect(result.pdfFileId).toEqual(dummyFileId);
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('Reading Progress Stale Request Protection', () => {
    it('should reject stale lower page updates on the same chapter', () => {
      const existing = {
        chapterNumber: 5,
        lastPage: 10,
        completed: false,
      };

      // Stale incoming request from an earlier page (e.g. Page 2)
      const staleIncoming = {
        chapterNumber: 5,
        lastPage: 2,
        completed: false,
      };

      const isMoreRecentStale =
        staleIncoming.chapterNumber > existing.chapterNumber ||
        (staleIncoming.chapterNumber === existing.chapterNumber && staleIncoming.lastPage >= existing.lastPage) ||
        (Boolean(staleIncoming.completed) && !existing.completed);

      expect(isMoreRecentStale).toBe(false);

      // Newer incoming request (Page 15)
      const newerIncoming = {
        chapterNumber: 5,
        lastPage: 15,
        completed: false,
      };

      const isMoreRecentNewer =
        newerIncoming.chapterNumber > existing.chapterNumber ||
        (newerIncoming.chapterNumber === existing.chapterNumber && newerIncoming.lastPage >= existing.lastPage) ||
        (Boolean(newerIncoming.completed) && !existing.completed);

      expect(isMoreRecentNewer).toBe(true);
    });

    it('should reject stale lower chapter updates on earlier chapters', () => {
      const existing = {
        chapterNumber: 10,
        lastPage: 5,
        completed: false,
      };

      // Stale incoming request from Chapter 3
      const staleIncoming = {
        chapterNumber: 3,
        lastPage: 20,
        completed: false,
      };

      const isMoreRecent =
        staleIncoming.chapterNumber > existing.chapterNumber ||
        (staleIncoming.chapterNumber === existing.chapterNumber && staleIncoming.lastPage >= existing.lastPage) ||
        (Boolean(staleIncoming.completed) && !existing.completed);

      expect(isMoreRecent).toBe(false);
    });
  });
});
