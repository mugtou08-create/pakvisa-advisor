import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test 1: Check env vars
    const envCheck = {
      DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 20)}...` : 'MISSING',
      TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL ? `${process.env.TURSO_DATABASE_URL.substring(0, 20)}...` : 'MISSING',
      TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN ? 'SET' : 'MISSING',
      NODE_ENV: process.env.NODE_ENV,
    };

    // Test 2: Try direct Turso connection
    const { createClient } = await import('@libsql/client');
    const libsql = createClient({
      url: 'libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io',
      authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3NDczNTksImlkIjoiMDFhMDAyNzAtYTYwMS03N2M4LThjYzQtYjRmMGFkNGQwN2U4Iiwia2lkIjoiMFo3RGw0SktHOUYyZHdKRjFxYXZJU0Z0anllb0dzMG9iRHltTF9uSXJvYyIsInJpZCI6IjY1MThlNjAxLWFkYzQtNDU0My1iOGIxLWI5NjA0MjRlYTc1YyJ9.yb83UTEFumqIy7mMTFMlHDepc-Bf78cyeyQzGiGORKDSpgX2292-l-95Zx5hVzKJs4oHjxjYsGAj5xWBEWIBCw',
    });

    const result = await libsql.execute('SELECT count(*) as cnt FROM Country');
    const count = result.rows[0]?.cnt;

    return NextResponse.json({
      success: true,
      env: envCheck,
      tursoDirect: { countryCount: count },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
    }, { status: 500 });
  }
}
