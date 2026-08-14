import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

function createTursoClient() {
  // Support multiple env var formats:
  // Format 1: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (separate)
  // Format 2: DATABASE_URL with authToken embedded (Prisma-compatible)
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoUrl.startsWith('libsql://')) {
    // Build connection URL with auth token
    let finalUrl = tursoUrl;
    if (tursoToken && !tursoUrl.includes('authToken')) {
      finalUrl = `${tursoUrl}?authToken=${tursoToken}`;
    }

    const libsql = createClient({ url: finalUrl });
    const adapter = new PrismaLibSql(libsql);
    return new PrismaClient({ adapter, log: ['error', 'warn'] });
  }

  // Fallback to local SQLite for development only
  console.warn('[DB] No Turso URL found, falling back to local SQLite');
  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createTursoClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
