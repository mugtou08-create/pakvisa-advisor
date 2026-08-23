// Next.js Instrumentation - runs at server startup BEFORE any modules are loaded
// This sets a dummy DATABASE_URL so Prisma's internal schema validation passes.
// The actual Turso connection is handled by the PrismaLibSQL adapter in db.ts,
// which completely bypasses DATABASE_URL for real database operations.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.NODE_ENV === 'production') {
    // Override DATABASE_URL with a dummy SQLite path for Prisma's validation.
    // Prisma schema has provider = "sqlite" which requires "file:" URLs,
    // but Vercel's DATABASE_URL points to a Turso libsql:// URL.
    // The adapter handles the real connection, so this is purely for validation.
    // Only applies in production — development uses local SQLite directly.
    process.env.DATABASE_URL = 'file:./dummy.db';

    // Ensure all database tables exist on Turso.
    // This is needed because Prisma db push is not run on Vercel.
    // We use @libsql/client directly for DDL (CREATE TABLE IF NOT EXISTS).
    try {
      const { ensureAllTables } = await import('@/lib/ensure-tables');
      await ensureAllTables();
      console.log('[instrumentation] All Turso tables ensured');
    } catch (err) {
      console.error('[instrumentation] Failed to ensure tables:', err);
    }
  }
}
