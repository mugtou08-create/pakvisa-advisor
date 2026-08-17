import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

const FALLBACK_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3NDczNTksImlkIjoiMDFhMDAyNzAtYTYwMS03N2M4LThjYzQtYjRmMGFkNGQwN2U4Iiwia2lkIjoiMFo3RGw0SktHOUYyZHdKRjFxYXZJU0Z0anllb0dzMG9iRHltTF9uSXJvYyIsInJpZCI6IjY1MThlNjAxLWFkYzQtNDU0My1iOGIxLWI5NjA0MjRlYTc1YyJ9.yb83UTEFumqIy7mMTFMlHDepc-Bf78cyeyQzGiGORKDSpgX2292-l-95Zx5hVzKJs4oHjxjYsGAj5xWBEWIBCw';

function createTursoClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;

  // Determine URL: env var or hardcoded fallback
  const url = (tursoUrl && tursoUrl.startsWith('libsql://'))
    ? tursoUrl.split('?')[0]
    : (process.env.NODE_ENV === 'production'
      ? 'libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io'
      : null);

  if (url) {
    try {
      // Auth token: env var > embedded in URL > hardcoded fallback
      let token = process.env.TURSO_AUTH_TOKEN;
      if (!token && tursoUrl?.includes('authToken=')) {
        const match = tursoUrl.match(/authToken=([^&]+)/);
        if (match) token = match[1];
      }
      if (!token && process.env.NODE_ENV === 'production') {
        token = FALLBACK_TOKEN;
      }

      const libsql = createClient({ url, authToken: token });
      const adapter = new PrismaLibSQL(libsql);
      return new PrismaClient({ adapter, log: ['error', 'warn'] });
    } catch (error) {
      throw new Error(
        `Failed to create Turso client: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Development only: local SQLite
  console.warn('[DB] No Turso URL found, falling back to local SQLite (development only)');
  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createTursoClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
