import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const r = await p.$queryRawUnsafe(`SELECT c.name, vt.id as vtId, vt.type, vt.description, vt.maxDuration, vt.sourceUrl FROM VisaType vt JOIN Country c ON vt.countryId = c.id WHERE c.name IN ('United Arab Emirates', 'Saudi Arabia', 'United Kingdom', 'United States', 'Canada', 'France', 'Netherlands', 'Ireland', 'Germany', 'Australia') ORDER BY c.name, vt.type`);
  console.log(JSON.stringify(r, null, 2));
  await p.$disconnect();
}
main();
