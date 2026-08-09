import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const countries = await db.country.findMany({
      include: { costProfiles: true },
    });

    const totalCountries = countries.length;

    // Exclusive classification: visaFree > visaOnArrival > eVisa > embassy
    // A country is counted in ONLY ONE category (the most accessible)
    let visaFreeCount = 0;
    let visaOnArrivalCount = 0;
    let eVisaCount = 0;
    let embassyRequiredCount = 0;

    for (const c of countries) {
      if (c.visaFree) {
        visaFreeCount++;
      } else if (c.visaOnArrival) {
        visaOnArrivalCount++;
      } else if (c.etaAvailable) {
        eVisaCount++;
      } else {
        embassyRequiredCount++;
      }
    }

    const countriesWithCost = countries
      .map((c) => ({
        name: c.name,
        code: c.code,
        flagEmoji: c.flagEmoji,
        totalMonthlyUSD:
          c.costProfiles.length > 0 ? c.costProfiles[0].totalMonthlyUSD : 0,
        processingDaysMin: c.processingDaysMin,
        visaFeeUSD:
          c.costProfiles.length > 0 ? c.costProfiles[0].visaFeeUSD : 0,
      }))
      .filter((c) => c.totalMonthlyUSD > 0);

    const cheapestCountry =
      countriesWithCost.length > 0
        ? [...countriesWithCost].sort(
            (a, b) => a.totalMonthlyUSD - b.totalMonthlyUSD
          )[0]
        : null;

    const fastestProcessing =
      countries.length > 0
        ? [...countries].sort(
            (a, b) => a.processingDaysMin - b.processingDaysMin
          )[0]
        : null;

    const avgCost =
      countriesWithCost.length > 0
        ? Math.round(
            countriesWithCost.reduce((s, c) => s + c.totalMonthlyUSD, 0) /
              countriesWithCost.length
          )
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalCountries,
        visaFreeCount,
        visaOnArrivalCount,
        eVisaCount,
        embassyRequiredCount,
        avgCostUSD: avgCost,
        cheapestCountry: cheapestCountry
          ? { name: cheapestCountry.name, code: cheapestCountry.code, flagEmoji: cheapestCountry.flagEmoji, visaFeeUSD: cheapestCountry.visaFeeUSD, totalMonthlyUSD: cheapestCountry.totalMonthlyUSD }
          : null,
        fastestProcessing: fastestProcessing
          ? { name: fastestProcessing.name, code: fastestProcessing.code, flagEmoji: fastestProcessing.flagEmoji, processingDaysMin: fastestProcessing.processingDaysMin }
          : null,
      },
    });
  } catch (error) {
    console.error('Error fetching country stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats', details: String(error) },
      { status: 500 }
    );
  }
}
