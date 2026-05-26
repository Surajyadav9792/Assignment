import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let cached = global._ffMongo;
if (!cached) cached = global._ffMongo = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.MONGO_URI, { serverSelectionTimeoutMS: 8000 })
      .then((m) => {
        logger.info(`MongoDB connected: ${m.connection.host}/${m.connection.name}`);
        return m;
      })
      .catch((err) => {
        logger.error(`MongoDB connection error: ${err.message}`);
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
