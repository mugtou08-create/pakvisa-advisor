import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

function isValidAdminToken(token: string): boolean {
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    if (parts.length < 4) return false;
    if (parts[2] !== 'admin') return false;
    const timestamp = parseInt(parts[parts.length - 1], 10);
    if (isNaN(timestamp)) return false;
    // Token valid for 7 days
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    return Date.now() - timestamp < maxAge;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Accept either BACKUP_SECRET or admin token
    const key = request.nextUrl.searchParams.get('key');
    const backupSecret = process.env.BACKUP_SECRET;
    const isAdmin = key ? isValidAdminToken(key) : false;
    const isSecretValid = key && backupSecret && key === backupSecret;

    if (!isAdmin && !isSecretValid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const countries = await db.country.findMany({
      include: { visaTypes: { include: { costProfiles: true, requirements: true } }, requirements: true, costProfiles: true },
      orderBy: { name: 'asc' },
    });

    const siteSettings = await db.siteSettings.findMany();
    const users = await db.user.findMany({
      select: { id: true, email: true, fullName: true, phone: true, role: true, proExpiresAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const admins = await db.admin.findMany({
      select: { id: true, username: true, role: true, createdAt: true, lastLogin: true },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `pakvisa-backup-${dateStr}.json`;

    const backup = {
      exportedAt: now.toISOString(),
      version: '1.0',
      tables: { countries, siteSettings, users, admins },
    };

    const json = JSON.stringify(backup, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Backup export failed:', message);
    return NextResponse.json(
      { success: false, error: 'Failed to generate backup' },
      { status: 500 }
    );
  }
}
