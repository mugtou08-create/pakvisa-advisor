import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/security-log';
import bcrypt from 'bcryptjs';

function getIp(req: NextRequest): string {
  return (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
}

export async function POST(request: NextRequest) {
  const ip = getIp(request);
  const ua = request.headers.get('user-agent') || '';

  try {
    if (!rateLimit(ip, 5, 60000)) {
      await logSecurityEvent({ action: 'admin_login_fail', email: 'rate_limited', ip, userAgent: ua, success: false, details: 'Rate limited' });
      return NextResponse.json({ success: false, error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username and password are required' }, { status: 400 });
    }

    const sanitizedUsername = username.trim().slice(0, 50);
    const admin = await db.adminUser.findUnique({ where: { username: sanitizedUsername } });

    if (!admin) {
      await logSecurityEvent({ action: 'admin_login_fail', email: sanitizedUsername, ip, userAgent: ua, success: false, details: 'Username not found' });
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      await logSecurityEvent({ action: 'admin_login_fail', email: sanitizedUsername, ip, userAgent: ua, success: false, details: 'Wrong password' });
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    await db.adminUser.update({ where: { id: admin.id }, data: { lastLogin: new Date(), isOnline: true } });
    await logSecurityEvent({ action: 'admin_login', email: admin.username, ip, userAgent: ua, success: true });

    const token = Buffer.from(`${admin.id}:${admin.username}:${admin.role}:${Date.now()}`).toString('base64');
    return NextResponse.json({ success: true, data: { token, username: admin.username, role: admin.role, permissions: admin.permissions } });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
