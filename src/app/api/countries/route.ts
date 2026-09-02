import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { rateLimit } from '@/lib/rate-limit';
import { fetchAndCache } from '@/lib/api-cache';
import { getStaticCountries } from '@/lib/static-countries';
import type { CountryData } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 100 requests/minute
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    if (!rateLimit(ip, 100, 60000)) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const continent = searchParams.get('continent') || '';
    const visaFree = searchParams.get('visaFree');
    const visaOnArrival = searchParams.get('visaOnArrival');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = Math.min(Math.max(parseInt(limitParam) || 100, 1), 500);
    const offset = Math.max(parseInt(offsetParam) || 0, 0);

    // Cache key: only cache the default listing (no filters, standard sort)
    const isDefaultListing = !search && !continent && !visaFree && !visaOnArrival && sortBy === 'name' && sortOrder === 'asc' && limit >= 200;
    const cacheKey = `countries:all:${limit}:${offset}`;

    // Use cache for default listing, bypass for filtered/sorted queries
    if (isDefaultListing) {
      const cached = await fetchAndCache(cacheKey, async () => {
        return await queryCountries({ search, continent, visaFree, visaOnArrival, sortBy, sortOrder, limit, offset });
      }, 60_000);
      return NextResponse.json(cached);
    }

    const data = await queryCountries({ search, continent, visaFree, visaOnArrival, sortBy, sortOrder, limit, offset });
    return NextResponse.json(data);
  } catch (error) {
    // Structured error for debugging
    const msg = error instanceof Error ? error.message : String(error);
    const code = error instanceof Error && 'code' in error ? (error as any).code : 'UNKNOWN';
    console.error(`[GET /api/countries] UNHANDLED ERROR — code:${code} msg:${msg}`, error);

    // Last-resort: return static data
    try {
      const staticData = getStaticCountries();
      return NextResponse.json({
        success: true,
        data: staticData,
        pagination: { total: staticData.length, limit: 500, offset: 0, returned: staticData.length },
        _fallback: true,
        _error: msg,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch countries', _debug: { code, message: msg } },
        { status: 500 }
      );
    }
  }
}

// Extracted query function for cacheability
async function queryCountries(params: {
  search: string;
  continent: string;
  visaFree: string | null;
  visaOnArrival: string | null;
  sortBy: string;
  sortOrder: string;
  limit: number;
  offset: number;
}) {
  const { search, continent, visaFree, visaOnArrival, sortBy, sortOrder, limit, offset } = params;

  // Build where clause
  const where: Prisma.CountryWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
    ];
  }

  if (continent) {
    where.continent = { contains: continent };
  }

  if (visaFree !== null && visaFree !== undefined && visaFree !== '') {
    where.visaFree = visaFree === 'true';
  }

  if (visaOnArrival !== null && visaOnArrival !== undefined && visaOnArrival !== '') {
    where.visaOnArrival = visaOnArrival === 'true';
  }

  // Build orderBy clause
  const orderByField = (() => {
    switch (sortBy) {
      case 'name': return 'name';
      case 'safetyRating': return 'safetyRating';
      case 'visaFee': return 'costProfiles';
      default: return 'name';
    }
  })();

  let orderBy: Prisma.CountryOrderByWithRelationInput;
  if (sortBy === 'visaFee') {
    orderBy = {
      costProfiles: {
        visaFeeUSD: sortOrder === 'desc' ? 'desc' as const : 'asc' as const,
      },
    };
  } else {
    orderBy = {
      [orderByField]: sortOrder === 'desc' ? 'desc' as const : 'asc' as const,
    } as Prisma.CountryOrderByWithRelationInput;
  }

  // ── Try DB query ──
  let countries: any[] = [];
  let total = 0;
  let usedFallback = false;

  try {
    const dbCountries = await db.country.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        visaTypes: {
          include: { costProfiles: true, requirements: true },
          orderBy: { type: 'asc' },
        },
        requirements: true,
        costProfiles: true,
      },
    });

    if (dbCountries && dbCountries.length > 0) {
      countries = dbCountries;
      total = await db.country.count({ where });
    }
  } catch (dbError) {
    const dbMsg = dbError instanceof Error ? dbError.message : String(dbError);
    console.warn(`[api/countries] DB query failed, using static fallback: ${dbMsg}`);
  }

  // ── Static fallback if DB returned nothing ──
  if (countries.length === 0) {
    try {
      const staticAll = getStaticCountries() as CountryData[];
      let filtered = staticAll;

      // Apply filters on static data
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(c =>
          c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
        );
      }
      if (continent) {
        filtered = filtered.filter(c => c.continent.toLowerCase().includes(continent.toLowerCase()));
      }
      if (visaFree !== null && visaFree !== undefined && visaFree !== '') {
        filtered = filtered.filter(c => c.visaFree === (visaFree === 'true'));
      }
      if (visaOnArrival !== null && visaOnArrival !== undefined && visaOnArrival !== '') {
        filtered = filtered.filter(c => c.visaOnArrival === (visaOnArrival === 'true'));
      }

      // Sort
      filtered.sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'safetyRating') {
          cmp = a.safetyRating - b.safetyRating;
        } else if (sortBy === 'visaFee') {
          cmp = (a.costProfile?.visaFeeUSD ?? 9999) - (b.costProfile?.visaFeeUSD ?? 9999);
        } else {
          cmp = a.name.localeCompare(b.name);
        }
        return sortOrder === 'desc' ? -cmp : cmp;
      });

      total = filtered.length;
      countries = filtered.slice(offset, offset + limit);
      usedFallback = true;
      console.log(`[api/countries] Static fallback returned ${countries.length} countries (total: ${total})`);
    } catch (staticError) {
      console.error('[api/countries] Static fallback FAILED:', staticError);
    }
  }

  // Format response
  const formattedCountries = countries.map((country) => {
    let monthlyTemps: any;
    try {
      monthlyTemps = typeof country.monthlyTemps === 'string'
        ? JSON.parse(country.monthlyTemps)
        : country.monthlyTemps || {};
    } catch {
      monthlyTemps = country.monthlyTemps || {};
    }
    return {
      ...country,
      monthlyTemps,
      costProfile: country.costProfiles?.length > 0
        ? country.costProfiles[0]
        : country.costProfile || null,
      visaTypes: (country.visaTypes || []).map((vt: any) => ({
        id: vt.id, type: vt.type, description: vt.description,
        maxDuration: vt.maxDuration, extensions: vt.extensions,
        multipleEntry: vt.multipleEntry,
        processingDaysMin: vt.processingDaysMin,
        processingDaysMax: vt.processingDaysMax,
        sourceUrl: vt.sourceUrl, verifiedTill: vt.verifiedTill,
        parserConfidence: vt.parserConfidence,
        costProfile: (vt.costProfiles?.length > 0 ? vt.costProfiles[0] : vt.costProfile) || null,
        requirements: (vt.requirements || []).map((r: any) => ({
          id: r.id, category: r.category, requirement: r.requirement,
          mandatory: r.mandatory, description: r.description,
          scoringWeight: r.scoringWeight, sourceUrl: r.sourceUrl,
          parserConfidence: r.parserConfidence, needsReview: r.needsReview,
        })),
      })),
    };
  });

  return {
    success: true,
    data: formattedCountries,
    pagination: { total, limit, offset, returned: formattedCountries.length },
    ...(usedFallback ? { _fallback: true } : {}),
  };
}