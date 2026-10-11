export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status?: 'active' | 'suspended';
  createdAt?: string;
}

export interface Manga {
  _id?: string;
  id?: string;
  title: string;
  originalTitle?: string;
  slug: string;
  synopsis: string;
  coverImageId?: string;
  bannerImageId?: string;
  coverUrl: string;
  bannerUrl?: string;
  author: string;
  artist: string;
  genres: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  contentRating: 'safe' | 'suggestive' | 'mature';
  language: string;
  viewCount: number;
  rating: number;
  ratingCount: number;
  featured?: boolean;
  isPublished?: boolean;
  latestChapter?: number | null;
  latestUpdated?: string;
  chapterCount?: number;
  rank?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChapterPage {
  pageNumber: number;
  fileId?: string;
  imageUrl: string;
}

export interface Chapter {
  id: string;
  _id?: string;
  mangaId?: string;
  chapterNumber: number;
  title: string;
  volume?: number | null;
  pages?: ChapterPage[];
  pageCount?: number;
  hasPdf?: boolean;
  downloadAvailable: boolean;
  downloadSize?: number;
  publicationStatus?: 'published' | 'draft';
  publishedAt: string;
}

export interface Genre {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Bookmark {
  id: string;
  status: 'reading' | 'plan_to_read' | 'completed' | 'favorite';
  updatedAt: string;
  manga: Manga;
}

export interface ReadingProgress {
  id: string;
  chapterNumber: number;
  lastPage: number;
  completed: boolean;
  updatedAt: string;
  manga: Manga;
  chapterTitle?: string;
}

export interface Comment {
  id: string;
  content: string;
  rating?: number | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export interface BannerItem {
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  active: boolean;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  announcement: string;
  contactEmail: string;
  logoUrl?: string;
  maintenanceMode?: boolean;
  bannerImages?: BannerItem[];
}

export interface OverviewStats {
  totalManga: number;
  totalChapters: number;
  totalUsers: number;
  totalComments: number;
  totalViews: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
