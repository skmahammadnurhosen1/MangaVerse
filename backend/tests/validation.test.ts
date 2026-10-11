import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  mangaCreateSchema,
  chapterCreateSchema,
  siteSettingsSchema,
  readingProgressSchema,
} from '../src/validation/schemas.js';

describe('Strict Zod Schema Validation & Injection Prevention', () => {
  it('should accept valid registration payloads', () => {
    const validData = {
      username: 'MangaFan42',
      email: 'reader@example.com',
      password: 'SafePassword123!',
      passwordConfirm: 'SafePassword123!',
    };

    const parsed = registerSchema.parse(validData);
    expect(parsed.username).toBe('MangaFan42');
    expect(parsed.email).toBe('reader@example.com');
  });

  it('should reject registration attempts with mismatched password confirmation', () => {
    const mismatchData = {
      username: 'MangaFan42',
      email: 'reader@example.com',
      password: 'SafePassword123!',
      passwordConfirm: 'DifferentPassword456!',
    };

    expect(() => registerSchema.parse(mismatchData)).toThrow('Passwords do not match');
  });

  it('should reject passwords shorter than 8 characters', () => {
    const shortPasswordData = {
      username: 'MangaFan42',
      email: 'reader@example.com',
      password: 'short',
      passwordConfirm: 'short',
    };

    expect(() => registerSchema.parse(shortPasswordData)).toThrow('Password must be at least 8 characters');
  });

  it('should reject usernames containing invalid characters or script tags', () => {
    const invalidUsername = {
      username: '<script>alert(1)</script>',
      email: 'reader@example.com',
      password: 'SafePassword123!',
      passwordConfirm: 'SafePassword123!',
    };

    expect(() => registerSchema.parse(invalidUsername)).toThrow();
  });

  it('should reject mass assignment or privilege escalation attempts in registration payload', () => {
    const escalatedPayload = {
      username: 'SneakyAttacker',
      email: 'attacker@example.com',
      password: 'SafePassword123!',
      passwordConfirm: 'SafePassword123!',
      role: 'admin', // Malicious field
      status: 'active',
      isSuperUser: true,
    };

    // Strict schema must reject unrecognized keys
    expect(() => registerSchema.parse(escalatedPayload)).toThrow('unrecognized_keys');
  });

  it('should reject NoSQL operator objects inside login payload', () => {
    const noSqlInjection = {
      email: { $gt: '' }, // NoSQL query injection payload
      password: 'password',
    };

    expect(() => loginSchema.parse(noSqlInjection)).toThrow();
  });

  it('should validate and normalize manga creation parameters', () => {
    const mangaData = {
      title: 'Solo Leveling: Ragnarok',
      slug: 'solo-leveling-ragnarok',
      synopsis: 'The continuation of the Sung Jinwoo legacy in earth dimension.',
      author: 'Chugong',
      artist: 'REDICE Studio',
      genres: ['Action', 'Fantasy'],
      status: 'ongoing',
      contentRating: 'safe',
      language: 'en',
    };

    const parsed = mangaCreateSchema.parse(mangaData);
    expect(parsed.slug).toBe('solo-leveling-ragnarok');
    expect(parsed.status).toBe('ongoing');
  });

  it('should reject manga creation with malformed slug', () => {
    const badSlug = {
      title: 'Title',
      slug: 'Bad Slug With Spaces & CAPS',
      synopsis: 'Long enough synopsis for test validation.',
      author: 'Author',
      artist: 'Artist',
      genres: ['Action'],
    };

    expect(() => mangaCreateSchema.parse(badSlug)).toThrow('Slug must be lowercase alphanumeric with hyphens');
  });

  it('should reject invalid chapter number or malformed Manga ID in chapter creation', () => {
    const badChapter = {
      mangaId: 'not-a-valid-mongo-id',
      chapterNumber: -5,
    };

    expect(() => chapterCreateSchema.parse(badChapter)).toThrow();
  });

  it('should accept valid site settings including bannerImages', () => {
    const settingsData = {
      siteName: 'MangaVerse Pro',
      siteDescription: 'Premium reading platform',
      bannerImages: [
        {
          title: 'Featured Release',
          subtitle: 'Read chapter 1 now',
          imageUrl: '/images/hero-character.jpg',
          linkUrl: '/manga/solo-leveling',
          active: true,
        },
      ],
    };

    const parsed = siteSettingsSchema.parse(settingsData);
    expect(parsed.siteName).toBe('MangaVerse Pro');
    expect(parsed.bannerImages).toHaveLength(1);
    expect(parsed.bannerImages![0].title).toBe('Featured Release');
  });

  it('should validate change password schema and enforce confirmation match', () => {
    const valid = {
      currentPassword: 'CurrentPassword123!',
      newPassword: 'BrandNewSecurePassword456!',
      confirmPassword: 'BrandNewSecurePassword456!',
    };
    expect(changePasswordSchema.parse(valid).newPassword).toBe('BrandNewSecurePassword456!');

    const mismatch = {
      currentPassword: 'CurrentPassword123!',
      newPassword: 'BrandNewSecurePassword456!',
      confirmPassword: 'WrongConfirmation456!',
    };
    expect(() => changePasswordSchema.parse(mismatch)).toThrow('New passwords do not match');
  });

  it('should validate reading progress schema', () => {
    const validProgress = {
      mangaId: '507f1f77bcf86cd799439011',
      chapterId: '507f1f77bcf86cd799439012',
      chapterNumber: 12,
      lastPage: 5,
      completed: false,
    };
    const parsed = readingProgressSchema.parse(validProgress);
    expect(parsed.chapterNumber).toBe(12);
    expect(parsed.lastPage).toBe(5);
  });
});
