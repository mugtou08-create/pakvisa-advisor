import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

const FALLBACK_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3NDczNTksImlkIjoiMDFhMDAyNzAtYTYwMS03N2M4LThjYzQtYjRmMGFkNGQwN2U4Iiwia2lkIjoiMFo3RGw0SktHOUYyZHdKRjFxYXZJU0Z0anllb0dzMG9iRHltTF9uSXJvYyIsInJpZCI6IjY1MThlNjAxLWFkYzQtNDU0My1iOGIxLWI5NjA0MjRlYTc1YyJ9.yb83UTEFumqIy7mMTFMlHDepc-Bf78cyeyQzGiGORKDSpgX2292-l-95Zx5hVzKJs4oHjxjYsGAj5xWBEWIBCw';
const FALLBACK_URL = 'libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io';

function createPrismaClient() {
  const envUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;

  // Extract base URL
  const baseUrl = (envUrl && envUrl.startsWith('libsql://'))
    ? envUrl.split('?')[0]
    : null;

  // Extract token from env URL query string
  let envToken: string | undefined;
  if (envUrl?.includes('authToken=')) {
    const match = envUrl.match(/authToken=([^&]+)/);
    if (match) envToken = match[1];
  }

  // Determine final URL with token
  const finalUrl = (() => {
    // If env URL already has token embedded, use it as-is
    if (envToken) return envUrl;
    // If we have a separate env token, append it
    if (process.env.TURSO_AUTH_TOKEN && baseUrl) return `${baseUrl}?authToken=${process.env.TURSO_AUTH_TOKEN}`;
    // Production fallback: use hardcoded token
    if (process.env.NODE_ENV === 'production') return `${FALLBACK_URL}?authToken=${FALLBACK_TOKEN}`;
    // No token available - use bare URL or local
    return envUrl || 'file:./db/custom.db';
  })();

  // CRITICAL: Set DATABASE_URL before creating PrismaClient
  // Prisma reads env("DATABASE_URL") from schema.prisma at instantiation
  process.env.DATABASE_URL = finalUrl;

  console.log(`[DB] Connecting to: ${finalUrl.substring(0, 50)}...`);

  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
