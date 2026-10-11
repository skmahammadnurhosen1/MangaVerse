import { Schema, model, Document, Types } from 'mongoose';

export interface IReadingProgress extends Document {
  userId: Types.ObjectId;
  mangaId: Types.ObjectId;
  chapterId: Types.ObjectId;
  chapterNumber: number;
  lastPage: number;
  completed: boolean;
  updatedAt: Date;
}

const readingProgressSchema = new Schema<IReadingProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mangaId: {
      type: Schema.Types.ObjectId,
      ref: 'Manga',
      required: true,
      index: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true,
    },
    chapterNumber: {
      type: Number,
      required: true,
    },
    lastPage: {
      type: Number,
      default: 1,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// One progress entry per user per manga
readingProgressSchema.index({ userId: 1, mangaId: 1 }, { unique: true });
readingProgressSchema.index({ userId: 1, updatedAt: -1 });

export const ReadingProgress = model<IReadingProgress>('ReadingProgress', readingProgressSchema);
