import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();

  // Rate limit: 10 per minute
  if (!rateLimit(ip, 10, 60000)) {
    return NextResponse.json({ ok: true });
  }

  try {
    const { query, results = 0 } = await request.json();
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ ok: true });
    }

    await db.searchLog.create({
      data: { query: query.trim().substring(0, 200), ip, results: typeof results === 'number' ? results : 0 },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
