import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { openDownloadStream, getFileInfo } from '../services/gridfsService.js';

export class FileController {
  /**
   * Streams a file from GridFS with HTTP caching and range support.
   */
  static async serveFile(req: Request, res: Response): Promise<void> {
    const fileId = String(req.params.fileId);

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      res.status(400).json({ error: 'Invalid file ID format' });
      return;
    }

    const objectId = new mongoose.Types.ObjectId(fileId);

    try {
      const fileInfo = await getFileInfo(objectId);
      if (!fileInfo) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const contentType = fileInfo.contentType || 'application/octet-stream';
      const etag = `"${fileInfo._id.toString()}-${fileInfo.uploadDate.getTime()}"`;

      // Check client cache (If-None-Match)
      if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', fileInfo.length.toString());
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // Cache for 7 days

      const downloadStream = openDownloadStream(objectId);

      downloadStream.on('error', (err) => {
        console.error('[File] Streaming error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to retrieve file asset' });
        }
      });

      downloadStream.pipe(res);
    } catch (error) {
      console.error('[File] Error retrieving file:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal storage error' });
      }
    }
  }
}
