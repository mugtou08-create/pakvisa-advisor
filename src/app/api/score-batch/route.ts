import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateScore } from '@/lib/scoring';
import { rateLimit } from '@/lib/rate-limit';
import type { CountryData, UserProfileData, ScoreBreakdown } from '@/lib/types';

interface BatchScoreRequestBody {
  profile: UserProfileData;
  userProfileId?: string;
}

/**
 * Transform a Prisma country row (with includes) into the CountryData format
 * expected by the scoring engine. Mirrors the transformation in /api/score/route.ts.
 */
function transformCountryToData(country: {
  id: string;
  code: string;
  name: string;
  flagEmoji: string;
  flagUrl: string;
  continent: string;
  currency: string;
  currencyCode: string;
  timezone: string;
  visaFree: boolean;
  visaOnArrival: boolean;
  etaAvailable: boolean;
  safetyRating: number;
  safetySummary: string;
  bestTravelMonths: string;
  avgTempC: string;
  monthlyTemps: string;
  processingDaysMin: number;
  processingDaysMax: number;
  sourceUrl: string;
  fetchTimestamp: Date;
  fetchHash: string;
  parserVersion: string;
  parserConfidence: number;
  visaTypes: {
    id: string;
    type: string;
    description: string;
    maxDuration: string;
    extensions: boolean;
    multipleEntry: boolean;
    sourceUrl: string;
    parserConfidence: number;
  }[];
  costProfiles: {
    id: string;
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
    parserConfidence: number;
  }[];
  requirements: {
    id: string;
    category: string;
    requirement: string;
    mandatory: boolean;
    description: string;
    scoringWeight: number;
    sourceUrl: string;
    parserConfidence: number;
    needsReview: boolean;
  }[];
}): CountryData {
  return {
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
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limit: 30 requests/minute
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 30, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body: BatchScoreRequestBody = await request.json();
    const { profile, userProfileId } = body;

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'profile is required' },
        { status: 400 }
      );
    }

    // --- 1. Fetch ALL countries in a single query ---
    const countries = await db.country.findMany({
      include: {
        visaTypes: true,
        requirements: true,
        costProfiles: true,
      },
    });

    if (countries.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: { totalCountries: 0, queryTimeMs: Date.now() - startTime, scoringTimeMs: 0 },
      });
    }

    const queryTimeMs = Date.now() - startTime;

    // --- 2. Transform all countries to CountryData format ---
    const allCountryData: CountryData[] = countries.map(transformCountryToData);

    // --- 3. Calculate scores for ALL countries ---
    const scoringStart = Date.now();
    const results: ScoreBreakdown[] = allCountryData.map((countryData) =>
      calculateScore(countryData, profile)
    );
    const scoringTimeMs = Date.now() - scoringStart;

    // --- 4. Sort by finalScore descending ---
    results.sort((a, b) => b.finalScore - a.finalScore);

    // --- 5. Create audit log session if userProfileId provided ---
    let sessionId = 'batch-no-session';

    if (userProfileId) {
      try {
        const existingProfile = await db.userProfile.findUnique({
          where: { id: userProfileId },
        });
        if (existingProfile) {
          const session = await db.session.create({
            data: {
              userProfileId,
              status: 'completed',
              answers: JSON.stringify(profile),
              scores: JSON.stringify(results.map((r) => ({
                countryCode: r.countryCode,
                finalScore: r.finalScore,
              }))),
              questionnaireProgress: 100,
              currentStep: 100,
            },
          });
          sessionId = session.id;
        }
      } catch { /* skip audit logging if session creation fails */ }
    }

    // --- 6. Write audit logs for all countries in a single bulk create ---
    const auditEntries: {
      sessionId: string;
      action: string;
      countryId: string;
      component: string;
      score: number;
      weight: number | null;
      multiplier: number | null;
      confidence: number;
      details: string;
    }[] = [];

    for (const breakdown of results) {
      const countryData = allCountryData.find(
        (c) => c.code === breakdown.countryCode
      );
      if (!countryData) continue;

      // Audit log for each scoring component
      for (const component of breakdown.components) {
        auditEntries.push({
          sessionId,
          action: 'SCORE_COMPONENT',
          countryId: countryData.id,
          component: component.name,
          score: component.score,
          weight: component.weight,
          multiplier: 1.0,
          confidence: countryData.parserConfidence,
          details: component.details,
        });
      }

      // Audit log for the final score
      auditEntries.push({
        sessionId,
        action: 'SCORE_FINAL',
        countryId: countryData.id,
        component: 'Final Score',
        score: breakdown.finalScore,
        weight: null,
        multiplier: null,
        confidence: breakdown.confidence,
        details: `Eligibility: ${breakdown.eligibility}%, Visa Likelihood: ${breakdown.visaLikelihood}%, Cost Suitability: ${breakdown.costSuitability}%`,
      });
    }

    // Bulk insert all audit logs in one operation (skip if no valid session)
    if (auditEntries.length > 0 && sessionId !== 'batch-no-session') {
      try {
        await db.auditLog.createMany({
          data: auditEntries,
        });
      } catch { /* skip audit logging on error */ }
    }

    const totalTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        totalCountries: results.length,
        sessionId,
        queryTimeMs,
        scoringTimeMs,
        auditLogCount: auditEntries.length,
        totalTimeMs,
      },
    });
  } catch (error) {
    console.error('Error calculating batch scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate batch scores', details: String(error) },
      { status: 500 }
    );
  }
}
