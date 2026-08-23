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
    const { email, password, fullName, phone } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: 'Invalid email format' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    const existingUser = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      await logSecurityEvent({ action: 'user_signup_fail', email: email.toLowerCase(), ip, userAgent: ua, success: false, details: 'Email already registered' });
      return NextResponse.json({ success: false, error: 'Email is already registered' }, { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { email: email.toLowerCase(), passwordHash, fullName: fullName || '', phone: phone || '', role: 'free' },
    });
    await logSecurityEvent({ action: 'user_signup', email: user.email, ip, userAgent: ua, success: true, details: `Name: ${fullName || 'N/A'}` });
    const token = Buffer.from(`user:${user.id}:${Date.now()}`).toString('base64');
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role, proExpiresAt: user.proExpiresAt },
      token,
    });
    response.cookies.set('user_token', token, { httpOnly: true, sameSite: 'lax', maxAge: 604800, path: '/' });
    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
