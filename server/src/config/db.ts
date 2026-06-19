import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

export async function connectDb(uri: string = env.MONGO_URI): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri);
  logger.info({ host: conn.connection.host, db: conn.connection.name }, 'MongoDB connected');
  return conn;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
