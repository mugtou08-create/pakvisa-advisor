import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

// Simple token validation helper
function validateToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [id, username] = decoded.split(':');
    if (!id || !username) return { valid: false };
    // Check if token is not too old (24 hours)
    const timestamp = parseInt(decoded.split(':')[3]);
    if (!timestamp || Date.now() - timestamp > 86400000) return { valid: false };
    return { valid: true, username };
  } catch {
    return { valid: false };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate auth (same as PUT)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const validation = validateToken(token);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Rate limit
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    if (!rateLimit(ip, 5, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limited' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key) {
      const setting = await db.siteSettings.findUnique({
        where: { key },
      });
      return NextResponse.json({
        success: true,
        data: setting ? { key: setting.key, value: setting.value } : null,
      });
    }

    const settings = await db.siteSettings.findMany();
    return NextResponse.json({
      success: true,
      data: settings.map(s => ({ key: s.key, value: s.value })),
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Rate limit
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    if (!rateLimit(ip, 5, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limited' },
        { status: 429 }
      );
    }

    // Validate auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const validation = validateToken(token);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Key and value are required' },
        { status: 400 }
      );
    }

    const setting = await db.siteSettings.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    return NextResponse.json({
      success: true,
      data: { key: setting.key, value: setting.value },
    });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}
