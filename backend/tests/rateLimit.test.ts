import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RateLimitService } from '../src/services/rateLimitService.js';
import { RateLimitRecord } from '../src/models/RateLimit.js';

describe('Login Rate Limiter & Cooldown Protection', () => {
  // In-memory record store for testing
  const memoryStore = new Map<string, {
    key: string;
    attempts: number;
    windowExpiresAt: Date;
    blockedUntil: Date | null;
  }>();

  beforeEach(() => {
    memoryStore.clear();

    vi.spyOn(RateLimitRecord, 'findOne').mockImplementation((async ({ key }: { key: string }) => {
      const data = memoryStore.get(key);
      if (!data) return null;

      // Return a simulated document
      return {
        key: data.key,
        attempts: data.attempts,
        windowExpiresAt: data.windowExpiresAt,
        blockedUntil: data.blockedUntil,
        save: async function () {
          memoryStore.set(key, {
            key: this.key,
            attempts: this.attempts,
            windowExpiresAt: this.windowExpiresAt,
            blockedUntil: this.blockedUntil,
          });
          return this;
        },
      };
    }) as any);

    vi.spyOn(RateLimitRecord, 'deleteOne').mockImplementation((async ({ key }: { key: string }) => {
      memoryStore.delete(key);
      return { deletedCount: 1 };
    }) as any);

    // Mock document creation & save
    vi.spyOn(RateLimitRecord.prototype, 'save').mockImplementation(async function (this: any) {
      const key = this.get ? this.get('key') : this.key;
      const attempts = this.get ? this.get('attempts') : this.attempts;
      const windowExpiresAt = this.get ? this.get('windowExpiresAt') : this.windowExpiresAt;
      const blockedUntil = this.get ? this.get('blockedUntil') : this.blockedUntil;

      memoryStore.set(key, {
        key,
        attempts: attempts ?? 1,
        windowExpiresAt,
        blockedUntil,
      });
      return this;
    });
  });

  it('should not block on the first 4 failed attempts within the 10-minute window', async () => {
    const testKey = 'login:ip:192.168.1.100';

    for (let attempt = 1; attempt <= 4; attempt++) {
      const result = await RateLimitService.recordFailedLogin(testKey, 5, 600000, 600000);
      expect(result.isBlocked).toBe(false);
      expect(result.retryAfterSeconds).toBe(0);
    }
  });

  it('should block on the 5th failed attempt and enforce a 10-minute cooldown (600 seconds)', async () => {
    const testKey = 'login:ip:192.168.1.101';

    for (let attempt = 1; attempt <= 4; attempt++) {
      const r = await RateLimitService.recordFailedLogin(testKey, 5, 600000, 600000);
      expect(r.isBlocked).toBe(false);
    }

    // 5th attempt
    const fifthResult = await RateLimitService.recordFailedLogin(testKey, 5, 600000, 600000);
    expect(fifthResult.isBlocked).toBe(true);
    expect(fifthResult.retryAfterSeconds).toBeGreaterThanOrEqual(590);
    expect(fifthResult.retryAfterSeconds).toBeLessThanOrEqual(600);

    // Subsequent check verifies it remains blocked
    const checkResult = await RateLimitService.isKeyBlocked(testKey);
    expect(checkResult.isBlocked).toBe(true);
    expect(checkResult.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('should apply identical throttling to normalized account identifiers', async () => {
    const accountKey = 'login:acc:victim@example.com';

    for (let attempt = 1; attempt <= 5; attempt++) {
      await RateLimitService.recordFailedLogin(accountKey, 5, 600000, 600000);
    }

    const check = await RateLimitService.isKeyBlocked(accountKey);
    expect(check.isBlocked).toBe(true);
    expect(check.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('should reset failed login count on clearFailedLogins after successful login', async () => {
    const testKey = 'login:ip:192.168.1.102';

    await RateLimitService.recordFailedLogin(testKey, 5, 600000, 600000);
    await RateLimitService.recordFailedLogin(testKey, 5, 600000, 600000);

    await RateLimitService.clearFailedLogins(testKey);

    const check = await RateLimitService.isKeyBlocked(testKey);
    expect(check.isBlocked).toBe(false);
    expect(memoryStore.has(testKey)).toBe(false);
  });

  it('should block admin login requests when admin_login IP key is throttled', async () => {
    const { checkLoginRateLimit } = await import('../src/middleware/rateLimitMiddleware.js');
    const adminIpKey = 'admin_login:ip:10.0.0.5';

    // Record 5 failed admin attempts
    for (let i = 0; i < 5; i++) {
      await RateLimitService.recordFailedLogin(adminIpKey, 5, 600000, 600000);
    }

    let status = 0;
    let jsonBody: any = null;
    let headers: Record<string, string> = {};

    const req: any = {
      originalUrl: '/api/admin/auth/login',
      socket: { remoteAddress: '10.0.0.5' },
      body: { email: 'admin@example.com' },
    };

    const res: any = {
      setHeader: (k: string, v: string) => { headers[k] = v; },
      status: (code: number) => {
        status = code;
        return {
          json: (data: any) => { jsonBody = data; },
        };
      },
    };

    let nextCalled = false;
    await checkLoginRateLimit(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(status).toBe(429);
    expect(headers['Retry-After']).toBeDefined();
    expect(jsonBody?.error).toContain('Too many requests');
  });
});
