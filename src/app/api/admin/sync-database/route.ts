import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';

export const maxDuration = 30;

// --- Auth helper (same pattern as other admin routes) ---
function validateToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    const id = parts[0];
    const username = parts[1];
    const timestamp = parseInt(parts[3]);
    if (!id || !username) return { valid: false };
    if (!timestamp || Date.now() - timestamp > 604800000) return { valid: false };
    return { valid: true, username };
  } catch {
    return { valid: false };
  }
}

function authenticate(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  return validateToken(auth.slice(7)).valid;
}

interface TruthCountry {
  name: string;
  visaFree: boolean;
  visaOnArrival: boolean;
  etaAvailable: boolean;
  visaFeeUSD: number;
  processingDaysMin: number;
  processingDaysMax: number;
}

interface TruthData {
  version: string;
  source: string;
  lastVerified: string;
  countries: TruthCountry[];
}

function getAccessLabel(vf: boolean, voa: boolean, eta: boolean) {
  if (vf) return 'Visa Free';
  if (voa) return 'Visa on Arrival';
  if (eta) return 'e-Visa';
  return 'Embassy Required';
}

// ============================================================
// POST /api/admin/sync-database
// Body: { action: 'research' } | { action: 'apply', corrections: [...] }
// ============================================================
export async function POST(request: NextRequest) {
  if (!authenticate(request)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'research') {
      return await handleResearch();
    } else if (action === 'apply') {
      return await handleApply(body.corrections);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action. Use "research" or "apply".' }, { status: 400 });
    }
  } catch (error) {
    console.error('Sync database error:', error);
    return NextResponse.json(
      { success: false, error: 'Sync failed', details: String(error) },
      { status: 500 }
    );
  }
}

// ============================================================
// RESEARCH: Compare verified truth file against the database
// ============================================================
async function handleResearch() {
  // 1. Load the verified truth data
  let truthData: TruthData;
  try {
    const truthPath = join(process.cwd(), 'src/data/visa-truth.json');
    const raw = readFileSync(truthPath, 'utf-8');
    truthData = JSON.parse(raw);
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: `Failed to load verified data file: ${err}`,
    }, { status: 500 });
  }

  const truthMap = new Map(truthData.countries.map(c => [c.name, c]));

  // 2. Fetch all countries from the database
  const countries = await db.country.findMany({
    select: {
      id: true, name: true, code: true,
      visaFree: true, visaOnArrival: true, etaAvailable: true,
      costProfiles: { select: { id: true, visaFeeUSD: true }, take: 1 },
      processingDaysMin: true, processingDaysMax: true,
    },
    orderBy: { name: 'asc' },
  });

  // 3. Compare and find differences
  const changes: Array<{
    id: string; name: string;
    before: { accessType: string; visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean; visaFeeUSD: number; processingDaysMin: number; processingDaysMax: number };
    after: { accessType: string; visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean; visaFeeUSD: number; processingDaysMin: number; processingDaysMax: number };
    reason: string; source: string;
  }> = [];

  for (const country of countries) {
    const truth = truthMap.get(country.name);
    if (!truth) continue;

    const beforeAccessType = getAccessLabel(country.visaFree, country.visaOnArrival, country.etaAvailable);
    const afterAccessType = getAccessLabel(truth.visaFree, truth.visaOnArrival, truth.etaAvailable);
    const currentFee = country.costProfiles[0]?.visaFeeUSD ?? 0;

    // Check if anything differs
    const categoryChanged = country.visaFree !== truth.visaFree || country.visaOnArrival !== truth.visaOnArrival || country.etaAvailable !== truth.etaAvailable;
    const feeChanged = currentFee !== truth.visaFeeUSD;
    const daysChanged = country.processingDaysMin !== truth.processingDaysMin || country.processingDaysMax !== truth.processingDaysMax;

    if (categoryChanged || feeChanged || daysChanged) {
      const reasons: string[] = [];
      if (categoryChanged) reasons.push(`Visa type: ${beforeAccessType} → ${afterAccessType}`);
      if (feeChanged) reasons.push(`Fee: $${currentFee} → $${truth.visaFeeUSD}`);
      if (daysChanged) reasons.push(`Processing: ${country.processingDaysMin}-${country.processingDaysMax}d → ${truth.processingDaysMin}-${truth.processingDaysMax}d`);

      changes.push({
        id: country.id,
        name: country.name,
        before: {
          accessType: beforeAccessType,
          visaFree: country.visaFree,
          visaOnArrival: country.visaOnArrival,
          etaAvailable: country.etaAvailable,
          visaFeeUSD: currentFee,
          processingDaysMin: country.processingDaysMin,
          processingDaysMax: country.processingDaysMax,
        },
        after: {
          accessType: afterAccessType,
          visaFree: truth.visaFree,
          visaOnArrival: truth.visaOnArrival,
          etaAvailable: truth.etaAvailable,
          visaFeeUSD: truth.visaFeeUSD,
          processingDaysMin: truth.processingDaysMin,
          processingDaysMax: truth.processingDaysMax,
        },
        reason: reasons.join('. '),
        source: truthData.source,
      });
    }
  }

  return NextResponse.json({
    success: true,
    action: 'research',
    totalCountries: countries.length,
    truthVersion: truthData.version,
    truthSource: truthData.source,
    truthLastVerified: truthData.lastVerified,
    correctionsNeeded: changes.length,
    changes,
    researchedAt: new Date().toISOString(),
  });
}

// ============================================================
// APPLY: Write confirmed corrections to the database
// ============================================================
async function handleApply(corrections: Array<{
  name: string;
  visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean;
  visaFeeUSD: number; processingDaysMin: number; processingDaysMax: number;
}>) {
  if (!Array.isArray(corrections) || corrections.length === 0) {
    return NextResponse.json({ success: false, error: 'No corrections provided' }, { status: 400 });
  }

  const results: { name: string; status: string; error?: string }[] = [];
  let applied = 0;
  let failed = 0;

  for (const correction of corrections) {
    try {
      const country = await db.country.findFirst({
        where: { name: correction.name },
        select: { id: true, costProfiles: { select: { id: true }, take: 1 } },
      });

      if (!country) {
        results.push({ name: correction.name, status: 'NOT FOUND' });
        failed++;
        continue;
      }

      await db.country.update({
        where: { id: country.id },
        data: {
          visaFree: correction.visaFree,
          visaOnArrival: correction.visaOnArrival,
          etaAvailable: correction.etaAvailable,
          processingDaysMin: correction.processingDaysMin,
          processingDaysMax: correction.processingDaysMax,
          fetchTimestamp: new Date(),
        },
      });

      if (country.costProfiles.length > 0) {
        await db.costProfile.update({
          where: { id: country.costProfiles[0].id },
          data: { visaFeeUSD: correction.visaFeeUSD },
        });
      }

      results.push({ name: correction.name, status: 'APPLIED' });
      applied++;
    } catch (err) {
      results.push({ name: correction.name, status: 'FAILED', error: String(err) });
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    action: 'apply',
    total: corrections.length,
    applied,
    failed,
    results,
    appliedAt: new Date().toISOString(),
  });
}
