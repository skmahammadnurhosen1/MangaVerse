import { Schema, model, Document } from 'mongoose';

export interface IRateLimitRecord extends Document {
  key: string;              // e.g., 'login:ip:1.2.3.4' or 'login:account:test@example.com'
  attempts: number;         // number of failed attempts or hits
  windowExpiresAt: Date;    // when the rolling window resets
  blockedUntil?: Date;      // if blocked, until when
  createdAt: Date;
  updatedAt: Date;
}

const rateLimitSchema = new Schema<IRateLimitRecord>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 1,
    },
    windowExpiresAt: {
      type: Date,
      required: true,
    },
    blockedUntil: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL index to automatically purge expired records
rateLimitSchema.index({ windowExpiresAt: 1 }, { expireAfterSeconds: 3600 });

export const RateLimitRecord = model<IRateLimitRecord>('RateLimitRecord', rateLimitSchema);
