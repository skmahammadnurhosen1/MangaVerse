import { api, clearCsrfCache } from './api';
import { User } from '../types';

export const authService = {
  async register(data: { username: string; email: string; password: string; passwordConfirm: string }) {
    const res = await api.post<{ message: string; user: User }>('/api/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await api.post<{ message: string; user: User }>('/api/auth/login', data);
    return res.data;
  },

  async logout() {
    const res = await api.post<{ message: string }>('/api/auth/logout');
    clearCsrfCache();
    return res.data;
  },

  async getMe() {
    const res = await api.get<{ user: User }>('/api/auth/me');
    return res.data.user;
  },

  async changePassword(data: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    const res = await api.post<{ message: string }>('/api/auth/change-password', data);
    return res.data;
  },
};
