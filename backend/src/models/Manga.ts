import { Schema, model, Document, Types } from 'mongoose';

export type MangaStatus = 'ongoing' | 'completed' | 'hiatus';
export type ContentRating = 'safe' | 'suggestive' | 'mature';

export interface IManga extends Document {
  title: string;
  originalTitle?: string;
  slug: string;
  synopsis: string;
  coverImageId?: Types.ObjectId;
  bannerImageId?: Types.ObjectId;
  author: string;
  artist: string;
  genres: string[];
  status: MangaStatus;
  contentRating: ContentRating;
  language: string;
  viewCount: number;
  rating: number;
  ratingCount: number;
  featured: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const mangaSchema = new Schema<IManga>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    originalTitle: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    synopsis: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    coverImageId: {
      type: Schema.Types.ObjectId,
      ref: 'mangaFiles.files',
      default: null,
    },
    bannerImageId: {
      type: Schema.Types.ObjectId,
      ref: 'mangaFiles.files',
      default: null,
    },
    author: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    genres: {
      type: [String],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'hiatus'],
      default: 'ongoing',
      required: true,
      index: true,
    },
    contentRating: {
      type: String,
      enum: ['safe', 'suggestive', 'mature'],
      default: 'safe',
      required: true,
    },
    language: {
      type: String,
      default: 'en',
      trim: true,
    },
    viewCount: {
      type: Number,
      default: 0,
      index: true,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 1.0,
      max: 5.0,
    },
    ratingCount: {
      type: Number,
      default: 1,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for searching & listing
mangaSchema.index({ title: 'text', author: 'text', artist: 'text' });
mangaSchema.index({ isPublished: 1, updatedAt: -1 });
mangaSchema.index({ isPublished: 1, viewCount: -1 });

export const Manga = model<IManga>('Manga', mangaSchema);
