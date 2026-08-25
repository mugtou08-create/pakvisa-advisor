import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

function createPrismaClient() {
  // Production: connect to Turso via Prisma adapter
  if (process.env.NODE_ENV === 'production' && process.env.TURSO_DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dummy.db';

    const adapter = new PrismaLibSQL({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter, log: ['error', 'warn'] });
  }

  // Development: local SQLite
  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
