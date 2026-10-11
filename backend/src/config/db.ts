import mongoose from 'mongoose';
import { env } from './env.js';

let gridFSBucket: mongoose.mongo.GridFSBucket | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    if (mongoose.connection.db) {
      gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: env.GRIDFS_BUCKET_NAME,
      });
      console.log(`[Database] MongoDB connected. GridFS bucket '${env.GRIDFS_BUCKET_NAME}' initialized.`);
    }

    return conn;
  } catch (error) {
    console.error('[Database] MongoDB connection failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export function getGridFSBucket(): mongoose.mongo.GridFSBucket {
  if (!gridFSBucket) {
    if (mongoose.connection.db) {
      gridFSBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: env.GRIDFS_BUCKET_NAME,
      });
      return gridFSBucket;
    }
    throw new Error('GridFSBucket is not initialized. Database is not connected.');
  }
  return gridFSBucket;
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    gridFSBucket = null;
  }
}
