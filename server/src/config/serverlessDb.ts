import mongoose from 'mongoose';
import { env } from './env';

/**
 * Serverless-safe Mongo connection.
 *
 * On a platform like Vercel each function invocation may reuse a "warm"
 * container. Opening a new connection per request would quickly exhaust the
 * database's connection pool, so we cache the connection promise on the global
 * object and reuse it across invocations.
 */
declare global {
  // eslint-disable-next-line no-var
  var __orbitMongo: Promise<typeof mongoose> | undefined;
}

export function connectToDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose);
  }
  if (!global.__orbitMongo) {
    mongoose.set('strictQuery', true);
    global.__orbitMongo = mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
    });
  }
  return global.__orbitMongo;
}
