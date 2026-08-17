import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

// Production Turso fallback (remove once Vercel env vars are confirmed working)
const PROD_TURSO_URL = 'libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io';
const PROD_TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN as string | undefined;

function createTursoClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;

  // Determine connection: env var > production fallback
  const url = (tursoUrl && tursoUrl.startsWith('libsql://'))
    ? tursoUrl
    : (process.env.NODE_ENV === 'production' ? PROD_TURSO_URL : null);

  if (url) {
    try {
      const libsql = createClient({ url, authToken: PROD_TURSO_TOKEN });
      const adapter = new PrismaLibSQL(libsql);
      return new PrismaClient({ adapter, log: ['error', 'warn'] });
    } catch (error) {
      throw new Error(
        `Failed to create Turso client: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Development only: local SQLite fallback
  console.warn('[DB] No Turso URL found, falling back to local SQLite (development only)');
  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createTursoClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
