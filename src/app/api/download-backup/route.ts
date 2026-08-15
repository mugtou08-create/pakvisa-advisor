import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // On serverless (Vercel) there is no filesystem access; generate backup from DB.
    // Export key tables as JSON and stream as response.

    const countries = await db.country.findMany({
      include: { visaTypes: true, requirements: true, costProfiles: true },
      orderBy: { name: 'asc' },
    });

    const userProfiles = await db.userProfile.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const siteSettings = await db.siteSettings.findMany();

    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      tables: {
        countries,
        userProfiles,
        siteSettings,
      },
    };

    const json = JSON.stringify(backup, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="pakvisa-advisor-backup.json"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Backup export failed:', message);
    return NextResponse.json(
      {
        error: 'Failed to generate backup',
        ...(process.env.NODE_ENV !== 'production' ? { details: message } : {}),
      },
      { status: 500 }
    );
  }
}
