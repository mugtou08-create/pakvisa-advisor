import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

function createTursoClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (url && token) {
    const libsql = createClient({
      url: url.includes('authToken') ? url : `${url}?authToken=${token}`,
    });
    const adapter = new PrismaLibSql(libsql);
    return new PrismaClient({ adapter, log: ['error', 'warn'] });
  }

  // Fallback to local SQLite for development
  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createTursoClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
