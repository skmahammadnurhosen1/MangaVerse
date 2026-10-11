import { Request, Response } from 'express';
import { Genre } from '../models/Genre.js';
import { AuditLog } from '../models/AuditLog.js';
import { getClientIp } from '../middleware/rateLimitMiddleware.js';

export class AdminGenreController {
  static async listGenres(_req: Request, res: Response): Promise<void> {
    const genres = await Genre.find().sort({ name: 1 }).lean();
    res.json({ genres });
  }

  static async createGenre(req: Request, res: Response): Promise<void> {
    const { name, slug, description } = req.body;

    const existing = await Genre.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      res.status(409).json({ error: 'A genre with this name or slug already exists.' });
      return;
    }

    const genre = new Genre({ name, slug, description: description || '' });
    await genre.save();

    if (req.admin) {
      await AuditLog.create({
        adminId: req.admin._id,
        adminUsername: req.admin.username,
        action: 'CREATE_GENRE',
        targetType: 'GENRE',
        targetId: genre._id.toString(),
        details: { name, slug },
        ipAddress: getClientIp(req),
      });
    }

    res.status(201).json({ message: 'Genre created successfully', genre });
  }

  static async updateGenre(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, slug, description } = req.body;

    const genre = await Genre.findByIdAndUpdate(id, { name, slug, description }, { new: true });
    if (!genre) {
      res.status(404).json({ error: 'Genre not found' });
      return;
    }

    res.json({ message: 'Genre updated successfully', genre });
  }

  static async deleteGenre(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    await Genre.findByIdAndDelete(id);
    res.json({ message: 'Genre deleted successfully' });
  }
}
