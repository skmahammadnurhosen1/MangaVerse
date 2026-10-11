import { api } from './api';
import { Manga, Chapter, Genre, Bookmark, ReadingProgress, Comment, SiteSettings, PaginatedResponse } from '../types';

export const mangaService = {
  async getHomeData() {
    const res = await api.get<{
      siteSettings: SiteSettings;
      featured: Manga[];
      trending: Manga[];
      latestUpdates: any[];
      genres: Genre[];
    }>('/api/manga/home');
    return res.data;
  },

  async getMangaList(params: { page?: number; limit?: number; genre?: string; status?: string; sort?: string; search?: string }) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.genre) query.set('genre', params.genre);
    if (params.status) query.set('status', params.status);
    if (params.sort) query.set('sort', params.sort);
    if (params.search) query.set('search', params.search);

    const res = await api.get<PaginatedResponse<Manga>>(`/api/manga?${query.toString()}`);
    return res.data;
  },

  async getMangaBySlug(slug: string) {
    const res = await api.get<{ manga: Manga; chapters: Chapter[]; related: Manga[]; userProgress?: any }>(`/api/manga/${slug}`);
    return res.data;
  },

  async searchManga(q: string) {
    const res = await api.get<{ results: Manga[] }>(`/api/manga/search?q=${encodeURIComponent(q)}`);
    return res.data.results;
  },

  async getChapter(slug: string, chapterNumber: number) {
    const res = await api.get<{
      manga: { id: string; title: string; slug: string; status: string };
      chapter: Chapter;
      navigation: {
        previous: { chapterNumber: number; title: string } | null;
        next: { chapterNumber: number; title: string } | null;
        allChapters: { chapterNumber: number; title: string }[];
      };
      userProgress: any;
    }>(`/api/manga/${slug}/chapters/${chapterNumber}`);
    return res.data;
  },

  async saveProgress(data: { mangaId: string; chapterId: string; chapterNumber: number; lastPage: number; completed?: boolean }) {
    const res = await api.post<{ message: string }>('/api/manga/progress', data);
    return res.data;
  },

  async getGenres() {
    const res = await api.get<{ genres: Genre[] }>('/api/manga/genres');
    return res.data.genres;
  },

  // Library & Bookmarks
  async getBookmarks(status?: string) {
    const url = status ? `/api/library/bookmarks?status=${status}` : '/api/library/bookmarks';
    const res = await api.get<{ items: Bookmark[] }>(url);
    return res.data.items;
  },

  async setBookmark(mangaId: string, status: string) {
    const res = await api.post<{ message: string; bookmark: any }>('/api/library/bookmarks', { mangaId, status });
    return res.data;
  },

  async removeBookmark(mangaId: string) {
    const res = await api.delete<{ message: string }>(`/api/library/bookmarks/${mangaId}`);
    return res.data;
  },

  async getReadingHistory() {
    const res = await api.get<{ items: ReadingProgress[] }>('/api/library/history');
    return res.data.items;
  },

  // Comments
  async getComments(mangaId: string) {
    const res = await api.get<{ comments: Comment[] }>(`/api/comments/${mangaId}`);
    return res.data.comments;
  },

  async postComment(data: { mangaId: string; chapterId?: string | null; content: string; rating?: number | null }) {
    const res = await api.post<{ message: string; comment: Comment }>('/api/comments', data);
    return res.data;
  },

  async reportComment(commentId: string) {
    const res = await api.post<{ message: string }>(`/api/comments/${commentId}/report`);
    return res.data;
  },
};
