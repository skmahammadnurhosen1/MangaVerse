import { Schema, model, Document } from 'mongoose';

export interface ISiteSettings extends Document {
  siteName: string;
  siteDescription: string;
  announcement: string;
  contactEmail: string;
  logoUrl?: string;
  maintenanceMode: boolean;
  featuredMangaIds: string[];
  bannerImages: {
    title: string;
    subtitle: string;
    imageUrl: string;
    linkUrl: string;
    active: boolean;
  }[];
  updatedAt: Date;
}

const bannerItemSchema = new Schema(
  {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    linkUrl: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { _id: false }
);

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    siteName: {
      type: String,
      default: 'MangaVerse',
      required: true,
      trim: true,
      maxlength: 50,
    },
    siteDescription: {
      type: String,
      default: 'Read your favorite manga, manhwa, and manhua online in high quality for free.',
      trim: true,
      maxlength: 500,
    },
    announcement: {
      type: String,
      default: 'Welcome to MangaVerse! Experience ultra-fast reading and high-resolution manga.',
      trim: true,
      maxlength: 500,
    },
    contactEmail: {
      type: String,
      default: 'contact@mangaverse.example',
      trim: true,
      lowercase: true,
    },
    logoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    featuredMangaIds: {
      type: [String],
      default: [],
    },
    bannerImages: {
      type: [bannerItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const SiteSettings = model<ISiteSettings>('SiteSettings', siteSettingsSchema);
