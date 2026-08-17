import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

function createTursoClient() {
  // Priority: env var > hardcoded production fallback
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;

  if (tursoUrl && tursoUrl.startsWith('libsql://')) {
    try {
      const tursoToken = process.env.TURSO_AUTH_TOKEN;
      const baseUrl = tursoUrl.split('?')[0];
      const libsql = createClient({ url: baseUrl, authToken: tursoToken || undefined });
      const adapter = new PrismaLibSQL(libsql);
      return new PrismaClient({ adapter, log: ['error', 'warn'] });
    } catch (error) {
      throw new Error(
        `Failed to create Turso client: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Production fallback: hardcoded Turso connection
  if (process.env.NODE_ENV === 'production') {
    try {
      const libsql = createClient({
        url: 'libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io',
        authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3NDczNTksImlkIjoiMDFhMDAyNzAtYTYwMS03N2M4LThjYzQtYjRmMGFkNGQwN2U4Iiwia2lkIjoiMFo3RGw0SktHOUYyZHdKRjFxYXZJU0Z0anllb0dzMG9iRHltTF9uSXJvYyIsInJpZCI6IjY1MThlNjAxLWFkYzQtNDU0My1iOGIxLWI5NjA0MjRlYTc1YyJ9.yb83UTEFumqIy7mMTFMlHDepc-Bf78cyeyQzGiGORKDSpgX2292-l-95Zx5hVzKJs4oHjxjYsGAj5xWBEWIBCw',
      });
      const adapter = new PrismaLibSQL(libsql);
      return new PrismaClient({ adapter, log: ['error', 'warn'] });
    } catch (error) {
      throw new Error(
        `Failed to create Turso client (production fallback): ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Development only: local SQLite
  console.warn('[DB] No Turso URL found, falling back to local SQLite (development only)');
  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createTursoClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
