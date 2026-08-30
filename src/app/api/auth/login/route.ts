import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { logSecurityEvent } from '@/lib/security-log';

function getIp(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
}

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  const ua = request.headers.get('user-agent') || '';

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      await logSecurityEvent({ action: 'user_login_fail', email: email.toLowerCase(), ip, userAgent: ua, success: false, details: 'Email not found' });
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      await logSecurityEvent({ action: 'user_login_fail', email: user.email, ip, userAgent: ua, success: false, details: 'Account deactivated' });
      return NextResponse.json({ success: false, error: 'Account is deactivated' }, { status: 403 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      await logSecurityEvent({ action: 'user_login_fail', email: user.email, ip, userAgent: ua, success: false, details: 'Wrong password' });
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Auto-downgrade expired pro (admin role is never downgraded — handled by getUserFromRequest for API calls, and admins use a separate login system)
    let currentRole = user.role;
    let currentProExpiresAt = user.proExpiresAt;
    if (user.role === 'pro' && user.proExpiresAt && new Date(user.proExpiresAt) < new Date()) {
      await db.user.update({ where: { id: user.id }, data: { role: 'free', proExpiresAt: null } });
      currentRole = 'free';
      currentProExpiresAt = null;
    }

    await db.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    await logSecurityEvent({ action: 'user_login', email: user.email, ip, userAgent: ua, success: true, details: `Role: ${currentRole}` });

    const token = Buffer.from(`user:${user.id}:${Date.now()}`).toString('base64');
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: currentRole, proExpiresAt: currentProExpiresAt },
      token,
    });
    response.cookies.set('user_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 604800, path: '/' });
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
