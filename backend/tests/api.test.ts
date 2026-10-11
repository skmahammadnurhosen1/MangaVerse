import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('API Route Boundaries & RBAC Authorization Protection', () => {
  const app = createApp();

  it('GET /api/health should respond with 200 and sanitized health status without leaking secrets', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('MangaVerse Backend');
    // Ensure no sensitive config leaked
    expect(res.body.MONGODB_URI).toBeUndefined();
    expect(res.body.USER_SESSION_SECRET).toBeUndefined();
  });

  it('GET /api/admin/stats should reject unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/admin/stats');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Administrative authorization required');
  });

  it('GET /api/admin/manga should reject unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/admin/manga');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Administrative authorization required');
  });

  it('GET /api/admin/users should reject unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/admin/users');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Administrative authorization required');
  });

  it('GET /api/library/bookmarks should reject unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/library/bookmarks');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });

  it('GET /api/nonexistent-endpoint should respond with sanitized 404', async () => {
    const res = await request(app).get('/api/nonexistent-endpoint');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Endpoint not found');
  });

  it('POST /api/auth/register should reject empty or malformed payload with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('x-test-bypass-csrf', 'true')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('GET /api/auth/csrf-token should return a valid 64-hex CSRF token and set cookie', async () => {
    const res = await request(app).get('/api/auth/csrf-token');

    expect(res.status).toBe(200);
    expect(res.body.csrfToken).toBeDefined();
    expect(res.body.csrfToken).toMatch(/^[0-9a-fA-F]{64}$/);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    expect(setCookie.some((c: string) => c.includes('mv_csrf'))).toBe(true);
  });

  it('POST /api/auth/register should validate real CSRF token from /api/auth/csrf-token without test bypass', async () => {
    // 1. Fetch CSRF token
    const csrfRes = await request(app).get('/api/auth/csrf-token');
    const token = csrfRes.body.csrfToken;
    const cookie = csrfRes.headers['set-cookie'];

    // 2. Submit mutating POST with token and cookie
    const res = await request(app)
      .post('/api/auth/register')
      .set('Cookie', cookie)
      .set('X-CSRF-Token', token)
      .set('Origin', 'http://localhost:5173')
      .send({});

    // Should NOT be 403 CSRF error, should proceed to 400 Validation error
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('GET /api/admin/auth/csrf-token should return a valid CSRF token for administrative session', async () => {
    const res = await request(app).get('/api/admin/auth/csrf-token');

    expect(res.status).toBe(200);
    expect(res.body.csrfToken).toBeDefined();
    expect(res.body.csrfToken).toMatch(/^[0-9a-fA-F]{64}$/);
  });
});
