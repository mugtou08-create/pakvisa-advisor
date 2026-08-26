import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public endpoint — returns the WhatsApp number stored in SiteSettings
export async function GET() {
  try {
    const setting = await db.siteSettings.findUnique({
      where: { key: 'whatsapp_number' },
    });
    const number = setting?.value || '';
    return NextResponse.json({ success: true, number });
  } catch {
    return NextResponse.json({ success: true, number: '' });
  }
}
