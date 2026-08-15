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
    try {
      const baseUrl = tursoUrl.split('?')[0]; // strip any query params
      const libsql = tursoToken
        ? createClient({ url: baseUrl, authToken: tursoToken })
        : createClient({ url: baseUrl });
      const adapter = new PrismaLibSql(libsql);
      return new PrismaClient({ adapter, log: ['error', 'warn'] });
    } catch (error) {
      throw new Error(
        `Failed to create Turso client: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // In production, DATABASE_URL is required — no silent fallback
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'DATABASE_URL (libsql://) is required in production. ' +
      'Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.'
    );
  }

  // Fallback to local SQLite for development only
  console.warn('[DB] No Turso URL found, falling back to local SQLite (development only)');
  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createTursoClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
