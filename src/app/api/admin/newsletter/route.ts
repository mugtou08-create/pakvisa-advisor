import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

function validateToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [id, username] = decoded.split(':');
    if (!id || !username) return { valid: false };
    const timestamp = parseInt(decoded.split(':')[3]);
    if (!timestamp || Date.now() - timestamp > 86400000) return { valid: false };
    return { valid: true, username };
  } catch {
    return { valid: false };
  }
}

function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const validation = validateToken(token);
  return validation.valid ? token : null;
}

export async function GET(request: NextRequest) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    if (!rateLimit(ip, 10, 60000)) {
      return NextResponse.json({ success: false, error: 'Rate limited' }, { status: 429 });
    }

    const token = authenticate(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const [subscribers, total] = await Promise.all([
      db.newsletterSubscriber.findMany({
        orderBy: { subscribedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.newsletterSubscriber.count(),
    ]);

    const activeCount = await db.newsletterSubscriber.count({ where: { isActive: true } });

    // Daily subscription counts for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSubs = await db.newsletterSubscriber.groupBy({
      by: ['subscribedAt'],
      where: { subscribedAt: { gte: thirtyDaysAgo } },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        subscribers,
        total,
        activeCount,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Admin newsletter error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch subscribers' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = authenticate(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Subscriber ID required' }, { status: 400 });
    }

    await db.newsletterSubscriber.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin newsletter delete error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete subscriber' }, { status: 500 });
  }
}
