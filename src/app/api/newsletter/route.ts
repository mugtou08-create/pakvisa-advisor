import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 requests per minute per IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!rateLimit(ip, 5, 60000)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Validate email presence
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required.' },
        { status: 400 }
      );
    }

    const trimmed = email.trim().toLowerCase();

    // Validate email format
    if (!EMAIL_REGEX.test(trimmed)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // Check if already subscribed
    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: trimmed },
    });

    if (existing) {
      // Reactivate if was deactivated
      if (!existing.isActive) {
        await db.newsletterSubscriber.update({
          where: { email: trimmed },
          data: { isActive: true },
        });
      }
      return NextResponse.json({ success: true, message: 'Already subscribed' });
    }

    // Create new subscriber
    await db.newsletterSubscriber.create({
      data: { email: trimmed },
    });

    return NextResponse.json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Newsletter subscription error:', error);

    // Handle unique constraint violation gracefully
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ success: true, message: 'Already subscribed' });
    }

    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const count = await db.newsletterSubscriber.count({
      where: { isActive: true },
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Newsletter count error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch subscriber count.' },
      { status: 500 }
    );
  }
}
