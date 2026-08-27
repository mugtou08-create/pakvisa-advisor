import { NextResponse } from 'next/server';

/**
 * Temporary debug endpoint to diagnose Gemini API failures.
 * Call GET /api/debug-gemini to see the exact error for each model.
 */
export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not set in environment' }, { status: 500 });
  }

  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  const results: Record<string, { status: number; statusText: string; body: string }> = {};

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Say hi' }] }],
        }),
      });
      const bodyText = await res.text();
      results[model] = {
        status: res.status,
        statusText: res.statusText,
        body: bodyText.slice(0, 1000),
      };
    } catch (err) {
      results[model] = {
        status: 0,
        statusText: 'Network Error',
        body: String(err).slice(0, 500),
      };
    }
  }

  return NextResponse.json({
    keyPrefix: key.slice(0, 6) + '...',
    keyLength: key.length,
    results,
  });
}
