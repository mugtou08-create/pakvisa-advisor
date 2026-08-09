import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 requests/minute
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 5, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedUsername = username.trim().slice(0, 50);

    const admin = await db.adminUser.findUnique({
      where: { username: sanitizedUsername },
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await db.adminUser.update({
      where: { id: admin.id },
      data: { lastLogin: new Date(), isOnline: true },
    });

    // Create a simple token (in production, use proper JWT)
    const token = Buffer.from(`${admin.id}:${admin.username}:${admin.role}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      success: true,
      data: {
        token,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
