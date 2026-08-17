import { NextResponse } from 'next/server';

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test 1: Raw libsql (same as before - should work)
  try {
    const { createClient } = await import('@libsql/client');
    const libsql = createClient({
      url: 'libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io',
      authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3NDczNTksImlkIjoiMDFhMDAyNzAtYTYwMS03N2M4LThjYzQtYjRmMGFkNGQwN2U4Iiwia2lkIjoiMFo3RGw0SktHOUYyZHdKRjFxYXZJU0Z0anllb0dzMG9iRHltTF9uSXJvYyIsInJpZCI6IjY1MThlNjAxLWFkYzQtNDU0My1iOGIxLWI5NjA0MjRlYTc1YyJ9.yb83UTEFumqIy7mMTFMlHDepc-Bf78cyeyQzGiGORKDSpgX2292-l-95Zx5hVzKJs4oHjxjYsGAj5xWBEWIBCw',
    });
    const r = await libsql.execute('SELECT count(*) as cnt FROM Country');
    results.rawLibsql = { ok: true, count: r.rows[0]?.cnt };
  } catch (e: unknown) {
    results.rawLibsql = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // Test 2: Prisma adapter (same path as db.ts)
  try {
    const { createClient: createLibsql } = await import('@libsql/client');
    const { PrismaLibSQL } = await import('@prisma/adapter-libsql');
    const { PrismaClient } = await import('@prisma/client');

    const libsql = createLibsql({
      url: 'libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io',
      authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3NDczNTksImlkIjoiMDFhMDAyNzAtYTYwMS03N2M4LThjYzQtYjRmMGFkNGQwN2U4Iiwia2lkIjoiMFo3RGw0SktHOUYyZHdKRjFxYXZJU0Z0anllb0dzMG9iRHltTF9uSXJvYyIsInJpZCI6IjY1MThlNjAxLWFkYzQtNDU0My1iOGIxLWI5NjA0MjRlYTc1YyJ9.yb83UTEFumqIy7mMTFMlHDepc-Bf78cyeyQzGiGORKDSpgX2292-l-95Zx5hVzKJs4oHjxjYsGAj5xWBEWIBCw',
    });
    const adapter = new PrismaLibSQL(libsql);
    const prisma = new PrismaClient({ adapter, log: ['error', 'warn'] });
    const count = await prisma.country.count();
    results.prismaAdapter = { ok: true, count };
    await prisma.$disconnect();
  } catch (e: unknown) {
    results.prismaAdapter = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      constructor: e?.constructor?.name,
    };
  }

  // Test 3: The actual db import
  try {
    const { db } = await import('@/lib/db');
    const count = await db.country.count();
    results.dbImport = { ok: true, count };
  } catch (e: unknown) {
    results.dbImport = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
      constructor: e?.constructor?.name,
      stack: e instanceof Error ? e.stack?.substring(0, 800) : undefined,
    };
  }

  // Test 4: Env vars
  results.env = {
    DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'MISSING',
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? 'SET' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json(results);
}
