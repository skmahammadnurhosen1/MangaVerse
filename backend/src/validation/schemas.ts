import { z } from 'zod';

// Username: 3 to 30 alphanumeric + underscore/hyphen
export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username cannot exceed 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, underscores, and hyphens');

// Email: normalized lowercase email
export const emailSchema = z
  .string()
  .trim()
  .email('Valid email address is required')
  .toLowerCase()
  .max(100, 'Email cannot exceed 100 characters');

// Password: min 8, max 128 (supports passphrases, no restrictive special character demands)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters');

// User Registration Schema
export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .strict()
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  });

// Login Schema (Admin & User)
export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Password is required').max(128),
  })
  .strict();

// Change Password Schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(128),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

// Manga Create Schema
export const mangaCreateSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(200),
    originalTitle: z.string().trim().max(200).optional().default(''),
    slug: z
      .string()
      .trim()
      .min(1, 'Slug is required')
      .max(200)
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    synopsis: z.string().trim().min(5, 'Synopsis is required').max(5000),
    author: z.string().trim().min(1, 'Author is required').max(100),
    artist: z.string().trim().min(1, 'Artist is required').max(100),
    genres: z.array(z.string().trim()).min(1, 'At least one genre is required'),
    status: z.enum(['ongoing', 'completed', 'hiatus']).default('ongoing'),
    contentRating: z.enum(['safe', 'suggestive', 'mature']).default('safe'),
    language: z.string().trim().default('en'),
    featured: z.boolean().optional().default(false),
    isPublished: z.boolean().optional().default(true),
  })
  .strict();

// Manga Update Schema
export const mangaUpdateSchema = mangaCreateSchema.partial().strict();

// Chapter Create Schema
export const chapterCreateSchema = z
  .object({
    mangaId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Manga ID'),
    chapterNumber: z.number().min(0, 'Chapter number must be >= 0'),
    title: z.string().trim().max(200).optional().default(''),
    volume: z.number().optional().nullable(),
    publicationStatus: z.enum(['published', 'draft']).default('published'),
    publishedAt: z.string().datetime().optional(),
  })
  .strict();

// Chapter Update Schema
export const chapterUpdateSchema = z
  .object({
    chapterNumber: z.number().min(0).optional(),
    title: z.string().trim().max(200).optional(),
    volume: z.number().optional().nullable(),
    publicationStatus: z.enum(['published', 'draft']).optional(),
    downloadAvailable: z.boolean().optional(),
    pages: z
      .array(
        z.object({
          pageNumber: z.number(),
          fileId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid file ID'),
        })
      )
      .optional(),
  })
  .strict();

// Genre Create Schema
export const genreSchema = z
  .object({
    name: z.string().trim().min(1, 'Genre name is required').max(50),
    slug: z
      .string()
      .trim()
      .min(1, 'Genre slug is required')
      .max(50)
      .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens'),
    description: z.string().trim().max(500).optional().default(''),
  })
  .strict();

// Reading Progress Schema
export const readingProgressSchema = z
  .object({
    mangaId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Manga ID'),
    chapterId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Chapter ID'),
    chapterNumber: z.number().min(0),
    lastPage: z.number().min(1).default(1),
    completed: z.boolean().optional().default(false),
  })
  .strict();

// Bookmark Schema
export const bookmarkSchema = z
  .object({
    mangaId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Manga ID'),
    status: z.enum(['reading', 'plan_to_read', 'completed', 'favorite']),
  })
  .strict();

// Comment Create Schema
export const commentCreateSchema = z
  .object({
    mangaId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Manga ID'),
    chapterId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Chapter ID').optional().nullable(),
    content: z.string().trim().min(2, 'Comment must be at least 2 characters').max(1000),
    rating: z.number().min(1).max(5).optional().nullable(),
  })
  .strict();

// Site Settings Schema
export const siteSettingsSchema = z
  .object({
    siteName: z.string().trim().min(1).max(50).optional(),
    siteDescription: z.string().trim().max(500).optional(),
    announcement: z.string().trim().max(500).optional(),
    contactEmail: emailSchema.optional(),
    logoUrl: z.string().trim().optional(),
    maintenanceMode: z.boolean().optional(),
    featuredMangaIds: z.array(z.string()).optional(),
    bannerImages: z
      .array(
        z.object({
          title: z.string().optional().default(''),
          subtitle: z.string().optional().default(''),
          imageUrl: z.string().optional().default(''),
          linkUrl: z.string().optional().default(''),
          active: z.boolean().optional().default(true),
        })
      )
      .optional(),
  })
  .strict();
