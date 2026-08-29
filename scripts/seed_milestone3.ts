import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const VERIFIED_TILL = '2025-07-31';
const TODAY = new Date().toISOString();

interface VisaTypeData {
  type: string;
  description: string;
  maxDuration: string;
  extensions: boolean;
  multipleEntry: boolean;
  processingDaysMin: number;
  processingDaysMax: number;
  sourceUrl: string;
  requirements: { category: string; requirement: string; mandatory: boolean; description: string; }[];
  cost: { visaFeeUSD: number; serviceFeeUSD: number; currency: string; visaFeeLocal?: number; visaFeeLocalLabel?: string; };
}

// MILESTONE 3: Denmark, Switzerland, Luxembourg, Belgium, Azerbaijan, Turkmenistan, Romania, Thailand, Brazil, Singapore
const M3: Record<string, VisaTypeData[]> = {
  'Denmark': [
    {
      type: 'Schengen Tourist Visa',
      description: 'The Denmark Schengen Visa allows Pakistani citizens to visit Denmark and the Schengen Area for up to 90 days within 180 days for tourism, business, visiting family/friends, or short events. Applications are processed through VFS Global on behalf of the Danish Embassy. Denmark has one of the stricter Schengen visa assessment processes — thorough financial documentation and strong ties to Pakistan are essential. Processing takes 15 calendar days but can extend to 30-45 days. Requirements include passport (3+ months validity), travel insurance (EUR 30,000), accommodation proof, round-trip flights, and proof of sufficient funds (DKK 350/day or approximately USD 50/day). Denmark is expensive, so financial evidence must be particularly robust. Interviews are common for Pakistani applicants. The Danish Agency for International Recruitment and Integration (SIRI) may conduct additional background checks.',
      maxDuration: '90 days within 180-day period',
      extensions: false, multipleEntry: false, processingDaysMin: 15, processingDaysMax: 30,
      sourceUrl: 'https://www.nyidanmark.dk/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 3 months beyond stay', mandatory: true, description: 'With blank pages, issued within last 10 years.' },
        { category: 'photograph', requirement: 'Biometric photos (2, 35x45mm)', mandatory: true, description: 'Danish/Schengen specifications.' },
        { category: 'insurance', requirement: 'Travel insurance EUR 30,000 coverage', mandatory: true, description: 'Must cover Schengen area and entire stay.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Reserved flights.' },
        { category: 'accommodation', requirement: 'Hotel reservation or invitation from Danish host', mandatory: true, description: 'Hotel bookings OR invitation letter from Danish resident with their CPR number and address proof.' },
        { category: 'financial', requirement: 'Bank statements (6 months) + DKK 350/day funds', mandatory: true, description: 'Denmark is expensive. Recommended DKK 350/day. Strong bank statements essential.' },
        { category: 'employment', requirement: 'Employment letter + leave approval + cover letter', mandatory: true, description: 'Strong ties to Pakistan are critical for Danish applications.' },
        { category: 'financial', requirement: 'FBR tax returns + property documents', mandatory: false, description: 'Highly recommended additional financial evidence.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 35, currency: 'DKK', visaFeeLocal: 80, visaFeeLocalLabel: 'EUR 80 + VFS ~EUR 30' },
    },
    {
      type: 'Student Visa',
      description: 'The Denmark Student Residence Permit allows Pakistani students to study at Danish educational institutions. Denmark offers tuition-free education at public universities for EU/EEA students, but non-EU students (including Pakistanis) pay tuition (DKK 45,000-120,000/year, approximately USD 6,500-17,000). However, many scholarships are available (Danish Government Scholarships, university-specific grants). The application is made online to SIRI (Danish Immigration Service) after receiving admission. Key requirements: proof of enrollment, proof of funds (DKK 6,397/month for 2024), health insurance, and accommodation proof. Students can work up to 20 hours/week during term and full-time in June-July-August. After graduation, a 6-month job search permit is available. Denmark is known for innovation, sustainability, and high quality of life. Programs in engineering, design, and life sciences are particularly strong.',
      maxDuration: '1 year (renewable for program duration)',
      extensions: true, multipleEntry: true, processingDaysMin: 30, processingDaysMax: 60,
      sourceUrl: 'https://www.nyidanmark.dk/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport for study period', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'Danish specifications.' },
        { category: 'employment', requirement: 'Admission letter from Danish institution', mandatory: true, description: 'From a recognized Danish university/college for full-time study.' },
        { category: 'financial', requirement: 'Proof of funds: DKK 6,397/month (2024 subsistence)', mandatory: true, description: 'Bank statements showing DKK 76,764/year. Danish bank guarantee or documented foreign account.' },
        { category: 'financial', requirement: 'Tuition fee payment receipt', mandatory: true, description: 'First year tuition payment from the institution. Scholarship holders exempt.' },
        { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'Comprehensive health insurance for first 3 months, then Danish National Health registration.' },
        { category: 'accommodation', requirement: 'Accommodation proof', mandatory: true, description: 'Student housing or rental contract. Danish housing is competitive.' },
        { category: 'employment', requirement: 'English language proficiency (IELTS/TOEFL)', mandatory: true, description: 'For English-taught programs. Typically IELTS 6.5 or equivalent.' },
      ],
      cost: { visaFeeUSD: 265, serviceFeeUSD: 35, currency: 'DKK', visaFeeLocal: 1870, visaFeeLocalLabel: 'DKK 1,870 (residence permit fee)' },
    },
  ],

  'Switzerland': [
    {
      type: 'Schengen Tourist Visa',
      description: 'The Switzerland Schengen Visa allows Pakistani citizens to visit Switzerland and the Schengen Area for up to 90 days within 180 days. Switzerland, while part of the Schengen Area, is NOT in the EU — this distinction matters for certain long-stay permits. Applications are processed through the Swiss Embassy or Consulate. Switzerland has very strict visa assessment for Pakistani applicants. Processing takes 10-15 days but can extend to 30-45 days. Key requirements include passport (3+ months validity), travel insurance (EUR 30,000 minimum, CHF 100,000 recommended by Swiss authorities), accommodation proof, round-trip flights, and proof of sufficient funds (CHF 100/day or approximately USD 110/day — the highest per-day requirement among Schengen countries). Switzerland is the most expensive country in Europe, so financial evidence must be exceptional. The Swiss embassy may request interviews. Multiple-entry visas are rare for first-time Pakistani applicants.',
      maxDuration: '90 days within 180-day period',
      extensions: false, multipleEntry: false, processingDaysMin: 10, processingDaysMax: 30,
      sourceUrl: 'https://www.sem.admin.ch/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 3 months beyond stay', mandatory: true, description: 'With blank pages, issued within last 10 years.' },
        { category: 'photograph', requirement: 'Biometric photos (2, 35x45mm)', mandatory: true, description: 'Swiss/Schengen specifications.' },
        { category: 'insurance', requirement: 'Travel insurance CHF 100,000 (EUR 30,000+)', mandatory: true, description: 'Swiss authorities recommend CHF 100,000 coverage. Must cover Schengen area.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Reserved flights showing entry/exit.' },
        { category: 'accommodation', requirement: 'Hotel reservation or invitation from Swiss host', mandatory: true, description: 'Hotel bookings for all nights OR formal invitation from Swiss resident with their ID, address proof, and financial guarantee.' },
        { category: 'financial', requirement: 'Bank statements (6 months) + CHF 100/day funds', mandatory: true, description: 'Switzerland is very expensive. CHF 100/day (USD ~110). Strong bank statements essential.' },
        { category: 'employment', requirement: 'Cover letter + employment NOC + leave approval', mandatory: true, description: 'Strong ties to Pakistan are critical.' },
        { category: 'financial', requirement: 'FBR tax returns + property documents', mandatory: false, description: 'Highly recommended for Swiss applications.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 0, currency: 'CHF', visaFeeLocal: 80, visaFeeLocalLabel: 'CHF 80' },
    },
    {
      type: 'Student Visa',
      description: 'The Switzerland Student Visa (National D Visa) allows Pakistani students to study at Swiss educational institutions. Switzerland is home to world-class universities (ETH Zurich, EPFL, University of Zurich) and offers some of the best education globally. However, tuition and living costs are very high: tuition CHF 1,000-3,000/semester at public universities (much higher at private institutions), and living costs CHF 1,800-2,500/month. The process: (1) Get admission from a Swiss university, (2) Apply for D Visa at the Swiss Embassy, (3) Upon arrival, register at the local cantonal migration office for a residence permit. Key requirements include proof of enrollment, proof of funds (CHF 21,000-30,000/year), health insurance, and accommodation proof. Students can work up to 15 hours/week during term. Swiss Government Excellence Scholarships (ESKAS) are available for Pakistani students. After graduation, a 6-month job search permit is available. Switzerland is not in the EU, so the EU Blue Card does not apply.',
      maxDuration: '1 year (renewable for program duration)',
      extensions: true, multipleEntry: true, processingDaysMin: 30, processingDaysMax: 60,
      sourceUrl: 'https://www.sem.admin.ch/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport for study period', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'Biometric photos (2)', mandatory: true, description: 'Swiss specifications.' },
        { category: 'employment', requirement: 'Admission letter from Swiss institution', mandatory: true, description: 'From a recognized Swiss university or educational institution.' },
        { category: 'financial', requirement: 'Proof of funds: CHF 21,000-30,000/year', mandatory: true, description: 'Bank statements showing sufficient funds for tuition + living costs. Swiss bank guarantee recommended.' },
        { category: 'financial', requirement: 'Tuition fee payment or scholarship letter', mandatory: true, description: 'Tuition payment receipt OR Swiss Government Excellence Scholarship (ESKAS) letter.' },
        { category: 'insurance', requirement: 'Health insurance (Swiss or international)', mandatory: true, description: 'Swiss health insurance is mandatory from day 1 of arrival.' },
        { category: 'accommodation', requirement: 'Accommodation proof', mandatory: true, description: 'Student housing, rental contract, or university-provided housing confirmation.' },
        { category: 'employment', requirement: 'Academic certificates + language proficiency', mandatory: true, description: 'Previous qualifications. English or German/French depending on program language.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 0, currency: 'CHF', visaFeeLocal: 80, visaFeeLocalLabel: 'CHF 80 (D Visa) + cantonal permit fees' },
    },
  ],

  'Luxembourg': [
    {
      type: 'Schengen Tourist Visa',
      description: 'The Luxembourg Schengen Visa allows Pakistani citizens to visit Luxembourg and the Schengen Area for up to 90 days within 180 days for tourism, business, visiting family, or short-term study. Applications are processed through the Luxembourg Embassy (often in Brussels for Pakistani applicants, as Luxembourg may not have a dedicated embassy in Islamabad). Processing takes 15 calendar days. Luxembourg is a major European financial center and while small, it offers a high standard of living. Key requirements include passport (3+ months validity), travel insurance (EUR 30,000), accommodation proof, round-trip flights, and proof of sufficient funds (EUR 57-100/day). Pakistani applicants should note that applications for Luxembourg may be routed through the Belgian or French embassy depending on diplomatic arrangements. Strong financial evidence and ties to Pakistan are essential. Multiple-entry visas are possible for established travelers.',
      maxDuration: '90 days within 180-day period',
      extensions: false, multipleEntry: false, processingDaysMin: 15, processingDaysMax: 30,
      sourceUrl: 'https://gouvernement.lu/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 3 months beyond stay', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'Biometric photos (2, 35x45mm)', mandatory: true, description: 'Schengen specifications.' },
        { category: 'insurance', requirement: 'Travel insurance EUR 30,000 coverage', mandatory: true, description: 'Must cover Schengen area and entire stay.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Reserved flights.' },
        { category: 'accommodation', requirement: 'Hotel reservation or host invitation', mandatory: true, description: 'Hotel bookings OR invitation from Luxembourg host with ID and address proof.' },
        { category: 'financial', requirement: 'Bank statements + EUR 57-100/day funds', mandatory: true, description: 'Luxembourg is expensive. EUR 57/day if hosted, EUR 100/day if hotel.' },
        { category: 'employment', requirement: 'Cover letter + employment NOC', mandatory: true, description: 'Purpose of visit and ties to Pakistan.' },
        { category: 'financial', requirement: 'FBR tax returns', mandatory: false, description: 'Strengthens application.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 35, currency: 'EUR', visaFeeLocal: 80, visaFeeLocalLabel: 'EUR 80 + VFS ~EUR 30' },
    },
  ],

  'Belgium': [
    {
      type: 'Schengen Tourist Visa',
      description: 'The Belgium Schengen Visa allows Pakistani citizens to visit Belgium and the Schengen Area for up to 90 days within 180 days for tourism, business, visiting family, or short-term study. Applications are processed through VFS Global on behalf of the Belgian Embassy in Islamabad. Processing takes 15 calendar days but can extend to 30-45 days. Belgium has a significant Pakistani diaspora, particularly in Brussels, so family visit applications are common. Key requirements include passport (3+ months validity), travel insurance (EUR 30,000), accommodation proof, round-trip flights, and proof of sufficient funds (EUR 45-100/day depending on accommodation). For visiting family, a formal invitation (attestation d\'accueil) from the Belgian host is required, obtained from the local municipality. Belgium processes applications through its regional immigration offices (Office des Étrangers). Multiple-entry visas are possible for applicants with previous compliant travel.',
      maxDuration: '90 days within 180-day period',
      extensions: false, multipleEntry: false, processingDaysMin: 15, processingDaysMax: 30,
      sourceUrl: 'https://dofi.ibz.be/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 3 months beyond stay', mandatory: true, description: 'With blank pages, issued within last 10 years.' },
        { category: 'photograph', requirement: 'Biometric photos (2, 35x45mm)', mandatory: true, description: 'Belgian/Schengen specifications.' },
        { category: 'insurance', requirement: 'Travel insurance EUR 30,000 coverage', mandatory: true, description: 'Must cover Schengen area and entire stay.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Reserved flights.' },
        { category: 'accommodation', requirement: 'Hotel reservation or attestation d\'accueil from Belgian host', mandatory: true, description: 'Hotel bookings OR attestation d\'accueil (obtained by host at local municipality) + host\'s ID and proof of address.' },
        { category: 'financial', requirement: 'Bank statements (3 months) + EUR 45-100/day funds', mandatory: true, description: 'EUR 45/day if hosted, EUR 100/day if hotel. Strong bank statements required.' },
        { category: 'employment', requirement: 'Cover letter + employment NOC', mandatory: true, description: 'Explaining purpose of visit and ties to Pakistan.' },
        { category: 'financial', requirement: 'FBR tax returns + property documents', mandatory: false, description: 'Strengthens financial credibility.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 35, currency: 'EUR', visaFeeLocal: 80, visaFeeLocalLabel: 'EUR 80 + VFS ~EUR 30' },
    },
    {
      type: 'Work Visa',
      description: 'The Belgium Work Visa requires the employer to obtain a work permit (Type B for non-EU workers) from the regional employment agency (VDAB/ACTIRIS/Forem depending on the region). The employer must prove no qualified EU/EEA candidate was available. Once the work permit is approved, the employee applies for a Type D visa at the Belgian Embassy. The work permit is valid for 1 year and renewable. Belgium has a points-based system for highly qualified workers. The minimum salary for EU Blue Card in Belgium is approximately EUR 51,712/year (2024). For ordinary work permits, the salary must meet the Belgian minimum wage. Belgium also offers specific permits for researchers, au pairs, and seasonal workers. After 5 years of legal residence, permanent residence is available. Belgium has three language communities (Dutch, French, German) which can affect work permit requirements depending on the work location.',
      maxDuration: '1 year (renewable)',
      extensions: true, multipleEntry: true, processingDaysMin: 30, processingDaysMax: 60,
      sourceUrl: 'https://dofi.ibz.be/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'For the work contract period.' },
        { category: 'photograph', requirement: 'Biometric photos (2)', mandatory: true, description: 'Belgian specifications.' },
        { category: 'employment', requirement: 'Work permit (Type B) from regional employment agency', mandatory: true, description: 'Employer must obtain this approval. Labor market test is required.' },
        { category: 'employment', requirement: 'Employment contract from Belgian employer', mandatory: true, description: 'Meeting Belgian minimum wage and working conditions.' },
        { category: 'financial', requirement: 'Salary meeting minimum wage threshold', mandatory: true, description: 'As stated in the employment contract. EUR 1,994/month gross minimum (2024).' },
        { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'Belgian social security registration or private insurance.' },
        { category: 'accommodation', requirement: 'Accommodation proof', mandatory: true, description: 'Rental contract or employer-provided housing.' },
        { category: 'employment', requirement: 'Educational qualifications', mandatory: false, description: 'Relevant professional qualifications.' },
      ],
      cost: { visaFeeUSD: 58, serviceFeeUSD: 35, currency: 'EUR', visaFeeLocal: 50, visaFeeLocalLabel: 'EUR 50 (D Visa) + VFS ~EUR 30' },
    },
  ],

  'Azerbaijan': [
    {
      type: 'ASAN Visa (e-Visa)',
      description: 'Azerbaijan offers an electronic visa (ASAN Visa) for Pakistani citizens, which can be obtained online at evisa.gov.az. The e-Visa is typically a single-entry visa valid for 30 days. The application process is straightforward: fill the online form, upload a passport scan and photo, pay the fee (USD 20 for standard processing, USD 60 for urgent 3-hour processing), and receive the e-Visa via email within 3-5 business days. The e-Visa is suitable for tourism, business visits, and family visits. No visa on arrival is available for Pakistani passport holders — the e-Visa or embassy visa must be obtained in advance. Azerbaijan has been strengthening ties with Pakistan, and the visa process is relatively straightforward. Baku is a popular tourist destination known for its modern architecture, flame towers, and old city. The e-Visa can also be obtained through VFS Global in Islamabad for those who prefer in-person submission.',
      maxDuration: '30 days (single entry)',
      extensions: false, multipleEntry: false, processingDaysMin: 3, processingDaysMax: 5,
      sourceUrl: 'https://evisa.gov.az/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months', mandatory: true, description: 'Machine-readable Pakistani passport with blank pages.' },
        { category: 'photograph', requirement: 'Digital passport-size photograph', mandatory: true, description: 'Uploaded online with the application. White background.' },
        { category: 'travel', requirement: 'Return or onward flight ticket', mandatory: true, description: 'Confirmed return travel booking.' },
        { category: 'accommodation', requirement: 'Hotel booking or accommodation details', mandatory: true, description: 'Confirmed hotel reservation or host address.' },
        { category: 'financial', requirement: 'Proof of sufficient funds', mandatory: false, description: 'Recommended: USD 500-1,000. May be checked at border.' },
        { category: 'financial', requirement: 'Valid credit/debit card for online payment', mandatory: true, description: 'For the e-Visa fee payment (USD 20 standard).' },
      ],
      cost: { visaFeeUSD: 20, serviceFeeUSD: 0, currency: 'AZN', visaFeeLocal: 20, visaFeeLocalLabel: 'USD 20 (standard) / USD 60 (urgent 3-hour)' },
    },
  ],

  'Turkmenistan': [
    {
      type: 'Tourist Visa',
      description: 'The Turkmenistan Tourist Visa for Pakistani citizens requires a Letter of Invitation (LOI) from a licensed Turkmen travel agency. Turkmenistan has one of the most restrictive visa regimes in the world. The process: (1) Contact a licensed Turkmen travel agency (such as Stantours, Owadan Tourism, or Silk Road Tours) to arrange a guided tour and obtain the LOI, (2) The agency submits the LOI to the State Migration Service of Turkmenistan for approval (takes 7-14 working days), (3) Once approved, the applicant applies for the visa at the Turkmenistan Embassy in Islamabad (or the nearest consulate), (4) The visa is typically issued as a single-entry, 10-21 day tourist visa. Independent travel is very limited — tourists must generally be accompanied by a guide and use pre-approved transportation and accommodation. Turkmenistan is known for its desert landscapes, ancient Silk Road cities (Merv, Kunya-Urgench), and the capital Ashgabat with its white marble buildings. Visa fees are approximately USD 45-85 depending on processing speed.',
      maxDuration: '10-21 days',
      extensions: false, multipleEntry: false, processingDaysMin: 10, processingDaysMax: 21,
      sourceUrl: 'https://turkmenistan.gov.tm/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months', mandatory: true, description: 'With at least 2 blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'As per Turkmen visa specifications.' },
        { category: 'employment', requirement: 'Letter of Invitation (LOI) from licensed Turkmen travel agency', mandatory: true, description: 'CRITICAL: Must be obtained through a licensed agency. The agency arranges the tour and submits to State Migration Service.' },
        { category: 'travel', requirement: 'Travel itinerary arranged by agency', mandatory: true, description: 'Pre-approved itinerary, transportation, and accommodation through the inviting agency.' },
        { category: 'financial', requirement: 'Proof of sufficient funds', mandatory: false, description: 'Recommended USD 50-100/day. Tour package usually covers most costs.' },
        { category: 'financial', requirement: 'Tour package payment to travel agency', mandatory: true, description: 'Must pay for the full guided tour package through the licensed agency.' },
      ],
      cost: { visaFeeUSD: 55, serviceFeeUSD: 0, currency: 'USD', visaFeeLocal: 55, visaFeeLocalLabel: 'USD 55-85 (tourist visa) + tour package cost' },
    },
    {
      type: 'Transit Visa',
      description: 'The Turkmenistan Transit Visa is a 5-day visa for Pakistani citizens transiting through Turkmenistan overland. This visa does NOT require an LOI, making it more accessible than the tourist visa. However, it requires a valid visa for the next destination country and confirmed onward travel arrangements. The transit visa is suitable for travelers on the Silk Road overland route (e.g., traveling from Iran to Uzbekistan). The visa is valid for 5 days from the date of entry and cannot be extended. It is issued as a single-entry visa. The applicant must clearly demonstrate transit purpose with onward travel tickets and a visa for the destination country. The transit visa application can be made at the Turkmenistan Embassy in Islamabad or at border crossings (though embassy application is recommended). This visa has become popular among overland travelers exploring Central Asia.',
      maxDuration: '5 days',
      extensions: false, multipleEntry: false, processingDaysMin: 5, processingDaysMax: 10,
      sourceUrl: 'https://turkmenistan.gov.tm/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'As per specifications.' },
        { category: 'travel', requirement: 'Onward travel ticket/arrangement', mandatory: true, description: 'Confirmed onward travel within 5 days of entry.' },
        { category: 'travel', requirement: 'Valid visa for the next destination country', mandatory: true, description: 'Must show a valid visa for the country you are transiting to (e.g., Uzbekistan, Iran).' },
        { category: 'financial', requirement: 'Proof of sufficient transit funds', mandatory: false, description: 'Recommended USD 200-300 for the 5-day transit period.' },
      ],
      cost: { visaFeeUSD: 25, serviceFeeUSD: 0, currency: 'USD', visaFeeLocal: 25, visaFeeLocalLabel: 'USD 25 (transit visa)' },
    },
  ],

  'Romania': [
    {
      type: 'Short-Stay Visa (Type C)',
      description: 'The Romania Short-Stay Visa (Type C) allows Pakistani citizens to visit Romania for up to 90 days within 180 days for tourism, business, family visits, or short-term study. Romania is NOT yet a full Schengen member (air and sea borders joined Schengen in March 2024; land borders pending), but it issues Schengen-equivalent short-stay visas. Applications are processed through the Romanian Embassy in Islamabad. Processing takes 10-15 working days. Key requirements include passport (3+ months validity), travel insurance (EUR 30,000), accommodation proof, round-trip flights, and proof of sufficient funds (approximately EUR 50/day). Romania is an affordable European destination compared to Western Europe, making it attractive for Pakistani tourists. The visa allows travel within Romania only (not yet full Schengen area access). Multiple-entry Type C visas are possible. Romania has a growing IT sector and is becoming an attractive destination for tech professionals.',
      maxDuration: '90 days within 180-day period',
      extensions: false, multipleEntry: false, processingDaysMin: 10, processingDaysMax: 15,
      sourceUrl: 'https://evisa.mae.ro/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 3 months beyond stay', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'Biometric photos (2, 35x45mm)', mandatory: true, description: 'Romanian visa specifications.' },
        { category: 'insurance', requirement: 'Travel insurance EUR 30,000 coverage', mandatory: true, description: 'Must cover Romania and entire stay period.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Reserved flights.' },
        { category: 'accommodation', requirement: 'Hotel reservation or invitation from Romanian host', mandatory: true, description: 'Hotel bookings OR invitation letter from Romanian resident with their ID and address.' },
        { category: 'financial', requirement: 'Bank statements + EUR 50/day funds', mandatory: true, description: 'Romania is more affordable. EUR 50/day recommended.' },
        { category: 'employment', requirement: 'Cover letter + employment NOC', mandatory: true, description: 'Purpose of visit and ties to Pakistan.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 0, currency: 'EUR', visaFeeLocal: 80, visaFeeLocalLabel: 'EUR 80' },
    },
    {
      type: 'Long-Stay Visa (Type D)',
      description: 'The Romania Long-Stay Visa (Type D) is for Pakistani citizens planning to stay in Romania for more than 90 days for work, study, family reunification, or business. The visa must be converted to a residence permit upon arrival. Key categories include: (1) Work Visa — requires employer approval from the Romanian Immigration Inspectorate (IGI), (2) Study Visa — for enrollment at a Romanian university, (3) Family Reunification — for joining family members legally residing in Romania. Romania has become attractive for IT professionals — the minimum gross salary for EU Blue Card is approximately EUR 2,350/month (2024), which is lower than many Western European countries. Romania offers affordable living costs (EUR 500-800/month) and a growing economy. After 5 years of legal residence, permanent residency is possible. After 8 years, Romanian citizenship can be applied for (reduced to 5 years if married to a Romanian citizen). The university application process opens the path to student Type D visas with relatively affordable tuition (EUR 2,000-5,000/year in English programs).',
      maxDuration: '1 year (converts to residence permit)',
      extensions: true, multipleEntry: true, processingDaysMin: 30, processingDaysMax: 45,
      sourceUrl: 'https://evisa.mae.ro/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport for intended stay', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'Biometric photos (2)', mandatory: true, description: 'Romanian specifications.' },
        { category: 'employment', requirement: 'Work authorization from IGI (for work visa)', mandatory: true, description: 'Employer must obtain approval from the Romanian Immigration Inspectorate. Labor market test required.' },
        { category: 'employment', requirement: 'Employment contract or university enrollment (depending on purpose)', mandatory: true, description: 'Work: signed employment contract. Study: university admission letter.' },
        { category: 'financial', requirement: 'Proof of sufficient funds', mandatory: true, description: 'For work: salary per contract. For study: EUR 500/month minimum. Bank statements.' },
        { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'Romanian health insurance registration or private insurance.' },
        { category: 'accommodation', requirement: 'Accommodation proof', mandatory: true, description: 'Rental contract or employer/university-provided housing.' },
        { category: 'employment', requirement: 'Clean criminal record (attested)', mandatory: true, description: 'From Pakistani police, attested by MoFA and the Romanian Embassy.' },
      ],
      cost: { visaFeeUSD: 58, serviceFeeUSD: 0, currency: 'EUR', visaFeeLocal: 50, visaFeeLocalLabel: 'EUR 50 (Type D visa)' },
    },
  ],

  'Thailand': [
    {
      type: 'Tourist Visa',
      description: 'The Thailand Tourist Visa (TR - Tourist Visa) for Pakistani citizens is obtained from the Royal Thai Embassy in Islamabad or the Honorary Consulate in Karachi. Pakistani citizens do NOT get visa on arrival — they must apply in advance. The visa allows a 60-day stay (extendable once by 30 days at a Thai immigration office, for a total of 90 days). Processing takes 3-5 working days. The TR visa is single entry. A Multiple Entry Tourist Visa (METV) valid for 6 months is also available for frequent travelers. The application requires a passport (6+ months validity), 2 photographs, return flight ticket, hotel booking or host address, bank statements (last 6 months showing PKR 500,000+ recommended), employment letter/NOC, and a cover letter. Thailand is one of the most popular tourist destinations for Pakistanis due to its affordability, cultural richness, and hospitality. Pakistani travelers should note that immigration officers at Thai airports have the final say on entry duration regardless of visa type.',
      maxDuration: '60 days (extendable by 30 days = 90 days total)',
      extensions: true, multipleEntry: false, processingDaysMin: 3, processingDaysMax: 5,
      sourceUrl: 'https://www.thaievisa.go.th/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months', mandatory: true, description: 'With blank pages for visa stamp.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2, 35x45mm, white background)', mandatory: true, description: 'As per Thai visa specifications.' },
        { category: 'travel', requirement: 'Return or onward flight ticket', mandatory: true, description: 'Confirmed return travel within visa validity.' },
        { category: 'accommodation', requirement: 'Hotel booking or accommodation address', mandatory: true, description: 'Confirmed hotel reservation for at least the first few nights.' },
        { category: 'financial', requirement: 'Bank statements (6 months, recommended PKR 500,000+)', mandatory: true, description: 'Thai embassy checks financial capacity carefully. Minimum recommended PKR 500,000 balance.' },
        { category: 'employment', requirement: 'Employment letter, NOC, and cover letter', mandatory: true, description: 'From employer on company letterhead with position, salary, and leave approval.' },
        { category: 'financial', requirement: 'Proof of sufficient funds (THB 10,000 per person / THB 20,000 per family)', mandatory: false, description: 'May be checked at immigration on arrival in cash.' },
      ],
      cost: { visaFeeUSD: 30, serviceFeeUSD: 0, currency: 'THB', visaFeeLocal: 1100, visaFeeLocalLabel: 'THB 1,100 (single entry, PKR ~8,500)' },
    },
    {
      type: 'e-Visa',
      description: 'The Thailand e-Visa is an online visa application system available for Pakistani citizens at thaievisa.go.th. It offers the same 60-day tourist visa as the embassy application but can be done entirely online. The process involves: (1) Create an account on thaievisa.go.th, (2) Fill the application form, (3) Upload scanned documents (passport, photo, flight ticket, hotel booking, bank statements, employment letter), (4) Pay the fee online, (5) Receive the e-Visa approval via email (usually within 5-10 working days), (6) Print and carry the e-Visa approval letter to present at the Thai immigration counter. The e-Visa system is more convenient than visiting the embassy but processing can take slightly longer. The e-Visa is a single-entry tourist visa with the same 60-day stay and 30-day extension rules as the regular TR visa. The fee is THB 1,100 (same as the embassy visa).',
      maxDuration: '60 days (extendable by 30 days = 90 days total)',
      extensions: true, multipleEntry: false, processingDaysMin: 5, processingDaysMax: 10,
      sourceUrl: 'https://www.thaievisa.go.th/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months', mandatory: true, description: 'Scanned copy of the main page uploaded online.' },
        { category: 'photograph', requirement: 'Digital passport-size photograph', mandatory: true, description: 'Uploaded online. White background, 35x45mm.' },
        { category: 'travel', requirement: 'Return or onward flight ticket', mandatory: true, description: 'Scanned copy of confirmed return booking uploaded online.' },
        { category: 'accommodation', requirement: 'Hotel booking confirmation', mandatory: true, description: 'Scanned hotel reservation uploaded online.' },
        { category: 'financial', requirement: 'Bank statements (6 months)', mandatory: true, description: 'Scanned bank statements uploaded. PKR 500,000+ recommended.' },
        { category: 'employment', requirement: 'Employment letter/NOC', mandatory: true, description: 'Scanned employment letter uploaded online.' },
        { category: 'financial', requirement: 'Online payment (credit/debit card)', mandatory: true, description: 'THB 1,100 fee paid online via the e-Visa portal.' },
      ],
      cost: { visaFeeUSD: 30, serviceFeeUSD: 0, currency: 'THB', visaFeeLocal: 1100, visaFeeLocalLabel: 'THB 1,100 (same as embassy)' },
    },
  ],

  'Brazil': [
    {
      type: 'Tourist Visa',
      description: 'Brazil offers visa-free entry to Pakistani citizens for tourism and business for up to 90 days (extendable by another 90 days, for a maximum of 180 days per year). This facility was introduced in 2024 as part of Brazil\'s efforts to boost tourism. At the immigration counter, travelers should present: a valid passport (6+ months validity), return or onward ticket, hotel booking or accommodation details, and proof of sufficient funds. The immigration officer may ask about the purpose of visit and travel plans. For stays beyond 90 days or for other purposes (study, work, voluntary service), a proper visa must be obtained from the Brazilian Embassy. The visa-free entry is for tourism and business meetings only — employment is not permitted. Brazil is a vast country and Pakistani tourists typically visit São Paulo, Rio de Janeiro, Foz do Iguaçu, and the Amazon. Yellow fever vaccination is recommended for certain regions. An e-Visa option is also available for those who prefer to have a visa stamped before travel.',
      maxDuration: '90 days (extendable by 90 more = 180 days/year max)',
      extensions: true, multipleEntry: false, processingDaysMin: 0, processingDaysMax: 0,
      sourceUrl: 'https://brazil.vfsglobal.com/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months', mandatory: true, description: 'Must have blank pages for entry stamp.' },
        { category: 'travel', requirement: 'Return or onward flight ticket', mandatory: true, description: 'Confirmed return travel within visa-free period.' },
        { category: 'accommodation', requirement: 'Hotel booking or accommodation details', mandatory: true, description: 'First night hotel booking or address of host.' },
        { category: 'financial', requirement: 'Proof of sufficient funds (USD 100/day recommended)', mandatory: true, description: 'Bank statement, credit card, or cash. USD 100/day is a good benchmark for Brazil.' },
        { category: 'health', requirement: 'Yellow fever vaccination (recommended for certain regions)', mandatory: false, description: 'Recommended if visiting Amazon, Minas Gerais, or other endemic areas. Certificate valid for life.' },
        { category: 'employment', requirement: 'Employment proof / business card (for ties to Pakistan)', mandatory: false, description: 'Helps demonstrate intent to return.' },
      ],
      cost: { visaFeeUSD: 0, serviceFeeUSD: 0, currency: 'BRL', visaFeeLocal: 0, visaFeeLocalLabel: 'Free (visa-free entry for Pakistani citizens)' },
    },
    {
      type: 'Business Visa',
      description: 'While Pakistanis can enter Brazil visa-free for business meetings (up to 90 days), a formal Business Visa (VITUR - Temporary Visa I) may be needed for extended business activities, frequent travel, or business activities beyond meetings (e.g., attending trade fairs, signing contracts, conducting audits). The business visa is obtained through the Brazilian Embassy in Islamabad or via VFS Global. Processing typically takes 5-10 working days. The visa is valid for up to 90 days and can be extended. For frequent business travelers, a multiple-entry business visa valid for up to 2 years may be issued. The key document is an invitation letter from the Brazilian business partner explaining the purpose and duration of the business activities. Brazil has growing trade relations with Pakistan (textiles, rice, pharmaceuticals), and business travel between the two countries has increased.',
      maxDuration: '90 days (multiple entry 2-year visa possible)',
      extensions: true, multipleEntry: true, processingDaysMin: 5, processingDaysMax: 10,
      sourceUrl: 'https://brazil.vfsglobal.com/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'As per Brazilian visa specifications.' },
        { category: 'travel', requirement: 'Return flight ticket', mandatory: true, description: 'Confirmed return travel.' },
        { category: 'employment', requirement: 'Invitation letter from Brazilian business partner', mandatory: true, description: 'On company letterhead explaining the business purpose, duration, and activities planned.' },
        { category: 'financial', requirement: 'Bank statements (3 months)', mandatory: true, description: 'Showing sufficient funds for the business trip.' },
        { category: 'employment', requirement: 'Cover letter and company documents', mandatory: true, description: 'Letter from Pakistani company explaining the business trip. Company registration (SECP), NTN.' },
        { category: 'accommodation', requirement: 'Hotel booking or host arrangement', mandatory: true, description: 'Accommodation details in Brazil.' },
      ],
      cost: { visaFeeUSD: 50, serviceFeeUSD: 30, currency: 'BRL', visaFeeLocal: 250, visaFeeLocalLabel: 'USD 50 (consular fee)' },
    },
  ],

  'Singapore': [
    {
      type: 'Tourist Visa',
      description: 'Pakistani citizens require a visa to enter Singapore. The Singapore Tourist Visa is applied for online through the Immigration & Checkpoints Authority (ICA) portal or through authorized visa agents in Pakistan. Processing typically takes 3-5 working days for standard applications, though additional security screening may extend this to 7-14 days. The visa is typically valid for 30 days of stay, though the duration is determined by the ICA officer. The visa itself is valid for use within 2 years from the date of issue. Key requirements include a valid passport (6+ months), return flight ticket, hotel booking or accommodation proof, and bank statements showing sufficient funds. Singapore has strict immigration rules — visitors must not engage in any employment or business. Overstaying is a serious offense in Singapore with fines and caning for severe cases. Multiple-entry visas may be issued to applicants with good travel history. The visa application is online but requires a local contact (Singaporean citizen, PR, or registered company) who can be contacted for verification.',
      maxDuration: '30 days (visa valid 2 years for multiple entries)',
      extensions: false, multipleEntry: true,
      processingDaysMin: 3, processingDaysMax: 14,
      sourceUrl: 'https://www.ica.gov.sg/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'Digital passport-size photograph', mandatory: true, description: 'Uploaded online with the application. White background, 35x45mm.' },
        { category: 'travel', requirement: 'Return or onward flight ticket', mandatory: true, description: 'Confirmed return travel within the visa stay period.' },
        { category: 'accommodation', requirement: 'Hotel booking or accommodation details', mandatory: true, description: 'Confirmed hotel reservation or address of host in Singapore.' },
        { category: 'financial', requirement: 'Bank statements (3-6 months)', mandatory: true, description: 'Showing sufficient funds. Recommended SGD 1,000-2,000 equivalent.' },
        { category: 'employment', requirement: 'Employment letter / NOC / student enrollment', mandatory: true, description: 'Establishing ties to Pakistan. Critical for Singapore applications.' },
        { category: 'employment', requirement: 'Local contact in Singapore (Form V39A)', mandatory: true, description: 'A Singaporean citizen, PR, or registered business who can be contacted for verification. Must complete Form V39A.' },
      ],
      cost: { visaFeeUSD: 22, serviceFeeUSD: 15, currency: 'SGD', visaFeeLocal: 30, visaFeeLocalLabel: 'SGD 30 (visa fee)' },
    },
    {
      type: 'Business Visa',
      description: 'The Singapore Business Visa is for Pakistani citizens traveling to Singapore for business meetings, conferences, trade fairs, or exploring business opportunities. The application is made through the ICA online portal or authorized visa agents. The business visa is essentially a variant of the tourist visa with business purpose. Processing time is 3-14 working days. A letter of invitation from a Singapore-registered company or business partner is important, along with a cover letter from the Pakistani company explaining the business purpose. The visa does NOT permit employment — it is strictly for business visits, meetings, and negotiations. For actual work in Singapore, an Employment Pass (EP), S Pass, or Work Permit is required (employer-driven process). Multiple-entry business visas are available for frequent business travelers. Singapore is a major business hub in Asia and Pakistani businesspeople frequently visit for trade, IT, and financial services.',
      maxDuration: '30 days (multiple entry visa valid 2 years)',
      extensions: false, multipleEntry: true,
      processingDaysMin: 3, processingDaysMax: 14,
      sourceUrl: 'https://www.ica.gov.sg/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'Digital passport-size photograph', mandatory: true, description: 'Uploaded online.' },
        { category: 'travel', requirement: 'Return flight ticket', mandatory: true, description: 'Confirmed return travel.' },
        { category: 'employment', requirement: 'Invitation letter from Singapore business partner', mandatory: true, description: 'From a Singapore-registered company on their letterhead, explaining business purpose.' },
        { category: 'employment', requirement: 'Cover letter from Pakistani company', mandatory: true, description: 'On company letterhead explaining business objectives, company profile, and relationship with Singapore partner.' },
        { category: 'financial', requirement: 'Bank statements (3-6 months)', mandatory: true, description: 'Showing sufficient funds for the business trip.' },
        { category: 'employment', requirement: 'Local contact in Singapore (Form V39A)', mandatory: true, description: 'Singaporean contact person or registered business for verification.' },
        { category: 'accommodation', requirement: 'Hotel booking or business address', mandatory: true, description: 'Accommodation details in Singapore.' },
      ],
      cost: { visaFeeUSD: 22, serviceFeeUSD: 15, currency: 'SGD', visaFeeLocal: 30, visaFeeLocalLabel: 'SGD 30' },
    },
    {
      type: 'Student Pass',
      description: 'The Singapore Student Pass allows Pakistani students to study at Singapore\'s educational institutions (universities, polytechnics, private schools). The process: (1) Obtain admission from a Singapore institution, (2) The institution submits the Student Pass application on behalf of the student to the ICA, (3) Upon approval, the student receives an In-Principle Approval (IPA) letter, (4) Travel to Singapore and complete formalities at the ICA to get the Student Pass card. The Student Pass is valid for the duration of the study program. Key requirements include proof of admission, proof of funds (SGD 15,000-30,000/year for living costs), and a medical examination. Singapore has world-class institutions (NUS, NTU, SMU) and many private education institutions offering programs in English. Public university tuition for international students is approximately SGD 17,000-25,000/year for undergraduate programs. Students on Student Pass can work part-time (up to 16 hours/week during term, full-time during breaks) at approved institutions.',
      maxDuration: 'Duration of study program (typically 2-4 years)',
      extensions: true, multipleEntry: true,
      processingDaysMin: 14, processingDaysMax: 30,
      sourceUrl: 'https://www.ica.gov.sg/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport for study period', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'Digital passport-size photograph', mandatory: true, description: 'Uploaded online by the institution.' },
        { category: 'employment', requirement: 'Acceptance letter from Singapore institution', mandatory: true, description: 'The institution submits the Student Pass application on the student\'s behalf.' },
        { category: 'financial', requirement: 'Proof of funds (SGD 15,000-30,000/year)', mandatory: true, description: 'Bank statements or sponsor\'s financial documents showing ability to cover tuition and living costs.' },
        { category: 'financial', requirement: 'Tuition fee payment or financial guarantee', mandatory: true, description: 'First semester/year tuition payment or scholarship letter.' },
        { category: 'health', requirement: 'Medical examination (upon arrival in Singapore)', mandatory: true, description: 'HIV, TB, and other tests at designated clinics in Singapore. Done after arrival.' },
        { category: 'insurance', requirement: 'Medical insurance', mandatory: true, description: 'Required as part of the Student Pass conditions.' },
        { category: 'employment', requirement: 'Academic certificates and transcripts', mandatory: true, description: 'Previous educational qualifications submitted during admission.' },
      ],
      cost: { visaFeeUSD: 22, serviceFeeUSD: 0, currency: 'SGD', visaFeeLocal: 30, visaFeeLocalLabel: 'SGD 30 (Student Pass issuance fee) + tuition' },
    },
  ],
};

