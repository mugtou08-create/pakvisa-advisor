import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';

function validateToken(token: string): { valid: boolean; adminId?: string; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    const [id, username] = parts;
    if (!id || !username) return { valid: false };
    const timestamp = parseInt(parts[3]);
    if (!timestamp || Date.now() - timestamp > 604800000) return { valid: false };
    return { valid: true, adminId: id, username };
  } catch {
    return { valid: false };
  }
}

function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const validation = validateToken(token);
  return validation.valid ? { token, adminId: validation.adminId!, username: validation.username! } : null;
}

export async function PUT(request: NextRequest) {
  try {
    const auth = authenticate(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    if (!rateLimit(ip, 3, 300000)) {
      return NextResponse.json({ success: false, error: 'Too many attempts. Wait 5 minutes.' }, { status: 429 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Current and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    if (newPassword.length > 128) {
      return NextResponse.json({ success: false, error: 'Password too long (max 128 characters)' }, { status: 400 });
    }

    // Fetch admin user
    const admin = await db.adminUser.findUnique({ where: { id: auth.adminId } });
    if (!admin) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isCurrentValid) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
    }

    // Check new password is different
    const isSameAsOld = await bcrypt.compare(newPassword, admin.passwordHash);
    if (isSameAsOld) {
      return NextResponse.json({ success: false, error: 'New password must be different from current' }, { status: 400 });
    }

    // Hash and save new password
    const newHash = await bcrypt.hash(newPassword, 12);
    await db.adminUser.update({
      where: { id: auth.adminId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ success: false, error: 'Failed to change password' }, { status: 500 });
  }
}
