import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { parseUserToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Try to get token from cookie first, then Authorization header
    let token = '';
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('user_token')?.value || '';
    } catch { /* SSR context */ }

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const parsed = parseUserToken(token);
    if (!parsed.valid || !parsed.userId) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: parsed.userId } });
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'User not found or inactive' }, { status: 401 });
    }

    // Auto-downgrade expired pro (admin role is never downgraded — admins use separate login)
    let currentRole = user.role;
    let currentProExpiresAt = user.proExpiresAt;
    if (user.role === 'pro' && user.proExpiresAt && new Date(user.proExpiresAt) < new Date()) {
      await db.user.update({
        where: { id: user.id },
        data: { role: 'free', proExpiresAt: null },
      });
      currentRole = 'free';
      currentProExpiresAt = null;
    }

    // Get daily AI usage count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [dailyAiUsage, latestProof] = await Promise.all([
      db.aiUsageLog.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
      db.paymentProof.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, status: true, createdAt: true, adminNote: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: currentRole,
        proExpiresAt: currentProExpiresAt,
        createdAt: user.createdAt,
      },
      dailyAiUsage,
      latestProof: latestProof || null,
    });
  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
