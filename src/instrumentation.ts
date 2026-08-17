// Next.js Instrumentation - runs at server startup BEFORE any modules are loaded
// This sets a dummy DATABASE_URL so Prisma's internal schema validation passes.
// The actual Turso connection is handled by the PrismaLibSQL adapter in db.ts,
// which completely bypasses DATABASE_URL for real database operations.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Override DATABASE_URL with a dummy SQLite path for Prisma's validation.
    // Prisma schema has provider = "sqlite" which requires "file:" URLs,
    // but Vercel's DATABASE_URL points to a Turso libsql:// URL.
    // The adapter handles the real connection, so this is purely for validation.
    process.env.DATABASE_URL = 'file:./dummy.db';
  }
}
