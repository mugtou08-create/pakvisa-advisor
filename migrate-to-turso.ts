import { PrismaClient } from '@prisma/client';
import { createClient, Client } from '@libsql/client';

const TURSO_URL = 'libsql://pakvisa-db-pakvisa.aws-eu-west-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODY3NDczNTksImlkIjoiMDFhMDAyNzAtYTYwMS03N2M4LThjYzQtYjRmMGFkNGQwN2U4Iiwia2lkIjoiMFo3RGw0SktHOUYyZHdKRjFxYXZJU0Z0anllb0dzMG9iRHltTF9uSXJvYyIsInJpZCI6IjY1MThlNjAxLWFkYzQtNDU0My1iOGIxLWI5NjA0MjRlYTc1YyJ9.yb83UTEFumqIy7mMTFMlHDepc-Bf78cyeyQzGiGORKDSpgX2292-l-95Zx5hVzKJs4oHjxjYsGAj5xWBEWIBCw';

const localDb = new PrismaClient({
  datasources: { db: { url: 'file:/home/z/my-project/db/custom.db' } },
  log: [],
});

const turso: Client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

function s(val: unknown): unknown {
  if (val === null || val === undefined) return null;
  if (typeof val === 'boolean') return val ? 1 : 0;
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function escapeStr(val: string): string {
  return val.replace(/'/g, "''");
}

async function migrateTableSQL(name: string, records: Record<string, unknown>[], cols: string[]) {
  if (!records.length) { console.log(`${name}: 0 records`); return; }
  let ok = 0, fail = 0;

  // Build batch SQL - 5 inserts per batch to avoid timeout
  const BATCH = 5;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const stmts: string[] = [];
    for (const r of batch) {
      const vals = cols.map(c => {
        const v = s(r[c]);
        if (v === null) return 'NULL';
        if (typeof v === 'number') return String(v);
        return `'${escapeStr(String(v))}'`;
      }).join(',');
      stmts.push(`INSERT INTO ${name} (${cols.join(',')}) VALUES (${vals});`);
    }
    const sql = stmts.join('\n');
    try {
      await turso.execute(sql);
      ok += batch.length;
      console.log(`  ${name}: ${ok}/${records.length}`);
    } catch (e: unknown) {
      // Fallback: one by one for this batch
      for (const stmt of stmts) {
        try { await turso.execute(stmt); ok++; }
        catch (e2: unknown) { fail++; if (fail<=3) console.log(`    err: ${(e2 as Error).message.substring(0,60)}`); }
      }
    }
  }
  console.log(`${name}: DONE ${ok}/${records.length}${fail ? `, ${fail} failed` : ''}`);
}

async function main() {
  console.log('Starting migration to Turso (batch mode)...');

  const countries = await localDb.country.findMany();
  await migrateTableSQL('Country', countries, [
    'id','code','name','flagEmoji','flagUrl','continent','currency','currencyCode','timezone',
    'visaFree','visaOnArrival','etaAvailable','safetyRating','safetySummary','bestTravelMonths',
    'avgTempC','monthlyTemps','processingDaysMin','processingDaysMax','sourceUrl','fetchTimestamp',
    'fetchHash','parserVersion','parserConfidence','createdAt','updatedAt',
  ]);

  const visaTypes = await localDb.visaType.findMany();
  await migrateTableSQL('VisaType', visaTypes, [
    'id','countryId','type','description','maxDuration','extensions','multipleEntry',
    'sourceUrl','fetchTimestamp','parserConfidence','createdAt','updatedAt',
  ]);

  const costProfiles = await localDb.costProfile.findMany();
  await migrateTableSQL('CostProfile', costProfiles, [
    'id','countryId','visaFeeUSD','serviceFeeUSD','processingDays','monthlyLivingUSD',
    'monthlyRentUSD','monthlyFoodUSD','monthlyTransportUSD','healthInsuranceUSD',
    'totalMonthlyUSD','currency','sourceUrl','fetchTimestamp','parserConfidence','createdAt','updatedAt',
  ]);

  const requirements = await localDb.visaRequirement.findMany();
  await migrateTableSQL('VisaRequirement', requirements, [
    'id','countryId','visaTypeId','category','requirement','mandatory','description',
    'scoringWeight','sourceUrl','fetchTimestamp','fetchHash','parserVersion',
    'parserConfidence','needsReview','reviewNote','createdAt','updatedAt',
  ]);

  const scoringWeights = await localDb.scoringWeight.findMany();
  await migrateTableSQL('ScoringWeight', scoringWeights, [
    'id','category','weight','editable','description','createdAt','updatedAt',
  ]);

  const adminUsers = await localDb.adminUser.findMany();
  await migrateTableSQL('AdminUser', adminUsers, [
    'id','username','passwordHash','role','permissions','isOnline','lastLogin','createdAt','updatedAt',
  ]);

  const siteSettings = await localDb.siteSettings.findMany();
  await migrateTableSQL('SiteSettings', siteSettings, [
    'id','key','value','updatedAt',
  ]);

  const subscribers = await localDb.newsletterSubscriber.findMany();
  await migrateTableSQL('NewsletterSubscriber', subscribers, [
    'id','email','subscribedAt','isActive',
  ]);

  console.log('\nVerifying...');
  const v1 = await turso.execute('SELECT COUNT(*) as c FROM Country');
  console.log('Countries:', v1.rows[0].c);
  const v2 = await turso.execute('SELECT COUNT(*) as c FROM VisaType');
  console.log('VisaTypes:', v2.rows[0].c);
  const v3 = await turso.execute('SELECT COUNT(*) as c FROM CostProfile');
  console.log('CostProfiles:', v3.rows[0].c);
  const v4 = await turso.execute('SELECT COUNT(*) as c FROM VisaRequirement');
  console.log('Requirements:', v4.rows[0].c);
  const v5 = await turso.execute('SELECT COUNT(*) as c FROM ScoringWeight');
  console.log('ScoringWeights:', v5.rows[0].c);

  console.log('\nMigration complete!');
  await localDb.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
