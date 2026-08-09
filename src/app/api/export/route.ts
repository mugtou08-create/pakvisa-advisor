import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 requests/minute
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 10, 60000)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const { countryCodes, profile } = body as {
      countryCodes: string[];
      profile: Record<string, unknown>;
    };

    if (!countryCodes || countryCodes.length === 0) {
      return NextResponse.json({ error: 'countryCodes is required' }, { status: 400 });
    }

    const countries = await db.country.findMany({
      where: { code: { in: countryCodes } },
      include: {
        visaTypes: true,
        costProfiles: true,
        requirements: { orderBy: { category: 'asc' } },
      },
    });

    const reportData = countries.map((c) => {
      const cost = (c.costProfiles?.[0] ?? null) as unknown as {
        visaFeeUSD: number;
        serviceFeeUSD: number;
        processingDays: number;
        monthlyLivingUSD: number;
        monthlyRentUSD: number;
        monthlyFoodUSD: number;
        monthlyTransportUSD: number;
        healthInsuranceUSD: number;
        totalMonthlyUSD: number;
        currency: string;
      } | null;
      return {
        code: c.code,
        name: c.name,
        flagEmoji: c.flagEmoji,
        continent: c.continent,
        currency: c.currency,
        currencyCode: c.currencyCode,
        timezone: c.timezone,
        visaFree: c.visaFree,
        visaOnArrival: c.visaOnArrival,
        etaAvailable: c.etaAvailable,
        safetyRating: c.safetyRating,
        safetySummary: c.safetySummary,
        bestTravelMonths: c.bestTravelMonths,
        avgTempC: c.avgTempC,
        processingDaysMin: c.processingDaysMin,
        processingDaysMax: c.processingDaysMax,
        visaTypes: c.visaTypes.map((vt) => ({
          type: vt.type,
          description: vt.description,
          maxDuration: vt.maxDuration,
          extensions: vt.extensions,
          multipleEntry: vt.multipleEntry,
        })),
        costProfile: cost
          ? {
              visaFeeUSD: cost.visaFeeUSD,
              serviceFeeUSD: cost.serviceFeeUSD,
              totalMonthlyUSD: cost.totalMonthlyUSD,
              monthlyRentUSD: cost.monthlyRentUSD,
              monthlyFoodUSD: cost.monthlyFoodUSD,
              currency: cost.currency,
            }
          : null,
        requirements: c.requirements.map((r) => ({
          category: r.category,
          requirement: r.requirement,
          mandatory: r.mandatory,
          description: r.description,
        })),
      };
    });

    return NextResponse.json({
      data: {
        generatedAt: new Date().toISOString(),
        profile: {
          fullName: (profile.fullName as string) || 'N/A',
          age: profile.age || 0,
          occupation: (profile.occupation as string) || 'N/A',
          travelPurpose: (profile.travelPurpose as string) || 'N/A',
          intendedStayDays: profile.intendedStayDays || 0,
          budgetUSD: profile.budgetUSD || 0,
        },
        countries: reportData,
        summary: {
          totalCountries: reportData.length,
          visaFreeCount: reportData.filter((c) => c.visaFree).length,
          visaOnArrivalCount: reportData.filter((c) => c.visaOnArrival).length,
          eVisaCount: reportData.filter((c) => c.etaAvailable).length,
          avgSafety: Math.round(reportData.reduce((a, c) => a + c.safetyRating, 0) / reportData.length * 10) / 10,
          avgCost: Math.round(reportData.reduce((a, c) => a + (c.costProfile?.totalMonthlyUSD || 0), 0) / reportData.length),
          cheapestCountry: reportData.reduce((best, c) => (c.costProfile?.visaFeeUSD ?? 9999) < (best.costProfile?.visaFeeUSD ?? 9999) ? c : best, reportData[0])?.name,
          fastestCountry: reportData.reduce((best, c) => c.processingDaysMin < best.processingDaysMin ? c : best, reportData[0])?.name,
        },
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to generate report data' }, { status: 500 });
  }
}
