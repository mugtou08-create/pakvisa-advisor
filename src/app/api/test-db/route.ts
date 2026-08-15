import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

export async function GET() {
  const tursoUrl = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
  const results: Record<string, string> = {};
  
  // Test 1: Raw libsql connection
  try {
    const libsql = createClient({ url: tursoUrl! });
    const r = await libsql.execute("SELECT COUNT(*) as c FROM Country");
    results.rawLibsql = `OK: ${r.rows[0].c} countries`;
  } catch (e: any) {
    results.rawLibsql = `FAIL: ${e.message?.substring(0, 200)}`;
  }
  
  // Test 2: Prisma with adapter
  try {
    const libsql = createClient({ url: tursoUrl! });
    const adapter = new PrismaLibSql(libsql);
    const prisma = new PrismaClient({ adapter });
    const count = await prisma.country.count();
    results.prisma = `OK: ${count} countries`;
    await prisma.$disconnect();
  } catch (e: any) {
    results.prisma = `FAIL: ${e.message?.substring(0, 300)}`;
  }
  
  return NextResponse.json({ envUrlPrefix: tursoUrl?.substring(0, 40), ...results });
}
