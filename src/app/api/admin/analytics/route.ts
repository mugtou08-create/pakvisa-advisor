import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

function validateToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [id, username] = decoded.split(':');
    if (!id || !username) return { valid: false };
    const timestamp = parseInt(decoded.split(':')[3]);
    if (!timestamp || Date.now() - timestamp > 86400000) return { valid: false };
    return { valid: true, username };
  } catch {
    return { valid: false };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 5, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Rate limited' },
        { status: 429 }
      );
    }

    // Validate auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const validation = validateToken(token);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Gather analytics
    const totalCountries = await db.country.count();
    const visaFreeCount = await db.country.count({ where: { visaFree: true } });
    const visaOnArrivalCount = await db.country.count({ where: { visaOnArrival: true } });
    const etaAvailableCount = await db.country.count({ where: { etaAvailable: true } });
    const totalRequirements = await db.visaRequirement.count();
    const totalCostProfiles = await db.costProfile.count();
    const totalUsers = await db.userProfile.count();
    const totalSessions = await db.session.count();

    // Most recent data fetch
    const latestFetch = await db.country.findFirst({
      orderBy: { fetchTimestamp: 'desc' },
      select: { fetchTimestamp: true },
    });

    // Continent distribution
    const continentData = await db.country.groupBy({
      by: ['continent'],
      _count: true,
      orderBy: { _count: { continent: 'desc' } },
    });

    // Visa category distribution
    const visaCategories = {
      visaFree: visaFreeCount,
      visaOnArrival: visaOnArrivalCount,
      etaAvailable: etaAvailableCount,
      regularVisa: totalCountries - visaFreeCount - visaOnArrivalCount - etaAvailableCount,
    };

    // Admin users info
    const adminUsers = await db.adminUser.findMany({
      select: { username: true, lastLogin: true, isOnline: true, createdAt: true },
    });

    // Site settings
    const settings = await db.siteSettings.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json({
      success: true,
      data: {
        countries: {
          total: totalCountries,
          visaFree: visaFreeCount,
          visaOnArrival: visaOnArrivalCount,
          etaAvailable: etaAvailableCount,
        },
        visaCategories,
        continents: continentData.map(c => ({ continent: c.continent, count: c._count })),
        dataFreshness: latestFetch?.fetchTimestamp || null,
        requirements: totalRequirements,
        costProfiles: totalCostProfiles,
        users: totalUsers,
        sessions: totalSessions,
        adminUsers,
        settings: settingsMap,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
