import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const r = await p.$queryRawUnsafe(`
    SELECT c.name, vt.type, COUNT(vr.id) as req_count, cp.visaFeeUSD as fee, vt.processingDaysMin, vt.processingDaysMax, vt.verifiedTill
    FROM VisaType vt 
    JOIN Country c ON vt.countryId=c.id 
    LEFT JOIN VisaRequirement vr ON vr.visaTypeId=vt.id 
    LEFT JOIN CostProfile cp ON cp.visaTypeId=vt.id 
    WHERE c.name IN ('United Arab Emirates','Saudi Arabia','United Kingdom','United States','Canada','France','Netherlands','Ireland','Germany','Australia') 
    GROUP BY c.name, vt.type, cp.visaFeeUSD, vt.processingDaysMin, vt.processingDaysMax, vt.verifiedTill 
    ORDER BY c.name, vt.type
  `);
  for (const row of r as any[]) {
    console.log(`${row.name} | ${row.type} | Reqs: ${row.req_count} | Fee: $${row.visaFeeUSD} | Processing: ${row.processingDaysMin}-${row.processingDaysMax} days | Verified: ${row.verifiedTill}`);
  }
  await p.$disconnect();
}
main();
