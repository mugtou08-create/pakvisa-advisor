import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

function createTursoClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoUrl.startsWith('libsql://')) {
    try {
      // Check if auth token is embedded in URL query string
      const hasEmbeddedToken = tursoUrl.includes('authToken=');
      
      let libsql;
      if (tursoToken) {
        // Prefer explicit TURSO_AUTH_TOKEN, strip query from URL
        const baseUrl = tursoUrl.split('?')[0];
        libsql = createClient({ url: baseUrl, authToken: tursoToken });
      } else if (hasEmbeddedToken) {
        // Use the URL as-is (auth token embedded in query string)
        libsql = createClient({ url: tursoUrl });
      } else {
        // No auth token at all
        const baseUrl = tursoUrl.split('?')[0];
        libsql = createClient({ url: baseUrl });
      }
      
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
      'DATABASE_URL (libsql://) is required in production.'
    );
  }

  // Fallback to local SQLite for development only
  console.warn('[DB] No Turso URL found, falling back to local SQLite (development only)');
  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createTursoClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
