/**
 * Comprehensive data fix script for PakVisa Advisor
 * 
 * Issues fixed:
 * 1. Visa flag conflicts — 14 countries had multiple flags (e.g., visaFree + visaOnArrival)
 * 2. Duplicate visa types — 265 extra rows (seed was run 3x)
 * 3. Duplicate requirements — 323 extra rows (seed was run 3x)
 * 4. Processing time anomaly — UAE visa-free but showed 3-7 days
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== PakVisa Data Fix Script ===\n');

  // ============================================================
  // FIX 1: Visa Flag Conflicts
  // ============================================================
  console.log('--- FIX 1: Visa Flag Conflicts ---');

  const flagFixes: Record<string, { visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean; processingDaysMin?: number; processingDaysMax?: number }> = {
    // UAE: Visa Free on arrival (no form, no fee for tourism) — keep visaFree only
    'United Arab Emirates': { visaFree: true, visaOnArrival: false, etaAvailable: false, processingDaysMin: 0, processingDaysMax: 0 },
    // Saudi Arabia: Visa on Arrival (the e-Visa is just the method to get VoA)
    'Saudi Arabia': { visaFree: false, visaOnArrival: true, etaAvailable: false },
    // Qatar: Visa on Arrival
    'Qatar': { visaFree: false, visaOnArrival: true, etaAvailable: false },
    // Bahrain: Visa on Arrival
    'Bahrain': { visaFree: false, visaOnArrival: true, etaAvailable: false },
    // Malaysia: Visa Free (30 days, no form needed)
    'Malaysia': { visaFree: true, visaOnArrival: false, etaAvailable: false, processingDaysMin: 0, processingDaysMax: 0 },
    // Thailand: Visa on Arrival (the e-Visa is just the application method)
    'Thailand': { visaFree: false, visaOnArrival: true, etaAvailable: false },
    // Indonesia: Visa on Arrival (VoA or e-VoA)
    'Indonesia': { visaFree: false, visaOnArrival: true, etaAvailable: false },
    // Sri Lanka: e-Visa/ETA (electronic travel authorization — classified as eVisa)
    'Sri Lanka': { visaFree: false, visaOnArrival: false, etaAvailable: true },
    // Egypt: Visa on Arrival at major airports
    'Egypt': { visaFree: false, visaOnArrival: true, etaAvailable: false },
    // Kenya: e-Visa (mandatory electronic visa before travel)
    'Kenya': { visaFree: false, visaOnArrival: false, etaAvailable: true },
    // Azerbaijan: Visa Free (the ASAN visa is e-method for other nationalities, Pakistanis are visa-free)
    'Azerbaijan': { visaFree: true, visaOnArrival: false, etaAvailable: false, processingDaysMin: 0, processingDaysMax: 0 },
    // Cambodia: Visa on Arrival
    'Cambodia': { visaFree: false, visaOnArrival: true, etaAvailable: false },
    // Ethiopia: Visa on Arrival / e-Visa
    'Ethiopia': { visaFree: false, visaOnArrival: true, etaAvailable: false },
    // Tanzania: Visa on Arrival
    'Tanzania': { visaFree: false, visaOnArrival: true, etaAvailable: false },
  };

  let flagFixCount = 0;
  for (const [name, fixes] of Object.entries(flagFixes)) {
    const result = await prisma.country.updateMany({
      where: { name },
      data: fixes as any,
    });
    if (result.count > 0) {
      console.log(`  Fixed ${name}: visaFree=${fixes.visaFree}, voa=${fixes.visaOnArrival}, eta=${fixes.etaAvailable}`);
      flagFixCount += result.count;
    } else {
      console.log(`  WARNING: Not found: ${name}`);
    }
  }
  console.log(`  Fixed ${flagFixCount} countries\n`);

  // ============================================================
  // FIX 2: Remove Duplicate Visa Types
  // ============================================================
  console.log('--- FIX 2: Duplicate Visa Types ---');

  const allCountries = await prisma.country.findMany({ include: { visaTypes: true } });
  let visaTypeDeleteCount = 0;
  let countriesWithVisaTypeDupes = 0;

  for (const country of allCountries) {
    if (country.visaTypes.length <= 1) continue;

    const seen = new Map<string, string>(); // key -> id of first occurrence
    const idsToDelete: string[] = [];

    for (const vt of country.visaTypes) {
      const key = `${vt.type}::${vt.maxDuration || ''}`;
      if (seen.has(key)) {
        idsToDelete.push(vt.id);
      } else {
        seen.set(key, vt.id);
      }
    }

    if (idsToDelete.length > 0) {
      countriesWithVisaTypeDupes++;
      await prisma.visaType.deleteMany({ where: { id: { in: idsToDelete } } });
      visaTypeDeleteCount += idsToDelete.length;
      console.log(`  ${country.name}: removed ${idsToDelete.length} dupes, kept ${seen.size} unique`);
    }
  }
  console.log(`  Fixed ${countriesWithVisaTypeDupes} countries, deleted ${visaTypeDeleteCount} rows\n`);

  // ============================================================
  // FIX 3: Remove Duplicate Requirements
  // ============================================================
  console.log('--- FIX 3: Duplicate Requirements ---');

  const allCountries2 = await prisma.country.findMany({ include: { requirements: true } });
  let reqDeleteCount = 0;
  let countriesWithReqDupes = 0;

  for (const country of allCountries2) {
    if (country.requirements.length <= 1) continue;

    const seen = new Map<string, string>();
    const idsToDelete: string[] = [];

    for (const req of country.requirements) {
      const key = req.requirement.toLowerCase().trim();
      if (seen.has(key)) {
        idsToDelete.push(req.id);
      } else {
        seen.set(key, req.id);
      }
    }

    if (idsToDelete.length > 0) {
      countriesWithReqDupes++;
      await prisma.visaRequirement.deleteMany({ where: { id: { in: idsToDelete } } });
      reqDeleteCount += idsToDelete.length;
      console.log(`  ${country.name}: removed ${idsToDelete.length} dupes, kept ${seen.size} unique`);
    }
  }
  console.log(`  Fixed ${countriesWithReqDupes} countries, deleted ${reqDeleteCount} rows\n`);

  // ============================================================
  // VERIFY
  // ============================================================
  console.log('=== VERIFICATION ===');

  const verifyCountries = await prisma.country.findMany({
    include: { visaTypes: true, requirements: true }
  });

  const stillConflicts = verifyCountries.filter(c => {
    const flags = [c.visaFree, c.visaOnArrival, c.etaAvailable].filter(Boolean);
    return flags.length > 1;
  });
  console.log(`Flag conflicts remaining: ${stillConflicts.length} ${stillConflicts.length === 0 ? 'CLEAN' : 'ISSUES'}`);

  let totalVT = 0, totalUniqueVT = 0, vtDupeCheck = 0;
  for (const c of verifyCountries) {
    totalVT += c.visaTypes.length;
    const seen = new Set(c.visaTypes.map(v => `${v.type}::${v.maxDuration || ''}`));
    totalUniqueVT += seen.size;
    if (c.visaTypes.length !== seen.size) vtDupeCheck++;
  }
  console.log(`Visa types: ${totalVT} total, ${totalUniqueVT} unique, dupes in ${vtDupeCheck} countries ${vtDupeCheck === 0 ? 'CLEAN' : 'ISSUES'}`);

  let totalReq = 0, totalUniqueReq = 0, reqDupeCheck = 0;
  for (const c of verifyCountries) {
    totalReq += c.requirements.length;
    const seen = new Set(c.requirements.map(r => r.requirement.toLowerCase().trim()));
    totalUniqueReq += seen.size;
    if (c.requirements.length !== seen.size) reqDupeCheck++;
  }
  console.log(`Requirements: ${totalReq} total, ${totalUniqueReq} unique, dupes in ${reqDupeCheck} countries ${reqDupeCheck === 0 ? 'CLEAN' : 'ISSUES'}`);

  console.log('\n=== ALL DONE ===');
}

main()
  .catch((e) => { console.error('ERROR:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
