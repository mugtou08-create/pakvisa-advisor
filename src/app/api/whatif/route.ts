import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { calculateScore, simulateWhatIf } from '@/lib/scoring';
import type { CountryData, UserProfileData, ScoreBreakdown } from '@/lib/types';

function safeJsonParse(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    return str;
  }
}

interface WhatIfRequestBody {
  countryCode: string;
  profile: UserProfileData;
  scenario: {
    field: string;
    value: number | string | boolean;
  };
}

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
    monthlyTemps: safeJsonParse(country.monthlyTemps),
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
  try {
    // Rate limit: 10 requests/minute
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 10, 60000)) {
      return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body: WhatIfRequestBody = await request.json();
    const { countryCode, profile, scenario } = body;

    if (!countryCode || !profile || !scenario) {
      return NextResponse.json(
        { success: false, error: 'countryCode, profile, and scenario are required' },
        { status: 400 }
      );
    }

    if (!scenario.field || scenario.value === undefined) {
      return NextResponse.json(
        { success: false, error: 'scenario must include field and value' },
        { status: 400 }
      );
    }

    // Validate field is a known what-if field
    const validFields = [
      'monthlyIncomeUSD', 'savingsUSD', 'hasHealthInsurance',
      'hasReturnTicket', 'hasHotelBooking', 'hasSponsor',
      'budgetUSD', 'hasPriorTravel',
    ];

    if (!validFields.includes(scenario.field)) {
      return NextResponse.json(
        { success: false, error: `Invalid field '${scenario.field}'. Valid fields: ${validFields.join(', ')}` },
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

    // Transform to CountryData
    const countryData = transformCountryToData(country as Parameters<typeof transformCountryToData>[0]);

    // Calculate current score (before)
    const beforeBreakdown = calculateScore(countryData, profile);

    // Simulate what-if scenario
    const afterBreakdown = simulateWhatIf(beforeBreakdown, countryData, profile, scenario);

    // Calculate the delta
    const delta: ScoreBreakdown['components'] = afterBreakdown.components.map((component, i) => ({
      ...component,
      score: Math.round((afterBreakdown.components[i].score - beforeBreakdown.components[i].score) * 10) / 10,
      weightedScore: Math.round((afterBreakdown.components[i].weightedScore - beforeBreakdown.components[i].weightedScore) * 10) / 10,
    }));

    return NextResponse.json({
      success: true,
      data: {
        scenario: {
          field: scenario.field,
          oldValue: profile[scenario.field as keyof UserProfileData],
          newValue: scenario.value,
        },
        before: {
          finalScore: beforeBreakdown.finalScore,
          visaLikelihood: beforeBreakdown.visaLikelihood,
          costSuitability: beforeBreakdown.costSuitability,
          eligibility: beforeBreakdown.eligibility,
          hardFiltersFailed: beforeBreakdown.hardFilters.filter((f) => !f.passed).length,
        },
        after: {
          finalScore: afterBreakdown.finalScore,
          visaLikelihood: afterBreakdown.visaLikelihood,
          costSuitability: afterBreakdown.costSuitability,
          eligibility: afterBreakdown.eligibility,
          hardFiltersFailed: afterBreakdown.hardFilters.filter((f) => !f.passed).length,
        },
        delta: {
          finalScore: Math.round((afterBreakdown.finalScore - beforeBreakdown.finalScore) * 10) / 10,
          visaLikelihood: Math.round((afterBreakdown.visaLikelihood - beforeBreakdown.visaLikelihood) * 10) / 10,
          costSuitability: Math.round((afterBreakdown.costSuitability - beforeBreakdown.costSuitability) * 10) / 10,
          eligibility: Math.round((afterBreakdown.eligibility - beforeBreakdown.eligibility) * 10) / 10,
        },
        componentChanges: delta,
        recommendation: buildWhatIfRecommendation(beforeBreakdown, afterBreakdown, scenario.field),
      },
    });
  } catch (error) {
    console.error('Error in what-if simulation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to simulate what-if scenario', ...(process.env.NODE_ENV !== 'production' ? { details: String(error) } : {}) },
      { status: 500 }
    );
  }
}

function buildWhatIfRecommendation(
  before: ScoreBreakdown,
  after: ScoreBreakdown,
  field: string
): string {
  const diff = after.finalScore - before.finalScore;

  if (Math.abs(diff) < 1) {
    return `Changing ${field} has minimal impact on your score (${diff > 0 ? '+' : ''}${diff.toFixed(1)} points). Consider other improvements for better results.`;
  }

  if (diff > 0) {
    return `Increasing ${field} improves your score by +${diff.toFixed(1)} points, bringing your final score to ${after.finalScore}/100. This change is recommended!`;
  }

  return `Decreasing ${field} lowers your score by ${diff.toFixed(1)} points to ${after.finalScore}/100. Be cautious about this change.`;
}
