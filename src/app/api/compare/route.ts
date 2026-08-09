import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateScore, compareCountries } from '@/lib/scoring';
import { rateLimit } from '@/lib/rate-limit';
import type { CountryData, UserProfileData, ScoreBreakdown } from '@/lib/types';

interface CompareRequestBody {
  countryCodes: string[];
  profile: UserProfileData;
  sessionId?: string;
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
  try {
    // Rate limit: 30 requests/minute
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 30, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body: CompareRequestBody = await request.json();
    const { countryCodes, profile, sessionId } = body;

    if (!countryCodes || !Array.isArray(countryCodes) || countryCodes.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 country codes are required for comparison' },
        { status: 400 }
      );
    }

    if (!countryCodes.length || countryCodes.length > 10) {
      return NextResponse.json(
        { success: false, error: 'You can compare between 2 and 10 countries at a time' },
        { status: 400 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'profile is required' },
        { status: 400 }
      );
    }

    // Fetch all countries
    const countries = await db.country.findMany({
      where: {
        code: { in: countryCodes },
      },
      include: {
        visaTypes: true,
        requirements: true,
        costProfiles: true,
      },
    });

    if (countries.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No countries found with the provided codes' },
        { status: 404 }
      );
    }

    // Check for missing countries
    const foundCodes = countries.map((c) => c.code);
    const missingCodes = countryCodes
      .filter((c) => !foundCodes.includes(c));

    if (missingCodes.length > 0) {
      return NextResponse.json(
        { success: false, error: `Countries not found: ${missingCodes.join(', ')}` },
        { status: 404 }
      );
    }

    // Calculate scores for each country
    const scores: ScoreBreakdown[] = countries.map((country) => {
      const countryData = transformCountryToData(country as Parameters<typeof transformCountryToData>[0]);
      return calculateScore(countryData, profile);
    });

    // Compare countries using the compare function
    const comparison = compareCountries(scores);

    // Create audit logs if sessionId provided
    if (sessionId) {
      const session = await db.session.findUnique({
        where: { id: sessionId },
      });
      if (session) {
        for (const country of countries) {
          await db.auditLog.create({
            data: {
              sessionId: sessionId,
              action: 'COMPARE_SCORE',
              countryId: country.id,
              component: 'Comparison',
              score: scores.find((s) => s.countryCode === country.code)?.finalScore || 0,
              details: `Compared ${country.name} with other countries`,
            },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        countries: scores,
        bestMatch: comparison.bestMatch,
        cheapest: comparison.cheapest,
        easiest: comparison.easiest,
        recommendation: comparison.recommendation,
      },
    });
  } catch (error) {
    console.error('Error comparing countries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compare countries', details: String(error) },
      { status: 500 }
    );
  }
}
