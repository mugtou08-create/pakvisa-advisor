import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateScore } from '@/lib/scoring';
import type { CountryData, UserProfileData } from '@/lib/types';
import { rateLimit } from '@/lib/rate-limit';

interface ScoreRequestBody {
  countryCode: string;
  profile: UserProfileData;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 30 requests/minute
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 30, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body: ScoreRequestBody = await request.json();
    const { countryCode, profile, sessionId } = body;

    if (!countryCode || !profile) {
      return NextResponse.json(
        { success: false, error: 'countryCode and profile are required' },
        { status: 400 }
      );
    }

    // Fetch country with all related data
    const country = await db.country.findUnique({
      where: { code: countryCode.toUpperCase() },
      include: {
        visaTypes: true,
        requirements: true,
        costProfiles: true,
      },
    });

    if (!country) {
      return NextResponse.json(
        { success: false, error: `Country with code '${countryCode}' not found` },
        { status: 404 }
      );
    }

    // Transform Prisma result to CountryData format expected by scoring engine
    const countryData: CountryData = {
      id: country.id,
      code: country.code,
      name: country.name,
      flagEmoji: country.flagEmoji,
      flagUrl: country.flagUrl,
      continent: country.continent,
      currency: country.currency,
      currencyCode: country.currencyCode,
      timezone: country.timezone,
      visaFree: country.visaFree,
      visaOnArrival: country.visaOnArrival,
      etaAvailable: country.etaAvailable,
      safetyRating: country.safetyRating,
      safetySummary: country.safetySummary,
      bestTravelMonths: country.bestTravelMonths,
      avgTempC: country.avgTempC,
      monthlyTemps: JSON.parse(country.monthlyTemps),
      processingDaysMin: country.processingDaysMin,
      processingDaysMax: country.processingDaysMax,
      sourceUrl: country.sourceUrl,
      fetchTimestamp: country.fetchTimestamp.toISOString(),
      fetchHash: country.fetchHash,
      parserVersion: country.parserVersion,
      parserConfidence: country.parserConfidence,
      visaTypes: country.visaTypes.map((vt) => ({
        id: vt.id,
        type: vt.type,
        description: vt.description,
        maxDuration: vt.maxDuration,
        extensions: vt.extensions,
        multipleEntry: vt.multipleEntry,
        sourceUrl: vt.sourceUrl,
        parserConfidence: vt.parserConfidence,
      })),
      costProfile: country.costProfiles.length > 0
        ? (() => {
            const cp = country.costProfiles[0];
            return {
              id: cp.id,
              visaFeeUSD: cp.visaFeeUSD,
              serviceFeeUSD: cp.serviceFeeUSD,
              processingDays: cp.processingDays,
              monthlyLivingUSD: cp.monthlyLivingUSD,
              monthlyRentUSD: cp.monthlyRentUSD,
              monthlyFoodUSD: cp.monthlyFoodUSD,
              monthlyTransportUSD: cp.monthlyTransportUSD,
              healthInsuranceUSD: cp.healthInsuranceUSD,
              totalMonthlyUSD: cp.totalMonthlyUSD,
              currency: cp.currency,
              parserConfidence: cp.parserConfidence,
            };
          })()
        : null,
      requirements: country.requirements.map((req) => ({
        id: req.id,
        category: req.category,
        requirement: req.requirement,
        mandatory: req.mandatory,
        description: req.description,
        scoringWeight: req.scoringWeight,
        sourceUrl: req.sourceUrl,
        parserConfidence: req.parserConfidence,
        needsReview: req.needsReview,
      })),
    };

    // Calculate score using the scoring engine
    const scoreBreakdown = calculateScore(countryData, profile);

    // Create audit logs for each scoring component
    let createdSessionId = sessionId;
    if (sessionId) {
      // Verify session exists
      const session = await db.session.findUnique({
        where: { id: sessionId },
      });
      if (!session) {
        return NextResponse.json(
          { success: false, error: `Session with id '${sessionId}' not found` },
          { status: 404 }
        );
      }
    }

    // Create audit log entries for each component
    for (const component of scoreBreakdown.components) {
      await db.auditLog.create({
        data: {
          sessionId: createdSessionId || 'no-session',
          action: 'SCORE_COMPONENT',
          countryId: country.id,
          component: component.name,
          score: component.score,
          weight: component.weight,
          multiplier: 1.0,
          confidence: countryData.parserConfidence,
          details: component.details,
        },
      });
    }

    // Create audit log for the final score
    await db.auditLog.create({
      data: {
        sessionId: createdSessionId || 'no-session',
        action: 'SCORE_FINAL',
        countryId: country.id,
        component: 'Final Score',
        score: scoreBreakdown.finalScore,
        multiplier: null,
        confidence: scoreBreakdown.confidence,
        details: `Eligibility: ${scoreBreakdown.eligibility}%, Visa Likelihood: ${scoreBreakdown.visaLikelihood}%, Cost Suitability: ${scoreBreakdown.costSuitability}%`,
      },
    });

    return NextResponse.json({
      success: true,
      data: scoreBreakdown,
    });
  } catch (error) {
    console.error('Error calculating score:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate score', details: String(error) },
      { status: 500 }
    );
  }
}
