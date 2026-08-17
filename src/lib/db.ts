import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

const FALLBACK_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3NDczNTksImlkIjoiMDFhMDAyNzAtYTYwMS03N2M4LThjYzQtYjRmMGFkNGQwN2U4Iiwia2lkIjoiMFo3RGw0SktHOUYyZHdKRjFxYXZJU0Z0anllb0dzMG9iRHltTF9uSXJvYyIsInJpZCI6IjY1MThlNjAxLWFkYzQtNDU0My1iOGIxLWI5NjA0MjRlYTc1YyJ9.yb83UTEFumqIy7mMTFMlHDepc-Bf78cyeyQzGiGORKDSpgX2292-l-95Zx5hVzKJs4oHjxjYsGAj5xWBEWIBCw';
const FALLBACK_URL = 'libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io';

function createPrismaClient() {
  const envUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;

  // Determine URL
  let url: string | null = (envUrl && envUrl.startsWith('libsql://'))
    ? envUrl.split('?')[0]
    : (process.env.NODE_ENV === 'production' ? FALLBACK_URL : null);

  if (!url) {
    // Development: use local SQLite
    return new PrismaClient({ log: ['error', 'warn'] });
  }

  // Determine auth token
  let token = process.env.TURSO_AUTH_TOKEN;
  if (!token && envUrl?.includes('authToken=')) {
    const match = envUrl.match(/authToken=([^&]+)/);
    if (match) token = match[1];
  }
  if (!token && process.env.NODE_ENV === 'production') {
    token = FALLBACK_TOKEN;
  }

  // Embed token in DATABASE_URL for Prisma's native libsql support
  const fullUrl = token ? `${url}?authToken=${token}` : url;
  process.env.DATABASE_URL = fullUrl;

  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
