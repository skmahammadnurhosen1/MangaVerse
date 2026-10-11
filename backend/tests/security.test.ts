import { describe, it, expect } from 'vitest';
import { validateFileMagicBytes } from '../src/services/gridfsService.js';
import { csrfProtection } from '../src/middleware/csrfMiddleware.js';

describe('Application Security & Upload Defense', () => {
  describe('File Magic Bytes Validation', () => {
    it('should validate genuine JPEG headers (FF D8 FF)', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
      const result = validateFileMagicBytes(jpegBuffer);
      expect(result.valid).toBe(true);
      expect(result.contentType).toBe('image/jpeg');
    });

    it('should validate genuine PNG headers (89 50 4E 47 0D 0A 1A 0A)', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
      const result = validateFileMagicBytes(pngBuffer);
      expect(result.valid).toBe(true);
      expect(result.contentType).toBe('image/png');
    });

    it('should validate genuine WEBP headers (RIFF....WEBP)', () => {
      const webpBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x20, 0x00, 0x00, 0x00, // size
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      const result = validateFileMagicBytes(webpBuffer);
      expect(result.valid).toBe(true);
      expect(result.contentType).toBe('image/webp');
    });

    it('should validate genuine PDF headers (%PDF-)', () => {
      const pdfBuffer = Buffer.from('%PDF-1.7 header content here');
      const result = validateFileMagicBytes(pdfBuffer);
      expect(result.valid).toBe(true);
      expect(result.contentType).toBe('application/pdf');
    });

    it('should strictly reject SVG, HTML, scripts and executables disguised as images', () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      const htmlBuffer = Buffer.from('<!DOCTYPE html><html><body>malicious payload</body></html>');
      const exeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00'); // Windows PE header

      expect(validateFileMagicBytes(svgBuffer).valid).toBe(false);
      expect(validateFileMagicBytes(htmlBuffer).valid).toBe(false);
      expect(validateFileMagicBytes(exeBuffer).valid).toBe(false);
    });
  });

  describe('CSRF Protection Middleware', () => {
    it('should allow safe GET, HEAD, OPTIONS requests without CSRF verification', () => {
      let nextCalled = false;
      const req: any = { method: 'GET' };
      const res: any = {};
      const next = () => { nextCalled = true; };

      csrfProtection(req, res, next);
      expect(nextCalled).toBe(true);
    });

    it('should block POST requests with missing or invalid CSRF token', () => {
      let statusCode = 0;
      let errorResponse: any = null;

      const req: any = {
        method: 'POST',
        headers: { origin: 'http://localhost:5173' },
        session: { csrfToken: 'session-secret-token-32-chars-long' },
      };
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (payload: any) => { errorResponse = payload; },
          };
        },
      };
      const next = () => {};

      csrfProtection(req, res, next);
      expect(statusCode).toBe(403);
      expect(errorResponse?.error).toBeDefined();
    });

    it('should reject requests with untrusted Origin header', () => {
      let statusCode = 0;
      let errorResponse: any = null;

      const req: any = {
        method: 'POST',
        headers: { origin: 'https://evil-hacker-site.com' },
        session: { csrfToken: 'valid-token' },
      };
      const res: any = {
        status: (code: number) => {
          statusCode = code;
          return {
            json: (payload: any) => { errorResponse = payload; },
          };
        },
      };
      const next = () => {};

      csrfProtection(req, res, next);
      expect(statusCode).toBe(403);
      expect(errorResponse?.error).toContain('Untrusted Origin');
    });

    it('should allow POST request with valid CSRF token matching session', () => {
      let nextCalled = false;
      const testToken = 'a'.repeat(64);
      const req: any = {
        method: 'POST',
        headers: { origin: 'http://localhost:5173', 'x-csrf-token': testToken },
        session: { csrfToken: testToken },
      };
      const res: any = {};
      const next = () => { nextCalled = true; };

      csrfProtection(req, res, next);
      expect(nextCalled).toBe(true);
    });

    it('should allow POST request with valid CSRF token matching mv_csrf cookie (double-submit)', () => {
      let nextCalled = false;
      const testToken = 'b'.repeat(64);
      const req: any = {
        method: 'POST',
        headers: { origin: 'http://localhost:5173', 'x-csrf-token': testToken },
        cookies: { mv_csrf: testToken },
      };
      const res: any = {};
      const next = () => { nextCalled = true; };

      csrfProtection(req, res, next);
      expect(nextCalled).toBe(true);
    });

    it('should safely handle malformed Referer headers without throwing URL parsing exceptions', () => {
      let nextCalled = false;
      const testToken = 'c'.repeat(64);
      const req: any = {
        method: 'POST',
        headers: { referer: 'not-a-valid-url-at-all', 'x-csrf-token': testToken },
        session: { csrfToken: testToken },
      };
      const res: any = {};
      const next = () => { nextCalled = true; };

      expect(() => csrfProtection(req, res, next)).not.toThrow();
      expect(nextCalled).toBe(true);
    });
  });
});
