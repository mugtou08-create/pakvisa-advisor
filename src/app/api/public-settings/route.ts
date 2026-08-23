import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public settings that don't need admin auth
// Used by client components like WhatsApp button
const PUBLIC_KEYS = [
  'whatsapp_number',
] as const;

export async function GET() {
  try {
    const settings = await db.siteSettings.findMany({
      where: { key: { in: [...PUBLIC_KEYS] } },
    });

    const map: Record<string, string> = {};
    for (const s of settings) {
      map[s.key] = s.value;
    }

    return NextResponse.json({ success: true, data: map });
  } catch (error) {
    console.error('Public settings error:', error);
    return NextResponse.json({ success: true, data: {} });
  }
}
