import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

const FALLBACK_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3NDczNTksImlkIjoiMDFhMDAyNzAtYTYwMS03N2M4LThjYzQtYjRmMGFkNGQwN2U4Iiwia2lkIjoiMFo3RGw0SktHOUYyZHdKRjFxYXZJU0Z0anllb0dzMG9iRHltTF9uSXJvYyIsInJpZCI6IjY1MThlNjAxLWFkYzQtNDU0My1iOGIxLWI5NjA0MjRlYTc1YyJ9.yb83UTEFumqIy7mMTFMlHDepc-Bf78cyeyQzGiGORKDSpgX2292-l-95Zx5hVzKJs4oHjxjYsGAj5xWBEWIBCw';
const FALLBACK_URL = 'libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io';

function createPrismaClient() {
  const envUrl = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;

  // For production: use Turso via adapter
  if (process.env.NODE_ENV === 'production') {
    const tursoUrl = (envUrl && envUrl.startsWith('libsql://'))
      ? envUrl.split('?')[0]
      : FALLBACK_URL;

    let token = process.env.TURSO_AUTH_TOKEN;
    if (!token && envUrl?.includes('authToken=')) {
      const match = envUrl.match(/authToken=([^&]+)/);
      if (match) token = match[1];
    }
    if (!token) token = FALLBACK_TOKEN;

    // KEY: Set DATABASE_URL to a dummy file path so Prisma's schema validation
    // (provider=sqlite expects file:) passes. The actual queries go through
    // the adapter, which uses the real libsql connection.
    process.env.DATABASE_URL = 'file:./dummy.db';

    const libsql = createClient({ url: tursoUrl, authToken: token });
    const adapter = new PrismaLibSQL(libsql);

    return new PrismaClient({ adapter, log: ['error', 'warn'] });
  }

  // Development: use local SQLite
  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
