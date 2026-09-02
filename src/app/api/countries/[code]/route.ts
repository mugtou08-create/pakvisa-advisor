import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getStaticCountry } from '@/lib/static-countries';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  let countryCode: string | undefined;
  try {
    const { code } = await params;
    countryCode = code;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Country code is required', _hint: 'Provide a country code like UAE, USA, Turkey' },
        { status: 400 }
      );
    }

    // ── Try DB first ──
    let country: any = null;
    let usedFallback = false;

    try {
      country = await db.country.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          visaTypes: {
            include: { costProfiles: true, requirements: { orderBy: { category: 'asc' } } },
            orderBy: { type: 'asc' },
          },
          requirements: { orderBy: { category: 'asc' } },
          costProfiles: true,
        },
      });
    } catch (dbError) {
      const msg = dbError instanceof Error ? dbError.message : String(dbError);
      console.warn(`[/api/countries/${code}] DB query failed, trying static fallback: ${msg}`);
    }

    // ── Static fallback ──
    if (!country) {
      country = getStaticCountry(code.toUpperCase()) || getStaticCountry(code);
      usedFallback = !!country;
      if (country) {
        console.log(`[/api/countries/${code}] Using static fallback for ${country.name}`);
      }
    }

    if (!country) {
      return NextResponse.json(
        { success: false, error: `Country '${code}' not found`, _hint: 'Check the country code. Examples: UAE, USA, Turkey, Malaysia' },
        { status: 404 }
      );
    }

    // Parse monthlyTemps
    let monthlyTemps: any;
    try {
      monthlyTemps = typeof country.monthlyTemps === 'string'
        ? JSON.parse(country.monthlyTemps)
        : country.monthlyTemps || {};
    } catch {
      monthlyTemps = country.monthlyTemps || {};
    }

    // Format visa types
    const visaTypesFormatted = (country.visaTypes || []).map((vt: any) => ({
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
    }));

    const formattedCountry = {
      ...country,
      monthlyTemps,
      visaTypes: visaTypesFormatted,
      costProfile: (country.costProfiles?.length > 0 ? country.costProfiles[0] : null) || country.costProfile || null,
    };

    return NextResponse.json({
      success: true,
      data: formattedCountry,
      ...(usedFallback ? { _fallback: true } : {}),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[/api/countries/${countryCode || 'unknown'}] UNHANDLED: ${msg}`, error);

    // Last-resort static fallback
    if (countryCode) {
      try {
        const staticCountry = getStaticCountry(countryCode.toUpperCase());
        if (staticCountry) {
          return NextResponse.json({ success: true, data: staticCountry, _fallback: true, _error: msg });
        }
      } catch {}
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch country', _debug: { code: countryCode, message: msg } },
      { status: 500 }
    );
  }
}
