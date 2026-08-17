import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

const FALLBACK_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3NDczNTksImlkIjoiMDFhMDAyNzAtYTYwMS03N2M4LThjYzQtYjRmMGFkNGQwN2U4Iiwia2lkIjoiMFo3RGw0SktHOUYyZHdKRjFxYXZJU0Z0anllb0dzMG9iRHltTF9uSXJvYyIsInJpZCI6IjY1MThlNjAxLWFkYzQtNDU0My1iOGIxLWI5NjA0MjRlYTc1YyJ9.yb83UTEFumqIy7mMTFMlHDepc-Bf78cyeyQzGiGORKDSpgX2292-l-95Zx5hVzKJs4oHjxjYsGAj5xWBEWIBCw';
const FALLBACK_URL = 'libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io';

function createTursoClient() {
  const envUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;

  // Determine URL
  let url = (envUrl && envUrl.startsWith('libsql://'))
    ? envUrl.split('?')[0]
    : (process.env.NODE_ENV === 'production' ? FALLBACK_URL : null);

  if (!url) {
    console.warn('[DB] No Turso URL found, falling back to local SQLite (development only)');
    return new PrismaClient({ log: ['error', 'warn'] });
  }

  // Determine auth token: env var > embedded in URL > fallback
  let token = process.env.TURSO_AUTH_TOKEN;
  if (!token && envUrl?.includes('authToken=')) {
    const match = envUrl.match(/authToken=([^&]+)/);
    if (match) token = match[1];
  }
  if (!token && process.env.NODE_ENV === 'production') {
    token = FALLBACK_TOKEN;
  }

  try {
    const libsql = createClient({ url, authToken: token });
    const adapter = new PrismaLibSQL(libsql);

    // KEY FIX: Also set DATABASE_URL with embedded token so Prisma's
    // internal connection (used by generateClient) doesn't fail.
    // The adapter handles actual queries, but Prisma still validates
    // DATABASE_URL at instantiation time.
    const effectiveUrl = token
      ? `${url}?authToken=${token}`
      : url;
    process.env.DATABASE_URL = effectiveUrl;

    return new PrismaClient({ adapter, log: ['error', 'warn'] });
  } catch (error) {
    throw new Error(
      `Failed to create Turso client: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const db = globalForPrisma.prisma ?? createTursoClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
