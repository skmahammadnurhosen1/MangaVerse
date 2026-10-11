import { Schema, model, Document } from 'mongoose';

export interface IGenre extends Document {
  name: string;
  slug: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const genreSchema = new Schema<IGenre>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

export const Genre = model<IGenre>('Genre', genreSchema);
