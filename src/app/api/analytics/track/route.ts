import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

const VALID_EVENTS = [
  'page_view',
  'country_view',
  'search',
  'comparison',
  'score_generated',
  'chat_message',
  'newsletter_signup',
] as const;

type EventType = (typeof VALID_EVENTS)[number];

function isValidEvent(event: unknown): event is EventType {
  return typeof event === 'string' && (VALID_EVENTS as readonly string[]).includes(event);
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    if (!rateLimit(ip, 30, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { event, data } = body as { event?: unknown; data?: Record<string, unknown> };

    if (!event || !isValidEvent(event)) {
      return NextResponse.json(
        { success: false, error: `Invalid event type. Must be one of: ${VALID_EVENTS.join(', ')}` },
        { status: 400 }
      );
    }

    const dataString = data ? JSON.stringify(data) : '{}';

    await db.analyticsEvent.create({
      data: {
        event,
        data: dataString,
        ip,
      },
    });

    return NextResponse.json({ success: true, message: 'Event tracked' });
  } catch (error) {
    console.error('Analytics track error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
