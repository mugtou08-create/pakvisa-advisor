import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const VERIFIED_TILL = '2025-07-31';
const TODAY = new Date().toISOString();

const turkeyData = [
  {
    type: 'e-Visa',
    description: 'Pakistanis are eligible for the Turkish e-Visa, which can be obtained online at evisa.gov.tr. The e-Visa is valid for 180 days and allows a single entry stay of up to 30 days for tourism or business purposes. The application is straightforward: fill the online form, pay the fee (USD 50) via credit/debit card, and receive the e-Visa via email within minutes. Requirements include a valid passport (6 months validity), a return ticket, sufficient funds (USD 50/day), and hotel reservation or accommodation details. Pakistani citizens aged 18-35 must also provide a Schengen, US, UK, or Ireland visa/residence permit OR a valid OECD member visa. The e-Visa cannot be extended — for longer stays, a regular visa must be obtained from the Turkish Embassy.',
    maxDuration: '30 days (single entry, visa valid 180 days)',
    extensions: false,
    multipleEntry: false,
    processingDaysMin: 1,
    processingDaysMax: 1,
    sourceUrl: 'https://www.evisa.gov.tr/',
    requirements: [
      { category: 'passport', requirement: 'Passport valid at least 6 months from entry date', mandatory: true, description: 'Machine-readable Pakistani passport required.' },
      { category: 'travel', requirement: 'Return or onward flight ticket', mandatory: true, description: 'Must show confirmed return travel within the 30-day stay.' },
      { category: 'financial', requirement: 'Proof of sufficient funds (USD 50/day recommended)', mandatory: true, description: 'Bank statement or credit card. Approximately USD 1,500 for 30 days recommended.' },
      { category: 'accommodation', requirement: 'Hotel reservation or accommodation details', mandatory: true, description: 'Hotel booking for the stay period or address of where you will stay.' },
      { category: 'employment', requirement: 'Supporting visa (Schengen/US/UK/Ireland/OECD) for ages 18-35', mandatory: true, description: 'Pakistani citizens aged 18-35 must hold a valid visa or residence permit from Schengen, US, UK, Ireland, or an OECD country.' },
      { category: 'photograph', requirement: 'Digital photo (uploaded during online application)', mandatory: true, description: 'Uploaded as part of the e-Visa application form.' },
      { category: 'financial', requirement: 'Valid credit/debit card for online payment', mandatory: true, description: 'Visa or Mastercard for the USD 50 e-Visa fee payment.' },
    ],
    cost: { visaFeeUSD: 50, serviceFeeUSD: 0, currency: 'TRY', visaFeeLocal: 50, visaFeeLocalLabel: 'USD 50' },
  },
  {
    type: 'Tourist Visa (Sticker)',
    description: 'The Turkish Sticker Visa is for Pakistani citizens who do not qualify for the e-Visa (e.g., those aged 18-35 without a supporting visa/residence permit) or who need a longer stay. Applications are made at the Turkish Embassy in Islamabad or Consulate in Karachi. Processing typically takes 5-10 working days. The sticker visa allows stays of up to 30 or 90 days depending on the visa issued. It can be single or multiple entry.',
    maxDuration: '30-90 days',
    extensions: false,
    multipleEntry: false,
    processingDaysMin: 5,
    processingDaysMax: 10,
    sourceUrl: 'https://www.evisa.gov.tr/',
    requirements: [
      { category: 'passport', requirement: 'Passport valid at least 6 months', mandatory: true, description: 'With at least 2 blank pages.' },
      { category: 'photograph', requirement: 'Passport-size photographs (2, white background)', mandatory: true, description: 'Recent photos meeting Turkish visa specifications.' },
      { category: 'travel', requirement: 'Return flight ticket', mandatory: true, description: 'Confirmed booking for return travel.' },
      { category: 'accommodation', requirement: 'Hotel reservation or host invitation letter', mandatory: true, description: 'Confirmed hotel booking or invitation letter from Turkish host with their ID copy.' },
      { category: 'financial', requirement: 'Bank statements for last 3 months', mandatory: true, description: 'Showing sufficient balance for the trip. Recommended: PKR 500,000+.' },
      { category: 'employment', requirement: 'Employment NOC or student letter', mandatory: true, description: 'Employment letter with leave approval or student enrollment letter.' },
      { category: 'employment', requirement: 'Cover letter explaining visit purpose', mandatory: true, description: 'Detailed letter about travel plans and purpose.' },
    ],
    cost: { visaFeeUSD: 30, serviceFeeUSD: 0, currency: 'TRY', visaFeeLocal: 30, visaFeeLocalLabel: 'USD 30 (single entry)' },
  },
  {
    type: 'Student Visa',
    description: 'The Turkish Student Visa allows Pakistani students to study at Turkish universities. Turkey is increasingly popular for Pakistani students due to affordable tuition, Turkiye Burslari scholarships, and cultural proximity. The process: (1) Get admission from a Turkish university, (2) Apply for student visa at the Turkish Embassy, (3) Upon arrival, apply for residence permit (ikamet) within 30 days. The student visa is typically valid for 90 days — actual authorization comes from the residence permit. Students can work part-time with permission. Many programs are available in English.',
    maxDuration: '90 days (entry) + residence permit (1 year, renewable)',
    extensions: true,
    multipleEntry: true,
    processingDaysMin: 7,
    processingDaysMax: 15,
    sourceUrl: 'https://www.evisa.gov.tr/',
    requirements: [
      { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Valid for at least 6 months beyond the intended stay.' },
      { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'Biometric photos as per specifications.' },
      { category: 'employment', requirement: 'Acceptance letter from Turkish university', mandatory: true, description: 'Official admission/acceptance letter from a recognized Turkish institution.' },
      { category: 'financial', requirement: 'Proof of sufficient funds or scholarship letter', mandatory: true, description: 'Bank statements showing at least USD 500/month, OR Turkiye Burslari scholarship letter.' },
      { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'Required for the residence permit. Turkish SGK or private insurance.' },
      { category: 'employment', requirement: 'Academic certificates and transcripts', mandatory: true, description: 'Previous educational qualifications.' },
      { category: 'employment', requirement: 'Notarized translation of documents (Turkish)', mandatory: false, description: 'Educational documents may need Turkish notarized translations.' },
    ],
    cost: { visaFeeUSD: 30, serviceFeeUSD: 0, currency: 'TRY', visaFeeLocal: 30, visaFeeLocalLabel: 'USD 30 (visa) + residence permit fees in Turkey' },
  },
  {
    type: 'Work Visa',
    description: 'The Turkish Work Visa (Calisma Izni) requires the employer in Turkey to first obtain a work permit from the Ministry of Labor and Social Security (MLSS). The employer submits the application on behalf of the foreign worker. The process: (1) Employer applies for work permit at MLSS (30-45 days), (2) Employee applies for work visa at Turkish Embassy in Pakistan, (3) Upon arrival, register for residence permit within 30 days. The work permit is typically valid for 1 year and renewable. Minimum salary is the Turkish minimum wage (TRY 20,002.50/month in 2024). After 5 years, workers may be eligible for citizenship or long-term residence.',
    maxDuration: '1 year (renewable)',
    extensions: true,
    multipleEntry: true,
    processingDaysMin: 30,
    processingDaysMax: 60,
    sourceUrl: 'https://www.evisa.gov.tr/',
    requirements: [
      { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Valid for the intended work period.' },
      { category: 'photograph', requirement: 'Passport-size photographs (4)', mandatory: true, description: 'As per Turkish specifications.' },
      { category: 'employment', requirement: 'Work permit approval from MLSS (employer applies)', mandatory: true, description: 'The Turkish employer must obtain the work permit. This is the primary requirement.' },
      { category: 'employment', requirement: 'Employment contract from Turkish employer', mandatory: true, description: 'Signed contract with salary meeting minimum wage requirements.' },
      { category: 'employment', requirement: 'Educational certificates (attested)', mandatory: true, description: 'Relevant professional qualifications with notarized Turkish translations.' },
      { category: 'health', requirement: 'Medical certificate from approved doctor', mandatory: true, description: 'General health certificate.' },
      { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'Required for residence permit.' },
    ],
    cost: { visaFeeUSD: 50, serviceFeeUSD: 0, currency: 'TRY', visaFeeLocal: 50, visaFeeLocalLabel: 'USD 50 + work permit fees (employer pays)' },
  },
];

async function main() {
  const country = await db.country.findFirst({ where: { code: 'Turkey' } });
  if (!country) { console.log('Turkey not found'); return; }
  console.log(`Found: ${country.name} (${country.id})`);

  let totalVT = 0, totalReq = 0, totalCost = 0;
  for (const vtData of turkeyData) {
    const existingVT = await db.visaType.findFirst({ where: { countryId: country.id, type: vtData.type } });
    let visaType: { id: string };
    if (existingVT) {
      await db.visaType.update({ where: { id: existingVT.id }, data: { description: vtData.description, maxDuration: vtData.maxDuration, extensions: vtData.extensions, multipleEntry: vtData.multipleEntry, processingDaysMin: vtData.processingDaysMin, processingDaysMax: vtData.processingDaysMax, sourceUrl: vtData.sourceUrl, verifiedTill: VERIFIED_TILL, fetchTimestamp: new Date(TODAY), parserConfidence: 0.95 } });
      visaType = existingVT;
      console.log(`  Updated: ${vtData.type}`);
    } else {
      const newVT = await db.visaType.create({ data: { countryId: country.id, type: vtData.type, description: vtData.description, maxDuration: vtData.maxDuration, extensions: vtData.extensions, multipleEntry: vtData.multipleEntry, processingDaysMin: vtData.processingDaysMin, processingDaysMax: vtData.processingDaysMax, sourceUrl: vtData.sourceUrl, verifiedTill: VERIFIED_TILL, fetchTimestamp: new Date(TODAY), parserConfidence: 0.95 } });
      visaType = newVT;
      console.log(`  Created: ${vtData.type}`);
    }
    totalVT++;
    for (const req of vtData.requirements) {
      const exists = await db.visaRequirement.findFirst({ where: { countryId: country.id, visaTypeId: visaType.id, category: req.category, requirement: req.requirement } });
      if (!exists) { await db.visaRequirement.create({ data: { countryId: country.id, visaTypeId: visaType.id, category: req.category, requirement: req.requirement, mandatory: req.mandatory, description: req.description, sourceUrl: vtData.sourceUrl, fetchTimestamp: new Date(TODAY), parserConfidence: 0.95 } }); totalReq++; }
    }
    console.log(`    ${vtData.requirements.length} requirements`);
    const existingCost = await db.costProfile.findFirst({ where: { countryId: country.id, visaTypeId: visaType.id } });
    if (!existingCost) {
      await db.costProfile.create({ data: { countryId: country.id, visaTypeId: visaType.id, visaTypeName: vtData.type, visaFeeUSD: vtData.cost.visaFeeUSD, serviceFeeUSD: vtData.cost.serviceFeeUSD, processingDays: Math.round((vtData.processingDaysMin + vtData.processingDaysMax) / 2), processingDaysMin: vtData.processingDaysMin, processingDaysMax: vtData.processingDaysMax, currency: vtData.cost.currency, sourceUrl: vtData.sourceUrl, verifiedTill: VERIFIED_TILL, fetchTimestamp: new Date(TODAY), parserConfidence: 0.95 } });
      console.log(`    Cost: ${vtData.cost.visaFeeLocalLabel}`);
    }
    totalCost++;
  }
  console.log(`\nTurkey complete: ${totalVT} visa types, ${totalReq} requirements, ${totalCost} cost profiles`);
  await db.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
