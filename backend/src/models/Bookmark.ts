import { Schema, model, Document, Types } from 'mongoose';

export type BookmarkStatus = 'reading' | 'plan_to_read' | 'completed' | 'favorite';

export interface IBookmark extends Document {
  userId: Types.ObjectId;
  mangaId: Types.ObjectId;
  status: BookmarkStatus;
  createdAt: Date;
  updatedAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>(
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
    status: {
      type: String,
      enum: ['reading', 'plan_to_read', 'completed', 'favorite'],
      default: 'reading',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

bookmarkSchema.index({ userId: 1, mangaId: 1 }, { unique: true });
bookmarkSchema.index({ userId: 1, status: 1 });

export const Bookmark = model<IBookmark>('Bookmark', bookmarkSchema);