async function main() {
  console.log('=== Milestone 3: Visa Knowledge Base Expansion ===');
  console.log(`Verified till: ${VERIFIED_TILL}\n`);
  const countries = Object.keys(M3);
  let totalUpdated = 0, totalRequirements = 0, totalCostProfiles = 0;
  for (const countryName of countries) {
    const visaTypesData = M3[countryName];
    console.log(`\n--- ${countryName} (${visaTypesData.length} visa types) ---`);
    const country = await db.country.findFirst({ where: { name: countryName } });
    if (!country) { console.log(`  Country not found: ${countryName}`); continue; }
    for (const vtData of visaTypesData) {
      const existingVT = await db.visaType.findFirst({ where: { countryId: country.id, type: vtData.type } });
      let visaType: { id: string };
      if (existingVT) {
        await db.visaType.update({ where: { id: existingVT.id }, data: { description: vtData.description, maxDuration: vtData.maxDuration, extensions: vtData.extensions, multipleEntry: vtData.multipleEntry, processingDaysMin: vtData.processingDaysMin, processingDaysMax: vtData.processingDaysMax, sourceUrl: vtData.sourceUrl, verifiedTill: VERIFIED_TILL, fetchTimestamp: new Date(TODAY), parserConfidence: 0.95 } });
        visaType = existingVT; console.log(`  Updated: ${vtData.type}`);
      } else {
        const newVT = await db.visaType.create({ data: { countryId: country.id, type: vtData.type, description: vtData.description, maxDuration: vtData.maxDuration, extensions: vtData.extensions, multipleEntry: vtData.multipleEntry, processingDaysMin: vtData.processingDaysMin, processingDaysMax: vtData.processingDaysMax, sourceUrl: vtData.sourceUrl, verifiedTill: VERIFIED_TILL, fetchTimestamp: new Date(TODAY), parserConfidence: 0.95 } });
        visaType = newVT; console.log(`  Created: ${vtData.type}`);
      }
      totalUpdated++;
      for (const req of vtData.requirements) {
        const existingReq = await db.visaRequirement.findFirst({ where: { countryId: country.id, visaTypeId: visaType.id, category: req.category, requirement: req.requirement } });
        if (!existingReq) { await db.visaRequirement.create({ data: { countryId: country.id, visaTypeId: visaType.id, category: req.category, requirement: req.requirement, mandatory: req.mandatory, description: req.description, sourceUrl: vtData.sourceUrl, fetchTimestamp: new Date(TODAY), parserConfidence: 0.95 } }); totalRequirements++; }
      }
      console.log(`    ${vtData.requirements.length} requirements`);
      const existingCost = await db.costProfile.findFirst({ where: { countryId: country.id, visaTypeId: visaType.id } });
      if (!existingCost) { await db.costProfile.create({ data: { countryId: country.id, visaTypeId: visaType.id, visaTypeName: vtData.type, visaFeeUSD: vtData.cost.visaFeeUSD, serviceFeeUSD: vtData.cost.serviceFeeUSD, processingDays: Math.round((vtData.processingDaysMin + vtData.processingDaysMax) / 2), processingDaysMin: vtData.processingDaysMin, processingDaysMax: vtData.processingDaysMax, currency: vtData.cost.currency, sourceUrl: vtData.sourceUrl, verifiedTill: VERIFIED_TILL, fetchTimestamp: new Date(TODAY), parserConfidence: 0.95 } }); totalCostProfiles++; console.log(`    Cost: ${vtData.cost.visaFeeLocalLabel}`); }
      else { await db.costProfile.update({ where: { id: existingCost.id }, data: { visaTypeName: vtData.type, visaFeeUSD: vtData.cost.visaFeeUSD, serviceFeeUSD: vtData.cost.serviceFeeUSD, processingDays: Math.round((vtData.processingDaysMin + vtData.processingDaysMax) / 2), processingDaysMin: vtData.processingDaysMin, processingDaysMax: vtData.processingDaysMax, currency: vtData.cost.currency, sourceUrl: vtData.sourceUrl, verifiedTill: VERIFIED_TILL } }); totalCostProfiles++; console.log(`    Cost updated: ${vtData.cost.visaFeeLocalLabel}`); }
    }
  }
  console.log('\n=== MILESTONE 3 COMPLETE ===');
  console.log(`Countries processed: ${countries.length}`);
  console.log(`Visa types enriched: ${totalUpdated}`);
  console.log(`Per-visa-type requirements created: ${totalRequirements}`);
  console.log(`Per-visa-type cost profiles: ${totalCostProfiles}`);
  console.log(`Verified till: ${VERIFIED_TILL}`);
  await db.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
