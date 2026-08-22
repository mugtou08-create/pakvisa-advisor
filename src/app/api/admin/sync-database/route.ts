import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

// Vercel: allow up to 120 seconds for the LLM research call
export const maxDuration = 120;

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

interface CountrySnapshot {
  id: string;
  name: string;
  code: string;
  visaFree: boolean;
  visaOnArrival: boolean;
  etaAvailable: boolean;
  visaFeeUSD: number;
  processingDaysMin: number;
  processingDaysMax: number;
}

interface LLMCorrection {
  name: string;
  visaFree: boolean;
  visaOnArrival: boolean;
  etaAvailable: boolean;
  visaFeeUSD: number;
  processingDaysMin: number;
  processingDaysMax: number;
  reason: string;
  source: string;
}

// ============================================================
// POST /api/admin/sync-database
// Body: { action: 'research' } | { action: 'apply', corrections: LLMCorrection[] }
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
// RESEARCH: Use LLM to verify and correct visa data for all countries
// ============================================================
async function handleResearch() {
  // 1. Fetch all countries with current data
  const countries = await db.country.findMany({
    select: {
      id: true, name: true, code: true,
      visaFree: true, visaOnArrival: true, etaAvailable: true,
      costProfiles: { select: { visaFeeUSD: true }, take: 1 },
      processingDaysMin: true, processingDaysMax: true,
    },
    orderBy: { name: 'asc' },
  });

  const snapshots: CountrySnapshot[] = countries.map(c => ({
    id: c.id,
    name: c.name,
    code: c.code,
    visaFree: c.visaFree,
    visaOnArrival: c.visaOnArrival,
    etaAvailable: c.etaAvailable,
    visaFeeUSD: c.costProfiles[0]?.visaFeeUSD ?? 0,
    processingDaysMin: c.processingDaysMin,
    processingDaysMax: c.processingDaysMax,
  }));

  // 2. Build the prompt with current data
  const currentDataStr = snapshots.map((c, i) =>
    `${i + 1}. ${c.name} | visaFree:${c.visaFree} visaOnArrival:${c.visaOnArrival} eVisa:${c.etaAvailable} fee:${c.visaFeeUSD}USD days:${c.processingDaysMin}-${c.processingDaysMax}`
  ).join('\n');

  const systemPrompt = `You are an expert visa research assistant for PakVisa Advisor, a website that helps Pakistani citizens understand visa requirements worldwide.

Your job is to verify and correct visa data for Pakistani passport holders for each country listed below.

RULES:
1. Pakistani citizens currently have ZERO visa-free countries (as of 2025). If any country is marked visaFree:true, it is WRONG.
2. Use the Henley Passport Index 2025 and official government e-Visa portals as your authoritative sources.
3. For each country, determine the CORRECT visa category:
   - visaFree: true ONLY if Pakistanis can enter with NO visa at all (currently NONE)
   - visaOnArrival: true if Pakistanis get visa on arrival at the airport/border
   - etaAvailable: true if Pakistanis can apply for an e-Visa online
   - If none of the above, all three should be false (Embassy Required)
4. Priority: visaFree > visaOnArrival > etaAvailable. A country can only be in ONE primary category.
5. For visa fees, provide the most common/standard tourist visa fee in USD.
6. For processing days, provide the typical range for the primary visa type.
7. Only include countries where the data DIFFERS from what is currently stored. If current data is correct, skip it.
8. Provide the reason for each correction and the source you used.

RESPOND WITH VALID JSON ONLY. No markdown, no code blocks, just the JSON array.`;

  const userPrompt = `Here is the CURRENT visa data for ${countries.length} countries in our database for Pakistani passport holders. Review each one and return ONLY the countries that need correction.

${currentDataStr}

Return a JSON array of corrections. Each object must have exactly these fields:
{
  "name": "Country Name",
  "visaFree": false,
  "visaOnArrival": false,
  "etaAvailable": false,
  "visaFeeUSD": 0,
  "processingDaysMin": 5,
  "processingDaysMax": 30,
  "reason": "Brief explanation of the correction",
  "source": "e.g. Henley Passport Index 2025, evisa.gov.tr, etc."
}

If ALL data is already correct, return an empty array: []`;

  // 3. Call LLM
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  });

  let raw = completion.choices[0]?.message?.content || '';

  // Clean up response - remove markdown code blocks if present
  raw = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

  let corrections: LLMCorrection[];
  try {
    corrections = JSON.parse(raw);
    if (!Array.isArray(corrections)) corrections = [];
  } catch {
    // Try to extract JSON array from the response
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      try { corrections = JSON.parse(match[0]); } catch { corrections = []; }
    } else {
      corrections = [];
    }
  }

  // 4. Compare with current data to build change summary
  const currentMap = new Map(snapshots.map(c => [c.name, c]));
  const changes = corrections.map(correction => {
    const current = currentMap.get(correction.name);
    if (!current) return null;

    const getAccessLabel = (vf: boolean, voa: boolean, eta: boolean) => {
      if (vf) return 'Visa Free';
      if (voa) return 'Visa on Arrival';
      if (eta) return 'e-Visa';
      return 'Embassy Required';
    };

    return {
      id: current.id,
      name: correction.name,
      before: {
        accessType: getAccessLabel(current.visaFree, current.visaOnArrival, current.etaAvailable),
        visaFree: current.visaFree,
        visaOnArrival: current.visaOnArrival,
        etaAvailable: current.etaAvailable,
        visaFeeUSD: current.visaFeeUSD,
        processingDaysMin: current.processingDaysMin,
        processingDaysMax: current.processingDaysMax,
      },
      after: {
        accessType: getAccessLabel(correction.visaFree, correction.visaOnArrival, correction.etaAvailable),
        visaFree: correction.visaFree,
        visaOnArrival: correction.visaOnArrival,
        etaAvailable: correction.etaAvailable,
        visaFeeUSD: correction.visaFeeUSD,
        processingDaysMin: correction.processingDaysMin,
        processingDaysMax: correction.processingDaysMax,
      },
      reason: correction.reason || '',
      source: correction.source || '',
    };
  }).filter(Boolean);

  return NextResponse.json({
    success: true,
    action: 'research',
    totalCountries: snapshots.length,
    correctionsNeeded: changes.length,
    changes,
    rawLLMResponse: raw,
    researchedAt: new Date().toISOString(),
  });
}

// ============================================================
// APPLY: Write confirmed corrections to the database
// ============================================================
async function handleApply(corrections: LLMCorrection[]) {
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

      // Update country visa flags
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

      // Update visa fee if cost profile exists
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
