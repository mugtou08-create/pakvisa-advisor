import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const costs = await p.costProfile.findMany({
    where: { visaTypeId: { not: null } },
    include: { visaType: { select: { type: true }, }, country: { select: { name: true } } },
    orderBy: { countryId: 'asc' },
  });
  for (const c of costs) {
    console.log(`${c.country.name} | ${c.visaType?.type} | Fee: $${c.visaFeeUSD} | Service: $${c.serviceFeeUSD} | Processing: ${c.processingDaysMin}-${c.processingDaysMax} days | ${c.currency} | Verified: ${c.verifiedTill}`);
  }
  console.log(`\nTotal per-visa-type cost profiles: ${costs.length}`);
  await p.$disconnect();
}
main();
