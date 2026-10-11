import { Readable } from 'stream';
import mongoose from 'mongoose';
import { getGridFSBucket } from '../config/db.js';

export interface FileMetadata {
  originalName: string;
  contentType: string;
  size: number;
  uploadedBy?: string;
  createdAt: Date;
}

/**
 * Validates file magic bytes to verify genuine JPEG, PNG, WEBP, or PDF content.
 */
export function validateFileMagicBytes(buffer: Buffer): { valid: boolean; contentType: string } {
  if (buffer.length < 4) {
    return { valid: false, contentType: '' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, contentType: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, contentType: 'image/png' };
  }

  // WEBP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, contentType: 'image/webp' };
  }

  // PDF: %PDF-
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  ) {
    return { valid: true, contentType: 'application/pdf' };
  }

  return { valid: false, contentType: '' };
}

/**
 * Uploads a buffer directly into GridFS.
 */
export async function uploadBufferToGridFS(
  buffer: Buffer,
  filename: string,
  contentType: string,
  uploadedBy?: string
): Promise<mongoose.Types.ObjectId> {
  const bucket = getGridFSBucket();
  const fileId = new mongoose.Types.ObjectId();

  return new Promise((resolve, reject) => {
    const readable = Readable.from(buffer);
    const uploadStream = bucket.openUploadStreamWithId(fileId, filename, {
      contentType,
      metadata: {
        originalName: filename,
        size: buffer.length,
        uploadedBy: uploadedBy || 'system',
        createdAt: new Date(),
      },
    });

    uploadStream.on('error', (err) => reject(err));
    uploadStream.on('finish', () => resolve(fileId));

    readable.pipe(uploadStream);
  });
}

/**
 * Streams a GridFS file to an output stream (e.g. Express Response).
 */
export function openDownloadStream(fileId: mongoose.Types.ObjectId) {
  const bucket = getGridFSBucket();
  return bucket.openDownloadStream(fileId);
}

/**
 * Finds file info in GridFS.
 */
export async function getFileInfo(fileId: mongoose.Types.ObjectId) {
  const bucket = getGridFSBucket();
  const files = await bucket.find({ _id: fileId }).toArray();
  return files.length > 0 ? files[0] : null;
}

/**
 * Reads an entire GridFS file into a Buffer (with safety limit).
 */
export async function readFileToBuffer(fileId: mongoose.Types.ObjectId, maxBytes = 25 * 1024 * 1024): Promise<Buffer> {
  const bucket = getGridFSBucket();
  const downloadStream = bucket.openDownloadStream(fileId);

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    downloadStream.on('data', (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        downloadStream.destroy(new Error(`File exceeds maximum permitted size of ${maxBytes} bytes`));
        return;
      }
      chunks.push(chunk);
    });

    downloadStream.on('error', (err) => reject(err));
    downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Deletes a file from GridFS by ID safely.
 */
export async function deleteGridFSFile(fileId: mongoose.Types.ObjectId): Promise<void> {
  try {
    const bucket = getGridFSBucket();
    await bucket.delete(fileId);
  } catch (error) {
    // File may already have been removed
    console.warn(`[GridFS] Warning: Failed to delete file ${fileId}:`, error instanceof Error ? error.message : error);
  }
}
