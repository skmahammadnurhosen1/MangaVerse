import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { validateFileMagicBytes } from '../services/gridfsService.js';

// Multer memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024,
    files: env.MAX_CHAPTER_PAGES,
  },
  fileFilter: (_req, file, cb) => {
    // Basic pre-filter on client mime/name; actual magic byte verification happens below
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Disallowed file type: ${file.mimetype}. Only JPEG, PNG, WEBP and PDF are accepted.`));
    }
  },
});

export const uploadSingleImage = upload.single('image');
export const uploadSingleFile = upload.single('file');
export const uploadMultipleChapterPages = upload.array('pages', env.MAX_CHAPTER_PAGES);

/**
 * Middleware verifying magic bytes for all uploaded files in memory.
 */
export function verifyUploadedFilesContent(req: Request, res: Response, next: NextFunction): void {
  const files: Express.Multer.File[] = [];

  if (req.file) {
    files.push(req.file);
  }
  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach((fArray) => {
      if (Array.isArray(fArray)) files.push(...fArray);
    });
  }

  for (const file of files) {
    const magic = validateFileMagicBytes(file.buffer);
    if (!magic.valid) {
      res.status(400).json({
        error: `Invalid file content for '${file.originalname}'. Only real JPEG, PNG, WEBP and PDF documents are allowed. Executable, SVG, or HTML files are strictly prohibited.`,
      });
      return;
    }
    // Override mimetype with validated magic mime
    file.mimetype = magic.contentType;
  }

  next();
}
