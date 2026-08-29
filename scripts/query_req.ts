import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const r = await p.$queryRawUnsafe(`SELECT c.name, vr.id, vr.visaTypeId, vr.category, vr.requirement, vr.mandatory FROM VisaRequirement vr JOIN Country c ON vr.countryId = c.id WHERE c.name IN ('United Arab Emirates', 'Saudi Arabia', 'United Kingdom', 'United States', 'Canada', 'France', 'Netherlands', 'Ireland', 'Germany', 'Australia') ORDER BY c.name, vr.category, vr.requirement`);
  console.log(JSON.stringify(r, null, 2));
  await p.$disconnect();
}
main();
