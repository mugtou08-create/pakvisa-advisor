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
    const unreadOnly = searchParams.get('unread') === 'true';

    const where = unreadOnly ? { isRead: false } : {};
    const [messages, total] = await Promise.all([
      db.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contactMessage.count({ where }),
    ]);

    const unreadCount = await db.contactMessage.count({ where: { isRead: false } });

    return NextResponse.json({
      success: true,
      data: { messages, total, unreadCount, page, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin messages error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = authenticate(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, action, reply } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Message ID required' }, { status: 400 });
    }

    if (action === 'mark_read') {
      await db.contactMessage.update({ where: { id }, data: { isRead: true } });
      return NextResponse.json({ success: true });
    }

    if (action === 'reply') {
      if (!reply?.trim()) {
        return NextResponse.json({ success: false, error: 'Reply text required' }, { status: 400 });
      }
      await db.contactMessage.update({
        where: { id },
        data: { isRead: true, isReplied: true, reply: reply.trim(), repliedAt: new Date() },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      await db.contactMessage.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Admin message update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update message' }, { status: 500 });
  }
}
