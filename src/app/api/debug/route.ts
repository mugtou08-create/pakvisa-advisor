import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.DATABASE_URL || 'NOT SET';
  const tursoUrl = process.env.TURSO_DATABASE_URL || 'NOT SET';
  const tursoToken = process.env.TURSO_AUTH_TOKEN ? 'SET' : 'NOT SET';
  const nodeEnv = process.env.NODE_ENV || 'NOT SET';
  
  return NextResponse.json({
    databaseUrlPrefix: url.substring(0, 30),
    tursoUrlPrefix: tursoUrl.substring(0, 30),
    tursoToken,
    nodeEnv,
    hasAuthInUrl: url.includes('authToken'),
  });
}
