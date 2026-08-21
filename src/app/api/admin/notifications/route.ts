import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function validateToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [id, username] = decoded.split(':');
    if (!id || !username) return { valid: false };
    const timestamp = parseInt(decoded.split(':')[3]);
    if (!timestamp || Date.now() - timestamp > 604800000) return { valid: false };
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
    const token = authenticate(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const limit = 10;
    const [notifications, unreadCount] = await Promise.all([
      db.adminNotification.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.adminNotification.count({ where: { isRead: false } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { notifications, unreadCount },
    });
  } catch (error) {
    console.error('Admin notifications error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = authenticate(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, markAll } = body;

    if (markAll) {
      const result = await db.adminNotification.updateMany({
        where: { isRead: false },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, data: { updated: result.count } });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Notification ID is required' }, { status: 400 });
    }

    await db.adminNotification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin notification update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update notification' }, { status: 500 });
  }
}
