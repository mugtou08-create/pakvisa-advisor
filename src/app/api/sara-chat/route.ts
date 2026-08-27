import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest, isProUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    if (!isProUser(user)) {
      return NextResponse.json({ success: false, error: 'Pro account required' }, { status: 403 });
    }

    const chat = await db.saraChat.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    if (!chat) {
      return NextResponse.json({ success: true, data: null });
    }

    let messages: { role: string; content: string }[] = [];
    try {
      messages = JSON.parse(chat.messages);
    } catch {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: { messages } });
  } catch (error) {
    console.error('Sara chat load error:', error);
    return NextResponse.json({ success: false, error: 'Failed to load chat' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    if (!isProUser(user)) {
      return NextResponse.json({ success: false, error: 'Pro account required' }, { status: 403 });
    }

    const body = await request.json();
    const { messages } = body as { messages?: { role: string; content: string }[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ success: false, error: 'messages array is required' }, { status: 400 });
    }

    const messagesStr = JSON.stringify(messages);

    // Upsert: find existing chat for this user, update or create
    const existing = await db.saraChat.findFirst({ where: { userId: user.id } });

    if (existing) {
      await db.saraChat.update({
        where: { id: existing.id },
        data: { messages: messagesStr },
      });
    } else {
      await db.saraChat.create({
        data: { userId: user.id, messages: messagesStr },
      });
    }

    return NextResponse.json({ success: true, message: 'Chat saved' });
  } catch (error) {
    console.error('Sara chat save error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save chat' }, { status: 500 });
  }
}
