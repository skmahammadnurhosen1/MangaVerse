import { Schema, model, Document, Types } from 'mongoose';

export type CommentStatus = 'approved' | 'pending' | 'hidden' | 'deleted';

export interface IComment extends Document {
  mangaId: Types.ObjectId;
  chapterId?: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  rating?: number;
  status: CommentStatus;
  reportCount: number;
  reportedBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    mangaId: {
      type: Schema.Types.ObjectId,
      ref: 'Manga',
      required: true,
      index: true,
    },
    chapterId: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 1000,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    status: {
      type: String,
      enum: ['approved', 'pending', 'hidden', 'deleted'],
      default: 'approved',
      index: true,
    },
    reportCount: {
      type: Number,
      default: 0,
      index: true,
    },
    reportedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ mangaId: 1, status: 1, createdAt: -1 });

export const Comment = model<IComment>('Comment', commentSchema);
