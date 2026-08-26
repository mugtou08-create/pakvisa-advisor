import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public endpoint — returns only the unread count, no sensitive data
export async function GET() {
  try {
    const unreadCount = await db.contactMessage.count({
      where: { isRead: false },
    });
    return NextResponse.json({ count: unreadCount });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
