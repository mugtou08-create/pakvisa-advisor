import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { rateLimit } from '@/lib/rate-limit';
import { fetchAndCache } from '@/lib/api-cache';

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
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch countries' },
      { status: 500 }
    );
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
      case 'name':
        return 'name';
      case 'safetyRating':
        return 'safetyRating';
      case 'visaFee':
        return 'costProfiles';
      default:
        return 'name';
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

  // Fetch countries with related data
  const countries = await db.country.findMany({
    where,
    orderBy,
    skip: offset,
    take: limit,
    include: {
      visaTypes: true,
      requirements: true,
      costProfiles: true,
    },
  });

  // Get total count for pagination
  const total = await db.country.count({ where });

  // Format response with parsed monthlyTemps and costProfile singular
  const formattedCountries = countries.map((country) => {
    let monthlyTemps: any;
    try {
      monthlyTemps = JSON.parse(country.monthlyTemps);
    } catch {
      monthlyTemps = country.monthlyTemps;
    }
    return {
      ...country,
      monthlyTemps,
      costProfile: country.costProfiles.length > 0 ? country.costProfiles[0] : null,
    };
  });

  return {
    success: true,
    data: formattedCountries,
    pagination: {
      total,
      limit,
      offset,
      returned: formattedCountries.length,
    },
  };
}
