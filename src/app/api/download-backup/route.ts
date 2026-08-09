import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { existsSync, unlinkSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

const EXCLUDES = [
  'node_modules', '.next', '*.png', 'tool-results', 'agent-ctx',
  'download', '*.gz', '*.tar', '.DS_Store', 'dev.log', 'page.html',
  'watchdog.sh', '--timeout', 'examples', 'skills', 'tests',
  'bun.lock', 'backup-pakvisa-*',
];

export async function GET() {
  const projectRoot = process.cwd();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `pakvisa-advisor-backup-${timestamp}.tar.gz`;
  const filepath = join('/tmp', filename);

  try {
    const excludeArgs = EXCLUDES.map((e) => `--exclude=${e}`).join(' ');

    execSync(
      `cd "${projectRoot}" && tar czf "${filepath}" ${excludeArgs} .`,
      { timeout: 30000, stdio: 'pipe' }
    );

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'Backup generation failed' }, { status: 500 });
    }

    const stats = statSync(filepath);
    const buffer = readFileSync(filepath);

    // Clean up temp file
    try { unlinkSync(filepath); } catch {}

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
      { error: 'Failed to generate backup', details: String(error) },
      { status: 500 }
    );
  }
}
