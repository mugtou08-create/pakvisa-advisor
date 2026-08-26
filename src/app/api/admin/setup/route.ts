import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// ONE-TIME SETUP: Creates the first admin user if none exists.
// This route is safe to leave in production because it only works when
// the AdminUser table is COMPLETELY EMPTY.

export async function POST(request: NextRequest) {
  try {
    // Check if any admin users already exist
    const existingCount = await db.adminUser.count();

    if (existingCount > 0) {
      return NextResponse.json({
        success: false,
        error: 'Setup already completed. Use the admin login dialog to sign in.',
        adminExists: true,
      }, { status: 403 });
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Username and password are required',
        hint: 'Send POST with { "username": "your_name", "password": "your_password" }',
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 8 characters long',
      }, { status: 400 });
    }

    // Sanitize username
    const sanitizedUsername = username.trim().slice(0, 50).replace(/[^a-zA-Z0-9_]/g, '_');

    // Create admin user
    const passwordHash = await bcrypt.hash(password, 12);
    const admin = await db.adminUser.create({
      data: {
        username: sanitizedUsername,
        passwordHash,
        role: 'admin',
        permissions: 'full',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Admin user "${sanitizedUsername}" created successfully!`,
      data: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Setup failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

// GET: Check if setup is needed
export async function GET() {
  try {
    const count = await db.adminUser.count();
    return NextResponse.json({
      setupNeeded: count === 0,
      adminCount: count,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to check setup status' }, { status: 500 });
  }
}