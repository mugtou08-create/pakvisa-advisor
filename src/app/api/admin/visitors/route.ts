import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureVisitorTable } from '@/lib/ensure-tables';

// --- Auth helper (same pattern as sync-database route) ---
function validateToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    const id = parts[0];
    const username = parts[1];
    const timestamp = parseInt(parts[3]);
    if (!id || !username) return { valid: false };
    if (!timestamp || Date.now() - timestamp > 604800000) return { valid: false };
    return { valid: true, username };
  } catch {
    return { valid: false };
  }
}

function authenticate(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  return validateToken(auth.slice(7)).valid;
}

// Country code to flag emoji mapping (common countries)
const COUNTRY_FLAGS: Record<string, string> = {
  'Pakistan': '🇵🇰', 'India': '🇮🇳', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧',
  'Canada': '🇨🇦', 'Australia': '🇦🇺', 'Germany': '🇩🇪', 'France': '🇫🇷',
  'Saudi Arabia': '🇸🇦', 'UAE': '🇦🇪', 'Turkey': '🇹🇷', 'Malaysia': '🇲🇾',
  'China': '🇨🇳', 'Japan': '🇯🇵', 'South Korea': '🇰🇷', 'Indonesia': '🇮🇩',
  'Bangladesh': '🇧🇩', 'Afghanistan': '🇦🇫', 'Iran': '🇮🇷', 'Iraq': '🇮🇶',
  'Egypt': '🇪🇬', 'Thailand': '🇹🇭', 'Singapore': '🇸🇬', 'Qatar': '🇶🇦',
  'Kuwait': '🇰🇼', 'Bahrain': '🇧🇭', 'Oman': '🇴🇲', 'Jordan': '🇯🇴',
  'Italy': '🇮🇹', 'Spain': '🇪🇸', 'Netherlands': '🇳🇱', 'Sweden': '🇸🇪',
  'Norway': '🇳🇴', 'Denmark': '🇩🇰', 'Switzerland': '🇨🇭', 'Austria': '🇦🇹',
  'Belgium': '🇧🇪', 'Ireland': '🇮🇪', 'Portugal': '🇵🇹', 'Poland': '🇵🇱',
  'Czech Republic': '🇨🇿', 'Russia': '🇷🇺', 'Brazil': '🇧🇷', 'Mexico': '🇲🇽',
  'Argentina': '🇦🇷', 'South Africa': '🇿🇦', 'Nigeria': '🇳🇬', 'Kenya': '🇰🇪',
  'Philippines': '🇵🇭', 'Vietnam': '🇻🇳', 'Sri Lanka': '🇱🇰', 'Nepal': '🇳🇵',
  'Local': '🖥️',
};

function getFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '🌍';
}

interface LiveVisitor {
  id: string;
  sessionId: string;
  country: string;
  city: string;
  page: string;
  lastSeen: string;
  flag: string;
}

interface VisitorDay {
  date: string;
  visitors: number;
}

interface CountryStat {
  country: string;
  flag: string;
  count: number;
}

interface VisitorsResponse {
  success: boolean;
  period: string;
  live: LiveVisitor[];
  todayCount: number;
  weekCount: number;
  monthCount: number;
  todayVisitors: LiveVisitor[];
  weekBreakdown: VisitorDay[];
  monthBreakdown: VisitorDay[];
  topCountries: CountryStat[];
  totalAllTime: number;
  userActivity: {
    totalUsers: number;
    recentSignups: Array<{ id: string; email: string; fullName: string; createdAt: string }>;
    recentLogins: Array<{ id: string; email: string; fullName: string; lastLogin: string | null }>;
  };
}

