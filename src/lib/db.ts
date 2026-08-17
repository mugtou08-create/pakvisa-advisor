import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
};

// Turso production credentials
const TURSO_URL = 'libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3NDczNTksImlkIjoiMDFhMDAyNzAtYTYwMS03N2M4LThjYzQtYjRmMGFkNGQwN2U4Iiwia2lkIjoiMFo3RGw0SktHOUYyZHdKRjFxYXZJU0Z0anllb0dzMG9iRHltTF9uSXJvYyIsInJpZCI6IjY1MThlNjAxLWFkYzQtNDU0My1iOGIxLWI5NjA0MjRlYTc1YyJ9.yb83UTEFumqIy7mMTFMlHDepc-Bf78cyeyQzGiGORKDSpgX2292-l-95Zx5hVzKJs4oHjxjYsGAj5xWBEWIBCw';

function createPrismaClient() {
  // Production: connect to Turso via Prisma adapter
  if (process.env.NODE_ENV === 'production') {
    // Safety net: ensure DATABASE_URL is a valid SQLite path for Prisma's
    // internal schema validation. The adapter handles the real Turso connection.
    process.env.DATABASE_URL = 'file:./dummy.db';

    const libsql = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter, log: ['error', 'warn'] });
  }

  // Development: local SQLite
  return new PrismaClient({ log: ['error', 'warn'] });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
