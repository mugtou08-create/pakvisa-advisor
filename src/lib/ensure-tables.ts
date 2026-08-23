import { createClient, type Client } from '@libsql/client';

// In production, connect directly to Turso to create tables if missing.
// Prisma's adapter doesn't support DDL (CREATE TABLE), so we use @libsql/client.
// In development, Prisma db push handles schema; this is a no-op.

let ensured = false;
let tursoClient: Client | null = null;

function getTursoClient(): Client | null {
  if (tursoClient) return tursoClient;
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) return null;
  tursoClient = createClient({ url, authToken: token });
  return tursoClient;
}

export async function ensureVisitorTable(): Promise<void> {
  if (ensured) return;
  if (process.env.NODE_ENV !== 'production') {
    // In dev, prisma db push handles schema
    ensured = true;
    return;
  }

  const client = getTursoClient();
  if (!client) {
    console.warn('[ensure-tables] No TURSO_DATABASE_URL/TURSO_AUTH_TOKEN, skipping table check');
    ensured = true;
    return;
  }

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "VisitorSession" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "sessionId" TEXT NOT NULL DEFAULT '',
        "ip" TEXT NOT NULL DEFAULT 'unknown',
        "country" TEXT NOT NULL DEFAULT '',
        "city" TEXT NOT NULL DEFAULT '',
        "page" TEXT NOT NULL DEFAULT '',
        "referrer" TEXT NOT NULL DEFAULT '',
        "userAgent" TEXT NOT NULL DEFAULT '',
        "lastSeen" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Create indexes
    await client.execute(`CREATE INDEX IF NOT EXISTS "VisitorSession_sessionId_idx" ON "VisitorSession"("sessionId")`);
    await client.execute(`CREATE INDEX IF NOT EXISTS "VisitorSession_lastSeen_idx" ON "VisitorSession"("lastSeen")`);
    await client.execute(`CREATE INDEX IF NOT EXISTS "VisitorSession_createdAt_idx" ON "VisitorSession"("createdAt")`);
    await client.execute(`CREATE INDEX IF NOT EXISTS "VisitorSession_country_idx" ON "VisitorSession"("country")`);
    console.log('[ensure-tables] VisitorSession table ensured');
  } catch (err) {
    console.error('[ensure-tables] Failed to create VisitorSession table:', err);
  }

  ensured = true;
}