export async function GET(request: NextRequest) {
  if (!authenticate(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure VisitorSession table exists on Turso
  await ensureVisitorTable();

  try {
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'live';

    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Start of today (UTC)
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Start of this week (Monday UTC)
    const todayDay = now.getUTCDay();
    const mondayOffset = todayDay === 0 ? 6 : todayDay - 1;
    const weekStart = new Date(todayStart.getTime() - mondayOffset * 24 * 60 * 60 * 1000);

    // Start of this month (UTC)
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    // Live visitors (last 5 minutes)
    const liveSessions = await db.visitorSession.findMany({
      where: { lastSeen: { gte: fiveMinAgo } },
      orderBy: { lastSeen: 'desc' },
      take: 200,
    });

    const live: LiveVisitor[] = liveSessions.map(s => ({
      id: s.id,
      sessionId: s.sessionId,
      country: s.country,
      city: s.city,
      page: s.page,
      lastSeen: s.lastSeen.toISOString(),
      flag: getFlag(s.country),
    }));

    // Today's visitors (unique sessionId)
    const todaySessions = await db.visitorSession.findMany({
      where: { createdAt: { gte: todayStart } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const todayUnique = new Set(todaySessions.map(s => s.sessionId));
    const todayVisitors: LiveVisitor[] = todaySessions.slice(0, 50).map(s => ({
      id: s.id,
      sessionId: s.sessionId,
      country: s.country,
      city: s.city,
      page: s.page,
      lastSeen: s.lastSeen.toISOString(),
      flag: getFlag(s.country),
    }));

    // Week visitors
    const weekSessions = await db.visitorSession.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { sessionId: true, createdAt: true, country: true },
      take: 2000,
    });
    const weekUnique = new Set(weekSessions.map(s => s.sessionId));

    // Daily breakdown for week
    const weekBreakdown: VisitorDay[] = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const daySessions = weekSessions.filter(
        s => s.createdAt >= dayStart && s.createdAt < dayEnd
      );
      weekBreakdown.push({
        date: dayStart.toISOString().split('T')[0],
        visitors: new Set(daySessions.map(s => s.sessionId)).size,
      });
    }

    // Month visitors
    const monthSessions = await db.visitorSession.findMany({
      where: { createdAt: { gte: monthStart } },
      select: { sessionId: true, createdAt: true, country: true },
      take: 5000,
    });
    const monthUnique = new Set(monthSessions.map(s => s.sessionId));

    // Daily breakdown for month
    const daysInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getDate();
    const monthBreakdown: VisitorDay[] = [];
    const todayDate = now.getUTCDate();
    for (let d = 1; d <= todayDate; d++) {
      const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), d));
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
      const daySessions = monthSessions.filter(
        s => s.createdAt >= dayStart && s.createdAt < dayEnd
      );
      monthBreakdown.push({
        date: dayStart.toISOString().split('T')[0],
        visitors: new Set(daySessions.map(s => s.sessionId)).size,
      });
    }

    // Top countries (from period data)
    const periodSessions = period === 'live' ? liveSessions
      : period === 'today' ? todaySessions
      : period === 'week' ? weekSessions
      : monthSessions;

    const countryCount = new Map<string, number>();
    for (const s of periodSessions) {
      if (s.country) {
        countryCount.set(s.country, (countryCount.get(s.country) || 0) + 1);
      }
    }
    const topCountries: CountryStat[] = Array.from(countryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({
        country,
        flag: getFlag(country),
        count,
      }));

    // Total all time
    const totalAllTime = await db.visitorSession.count();

    // User activity
    const totalUsers = await db.user.count();
    const recentSignups = await db.user.findMany({
      select: { id: true, email: true, fullName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    const recentLogins = await db.user.findMany({
      select: { id: true, email: true, fullName: true, lastLogin: true },
      where: { lastLogin: { not: null } },
      orderBy: { lastLogin: 'desc' },
      take: 10,
    });

    const response: VisitorsResponse = {
      success: true,
      period,
      live,
      todayCount: todayUnique.size,
      weekCount: weekUnique.size,
      monthCount: monthUnique.size,
      todayVisitors,
      weekBreakdown,
      monthBreakdown,
      topCountries,
      totalAllTime,
      userActivity: {
        totalUsers,
        recentSignups: recentSignups.map(u => ({
          id: u.id, email: u.email, fullName: u.fullName,
          createdAt: u.createdAt.toISOString(),
        })),
        recentLogins: recentLogins.map(u => ({
          id: u.id, email: u.email, fullName: u.fullName,
          lastLogin: u.lastLogin?.toISOString() || null,
        })),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Admin visitors error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load visitor data' },
      { status: 500 }
    );
  }
}
