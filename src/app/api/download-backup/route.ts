import { NextResponse } from 'next/server';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export async function GET() {
  // Find the most recent backup in /home/z/
  const backupDir = '/home/z';
  try {
    const files = readdirSync(backupDir)
      .filter(f => f.startsWith('pakvisa-advisor-backup-') && f.endsWith('.tar.gz'))
      .sort()
      .reverse();

    if (files.length === 0) {
      return NextResponse.json({ error: 'No backup found' }, { status: 404 });
    }

    const filename = files[0];
    const filepath = join(backupDir, filename);

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'Backup file missing' }, { status: 404 });
    }

    const buffer = readFileSync(filepath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to download backup', details: String(error) },
      { status: 500 }
    );
  }
}
