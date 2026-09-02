import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const BACKUP_SECRET = process.env.BACKUP_SECRET || 'pakvisa-admin-backup-2026';

export async function GET(request: NextRequest) {
  try {
    // Require secret key to prevent unauthorized data access
    const key = request.nextUrl.searchParams.get('key');
    if (key !== BACKUP_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const countries = await db.country.findMany({
      include: { visaTypes: true, requirements: true, costProfiles: true },
      orderBy: { name: 'asc' },
    });

    const siteSettings = await db.siteSettings.findMany();

    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `pakvisa-backup-${dateStr}.json`;

    const backup = {
      exportedAt: now.toISOString(),
      version: '1.0',
      tables: { countries, siteSettings },
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
