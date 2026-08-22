import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// One-time data fix: correct visaFree flags for countries that were wrongly marked.
// Pakistani passport holders do NOT have visa-free access to these countries.
// Source: Henley Passport Index 2026, official government portals.
// This endpoint should be removed after successful execution.

const FIXES = [
  // These 6 were incorrectly set to visaFree = true.
  // They all require e-Visa or embassy visa for Pakistani citizens.
  { name: 'United Arab Emirates', visaFree: false, visaOnArrival: false, etaAvailable: true, correctedCategory: 'e-Visa' },
  { name: 'Malaysia', visaFree: false, visaOnArrival: false, etaAvailable: true, correctedCategory: 'e-Visa' },
  { name: 'Mexico', visaFree: false, visaOnArrival: false, etaAvailable: false, correctedCategory: 'Embassy Required' },
  { name: 'Azerbaijan', visaFree: false, visaOnArrival: false, etaAvailable: true, correctedCategory: 'e-Visa' },
  { name: 'Georgia', visaFree: false, visaOnArrival: false, etaAvailable: true, correctedCategory: 'e-Visa' },
  { name: 'Lebanon', visaFree: false, visaOnArrival: false, etaAvailable: false, correctedCategory: 'Embassy Required' },
];

export async function POST() {
  try {
    const results: { name: string; before: { visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean }; after: { visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean }; status: string }[] = [];

    for (const fix of FIXES) {
      const country = await db.country.findFirst({ where: { name: fix.name } });

      if (!country) {
        results.push({ name: fix.name, before: { visaFree: false, visaOnArrival: false, etaAvailable: false }, after: { visaFree: false, visaOnArrival: false, etaAvailable: false }, status: 'NOT FOUND' });
        continue;
      }

      const before = { visaFree: country.visaFree, visaOnArrival: country.visaOnArrival, etaAvailable: country.etaAvailable };

      await db.country.update({
        where: { id: country.id },
        data: {
          visaFree: fix.visaFree,
          visaOnArrival: fix.visaOnArrival,
          etaAvailable: fix.etaAvailable,
        },
      });

      const wasCorrected = before.visaFree !== fix.visaFree || before.visaOnArrival !== fix.visaOnArrival || before.etaAvailable !== fix.etaAvailable;
      results.push({
        name: country.name,
        before,
        after: { visaFree: fix.visaFree, visaOnArrival: fix.visaOnArrival, etaAvailable: fix.etaAvailable },
        status: wasCorrected ? `CORRECTED → ${fix.correctedCategory}` : 'ALREADY CORRECT',
      });
    }

    // Also do a safety sweep: set ANY remaining visaFree=true countries to false
    // (Pakistani passport has 0 visa-free countries)
    const remaining = await db.country.findMany({ where: { visaFree: true } });
    const sweepResults: string[] = [];
    for (const c of remaining) {
      await db.country.update({ where: { id: c.id }, data: { visaFree: false } });
      sweepResults.push(`SWEPT: ${c.name} (was visaFree=true, now false)`);
    }

    return NextResponse.json({
      success: true,
      message: 'Visa data fix applied',
      fixes: results,
      sweep: sweepResults,
      sweepCount: sweepResults.length,
    });
  } catch (error) {
    console.error('Fix visa data error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix visa data', details: String(error) },
      { status: 500 }
    );
  }
}

// Allow GET for easy browser-based triggering
export async function GET() {
  return POST();
}
