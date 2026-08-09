import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public endpoint - no auth needed
export async function GET() {
  try {
    const setting = await db.siteSettings.findUnique({
      where: { key: 'ai_enabled' },
    });

    const enabled = setting ? setting.value === 'true' : true; // Default to enabled

    return NextResponse.json({
      success: true,
      data: { enabled },
    });
  } catch (error) {
    console.error('AI status check error:', error);
    // Return true as default so AI features aren't accidentally disabled
    return NextResponse.json({
      success: true,
      data: { enabled: true },
    });
  }
}
