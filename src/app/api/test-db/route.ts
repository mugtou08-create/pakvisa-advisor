import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const count = await db.country.count();
    return NextResponse.json({ success: true, count, url: process.env.DATABASE_URL?.substring(0, 60) });
  } catch (e: unknown) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
      databaseUrl: process.env.DATABASE_URL?.substring(0, 60) || 'NOT_SET',
    }, { status: 500 });
  }
}
