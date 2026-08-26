import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const count = await db.country.count();
    return NextResponse.json({ success: true, count, env: process.env.NODE_ENV });
  } catch (e: unknown) {
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : String(e),
      constructor: e?.constructor?.name,
    }, { status: 500 });
  }
}
