import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

function validateToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [id, username] = decoded.split(':');
    if (!id || !username) return { valid: false };
    const timestamp = parseInt(decoded.split(':')[3]);
    if (!timestamp || Date.now() - timestamp > 604800000) return { valid: false };
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
    const totalUsers = await db.user.count().catch(() => 0);
    const totalSessions = await db.visitorSession.count().catch(() => 0);

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

    // Message stats for overview (gracefully handle missing ContactMessage table)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    let totalMessages = 0;
    let messagesThisWeek = 0;
    let unreadCount = 0;
    let repliedCount = 0;
    let dailyMessages: Array<{ date: string; count: number }> = [];
    try {
      totalMessages = await db.contactMessage.count();
      messagesThisWeek = await db.contactMessage.count({
        where: { createdAt: { gte: weekAgo } },
      });
      unreadCount = await db.contactMessage.count({ where: { isRead: false } });
      repliedCount = await db.contactMessage.count({ where: { isReplied: true } });
    } catch {
      // ContactMessage table may not exist yet
    }
    const responseRate = totalMessages > 0 ? Math.round((repliedCount / totalMessages) * 100) : 0;
    const totalSubscribers = await db.newsletterSubscriber.count();
    const activeSubscribers = await db.newsletterSubscriber.count({ where: { isActive: true } });
    const subscribersThisWeek = await db.newsletterSubscriber.count({
      where: { subscribedAt: { gte: weekAgo } },
    });

    // Daily messages for last 7 days (for sparkline)
    try {
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        const count = await db.contactMessage.count({
          where: { createdAt: { gte: dayStart, lt: dayEnd } },
        });
        dailyMessages.push({
          date: dayStart.toISOString().split('T')[0],
          count,
        });
      }
    } catch {
      // ContactMessage table may not exist yet
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
        // New message/contact stats
        messageStats: {
          total: totalMessages,
          thisWeek: messagesThisWeek,
          unread: unreadCount,
          replied: repliedCount,
          responseRate,
          dailyMessages,
        },
        subscriberStats: {
          total: totalSubscribers,
          active: activeSubscribers,
          thisWeek: subscribersThisWeek,
        },
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
