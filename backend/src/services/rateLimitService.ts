import { RateLimitRecord } from '../models/RateLimit.js';

export interface RateLimitCheckResult {
  isBlocked: boolean;
  retryAfterSeconds: number;
}

/**
 * Service to manage failed login attempts and endpoint throttling.
 * Persisted in MongoDB for cluster/distributed deployment safety.
 */
export class RateLimitService {
  /**
   * Checks if an IP or account key is currently blocked.
   */
  static async isKeyBlocked(key: string): Promise<RateLimitCheckResult> {
    try {
      const record = await RateLimitRecord.findOne({ key });
      if (!record) {
        return { isBlocked: false, retryAfterSeconds: 0 };
      }

      const now = new Date();

      // Check if explicitly blocked
      if (record.blockedUntil && record.blockedUntil > now) {
        const retryAfterSeconds = Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000);
        return { isBlocked: true, retryAfterSeconds };
      }

      // Check if window has expired
      if (record.windowExpiresAt < now) {
        await RateLimitRecord.deleteOne({ key });
        return { isBlocked: false, retryAfterSeconds: 0 };
      }

      return { isBlocked: false, retryAfterSeconds: 0 };
    } catch {
      // In case of DB hiccup, fail open or safe without leaking
      return { isBlocked: false, retryAfterSeconds: 0 };
    }
  }

  /**
   * Records a failed login attempt for an IP or account key.
   * If threshold (5 failures) reached within rolling window (10 mins), sets blockedUntil to now + 10 mins.
   */
  static async recordFailedLogin(
    key: string,
    maxFailures = 5,
    windowMs = 10 * 60 * 1000,
    blockDurationMs = 10 * 60 * 1000
  ): Promise<RateLimitCheckResult> {
    try {
      const now = new Date();
      let record = await RateLimitRecord.findOne({ key });

      if (!record || record.windowExpiresAt < now) {
        // Start new window
        record = new RateLimitRecord({
          key,
          attempts: 1,
          windowExpiresAt: new Date(now.getTime() + windowMs),
          blockedUntil: null,
        });
        await record.save();
        return { isBlocked: false, retryAfterSeconds: 0 };
      }

      record.attempts += 1;

      if (record.attempts >= maxFailures) {
        const blockedUntil = new Date(now.getTime() + blockDurationMs);
        record.blockedUntil = blockedUntil;
        record.windowExpiresAt = blockedUntil; // extend window to cover block
        await record.save();
        const retryAfterSeconds = Math.ceil(blockDurationMs / 1000);
        return { isBlocked: true, retryAfterSeconds };
      }

      await record.save();
      return { isBlocked: false, retryAfterSeconds: 0 };
    } catch {
      return { isBlocked: false, retryAfterSeconds: 0 };
    }
  }

  /**
   * Clears failed login counter upon successful authentication.
   */
  static async clearFailedLogins(key: string): Promise<void> {
    try {
      await RateLimitRecord.deleteOne({ key });
    } catch {
      // Ignore
    }
  }

  /**
   * Generic rolling window rate limiter for general endpoints.
   */
  static async checkGeneralLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
    try {
      const now = new Date();
      let record = await RateLimitRecord.findOne({ key });

      if (!record || record.windowExpiresAt < now) {
        record = new RateLimitRecord({
          key,
          attempts: 1,
          windowExpiresAt: new Date(now.getTime() + windowMs),
        });
        await record.save();
        return { allowed: true, retryAfterSeconds: 0 };
      }

      if (record.attempts >= maxRequests) {
        const retryAfterSeconds = Math.max(1, Math.ceil((record.windowExpiresAt.getTime() - now.getTime()) / 1000));
        return { allowed: false, retryAfterSeconds };
      }

      record.attempts += 1;
      await record.save();
      return { allowed: true, retryAfterSeconds: 0 };
    } catch {
      return { allowed: true, retryAfterSeconds: 0 };
    }
  }
}
