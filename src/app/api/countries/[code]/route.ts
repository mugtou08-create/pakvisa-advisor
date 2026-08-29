import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Country code is required' },
        { status: 400 }
      );
    }

    const country = await db.country.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        visaTypes: {
          include: {
            costProfiles: true,
            requirements: { orderBy: { category: 'asc' } },
          },
          orderBy: { type: 'asc' },
        },
        requirements: { orderBy: { category: 'asc' } },
        costProfiles: true,
      },
    });

    if (!country) {
      return NextResponse.json(
        { success: false, error: `Country with code '${code}' not found` },
        { status: 404 }
      );
    }

    // Parse monthlyTemps from JSON string to object
    let monthlyTemps: any;
    try {
      monthlyTemps = JSON.parse(country.monthlyTemps);
    } catch {
      monthlyTemps = country.monthlyTemps;
    }

    // Attach per-visa-type cost and requirements
    const visaTypesFormatted = country.visaTypes.map((vt) => ({
      id: vt.id,
      type: vt.type,
      description: vt.description,
      maxDuration: vt.maxDuration,
      extensions: vt.extensions,
      multipleEntry: vt.multipleEntry,
      processingDaysMin: vt.processingDaysMin,
      processingDaysMax: vt.processingDaysMax,
      sourceUrl: vt.sourceUrl,
      verifiedTill: vt.verifiedTill,
      parserConfidence: vt.parserConfidence,
      costProfile: vt.costProfiles.length > 0 ? {
        id: vt.costProfiles[0].id,
        visaFeeUSD: vt.costProfiles[0].visaFeeUSD,
        serviceFeeUSD: vt.costProfiles[0].serviceFeeUSD,
        processingDaysMin: vt.costProfiles[0].processingDaysMin,
        processingDaysMax: vt.costProfiles[0].processingDaysMax,
        totalMonthlyUSD: vt.costProfiles[0].totalMonthlyUSD,
        currency: vt.costProfiles[0].currency,
        verifiedTill: vt.costProfiles[0].verifiedTill,
      } : null,
      requirements: vt.requirements.map((r) => ({
        id: r.id,
        category: r.category,
        requirement: r.requirement,
        mandatory: r.mandatory,
        description: r.description,
        scoringWeight: r.scoringWeight,
        sourceUrl: r.sourceUrl,
        parserConfidence: r.parserConfidence,
        needsReview: r.needsReview,
      })),
    }));

    const formattedCountry = {
      ...country,
      monthlyTemps,
      visaTypes: visaTypesFormatted,
      costProfile: country.costProfiles.length > 0 ? country.costProfiles[0] : null,
    };

    return NextResponse.json({
      success: true,
      data: formattedCountry,
    });
  } catch (error) {
    console.error('Error fetching country:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch country', ...(process.env.NODE_ENV !== 'production' ? { details: String(error) } : {}) },
      { status: 500 }
    );
  }
}
