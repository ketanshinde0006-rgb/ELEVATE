import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Reuse client in development to avoid too many connections
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  prisma = globalThis.__prisma;
}

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    // Don't crash — let the app run; endpoints will return DB errors gracefully
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

export default prisma;
