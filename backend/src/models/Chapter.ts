import { Schema, model, Document, Types } from 'mongoose';

export interface IChapterPage {
  pageNumber: number;
  fileId: Types.ObjectId;
}

export type ChapterPublicationStatus = 'published' | 'draft';

export interface IChapter extends Document {
  mangaId: Types.ObjectId;
  chapterNumber: number;
  title: string;
  volume?: number;
  pages: IChapterPage[];
  pdfFileId?: Types.ObjectId;
  downloadAvailable: boolean;
  downloadSize?: number;
  publicationStatus: ChapterPublicationStatus;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chapterPageSchema = new Schema<IChapterPage>(
  {
    pageNumber: { type: Number, required: true },
    fileId: { type: Schema.Types.ObjectId, required: true, ref: 'mangaFiles.files' },
  },
  { _id: false }
);

const chapterSchema = new Schema<IChapter>(
  {
    mangaId: {
      type: Schema.Types.ObjectId,
      ref: 'Manga',
      required: true,
      index: true,
    },
    chapterNumber: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 200,
    },
    volume: {
      type: Number,
      default: null,
    },
    pages: {
      type: [chapterPageSchema],
      default: [],
    },
    pdfFileId: {
      type: Schema.Types.ObjectId,
      ref: 'mangaFiles.files',
      default: null,
    },
    downloadAvailable: {
      type: Boolean,
      default: false,
    },
    downloadSize: {
      type: Number,
      default: 0,
    },
    publicationStatus: {
      type: String,
      enum: ['published', 'draft'],
      default: 'published',
      required: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee unique chapter numbering per manga
chapterSchema.index({ mangaId: 1, chapterNumber: 1 }, { unique: true });
chapterSchema.index({ mangaId: 1, publicationStatus: 1, chapterNumber: -1 });

export const Chapter = model<IChapter>('Chapter', chapterSchema);
