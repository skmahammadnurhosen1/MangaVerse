import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';
import sharp from 'sharp';
import { readFileToBuffer, uploadBufferToGridFS, deleteGridFSFile } from './gridfsService.js';
import { IChapterPage } from '../models/Chapter.js';

export interface GeneratePdfOptions {
  title: string;
  mangaTitle: string;
  chapterNumber: number;
  pages: IChapterPage[];
}

/**
 * Generates a compiled PDF from an array of ordered chapter page images in GridFS
 * and saves the resulting document directly into GridFS, returning the new fileId and file size.
 */
export async function generateChapterPdf(
  options: GeneratePdfOptions
): Promise<{ pdfFileId: mongoose.Types.ObjectId; size: number }> {
  const { title, mangaTitle, chapterNumber, pages } = options;

  if (!pages || pages.length === 0) {
    throw new Error('Cannot generate PDF for a chapter with no pages');
  }

  // Sort pages in ascending numerical order
  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);

  return new Promise(async (resolve, reject) => {
    let pdfFileId: mongoose.Types.ObjectId | null = null;

    try {
      // Create PDF document in auto-fit page mode
      const doc = new PDFDocument({ autoFirstPage: false });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('error', (err) => {
        reject(err);
      });

      // Stream each page sequentially to limit peak memory usage
      for (let i = 0; i < sortedPages.length; i++) {
        const pageItem = sortedPages[i];
        try {
          const imageBuffer = await readFileToBuffer(pageItem.fileId as mongoose.Types.ObjectId);

          // PDFKit only natively embeds JPEG and PNG. Convert WebP to JPEG buffer via sharp
          let processedBuffer = imageBuffer;
          const isWebp =
            imageBuffer.length >= 12 &&
            imageBuffer[0] === 0x52 &&
            imageBuffer[1] === 0x49 &&
            imageBuffer[2] === 0x46 &&
            imageBuffer[3] === 0x46 &&
            imageBuffer[8] === 0x57 &&
            imageBuffer[9] === 0x45 &&
            imageBuffer[10] === 0x42 &&
            imageBuffer[11] === 0x50;

          if (isWebp) {
            processedBuffer = await sharp(imageBuffer).jpeg({ quality: 92 }).toBuffer();
          }

          // Add a new page matching the image dimensions or standard A4/US Letter aspect
          // PDFKit allows adding page with custom size
          doc.addPage({
            margin: 0,
            size: 'A4',
          });

          // Embed image scaled to fill page
          doc.image(processedBuffer, 0, 0, {
            fit: [595.28, 841.89], // A4 points
            align: 'center',
            valign: 'center',
          });
        } catch (pageError) {
          console.warn(`[PDF] Error processing page ${pageItem.pageNumber}:`, pageError);
          // If individual page fails, add blank or placeholder page
          doc.addPage({ margin: 20 });
          doc.fontSize(16).text(`[Page ${pageItem.pageNumber} - Image unavailable]`, 50, 100);
        }
      }

      doc.end();

      // Collect completed PDF buffer
      const completePdfBuffer = await new Promise<Buffer>((resPdf, rejPdf) => {
        doc.on('end', () => resPdf(Buffer.concat(chunks)));
        doc.on('error', rejPdf);
      });

      const safeFilename = `${mangaTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Ch${chapterNumber}_${title ? title.replace(/[^a-zA-Z0-9_-]/g, '_') : 'chapter'}.pdf`;

      // Upload generated PDF to GridFS
      pdfFileId = await uploadBufferToGridFS(
        completePdfBuffer,
        safeFilename,
        'application/pdf',
        'pdf-generator'
      );

      resolve({
        pdfFileId,
        size: completePdfBuffer.length,
      });
    } catch (error) {
      if (pdfFileId) {
        await deleteGridFSFile(pdfFileId);
      }
      reject(error);
    }
  });
}
