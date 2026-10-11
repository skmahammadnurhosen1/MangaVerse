import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Necessary for cookie-based sessions
  headers: {
    'Content-Type': 'application/json',
  },
});

let csrfTokenCache: string | null = null;
let csrfPromise: Promise<string> | null = null;

export function setCsrfToken(token: string): void {
  csrfTokenCache = token;
}

export function clearCsrfCache(): void {
  csrfTokenCache = null;
}

export async function fetchCsrfToken(): Promise<string> {
  if (csrfTokenCache) return csrfTokenCache;

  if (!csrfPromise) {
    csrfPromise = api
      .get<{ csrfToken: string }>('/api/csrf-token')
      .catch(() => api.get<{ csrfToken: string }>('/api/auth/csrf-token'))
      .then((res) => {
        csrfTokenCache = res.data.csrfToken;
        csrfPromise = null;
        return csrfTokenCache;
      })
      .catch((err) => {
        csrfPromise = null;
        throw err;
      });
  }

  return csrfPromise;
}

// Request interceptor to attach CSRF token for mutating requests
api.interceptors.request.use(async (config) => {
  const method = (config.method || '').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      const token = await fetchCsrfToken();
      if (token) {
        config.headers['X-CSRF-Token'] = token;
      }
    } catch {
      // Allow proceeding if backend doesn't require or is offline
    }
  }
  return config;
});

// Response interceptor to handle errors and auto-sync CSRF tokens uniformly
api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && response.data.csrfToken) {
      setCsrfToken(response.data.csrfToken);
    }
    return response;
  },
  (error: AxiosError<{ error?: string; message?: string; retryAfter?: number }>) => {
    if (error.response?.status === 403 && error.response.data?.error?.includes('CSRF')) {
      clearCsrfCache();
    }
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);

export function getAssetUrl(path: string | undefined): string {
  if (!path) return '/images/hero-character.jpg';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/images/')) return path; // local static asset
  return `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
}
