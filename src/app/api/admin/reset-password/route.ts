import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// TEMPORARY: Reset admin password.
// This route should be removed after use for security.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, newPassword } = body;

    if (!username || !newPassword) {
      return NextResponse.json({
        success: false,
        error: 'Username and newPassword are required',
      }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 8 characters',
      }, { status: 400 });
    }

    const admin = await db.adminUser.findUnique({
      where: { username: username.trim() },
    });

    if (!admin) {
      // List available usernames for the owner
      const allAdmins = await db.adminUser.findMany({
        select: { username: true, createdAt: true },
      });
      return NextResponse.json({
        success: false,
        error: `Username "${username.trim()}" not found`,
        availableUsernames: allAdmins.map(a => a.username),
      }, { status: 404 });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await db.adminUser.update({
      where: { id: admin.id },
      data: { passwordHash: hash },
    });

    return NextResponse.json({
      success: true,
      message: `Password reset for "${admin.username}"`,
    });
  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { success: false, error: 'Reset failed' },
      { status: 500 }
    );
  }
}
