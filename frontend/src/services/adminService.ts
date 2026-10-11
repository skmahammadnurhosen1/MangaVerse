import { api, clearCsrfCache } from './api';
import { User, Manga, Chapter, Genre, SiteSettings, OverviewStats, PaginatedResponse } from '../types';

export const adminService = {
  // Admin Auth
  async login(data: { email: string; password: string }) {
    const res = await api.post<{ message: string; admin: User }>('/api/admin/auth/login', data);
    return res.data;
  },

  async logout() {
    const res = await api.post<{ message: string }>('/api/admin/auth/logout');
    clearCsrfCache();
    return res.data;
  },

  async getMe() {
    const res = await api.get<{ admin: User }>('/api/admin/auth/me');
    return res.data.admin;
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    const res = await api.post<{ message: string }>('/api/admin/auth/change-password', data);
    return res.data;
  },

  // Stats
  async getStats() {
    const res = await api.get<{
      stats: OverviewStats;
      recentManga: Manga[];
      recentChapters: any[];
      recentAuditLogs: any[];
    }>('/api/admin/stats');
    return res.data;
  },

  // Manga Management
  async listManga(page = 1, limit = 20) {
    const res = await api.get<PaginatedResponse<Manga>>(`/api/admin/manga?page=${page}&limit=${limit}`);
    return res.data;
  },

  async getManga(id: string) {
    const res = await api.get<{ manga: Manga }>(`/api/admin/manga/${id}`);
    return res.data.manga;
  },

  async createManga(data: Partial<Manga>) {
    const res = await api.post<{ message: string; manga: Manga }>('/api/admin/manga', data);
    return res.data;
  },

  async updateManga(id: string, data: Partial<Manga>) {
    const res = await api.put<{ message: string; manga: Manga }>(`/api/admin/manga/${id}`, data);
    return res.data;
  },

  async deleteManga(id: string) {
    const res = await api.delete<{ message: string }>(`/api/admin/manga/${id}`);
    return res.data;
  },

  async uploadCover(mangaId: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await api.post<{ message: string; coverUrl: string }>(`/api/admin/manga/${mangaId}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async togglePublish(id: string) {
    const res = await api.patch<{ message: string; isPublished: boolean }>(`/api/admin/manga/${id}/publish`);
    return res.data;
  },

  // Chapter Management
  async listChapters(mangaId: string) {
    const res = await api.get<{ chapters: Chapter[] }>(`/api/admin/manga/${mangaId}/chapters`);
    return res.data.chapters;
  },

  async createChapter(data: { mangaId: string; chapterNumber: number; title: string; volume?: number | null; publicationStatus?: string }) {
    const res = await api.post<{ message: string; chapter: Chapter }>('/api/admin/chapters', data);
    return res.data;
  },

  async updateChapter(chapterId: string, data: Partial<Chapter>) {
    const res = await api.put<{ message: string; chapter: Chapter }>(`/api/admin/chapters/${chapterId}`, data);
    return res.data;
  },

  async deleteChapter(chapterId: string) {
    const res = await api.delete<{ message: string }>(`/api/admin/chapters/${chapterId}`);
    return res.data;
  },

  async uploadPages(chapterId: string, files: File[]) {
    const formData = new FormData();
    files.forEach((f) => formData.append('pages', f));
    const res = await api.post<{ message: string; totalPages: number }>(`/api/admin/chapters/${chapterId}/pages`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async generatePdf(chapterId: string) {
    const res = await api.post<{ message: string; size: number; downloadUrl: string }>(`/api/admin/chapters/${chapterId}/generate-pdf`);
    return res.data;
  },

  // Genre Management
  async listGenres() {
    const res = await api.get<{ genres: Genre[] }>('/api/admin/genres');
    return res.data.genres;
  },

  async createGenre(data: { name: string; slug: string; description?: string }) {
    const res = await api.post<{ message: string; genre: Genre }>('/api/admin/genres', data);
    return res.data;
  },

  async updateGenre(id: string, data: Partial<Genre>) {
    const res = await api.put<{ message: string; genre: Genre }>(`/api/admin/genres/${id}`, data);
    return res.data;
  },

  async deleteGenre(id: string) {
    const res = await api.delete<{ message: string }>(`/api/admin/genres/${id}`);
    return res.data;
  },

  // User Management
  async listUsers(page = 1, limit = 20, search?: string, status?: string) {
    let url = `/api/admin/users?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    const res = await api.get<{ users: User[]; pagination: any }>(url);
    return res.data;
  },

  async updateUserStatus(userId: string, status: 'active' | 'suspended') {
    const res = await api.patch<{ message: string; user: User }>(`/api/admin/users/${userId}/status`, { status });
    return res.data;
  },

  // Comments Management
  async listComments(page = 1, limit = 20, status?: string) {
    let url = `/api/admin/comments?page=${page}&limit=${limit}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    const res = await api.get<{ comments: any[]; pagination: any }>(url);
    return res.data;
  },

  async updateCommentStatus(id: string, status: string) {
    const res = await api.patch<{ message: string }>(`/api/admin/comments/${id}/status`, { status });
    return res.data;
  },

  async deleteComment(id: string) {
    const res = await api.delete<{ message: string }>(`/api/admin/comments/${id}`);
    return res.data;
  },

  // Settings
  async getSettings() {
    const res = await api.get<{ settings: SiteSettings }>('/api/admin/settings');
    return res.data.settings;
  },

  async updateSettings(data: Partial<SiteSettings>) {
    const res = await api.put<{ message: string; settings: SiteSettings }>('/api/admin/settings', data);
    return res.data;
  },
};
