import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

// Turso production credentials — read from environment variables (set in Vercel)
const TURSO_URL = process.env.TURSO_DATABASE_URL!;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN!;

function createPrismaClient() {
  // Production: connect to Turso via Prisma adapter
  // PrismaLibSQL is a factory that expects a config object { url, authToken },
  // NOT a pre-created libsql client. It handles createClient internally.
  if (process.env.NODE_ENV === 'production') {
    process.env.DATABASE_URL = 'file:./dummy.db';

    const adapter = new PrismaLibSQL({ url: TURSO_URL, authToken: TURSO_TOKEN });
    return new PrismaClient({ adapter, log: ['error', 'warn'] });
  }

  // Development: local SQLite
  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
