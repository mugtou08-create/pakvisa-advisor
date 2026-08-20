import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, error: 'Account is deactivated' }, { status: 403 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if pro has expired
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

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Create auth token
    const token = Buffer.from(`user:${user.id}:${Date.now()}`).toString('base64');

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: currentRole,
        proExpiresAt: currentProExpiresAt,
      },
      token,
    });

    response.cookies.set('user_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 604800,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
