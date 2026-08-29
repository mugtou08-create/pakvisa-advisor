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
  requirements: {
    category: string;
    requirement: string;
    mandatory: boolean;
    description: string;
  }[];
  cost: {
    visaFeeUSD: number;
    serviceFeeUSD: number;
    currency: string;
    visaFeeLocal?: number;
    visaFeeLocalLabel?: string;
  };
}

// =============================================================
// MILESTONE 1: UAE, Saudi Arabia, UK, USA, Canada, France, Netherlands, Ireland, Germany, Australia
// Verified till: 2025-07-31
// =============================================================

const MILESTONE_DATA: Record<string, VisaTypeData[]> = {
  'United Arab Emirates': [
    {
      type: 'Tourist Visa',
      description: 'The UAE Tourist Visa allows Pakistani citizens to visit the UAE for tourism, leisure, or short-term family visits. Pakistanis do NOT get visa on arrival — they must apply in advance through the UAE ICP portal, a travel agency, or an airline. The standard 30-day single-entry tourist visa is the most common option. A 60-day tourist visa is also available for longer stays. Applicants must provide a passport with 6 months validity, passport-size photographs, confirmed return flight ticket, hotel booking or sponsor address proof, and bank statements showing sufficient funds. The visa is typically processed within 3-5 working days. Visa on arrival was previously available for certain categories but has been discontinued for Pakistani passport holders. Women under 18 and men under 18 traveling alone may need additional documentation or parental consent.',
      maxDuration: '30 days (extendable to 60 days)',
      extensions: true,
      multipleEntry: false,
      processingDaysMin: 3,
      processingDaysMax: 5,
      sourceUrl: 'https://u.ae/en/information-and-services/visas',
      requirements: [
        { category: 'passport', requirement: 'Passport valid for at least 6 months from entry date', mandatory: true, description: 'Must have at least 2 blank pages. Machine-readable Pakistani passport required.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2, white background, 35x45mm)', mandatory: true, description: 'Recent color photographs with white background, no glasses, face covering 70-80% of frame.' },
        { category: 'travel', requirement: 'Confirmed return or onward flight ticket', mandatory: true, description: 'Must show confirmed booking for departure from UAE within visa validity period.' },
        { category: 'accommodation', requirement: 'Hotel booking confirmation or sponsor address proof', mandatory: true, description: 'Confirmed hotel reservation for entire stay OR letter of invitation from UAE resident/host with their Emirates ID copy and tenancy contract.' },
        { category: 'financial', requirement: 'Bank statements for last 3-6 months', mandatory: true, description: 'Must show sufficient balance (typically AED 10,000+ or equivalent). Salary slips help strengthen the application.' },
        { category: 'financial', requirement: 'Proof of sufficient travel funds or credit card copy', mandatory: false, description: 'Credit card copy or additional proof of financial capacity.' },
        { category: 'health', requirement: 'Travel health insurance', mandatory: false, description: 'Recommended but not strictly mandatory for tourist visa. Required if applying for longer stay.' },
        { category: 'employment', requirement: 'NOC from employer (if employed)', mandatory: false, description: 'No Objection Certificate from employer on company letterhead stating approved leave period.' },
      ],
      cost: { visaFeeUSD: 90, serviceFeeUSD: 30, currency: 'AED', visaFeeLocal: 330, visaFeeLocalLabel: 'AED 330 (approx.)' },
    },
    {
      type: 'Business Visa',
      description: 'The UAE Business Visa is designed for Pakistani citizens traveling to the UAE for business meetings, conferences, exhibitions, or exploring commercial opportunities. This visa can be single or multiple-entry. A sponsor in the UAE (a company, free zone authority, or business partner) must apply on behalf of the applicant through the General Directorate of Residency and Foreigners Affairs (GDRFA). The sponsor handles the application and guarantees the visitor. Processing typically takes 3-7 working days. For Pakistani nationals, the business visa requires a sponsoring company in the UAE, an invitation letter on company letterhead, and the visitor\'s passport with 6 months validity. Multiple-entry business visas are valid for 6 months with each stay up to 30 days. This visa does not permit employment — for work, an Employment Visa is required.',
      maxDuration: '30 days per entry (multiple entry valid 6 months)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 3,
      processingDaysMax: 7,
      sourceUrl: 'https://u.ae/en/information-and-services/visas',
      requirements: [
        { category: 'passport', requirement: 'Passport valid for at least 6 months', mandatory: true, description: 'Must have at least 2 blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2, white background)', mandatory: true, description: 'Recent color photographs meeting UAE photo specifications.' },
        { category: 'travel', requirement: 'Return flight ticket', mandatory: true, description: 'Confirmed booking for return travel.' },
        { category: 'employment', requirement: 'Invitation letter from UAE-based company or sponsor', mandatory: true, description: 'On company letterhead with trade license copy, stating purpose of visit, duration, and that sponsor will bear costs.' },
        { category: 'employment', requirement: 'Company trade license copy (sponsor)', mandatory: true, description: 'Copy of the UAE sponsoring company\'s trade license.' },
        { category: 'financial', requirement: 'Bank statements for last 3 months', mandatory: true, description: 'Personal bank statements showing financial capacity.' },
        { category: 'accommodation', requirement: 'Accommodation arrangement details', mandatory: true, description: 'Hotel booking or letter from sponsor confirming accommodation arrangement.' },
        { category: 'employment', requirement: 'Business cards or company profile', mandatory: false, description: 'Business card of the applicant and/or company profile helps strengthen application.' },
      ],
      cost: { visaFeeUSD: 120, serviceFeeUSD: 40, currency: 'AED', visaFeeLocal: 440, visaFeeLocalLabel: 'AED 440 (approx.)' },
    },
    {
      type: 'Work Visa',
      description: 'The UAE Employment Visa (also called Work Permit or Labor Card) is required for Pakistani citizens who have secured employment in the UAE. The employer/sponsor in the UAE initiates the visa application process. The process involves: (1) Employer obtains work permit from Ministry of Human Resources and Emiratisation (MOHRE), (2) Entry permit is issued, (3) Employee travels to UAE, (4) Medical fitness test and Emirates ID registration within 30 days, (5) Residence visa is stamped. The employment visa is typically valid for 2 years. Key requirements include a job offer letter, educational certificate attestation (from MoFA Pakistan, UAE Embassy, and MoFA UAE), and medical fitness clearance. The employer bears most costs. Workers in some sectors may need additional approvals. Family members can be sponsored on a dependent visa if the employee meets minimum salary requirements (AED 4,000+).',
      maxDuration: '2 years',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 7,
      processingDaysMax: 21,
      sourceUrl: 'https://u.ae/en/information-and-services/visas',
      requirements: [
        { category: 'passport', requirement: 'Passport valid for at least 6 months', mandatory: true, description: 'Must be machine-readable with blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photographs (4, white background)', mandatory: true, description: 'As per UAE specifications for residence visa processing.' },
        { category: 'employment', requirement: 'Employment contract / job offer letter from UAE employer', mandatory: true, description: 'Signed employment contract with salary, position, and terms. Must be MOHRE-approved.' },
        { category: 'employment', requirement: 'Educational certificates (attested)', mandatory: true, description: 'Degrees must be attested by: MoFA Pakistan → UAE Embassy Islamabad → MoFA UAE. Processing can take 2-4 weeks.' },
        { category: 'health', requirement: 'Medical fitness test (in UAE)', mandatory: true, description: 'Blood test (HIV, Hepatitis B/C), chest X-ray. Done at approved UAE medical center after arrival.' },
        { category: 'health', requirement: 'Police clearance certificate from Pakistan', mandatory: false, description: 'May be required for certain professions or by specific employers.' },
        { category: 'financial', requirement: 'Employer bears visa costs (no personal financial proof required)', mandatory: false, description: 'The UAE employer is responsible for all visa processing costs.' },
        { category: 'accommodation', requirement: 'Employer provides accommodation or housing allowance', mandatory: false, description: 'Per UAE labor law, employer must provide accommodation or housing allowance.' },
      ],
      cost: { visaFeeUSD: 200, serviceFeeUSD: 50, currency: 'AED', visaFeeLocal: 700, visaFeeLocalLabel: 'AED 700-2000 (employer pays)' },
    },
  ],

  'Saudi Arabia': [
    {
      type: 'Tourist e-Visa',
      description: 'Saudi Arabia launched the e-Visa for Pakistani citizens in 2023, making it significantly easier to visit. Pakistani passport holders can apply online through the official e-Visa portal (visa.visitsaudi.com). The e-Visa is a multiple-entry visa valid for 1 year, allowing stays up to 90 days per visit. It covers tourism-related activities including leisure, events, visiting relatives, and Umrah (excluding Hajj). The application requires a passport scan, passport-size photo, and online payment. Processing is typically fast (instant to 24 hours). Pakistani applicants must also carry travel insurance (which can be purchased during the e-Visa application). The e-Visa cannot be used for employment or long-term study. Women do not need a male guardian to travel independently on a tourist e-Visa. COVID-19 vaccination requirements have been lifted as of 2023.',
      maxDuration: '90 days per visit (visa valid 1 year, multiple entry)',
      extensions: false,
      multipleEntry: true,
      processingDaysMin: 1,
      processingDaysMax: 3,
      sourceUrl: 'https://www.visitsaudi.com/visa-information',
      requirements: [
        { category: 'passport', requirement: 'Passport valid for at least 6 months from entry date', mandatory: true, description: 'Must have at least 2 blank pages. Pakistani machine-readable passport required.' },
        { category: 'photograph', requirement: 'Digital passport-size photograph', mandatory: true, description: 'Uploaded during online application. White background, recent photo.' },
        { category: 'travel', requirement: 'Return or onward flight ticket', mandatory: true, description: 'Should be arranged before travel. May be checked at immigration.' },
        { category: 'accommodation', requirement: 'Hotel booking or accommodation details', mandatory: true, description: 'Confirmed hotel reservation for the stay period.' },
        { category: 'insurance', requirement: 'Travel health insurance (purchasable during e-Visa application)', mandatory: true, description: 'Must cover the duration of stay. Can be purchased directly on the e-Visa portal for SAR 140.' },
        { category: 'financial', requirement: 'Proof of sufficient funds', mandatory: false, description: 'Bank statements may be requested at port of entry. Recommended to carry SAR 3,000-5,000 equivalent.' },
        { category: 'health', requirement: 'COVID-19 vaccination (no longer mandatory as of 2023)', mandatory: false, description: 'Vaccination requirements have been lifted for most travelers.' },
      ],
      cost: { visaFeeUSD: 120, serviceFeeUSD: 0, currency: 'SAR', visaFeeLocal: 450, visaFeeLocalLabel: 'SAR 450 (incl. insurance SAR 140)' },
    },
    {
      type: 'Umrah Visa',
      description: 'The Umrah Visa is specifically for Pakistani Muslims wishing to perform the Umrah pilgrimage in Mecca and Medina. Unlike the tourist e-Visa, the Umrah Visa is arranged through licensed travel agencies in Pakistan approved by the Saudi Ministry of Hajj and Umrah. Pakistani citizens cannot apply for Umrah Visa individually — it must be processed through an authorized agency. The visa is typically valid for 30 days and is single-entry. The agency provides a package that includes visa processing, accommodation, transportation, and guidance. Required documents include a valid passport, passport-size photos, proof of being Muslim (CNIC or certificate), and a meningitis vaccination certificate (mandatory for all pilgrims). Women must be accompanied by a Mahram (close male relative) unless they are 45+ and traveling in an organized group. The Umrah Visa is free of charge (visa fee waived by Saudi government), but agencies charge for their services.',
      maxDuration: '30 days (single entry)',
      extensions: false,
      multipleEntry: false,
      processingDaysMin: 5,
      processingDaysMax: 14,
      sourceUrl: 'https://www.visitsaudi.com/visa-information',
      requirements: [
        { category: 'passport', requirement: 'Passport valid for at least 6 months', mandatory: true, description: 'Must have at least 2 blank pages.' },
        { category: 'photograph', requirement: 'Recent passport-size photographs (2, white background)', mandatory: true, description: 'As per Saudi visa photo specifications.' },
        { category: 'health', requirement: 'Meningitis (ACWY) vaccination certificate', mandatory: true, description: 'Mandatory for all Umrah pilgrims. Must be administered at least 10 days before travel. Valid for 3 years.' },
        { category: 'health', requirement: 'COVID-19 vaccination (requirements may vary)', mandatory: false, description: 'Check with travel agency for current COVID requirements.' },
        { category: 'travel', requirement: 'Return flight ticket (arranged by agency)', mandatory: true, description: 'Usually included in the Umrah package from authorized agency.' },
        { category: 'accommodation', requirement: 'Accommodation arrangement (arranged by agency)', mandatory: true, description: 'Part of the Umrah package. Hotels in Mecca and Medina.' },
        { category: 'employment', requirement: 'Proof of being Muslim (CNIC religion field or certificate)', mandatory: true, description: 'Pakistani CNIC showing "Islam" or a certificate from a mosque/imam.' },
        { category: 'financial', requirement: 'Umrah package payment to authorized agency', mandatory: true, description: 'Package typically costs PKR 250,000-600,000 depending on category (economy to premium).' },
      ],
      cost: { visaFeeUSD: 0, serviceFeeUSD: 0, currency: 'SAR', visaFeeLocal: 0, visaFeeLocalLabel: 'Free (agency charges apply)' },
    },
    {
      type: 'Work Visa',
      description: 'The Saudi Arabia Work Visa (Employment Visa/Iqama) is for Pakistani citizens who have a job offer from a Saudi employer. The Saudi employer initiates the process by obtaining a work permit from the Ministry of Human Resources and Social Development (MHRSD) and an invitation letter. The process involves: (1) Employer gets approval and block visa, (2) Documents are attested (degrees from MoFA Pakistan → Saudi Embassy → MoFA Saudi Arabia), (3) Medical test from an approved center in Pakistan (GAMCA/Wafid), (4) Visa stamping at the Saudi Embassy/Consulate in Pakistan, (5) Travel to Saudi Arabia, (6) Medical test in KSA and fingerprints/Iqama issuance within 90 days. The Iqama (residence permit) is typically valid for 1-2 years. Family visa can be obtained after proving minimum salary requirements. Saudi Arabia has been implementing Saudization (Nitaqat) policy, requiring companies to hire a percentage of Saudi nationals.',
      maxDuration: '1-2 years (Iqama)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 14,
      processingDaysMax: 45,
      sourceUrl: 'https://www.visitsaudi.com/visa-information',
      requirements: [
        { category: 'passport', requirement: 'Passport valid for at least 6 months', mandatory: true, description: 'Machine-readable passport with blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photographs (4, white background)', mandatory: true, description: 'As per Saudi specifications.' },
        { category: 'employment', requirement: 'Employment contract/offer letter from Saudi employer', mandatory: true, description: 'Signed contract approved by MHRSD.' },
        { category: 'employment', requirement: 'Educational certificates (attested)', mandatory: true, description: 'Must be attested by: MoFA Pakistan → Saudi Embassy Islamabad → MoFA Saudi Arabia. Takes 2-4 weeks.' },
        { category: 'health', requirement: 'GAMCA/Wafid medical test from approved center in Pakistan', mandatory: true, description: 'Blood tests, chest X-ray, physical exam. Valid for 3 months. Must be from GAMCA-approved medical center.' },
        { category: 'health', requirement: 'Medical fitness test (in Saudi Arabia)', mandatory: true, description: 'Second medical test upon arrival. Must be completed within 90 days for Iqama.' },
        { category: 'financial', requirement: 'Employer bears visa processing costs', mandatory: false, description: 'Saudi employer is responsible for visa fees, medical tests, and Iqama fees.' },
        { category: 'employment', requirement: 'Police clearance certificate (may be required)', mandatory: false, description: 'Some employers and professions may require a police clearance certificate from Pakistan.' },
      ],
      cost: { visaFeeUSD: 200, serviceFeeUSD: 80, currency: 'SAR', visaFeeLocal: 750, visaFeeLocalLabel: 'SAR 750+ (employer typically pays)' },
    },
  ],

  'United Kingdom': [
    {
      type: 'Standard Visitor Visa',
      description: 'The UK Standard Visitor Visa allows Pakistani citizens to visit the UK for tourism, business meetings, short-term study (up to 6 months), visiting family/friends, or medical treatment. This is the most common UK visa for Pakistanis. Applications are made online via GOV.UK, followed by biometric enrollment at a Visa Application Center (VAC) in Pakistan (Islamabad, Karachi, Lahore, or Mirpur). Processing times vary: standard service is 3-6 weeks, priority service (additional fee) is 5 working days, and super-priority is 1 working day. Key requirements include a valid passport, proof of funds (bank statements for 6 months), accommodation details, and strong ties to Pakistan (employment, property, family). The visa officer assesses the applicant\'s intention to return to Pakistan. Overstaying can result in a 10-year re-entry ban. The visa is typically granted for 6 months. Long-term visitor visas (2, 5, or 10 years) are available but more expensive.',
      maxDuration: '6 months',
      extensions: false,
      multipleEntry: false,
      processingDaysMin: 15,
      processingDaysMax: 30,
      sourceUrl: 'https://www.gov.uk/browse/visas-immigration',
      requirements: [
        { category: 'passport', requirement: 'Current valid passport', mandatory: true, description: 'Must have at least 1 blank page. All previous passports should be provided.' },
        { category: 'photograph', requirement: 'Biometric photo (taken at VAC)', mandatory: true, description: 'Photo taken during biometric enrollment at the Visa Application Center.' },
        { category: 'travel', requirement: 'Travel itinerary and flight booking details', mandatory: false, description: 'Not mandatory to submit but helps show travel plans. Do not purchase non-refundable tickets before visa approval.' },
        { category: 'accommodation', requirement: 'Accommodation details (hotel booking or host invitation)', mandatory: true, description: 'Hotel reservation OR letter of invitation from UK host with their passport copy, proof of address (utility bill), and tenancy agreement if applicable.' },
        { category: 'financial', requirement: 'Bank statements for last 6 months', mandatory: true, description: 'Personal bank statements showing regular income and sufficient balance. Recommended minimum PKR 500,000-1,000,000 equivalent in savings.' },
        { category: 'financial', requirement: 'TB (tuberculosis) test certificate', mandatory: true, description: 'Mandatory from approved TB testing centers in Pakistan. Valid for 6 months. Required for stays over 6 months; recommended for all applicants.' },
        { category: 'health', requirement: 'IHS (Immigration Health Surcharge) payment', mandatory: true, description: 'GBP 624 per year (from Feb 2024). Must be paid online during application. Covers NHS healthcare during stay.' },
        { category: 'employment', requirement: 'Employment letter and NOC from employer', mandatory: true, description: 'On company letterhead with salary details, position, leave approval. Establishes ties to Pakistan.' },
        { category: 'employment', requirement: 'Ties to Pakistan evidence', mandatory: true, description: 'Property documents, family ties, business ownership, or other evidence of intent to return.' },
        { category: 'travel', requirement: 'Travel history (previous visas, stamps)', mandatory: false, description: 'Previous travel history strengthens the application significantly. Include old passports.' },
      ],
      cost: { visaFeeUSD: 133, serviceFeeUSD: 50, currency: 'GBP', visaFeeLocal: 115, visaFeeLocalLabel: 'GBP 115 + IHS GBP 624' },
    },
    {
      type: 'Student Visa',
      description: 'The UK Student Visa replaces the former Tier 4 visa. It allows Pakistani students to study full-time at a UK educational institution (university, college, or school) that holds a Student Sponsor license. The visa duration matches the course length plus a short extra period (usually up to 4 months for courses below degree level, up to 6 months for degree-level and above). Key requirements include a Confirmation of Acceptance for Studies (CAS) from the sponsoring institution, proof of English language proficiency (IELTS UKVI, usually 5.5-7.0 depending on course), proof of funds to cover tuition and living costs (at least GBP 1,023/month for London or GBP 824/month outside London for up to 9 months), and a TB test certificate. Students can work up to 20 hours per week during term time and full-time during holidays (for degree-level courses). Dependent visas are available for postgraduate students only (as of Jan 2024). The Graduate Route allows staying for 2 years post-study (3 years for PhD).',
      maxDuration: 'Course length + up to 6 months',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 15,
      processingDaysMax: 30,
      sourceUrl: 'https://www.gov.uk/browse/visas-immigration',
      requirements: [
        { category: 'passport', requirement: 'Current valid passport', mandatory: true, description: 'With at least one blank page. Must be valid for entire stay.' },
        { category: 'photograph', requirement: 'Biometric photo (taken at VAC)', mandatory: true, description: 'Taken during biometric enrollment at Visa Application Center.' },
        { category: 'employment', requirement: 'CAS (Confirmation of Acceptance for Studies) from UK institution', mandatory: true, description: 'A unique reference number (e.g., CAS1234567) issued by the sponsoring institution. Contains course details and applicant information.' },
        { category: 'employment', requirement: 'English language proof (IELTS UKVI)', mandatory: true, description: 'IELTS UKVI Academic test scores. Minimum varies by course (typically 5.5-7.0 overall, no band below 5.5-6.0).' },
        { category: 'financial', requirement: 'Proof of funds for tuition + living costs', mandatory: true, description: 'Tuition fee (first year) + GBP 1,023/month for London or GBP 824/month for outside London (up to 9 months). Bank statements must show funds held for 28 consecutive days.' },
        { category: 'financial', requirement: 'TB test certificate', mandatory: true, description: 'From approved TB testing center in Pakistan. Valid for 6 months.' },
        { category: 'health', requirement: 'IHS (Immigration Health Surcharge) payment', mandatory: true, description: 'GBP 624 per year. Paid online during application. Covers NHS healthcare.' },
        { category: 'employment', requirement: 'Academic certificates and transcripts', mandatory: true, description: 'Previous educational qualifications (attested copies). Must match what was declared in CAS.' },
        { category: 'travel', requirement: 'ATAS certificate (for certain courses)', mandatory: false, description: 'Academic Technology Approval Scheme required for sensitive subjects (aerospace, nuclear, etc.). Apply at least 4 weeks before CAS.' },
      ],
      cost: { visaFeeUSD: 393, serviceFeeUSD: 50, currency: 'GBP', visaFeeLocal: 339, visaFeeLocalLabel: 'GBP 339 + IHS GBP 624/year' },
    },
    {
      type: 'Work Visa',
      description: 'The UK Skilled Worker Visa allows Pakistani professionals to work in the UK if they have a job offer from a UK-licensed sponsor. This visa replaced the Tier 2 General visa. Key requirements include: a valid job offer from an approved UK sponsor with a Certificate of Sponsorship (CoS), a minimum salary of GBP 38,700/year (or the going rate for the occupation, whichever is higher — lowered from GBP 26,000 threshold in April 2024), English language proficiency at CEFR B1 level (IELTS 4.0+), and sufficient personal savings (GBP 1,270 minimum). The visa is granted for up to 5 years. After 5 years on a Skilled Worker Visa, the applicant can apply for Indefinite Leave to Remain (ILR/settlement). Shortage occupation list roles may qualify for lower salary thresholds. Applicants can bring dependents (spouse and children under 18). Processing time is typically 3-8 weeks for standard service.',
      maxDuration: 'Up to 5 years',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 15,
      processingDaysMax: 40,
      sourceUrl: 'https://www.gov.uk/browse/visas-immigration',
      requirements: [
        { category: 'passport', requirement: 'Current valid passport', mandatory: true, description: 'Must be valid for the duration of the visa.' },
        { category: 'photograph', requirement: 'Biometric photo (taken at VAC)', mandatory: true, description: 'Taken at Visa Application Center during biometrics.' },
        { category: 'employment', requirement: 'Certificate of Sponsorship (CoS) from UK licensed sponsor', mandatory: true, description: 'Unique reference number from approved employer. Contains job details, salary, and SOC code.' },
        { category: 'employment', requirement: 'Proof of English language (IELTS UKVI 4.0+ or equivalent)', mandatory: true, description: 'CEFR B1 level minimum. IELTS UKVI, TOEFL, or degree taught in English accepted.' },
        { category: 'financial', requirement: 'Proof of minimum salary (GBP 38,700/year or going rate)', mandatory: true, description: 'Sponsor must confirm salary meets the threshold. Payslips/contract may be requested.' },
        { category: 'financial', requirement: 'Personal savings of at least GBP 1,270', mandatory: true, description: 'Must show funds held for 28 consecutive days. Not required if sponsor certifies maintenance.' },
        { category: 'health', requirement: 'TB test certificate', mandatory: true, description: 'From approved TB testing center in Pakistan.' },
        { category: 'health', requirement: 'IHS payment', mandatory: true, description: 'GBP 624 per year for healthcare surcharge.' },
        { category: 'employment', requirement: 'Professional qualification certificates (attested)', mandatory: false, description: 'Relevant professional qualifications may be needed for certain occupations.' },
      ],
      cost: { visaFeeUSD: 816, serviceFeeUSD: 50, currency: 'GBP', visaFeeLocal: 710, visaFeeLocalLabel: 'GBP 710 (up to 3 years) or GBP 1,420 (5 years) + IHS' },
    },
    {
      type: 'Family Visa',
      description: 'The UK Family Visa (also known as Settlement Visa) is for Pakistani citizens who have a close family member (spouse, partner, parent, or child) who is a British citizen, settled person (ILR), or has refugee/humanitarian protection status. The most common type is the Spouse/Partner Visa. Requirements include: a genuine and subsisting relationship, minimum income of GBP 29,000/year (the sponsoring partner must earn this, rising to GBP 34,500 by late 2025), adequate accommodation without overcrowding, and English language at A1 level (IELTS Life Skills). The visa is initially granted for 2.5 years and can be extended for another 2.5 years. After 5 years on a Family Visa, the applicant can apply for ILR. The financial requirement can be met through combined income, savings, or certain benefits. Processing takes 12-24 weeks for standard service.',
      maxDuration: '2.5 years (extendable)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 60,
      processingDaysMax: 120,
      sourceUrl: 'https://www.gov.uk/browse/visas-immigration',
      requirements: [
        { category: 'passport', requirement: 'Current valid passport', mandatory: true, description: 'Must be valid for the duration of the visa application process and stay.' },
        { category: 'photograph', requirement: 'Biometric photo (taken at VAC)', mandatory: true, description: 'Taken at Visa Application Center.' },
        { category: 'employment', requirement: 'Proof of genuine relationship', mandatory: true, description: 'Marriage certificate, wedding photos, communication records (calls, messages), joint financial documents, proof of meeting in person.' },
        { category: 'financial', requirement: 'Sponsor income of at least GBP 29,000/year', mandatory: true, description: 'UK sponsor must earn this threshold through employment, self-employment, or combined with savings (GBP 16,000 + 2.5x shortfall).' },
        { category: 'accommodation', requirement: 'Proof of adequate accommodation in UK', mandatory: true, description: 'Property ownership documents, tenancy agreement, or letter from council. Must not be overcrowded.' },
        { category: 'employment', requirement: 'English language proof (IELTS Life Skills A1)', mandatory: true, description: 'Speaking and listening at CEFR A1 level. IELTS Life Skills or approved English test required.' },
        { category: 'health', requirement: 'TB test certificate', mandatory: true, description: 'From approved TB testing center in Pakistan. Valid 6 months.' },
        { category: 'health', requirement: 'IHS payment', mandatory: true, description: 'GBP 624 per year healthcare surcharge.' },
        { category: 'financial', requirement: 'Bank statements of sponsor (last 6 months)', mandatory: true, description: 'UK sponsor\'s bank statements and/or employment letter with salary confirmation.' },
      ],
      cost: { visaFeeUSD: 2137, serviceFeeUSD: 50, currency: 'GBP', visaFeeLocal: 1846, visaFeeLocalLabel: 'GBP 1,846 (applying from outside UK) + IHS' },
    },
  ],

  'United States': [
    {
      type: 'B1/B2 Visa',
      description: 'The US B1/B2 Visa is a combined visa for Pakistani citizens for temporary business (B1) or tourism/medical treatment (B2) travel. Pakistanis cannot enter the US without a visa — there is no visa-on-arrival or ESTA. The application process involves: (1) Complete DS-160 form online, (2) Pay the MRV fee (currently USD 185), (3) Schedule an interview at the US Embassy in Islamabad or Consulate in Karachi/Lahore, (4) Attend the interview with supporting documents, (5) If approved, passport is returned with visa stamp (typically 2-5 business days). Interview wait times in Pakistan can be significant (weeks to months). The visa is usually issued for 10 years validity but each entry is limited to 6 months. The consular officer assesses intent to return to Pakistan. Strong ties (stable job, property, family) are crucial. Overstaying results in serious consequences including potential lifetime bans.',
      maxDuration: '6 months per entry (visa valid up to 10 years)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 5,
      processingDaysMax: 60,
      sourceUrl: 'https://travel.state.gov/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid for at least 6 months beyond intended stay', mandatory: true, description: 'Must have blank pages for visa stamp. All previous passports should be carried to interview.' },
        { category: 'photograph', requirement: 'DS-160 digital photo (uploaded online, 2x2 inches)', mandatory: true, description: 'Uploaded during DS-160 form. Must meet US visa photo specifications: white background, taken within last 6 months, no glasses.' },
        { category: 'travel', requirement: 'DS-160 confirmation page with barcode', mandatory: true, description: 'Printed confirmation page of the completed DS-160 form with the unique barcode.' },
        { category: 'financial', requirement: 'Bank statements + income proof (last 6-12 months)', mandatory: true, description: 'Strong financial evidence showing stable income and savings. Salary slips, tax returns, business documents.' },
        { category: 'financial', requirement: 'Sponsor/invitation letter (if applicable)', mandatory: false, description: 'If visiting someone in the US, their invitation letter and proof of their status (passport, visa, I-94).' },
        { category: 'employment', requirement: 'Ties to Pakistan evidence', mandatory: true, description: 'Employment letter, business ownership documents, property ownership, family ties. This is the MOST critical factor.' },
        { category: 'accommodation', requirement: 'US host/accommodation details (if visiting someone)', mandatory: false, description: 'Address where you will stay, host contact information.' },
        { category: 'travel', requirement: 'Travel itinerary or proposed plan', mandatory: false, description: 'Not mandatory but recommended. Show planned dates, cities to visit, purpose.' },
        { category: 'health', requirement: 'Medical examination (for immigrant visas only)', mandatory: false, description: 'Not required for B1/B2. Required only for immigrant visa categories.' },
      ],
      cost: { visaFeeUSD: 185, serviceFeeUSD: 0, currency: 'USD', visaFeeLocal: 51500, visaFeeLocalLabel: 'USD 185 (PKR ~51,500)' },
    },
    {
      type: 'F1 Visa',
      description: 'The US F1 Visa is for Pakistani students pursuing academic studies (degree programs, language programs) at accredited US institutions. The process: (1) Get admission to a SEVP-certified school, (2) Receive Form I-20 from the school, (3) Pay SEVIS fee (USD 350), (4) Complete DS-160 and pay MRV fee (USD 185), (5) Schedule and attend visa interview, (6) If approved, enter US up to 30 days before program start date. Key requirements include proof of admission, sufficient funds for tuition and living expenses, intent to return to Pakistan after studies, and English proficiency. F1 students can work on-campus (20 hrs/week) and can apply for OPT (Optional Practical Training) — 1 year (3 years for STEM) after completing studies. Dependents (F2 visa) cannot work. The visa is typically issued for the duration of the study program plus a grace period. Maintenance of full-time enrollment is mandatory.',
      maxDuration: 'Duration of study program (D/S)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 5,
      processingDaysMax: 30,
      sourceUrl: 'https://travel.state.gov/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid for at least 6 months beyond stay', mandatory: true, description: 'Must be valid for the entire period of study.' },
        { category: 'photograph', requirement: 'DS-160 digital photo (2x2 inches, white background)', mandatory: true, description: 'Uploaded during DS-160 application.' },
        { category: 'employment', requirement: 'Form I-20 from SEVP-certified US institution', mandatory: true, description: 'Certificate of Eligibility issued by the school. Contains program details and estimated costs.' },
        { category: 'financial', requirement: 'Proof of funds for tuition + living expenses (1 year minimum)', mandatory: true, description: 'Bank statements, scholarship letters, sponsor affidavit of support (Form I-134). Typical annual cost: USD 30,000-70,000 depending on school and location.' },
        { category: 'financial', requirement: 'SEVIS fee payment receipt (USD 350)', mandatory: true, description: 'Paid online at fmjfee.com. Receipt must be brought to the visa interview.' },
        { category: 'employment', requirement: 'Academic transcripts and certificates', mandatory: true, description: 'Previous educational qualifications (SSC, HSSC, Bachelor\'s degrees with transcripts).' },
        { category: 'employment', requirement: 'Standardized test scores (SAT/GRE/GMAT/TOEFL/IELTS)', mandatory: true, description: 'As required by the specific institution. TOEFL/IELTS for English proficiency is almost always required.' },
        { category: 'travel', requirement: 'DS-160 confirmation page', mandatory: true, description: 'Printed confirmation with barcode from completed DS-160 form.' },
        { category: 'employment', requirement: 'Intent to return to Pakistan (ties evidence)', mandatory: true, description: 'Evidence of family ties, property, job prospects in Pakistan after graduation.' },
      ],
      cost: { visaFeeUSD: 185, serviceFeeUSD: 350, currency: 'USD', visaFeeLocal: 535, visaFeeLocalLabel: 'MRV USD 185 + SEVIS USD 350' },
    },
    {
      type: 'H1B Visa',
      description: 'The US H1B Visa is a specialty occupation work visa for Pakistani professionals with at least a Bachelor\'s degree (or equivalent experience) in a field that requires specialized knowledge. The employer must file a Labor Condition Application (LCA) with the Department of Labor, then submit the H1B petition (Form I-129) to USCIS. The H1B has an annual cap of 65,000 (plus 20,000 for Master\'s degree holders). If petitions exceed the cap, a lottery is held (typically in March for October start). The process is employer-driven — the employee cannot self-petition. The visa is valid for 3 years, extendable to 6 years total (beyond 6 years with an approved I-140/green card petition). Spouses get H4 visa; H4 holders can apply for EAD (work authorization) if the H1B holder has an approved I-140. Current processing time for H1B petitions is 2-6 months (premium processing available for USD 2,805 with 15-day guarantee).',
      maxDuration: '3 years (extendable to 6 years)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 60,
      processingDaysMax: 180,
      sourceUrl: 'https://travel.state.gov/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Must be valid for the visa period.' },
        { category: 'employment', requirement: 'Job offer from US employer for specialty occupation', mandatory: true, description: 'Position must require at least a Bachelor\'s degree in a specific field. Employer files H1B petition.' },
        { category: 'employment', requirement: 'At least a Bachelor\'s degree or equivalent', mandatory: true, description: 'Degree in a relevant field. 3 years of work experience can substitute for 1 year of education.' },
        { category: 'employment', requirement: 'Approved Labor Condition Application (LCA)', mandatory: true, description: 'Filed by employer with DOL. Must certify prevailing wage and working conditions.' },
        { category: 'employment', requirement: 'USCIS approval notice (Form I-797)', mandatory: true, description: 'After USCIS approves the H1B petition, the applicant applies for visa stamping.' },
        { category: 'financial', requirement: 'No personal financial proof required (employer-sponsored)', mandatory: false, description: 'Employer is the petitioner. No proof of personal funds needed.' },
        { category: 'travel', requirement: 'DS-160 confirmation and interview appointment', mandatory: true, description: 'After I-797 approval, apply for visa stamping at US Embassy.' },
        { category: 'photograph', requirement: 'DS-160 digital photo', mandatory: true, description: 'As per US visa photo specifications.' },
      ],
      cost: { visaFeeUSD: 460, serviceFeeUSD: 2805, currency: 'USD', visaFeeLocal: 460, visaFeeLocalLabel: 'USD 460 (filing) + USD 2,805 (premium processing, optional)' },
    },
    {
      type: 'J1 Visa',
      description: 'The US J1 Exchange Visitor Visa is for Pakistani citizens participating in approved exchange visitor programs including: research scholars, professors, students, trainees, teachers, au pairs, camp counselors, and work-and-travel programs. The program must be designated by the US Department of State. A designated sponsor organization issues Form DS-2019, which is required for the visa application. Common programs for Pakistanis include: Fulbright (research/study), Humphrey Fellowship, work-and-travel (summer jobs), and medical residency/fellowship training. The J1 visa has a key restriction: some categories require a 2-year home residency requirement (Section 212(e)), meaning the participant must return to Pakistan for 2 years before being eligible for H1B, L1, or Green Card (unless a waiver is obtained). Processing time varies by program and embassy workload.',
      maxDuration: 'Up to 2 years (varies by program)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 10,
      processingDaysMax: 45,
      sourceUrl: 'https://travel.state.gov/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Must be valid for the duration of the exchange program.' },
        { category: 'employment', requirement: 'Form DS-2019 from designated sponsor organization', mandatory: true, description: 'Certificate of Eligibility for Exchange Visitor Status. Contains program details and dates.' },
        { category: 'financial', requirement: 'SEVIS fee payment receipt (USD 220)', mandatory: true, description: 'Paid online before the visa interview.' },
        { category: 'financial', requirement: 'Proof of funding (program funding or personal)', mandatory: true, description: 'If the program provides funding, the DS-2019 will indicate it. Otherwise, show personal/sponsor funds.' },
        { category: 'employment', requirement: 'Program acceptance or placement letter', mandatory: true, description: 'Acceptance from the US host institution or program organizer.' },
        { category: 'travel', requirement: 'DS-160 confirmation page', mandatory: true, description: 'Printed confirmation from completed DS-160 form.' },
        { category: 'photograph', requirement: 'DS-160 digital photo', mandatory: true, description: 'US visa photo specifications.' },
        { category: 'employment', requirement: 'Evidence of ties to Pakistan (for non-Government funded programs)', mandatory: false, description: 'For programs not funded by US/Pak government, show intent to return.' },
      ],
      cost: { visaFeeUSD: 185, serviceFeeUSD: 220, currency: 'USD', visaFeeLocal: 405, visaFeeLocalLabel: 'MRV USD 185 + SEVIS USD 220' },
    },
  ],

  'Canada': [
    {
      type: 'Visitor Visa (TRV)',
      description: 'The Canadian Temporary Resident Visa (TRV) allows Pakistani citizens to visit Canada for tourism, visiting family/friends, or short-term business. Pakistanis must apply online via IRCC (Immigration, Refugees and Citizenship Canada) or on paper at the VAC in Islamabad. The process: (1) Complete application online or fill forms, (2) Pay fees (CAD 100 visa fee + CAD 85 biometrics), (3) Give biometrics at VAC, (4) Wait for processing (typically 14-45 days for Pakistan), (5) If approved, passport is stamped with visa. The visa is usually a multiple-entry visa valid for up to 10 years (or until passport expiry), with each stay limited to 6 months. Key factors: strong ties to Pakistan, sufficient funds, purpose of visit, and travel history. Biometrics are valid for 10 years. An Electronic Travel Authorization (eTA) is NOT available for Pakistani citizens — TRV is required.',
      maxDuration: '6 months per entry (visa valid up to 10 years)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 14,
      processingDaysMax: 45,
      sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship.html',
      requirements: [
        { category: 'passport', requirement: 'Passport valid during stay', mandatory: true, description: 'Must be valid for the duration of your planned stay. Bring all previous passports.' },
        { category: 'photograph', requirement: 'Digital photo (specific specs: 35x45mm)', mandatory: true, description: 'Uploaded online or provided at VAC. Must meet Canadian visa photo specifications.' },
        { category: 'financial', requirement: 'Proof of funds (CAD 10,000 for individual)', mandatory: true, description: 'Bank statements for 4-6 months, fixed deposits, property documents. CAD 10,000 minimum recommended per person.' },
        { category: 'financial', requirement: 'GIC (Guaranteed Investment Certificate)', mandatory: false, description: 'Not required for visitor visa. GIC is for Student Direct Stream.' },
        { category: 'employment', requirement: 'Employment letter and NOC from employer', mandatory: true, description: 'On company letterhead with position, salary, date of joining, and approved leave period.' },
        { category: 'employment', requirement: 'Letter of explanation', mandatory: true, description: 'Detailed letter explaining purpose of visit, travel plans, and ties to Pakistan.' },
        { category: 'travel', requirement: 'Travel itinerary', mandatory: false, description: 'Proposed travel dates, flights, accommodation, activities planned.' },
        { category: 'travel', requirement: 'Travel history', mandatory: false, description: 'Previous visas and travel stamps strengthen the application significantly.' },
        { category: 'insurance', requirement: 'Biometrics (fingerprints + photo) at VAC', mandatory: true, description: 'CAD 85 fee. Must be done at Canada VAC in Islamabad, Karachi, or Lahore. Valid for 10 years.' },
        { category: 'health', requirement: 'Medical exam (if stay >6 months or for specific countries)', mandatory: false, description: 'Not typically required for standard 6-month tourist visit from Pakistan.' },
      ],
      cost: { visaFeeUSD: 74, serviceFeeUSD: 63, currency: 'CAD', visaFeeLocal: 100, visaFeeLocalLabel: 'CAD 100 (visa) + CAD 85 (biometrics)' },
    },
    {
      type: 'Study Permit',
      description: 'The Canadian Study Permit allows Pakistani students to study at Designated Learning Institutions (DLIs) in Canada. Students from Pakistan can use the Student Direct Stream (SDS) for faster processing (20 calendar days) if they meet additional criteria: IELTS (6.0+ overall, no band below 6.0), GIC of CAD 20,635, tuition payment for first year, and upfront medical exam. For regular study permit, processing takes 4-8 weeks from Pakistan. The study permit is typically valid for the duration of the study program plus 90 days. Students can work on-campus without a permit and off-campus up to 20 hours/week during term and full-time during breaks. After graduation, students may be eligible for a Post-Graduation Work Permit (PGWP) of up to 3 years. Key requirement: Letter of Acceptance (LOA) from a DLI, proof of funds (CAD 20,635/year + tuition), and biometrics.',
      maxDuration: 'Duration of study program + 90 days',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 20,
      processingDaysMax: 60,
      sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship.html',
      requirements: [
        { category: 'passport', requirement: 'Passport valid for the duration of the study program', mandatory: true, description: 'Must remain valid throughout your studies in Canada.' },
        { category: 'photograph', requirement: 'Digital photo (Canadian visa specifications)', mandatory: true, description: 'Uploaded with the online application.' },
        { category: 'employment', requirement: 'Letter of Acceptance (LOA) from a DLI', mandatory: true, description: 'Official acceptance letter from a Designated Learning Institution. Includes program details, start/end dates, and DLI number.' },
        { category: 'financial', requirement: 'Proof of funds: CAD 20,635/year + tuition', mandatory: true, description: 'GIC of CAD 20,635 (for SDS) OR bank statements showing equivalent funds. First year tuition receipt also helps.' },
        { category: 'financial', requirement: 'GIC of CAD 20,635 (for Student Direct Stream)', mandatory: false, description: 'Required for SDS fast-track. Purchased from a participating Canadian financial institution.' },
        { category: 'insurance', requirement: 'Biometrics at VAC', mandatory: true, description: 'CAD 85 biometrics fee. Valid for 10 years.' },
        { category: 'health', requirement: 'Upfront medical exam (required for SDS, recommended for all)', mandatory: false, description: 'From panel physician in Pakistan. For SDS, must be done upfront before application.' },
        { category: 'employment', requirement: 'IELTS Academic (SDS: 6.0+ overall, no band <6.0)', mandatory: true, description: 'Minimum IELTS scores vary by program. For SDS, minimum 6.0 in each band is required.' },
        { category: 'employment', requirement: 'Statement of purpose / study plan', mandatory: true, description: 'Explaining why you chose Canada, the specific program, and post-graduation plans.' },
      ],
      cost: { visaFeeUSD: 112, serviceFeeUSD: 63, currency: 'CAD', visaFeeLocal: 150, visaFeeLocalLabel: 'CAD 150 (permit) + CAD 85 (biometrics) + GIC CAD 20,635' },
    },
    {
      type: 'Work Permit',
      description: 'The Canadian Work Permit allows Pakistani citizens to work in Canada temporarily. There are two main types: (1) Employer-specific work permit — requires a Labour Market Impact Assessment (LMIA) from ESDC (or LMIA-exempt categories) and a job offer from a Canadian employer; (2) Open work permit — available to spouses of skilled workers/students, certain graduates, refugee claimants, and other specific categories. The LMIA process (employer-driven) confirms that hiring a foreign worker won\'t negatively affect Canadian workers. Processing time varies: 2-8 weeks for LMIA-exempt, 3-6 months with LMIA. Work permits are typically valid for 1-2 years and can be renewed. After working in Canada, applicants may transition to Permanent Residence through Express Entry (Federal Skilled Worker, Canadian Experience Class) or Provincial Nominee Programs (PNP).',
      maxDuration: '2 years (varies by type)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 14,
      processingDaysMax: 180,
      sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship.html',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Must be valid for the duration of the work permit.' },
        { category: 'photograph', requirement: 'Digital photo', mandatory: true, description: 'Canadian visa photo specifications.' },
        { category: 'employment', requirement: 'Job offer letter from Canadian employer (employer-specific)', mandatory: true, description: 'Detailed offer with job title, duties, salary, working conditions, and duration.' },
        { category: 'employment', requirement: 'LMIA approval or LMIA exemption proof', mandatory: true, description: 'Positive LMIA number OR proof of LMIA exemption (intra-company transfer, NAFTA, etc.).' },
        { category: 'financial', requirement: 'Proof of funds for initial settlement', mandatory: false, description: 'May be required if coming from a country requiring temporary resident visa.' },
        { category: 'insurance', requirement: 'Biometrics at VAC', mandatory: true, description: 'CAD 85 biometrics fee.' },
        { category: 'health', requirement: 'Medical examination', mandatory: false, description: 'Required if working in health care, food service, or if from a designated country.' },
        { category: 'employment', requirement: 'Educational credentials assessment (ECA) if needed', mandatory: false, description: 'WES or other approved assessment of foreign credentials.' },
      ],
      cost: { visaFeeUSD: 112, serviceFeeUSD: 63, currency: 'CAD', visaFeeLocal: 155, visaFeeLocalLabel: 'CAD 155 (employer-specific) + CAD 85 (biometrics)' },
    },
    {
      type: 'Super Visa',
      description: 'The Canadian Super Visa is specifically for parents and grandparents of Canadian citizens or permanent residents. It allows multiple entries over 10 years, with each stay up to 5 years (compared to 6 months for regular visitor visa). Key requirements: the sponsoring child/grandchild in Canada must provide a written invitation and proof of minimum income (Low Income Cut-Off plus 30%), and the applicant must purchase Canadian medical insurance covering at least CAD 100,000 for 1 year from a Canadian insurance company. The applicant must also complete an upfront medical examination from a panel physician. Processing time is typically longer than a regular visitor visa (4-8 weeks from Pakistan). This visa does not allow the holder to work in Canada. The sponsoring family member does NOT need to meet a specific income threshold — they must show they can support the parent/grandparent financially.',
      maxDuration: 'Up to 5 years per entry (visa valid 10 years)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 30,
      processingDaysMax: 60,
      sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship.html',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Must be valid for the intended stay period.' },
        { category: 'photograph', requirement: 'Digital photo', mandatory: true, description: 'Canadian visa photo specifications.' },
        { category: 'employment', requirement: 'Written invitation from child/grandchild in Canada', mandatory: true, description: 'Letter from the Canadian host (citizen or PR) promising financial support for the visit duration.' },
        { category: 'financial', requirement: 'Sponsor income proof (Low Income Cut-Off + 30%)', mandatory: true, description: 'Canadian sponsor must show income meeting LICO+30%. NOA (Notice of Assessment) from CRA, T4, employment letter.' },
        { category: 'insurance', requirement: 'Canadian medical insurance (min CAD 100,000, 1 year)', mandatory: true, description: 'Must be purchased from a Canadian insurance company before applying. Must cover repatriation, hospital, and medical.' },
        { category: 'health', requirement: 'Upfront medical examination from panel physician', mandatory: true, description: 'Must be completed before applying. Results sent directly to IRCC by the panel physician.' },
        { category: 'insurance', requirement: 'Biometrics at VAC', mandatory: true, description: 'CAD 85 biometrics fee.' },
        { category: 'financial', requirement: 'Proof of relationship (birth certificate, family registration)', mandatory: true, description: 'Documents proving parent-child or grandparent-grandchild relationship.' },
      ],
      cost: { visaFeeUSD: 74, serviceFeeUSD: 63, currency: 'CAD', visaFeeLocal: 100, visaFeeLocalLabel: 'CAD 100 (visa) + CAD 85 (biometrics) + insurance (CAD 1,000-2,000/year)' },
    },
  ],

  'France': [
    {
      type: 'Schengen Short-Stay Visa',
      description: 'The France Schengen Visa (Type C) allows Pakistani citizens to visit France and other Schengen Area countries for up to 90 days within a 180-day period for tourism, business, family visits, or short-term study. Pakistanis must apply at the French Embassy/Consulate or through VFS Global in Islamabad, Karachi, or Lahore. Processing typically takes 15 calendar days but can extend to 30-45 days during peak season. The visa center for France in Pakistan is operated by VFS Global. Key requirements include a passport with 3+ months validity beyond the planned stay, travel insurance with EUR 30,000 coverage, proof of accommodation, flight itinerary, and proof of sufficient funds (approximately EUR 65/day or EUR 120/day if staying in a hotel). For Pakistani applicants, demonstrating strong ties to Pakistan (employment, property, family) is crucial for approval. Multiple-entry visas (1-5 years) may be issued to applicants with good travel history.',
      maxDuration: '90 days within 180-day period',
      extensions: false,
      multipleEntry: false,
      processingDaysMin: 10,
      processingDaysMax: 30,
      sourceUrl: 'https://france-visas.gouv.fr/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 3 months beyond planned stay', mandatory: true, description: 'Must have at least 2 blank pages. Issued within the last 10 years.' },
        { category: 'photograph', requirement: 'ID photos (2, 35x45mm, white background)', mandatory: true, description: 'Recent photos meeting Schengen visa specifications. Not older than 6 months.' },
        { category: 'insurance', requirement: 'Travel insurance EUR 30,000 coverage', mandatory: true, description: 'Must cover the entire Schengen area and entire stay. Must include medical evacuation and repatriation.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Confirmed or reserved (not necessarily paid) round-trip flights. Do not purchase actual tickets before visa approval.' },
        { category: 'accommodation', requirement: 'Hotel booking or host accommodation proof', mandatory: true, description: 'Hotel reservation for all nights OR attestation d\'accueil (if staying with a host) + host\'s ID + utility bill.' },
        { category: 'financial', requirement: 'Bank statements + means of support', mandatory: true, description: 'Last 3 months bank statements. Recommended: EUR 65/day if hosted, EUR 120/day if staying in hotels.' },
        { category: 'financial', requirement: 'Income tax returns', mandatory: false, description: 'FBR tax returns for last 2 years strengthen financial credibility.' },
        { category: 'employment', requirement: 'Cover letter explaining purpose of visit', mandatory: true, description: 'Detailed letter in English or French explaining trip purpose, dates, and itinerary.' },
        { category: 'employment', requirement: 'Employment NOC and leave approval letter', mandatory: true, description: 'From employer on company letterhead. Shows position, salary, and approved leave dates.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 41, currency: 'EUR', visaFeeLocal: 80, visaFeeLocalLabel: 'EUR 80 + VFS service fee ~EUR 35' },
    },
    {
      type: 'Long-Stay Student Visa',
      description: 'The France Long-Stay Student Visa (Type D/VLS-TS) is for Pakistani students enrolled in programs exceeding 90 days at French educational institutions. The process: (1) Register on the Campus France Pakistan platform and create an Études en France account, (2) Get admission from a French institution, (3) Complete the Campus France procedure (academic interview), (4) Submit visa application through VFS Global, (5) Upon arrival in France, validate the VLS-TS within 3 months. Key requirements include proof of enrollment, proof of French language proficiency (DELF/DALF or TCF for French-taught programs; IELTS/TOEFL for English-taught), proof of funds (EUR 615/month minimum as per Campus France), and comprehensive health insurance. Students can work up to 964 hours/year (approximately 20 hours/week). After completing a Master\'s degree, students can apply for the APS (Autorisation Provisoire de Séjour) allowing them to stay and work for 1 year to seek employment.',
      maxDuration: '1 year (renewable)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 14,
      processingDaysMax: 30,
      sourceUrl: 'https://france-visas.gouv.fr/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid for entire stay + 3 months', mandatory: true, description: 'Must have blank pages and be less than 10 years old.' },
        { category: 'photograph', requirement: 'ID photos (2, 35x45mm)', mandatory: true, description: 'As per Schengen specifications.' },
        { category: 'employment', requirement: 'Letter of enrollment from French institution', mandatory: true, description: 'Official admission/acceptance letter from the French school or university.' },
        { category: 'employment', requirement: 'Campus France registration and academic interview clearance', mandatory: true, description: 'Must complete the Études en France procedure on Campus France Pakistan. Academic interview is mandatory.' },
        { category: 'financial', requirement: 'Proof of funds (EUR 615/month or EUR 7,380/year)', mandatory: true, description: 'Bank statements, scholarship letter, or guarantor letter with their financial documents.' },
        { category: 'insurance', requirement: 'Health insurance covering France', mandatory: true, description: 'French social security (for students under 28) OR private health insurance. Must cover full medical expenses.' },
        { category: 'employment', requirement: 'Language proficiency proof (DELF/IELTS/TOEFL)', mandatory: true, description: 'French-taught: DELF B1/B2 or TCF. English-taught: IELTS 6.0+ or TOEFL 80+.' },
        { category: 'financial', requirement: 'Tuition fee receipt (if paid)', mandatory: false, description: 'First year tuition payment receipt from the institution.' },
        { category: 'employment', requirement: 'Cover letter / motivation letter', mandatory: true, description: 'Explaining study plans and post-graduation intentions.' },
      ],
      cost: { visaFeeUSD: 58, serviceFeeUSD: 41, currency: 'EUR', visaFeeLocal: 50, visaFeeLocalLabel: 'EUR 50 + VFS service fee ~EUR 35' },
    },
    {
      type: 'Work Visa',
      description: 'The France Work Visa (Type D - Salarié) allows Pakistani professionals to work in France. The employer in France must first obtain an approved work authorization (Autorisation de Travail) from the French labor authorities (DREETS). This involves demonstrating that no qualified EU/EEA candidate was available for the position (labor market test). Once approved, the employee applies for a long-stay visa through VFS Global. The visa is typically valid for 1 year and renewable. For highly skilled workers, the EU Blue Card (Carte Bleue Européenne) is available if the salary exceeds EUR 53,836/year (2024 threshold). France also has a "Talent Passport" (Passeport Talent) for specific categories: researchers, innovators, investors, and highly qualified employees. After 5 years of legal residence in France, workers can apply for a 10-year permanent residence card or French citizenship.',
      maxDuration: '1 year (renewable)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 30,
      processingDaysMax: 60,
      sourceUrl: 'https://france-visas.gouv.fr/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid for entire stay', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'ID photos (2)', mandatory: true, description: 'As per French visa specifications.' },
        { category: 'employment', requirement: 'Work authorization (Autorisation de Travail) from DREETS', mandatory: true, description: 'Employer must obtain this approval from French labor authorities before the employee can apply.' },
        { category: 'employment', requirement: 'Employment contract (CDI or CDD)', mandatory: true, description: 'French employment contract approved by the labor inspectorate.' },
        { category: 'financial', requirement: 'Proof of salary meeting minimum threshold', mandatory: true, description: 'Salary must meet French minimum wage (SMIC: EUR 1,398.69/month net in 2024) or higher for specific categories.' },
        { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'French social security coverage through employment OR private insurance until social security kicks in.' },
        { category: 'accommodation', requirement: 'Accommodation arrangement in France', mandatory: true, description: 'Employer may provide housing or employee must show accommodation arrangement.' },
        { category: 'employment', requirement: 'Attestation d\'accueil or housing proof', mandatory: false, description: 'If employer provides housing, include proof. Otherwise, show rental agreement.' },
      ],
      cost: { visaFeeUSD: 58, serviceFeeUSD: 41, currency: 'EUR', visaFeeLocal: 50, visaFeeLocalLabel: 'EUR 50 (work visa) + VFS ~EUR 35' },
    },
  ],

  'Netherlands': [
    {
      type: 'Schengen Tourist Visa',
      description: 'The Netherlands Schengen Visa allows Pakistani citizens to visit the Netherlands and other Schengen countries for tourism, business, or family visits for up to 90 days within any 180-day period. Applications are processed by VFS Global in Islamabad, Karachi, or Lahore on behalf of the Dutch Embassy. Processing typically takes 15 calendar days but can extend to 30-45 days during peak season. Pakistanis must demonstrate strong financial standing (approximately EUR 34-55/day), travel insurance with EUR 30,000 coverage, confirmed accommodation, and round-trip flights. The Dutch embassy is known for thorough scrutiny of Pakistani applications. First-time applicants may receive a single-entry visa. Multiple-entry visas (1-5 years) are possible for applicants with proven travel history to Schengen countries. The Netherlands IND (Immigration and Naturalisation Service) processes the applications.',
      maxDuration: '90 days within 180-day period',
      extensions: false,
      multipleEntry: false,
      processingDaysMin: 15,
      processingDaysMax: 30,
      sourceUrl: 'https://ind.nl/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 6+ months beyond planned stay', mandatory: true, description: 'Must have at least 2 blank pages, issued within last 10 years.' },
        { category: 'photograph', requirement: 'Biometric photos (2, 35x45mm, white background)', mandatory: true, description: 'Dutch/Schengen visa photo specifications.' },
        { category: 'insurance', requirement: 'Travel insurance EUR 30,000', mandatory: true, description: 'Must cover entire Schengen area, entire stay duration, including medical evacuation and repatriation.' },
        { category: 'travel', requirement: 'Travel itinerary', mandatory: true, description: 'Round-trip flight reservation (not purchased), day-by-day itinerary with activities and places to visit.' },
        { category: 'financial', requirement: 'Bank statements (3 months)', mandatory: true, description: 'Last 3 months personal bank statements. Recommended balance: EUR 34/day if staying with host, EUR 55/day if staying in hotels.' },
        { category: 'accommodation', requirement: 'Hotel reservation or invitation from Dutch host', mandatory: true, description: 'Hotel bookings for all nights OR a notarized invitation letter from a Dutch resident with their ID copy and proof of address.' },
        { category: 'employment', requirement: 'Employment letter and leave approval', mandatory: true, description: 'Employer NOC on company letterhead with position, salary, and approved leave dates.' },
        { category: 'employment', requirement: 'Cover letter explaining purpose', mandatory: true, description: 'Detailed letter about the purpose of visit, planned activities, and dates.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 38, currency: 'EUR', visaFeeLocal: 80, visaFeeLocalLabel: 'EUR 80 + VFS service fee ~EUR 33' },
    },
    {
      type: 'Student Visa',
      description: 'The Netherlands Student Visa (MVV - Machtiging tot Voorlopig Verblijf, combined with VVR - Verblijfsvergunning) allows Pakistani students to study at Dutch universities and institutions. The process: (1) Obtain admission from a recognized Dutch institution, (2) The institution applies for the MVV (provisional residence permit) on the student\'s behalf through the IND, (3) Once approved, the student collects the MVV from the Dutch Embassy/Consulate in Pakistan, (4) After arrival, register at the municipality and receive the VVR (residence permit). Key requirements: proof of enrollment, proof of funds (approximately EUR 930-1,100/month as set by IND), and health insurance. Students can work up to 16 hours/week during the academic year and full-time during summer (June-August). After graduation, students can apply for the "Orientation Year" (Zoekjaar) permit allowing them to stay and work in the Netherlands for 1 year without a work permit requirement.',
      maxDuration: '1 year (renewable for duration of program)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 14,
      processingDaysMax: 30,
      sourceUrl: 'https://ind.nl/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Must be valid for the entire study period.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'As per Dutch visa photo specifications.' },
        { category: 'employment', requirement: 'Proof of enrollment from Dutch institution', mandatory: true, description: 'Official admission letter from a recognized Dutch educational institution.' },
        { category: 'financial', requirement: 'Proof of funds (EUR 930-1,100/month)', mandatory: true, description: 'Bank statements showing sufficient funds, OR a guarantee declaration from a Dutch resident/sponsor, OR a student loan document.' },
        { category: 'insurance', requirement: 'Health insurance covering Netherlands', mandatory: true, description: 'Dutch basic health insurance is mandatory after registration. Travel insurance for the initial period.' },
        { category: 'employment', requirement: 'Nuffic certificate (for some institutions)', mandatory: false, description: 'Credential evaluation of Pakistani qualifications by Nuffic. Required by some institutions.' },
        { category: 'financial', requirement: 'Tuition fee payment proof', mandatory: false, description: 'Receipt of first year tuition payment strengthens the application.' },
        { category: 'employment', requirement: 'Motivation letter', mandatory: true, description: 'Explaining study choice, career goals, and link to Pakistan.' },
      ],
      cost: { visaFeeUSD: 192, serviceFeeUSD: 38, currency: 'EUR', visaFeeLocal: 168, visaFeeLocalLabel: 'EUR 168 (MVV + VVR)' },
    },
    {
      type: 'Work Visa (HSM)',
      description: 'The Netherlands Highly Skilled Migrant (HSM / Kennismigrant) visa is designed for highly qualified professionals from outside the EU. The employer must be a recognized sponsor (IND recognized sponsor) and the employee must earn above the salary threshold: EUR 46,107/year for workers aged 30+, or EUR 34,304/year for those under 30 (2024 rates), or EUR 25,000/year for recent graduates from Dutch institutions. The process is employer-driven: the recognized sponsor notifies the IND of the employment, and the employee applies for the MVV/VVR. The HSM visa is valid for up to 5 years and comes with a residence permit. Spouses of HSM workers get a free work permit (no labor market test required). After 5 years of legal residence, the HSM worker and family can apply for permanent residence or Dutch citizenship. The 30% tax ruling (30%-ruling) provides significant tax benefits for qualifying expats.',
      maxDuration: 'Up to 5 years',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 14,
      processingDaysMax: 30,
      sourceUrl: 'https://ind.nl/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Must be valid for the duration of the work contract.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'Dutch visa specifications.' },
        { category: 'employment', requirement: 'Employment contract from IND-recognized sponsor', mandatory: true, description: 'The employer must be a recognized sponsor with the Dutch IND. Contract must meet salary thresholds.' },
        { category: 'financial', requirement: 'Salary above HSM threshold (EUR 46,107/year or EUR 34,304 if <30)', mandatory: true, description: 'Salary must meet the prescribed threshold. For recent graduates: EUR 25,000/year.' },
        { category: 'employment', requirement: 'Educational qualifications and CV', mandatory: true, description: 'Relevant professional qualifications and a detailed CV.' },
        { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'Dutch basic health insurance is mandatory from the day of registration.' },
        { category: 'accommodation', requirement: 'Address registration in Netherlands', mandatory: true, description: 'Must register at the municipality (gemeente) within 5 days of arrival.' },
        { category: 'financial', requirement: 'No public funds dependency proof', mandatory: false, description: 'Declaration that the applicant will not rely on public funds.' },
      ],
      cost: { visaFeeUSD: 192, serviceFeeUSD: 38, currency: 'EUR', visaFeeLocal: 168, visaFeeLocalLabel: 'EUR 168 (MVV + VVR) — employer may reimburse' },
    },
  ],

  'Ireland': [
    {
      type: 'Short Stay Visa',
      description: 'The Ireland Short Stay Visa allows Pakistani citizens to visit Ireland for up to 90 days for tourism, visiting family/friends, business meetings, or short-term study. Ireland is NOT part of the Schengen Area, so a separate Irish visa is required even if the applicant has a Schengen visa. Applications are made online via the Irish Naturalisation and Immigration Service (INIS) portal, followed by submitting documents to the VAC in Islamabad or through an Irish Embassy. Processing typically takes 4-8 weeks for standard applications from Pakistan. Priority processing may be available in certain cases. Key requirements include a valid passport (6+ months), detailed financial evidence, accommodation proof, travel insurance, and strong ties to Pakistan. Multiple-entry short-stay visas (up to 5 years) may be granted to applicants with good travel history and previous compliant visits to Ireland. The visa fee is single-entry at EUR 60 or multiple-entry at EUR 100.',
      maxDuration: '90 days',
      extensions: true,
      multipleEntry: false,
      processingDaysMin: 20,
      processingDaysMax: 40,
      sourceUrl: 'https://www.irishimmigration.ie/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 6+ months', mandatory: true, description: 'Must have at least 2 blank pages. All previous passports required.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'As per Irish visa specifications: 35x45mm, light background, recent.' },
        { category: 'financial', requirement: 'Bank statements (6 months)', mandatory: true, description: 'Detailed 6-month bank statements. Recommended minimum balance: EUR 100 per day of stay + return flight cost.' },
        { category: 'insurance', requirement: 'Travel health insurance', mandatory: true, description: 'Must cover the entire stay in Ireland, including medical emergencies and repatriation.' },
        { category: 'travel', requirement: 'Travel itinerary', mandatory: true, description: 'Proposed dates of travel, flight itinerary (can be reserved, not purchased).' },
        { category: 'accommodation', requirement: 'Accommodation proof', mandatory: true, description: 'Hotel reservation OR invitation letter from Irish host with their passport/residence proof and utility bill.' },
        { category: 'employment', requirement: 'Employment letter / NOC / leave approval', mandatory: true, description: 'On company letterhead with position, salary, and leave approval. Establishes ties to Pakistan.' },
        { category: 'employment', requirement: 'Cover letter explaining visit purpose', mandatory: true, description: 'Detailed letter about the purpose, duration, and plans during the visit.' },
        { category: 'financial', requirement: 'Income proof (salary slips, tax returns)', mandatory: false, description: 'Additional financial documentation strengthens the application.' },
      ],
      cost: { visaFeeUSD: 65, serviceFeeUSD: 30, currency: 'EUR', visaFeeLocal: 60, visaFeeLocalLabel: 'EUR 60 (single entry) / EUR 100 (multi entry)' },
    },
    {
      type: 'Study Visa',
      description: 'The Ireland Study Visa allows Pakistani students to study full-time at Irish educational institutions (universities, institutes of technology, English language schools) for programs longer than 90 days. The process: (1) Get acceptance from an Irish institution on the Interim List of Eligible Programmes (ILEP), (2) Apply online via INIS, (3) Submit documents at VAC, (4) If approved, register with the Garda National Immigration Bureau (GNIB) upon arrival and get an Irish Residence Permit (IRP). Key requirements include proof of enrollment, proof of funds (EUR 7,000 per year + tuition fees), English language proficiency (IELTS usually 5.0-6.5 depending on level), and private health insurance. Students on full-time degree programs (NFQ Level 7+) can work up to 20 hours/week during term and 40 hours/week during holidays. After graduation, the Third Level Graduate Programme allows a 1-year (2 years for PhD/research masters) stay to seek employment.',
      maxDuration: '1 year (renewable for program duration)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 20,
      processingDaysMax: 45,
      sourceUrl: 'https://www.irishimmigration.ie/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport (6+ months)', mandatory: true, description: 'Valid for the duration of the study program.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'Irish visa specifications.' },
        { category: 'employment', requirement: 'Letter of acceptance from Irish institution (ILEP listed)', mandatory: true, description: 'Must be on the Interim List of Eligible Programmes. Includes course details, start/end dates, and fee information.' },
        { category: 'financial', requirement: 'Proof of funds: EUR 7,000/year + tuition fees', mandatory: true, description: 'Bank statements showing EUR 7,000 for living costs per year + first year tuition (can show paid receipt).' },
        { category: 'insurance', requirement: 'Private health insurance', mandatory: true, description: 'Must cover the entire stay. Ireland does not provide free healthcare to international students.' },
        { category: 'employment', requirement: 'English language proof (IELTS/TOEFL)', mandatory: true, description: 'Minimum scores vary by institution: typically IELTS 5.0-6.5 overall.' },
        { category: 'employment', requirement: 'Education certificates and transcripts', mandatory: true, description: 'Previous academic qualifications.' },
        { category: 'financial', requirement: 'Tuition fee payment receipt', mandatory: false, description: 'Receipt of at least first semester/year tuition payment.' },
      ],
      cost: { visaFeeUSD: 65, serviceFeeUSD: 30, currency: 'EUR', visaFeeLocal: 60, visaFeeLocalLabel: 'EUR 60 (single entry study visa)' },
    },
  ],

  'Germany': [
    {
      type: 'Schengen Tourist Visa',
      description: 'The Germany Schengen Visa (Type C) allows Pakistani citizens to visit Germany and other Schengen Area countries for up to 90 days within any 180-day period for tourism, business, visiting family/friends, or short events. Applications are submitted through the German Embassy in Islamabad or the Consulate General in Karachi. VFS Global handles document collection. Processing time is typically 15 calendar days but can take up to 30-45 days for Pakistani applicants due to additional verification. Germany is one of the more accessible Schengen countries for Pakistani tourists, with relatively clear requirements. Strong financial evidence is crucial — applicants should show bank statements with healthy balances and regular income. A blocked account or sponsor declaration may be requested in borderline cases. Travel insurance with EUR 30,000 coverage is mandatory. Multiple-entry visas are possible for applicants with good Schengen travel history.',
      maxDuration: '90 days within 180-day period',
      extensions: false,
      multipleEntry: false,
      processingDaysMin: 10,
      processingDaysMax: 30,
      sourceUrl: 'https://www.diplo.de/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 3 months beyond planned stay', mandatory: true, description: 'At least 2 blank pages, issued within last 10 years.' },
        { category: 'photograph', requirement: 'Biometric photos (2, 35x45mm)', mandatory: true, description: 'Recent photos meeting ICAO specifications: light grey or white background, no glasses.' },
        { category: 'insurance', requirement: 'Travel health insurance EUR 30,000 coverage', mandatory: true, description: 'Must cover the entire Schengen area and entire stay. Must include emergency medical, hospitalization, and repatriation.' },
        { category: 'financial', requirement: 'Bank statements 3 months + proof of sufficient funds', mandatory: true, description: 'Last 3 months bank statements. Show approximately EUR 45/day. Fixed deposits and property documents help.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Reserved (not purchased) round-trip flights showing entry and exit dates from Schengen area.' },
        { category: 'accommodation', requirement: 'Accommodation proof', mandatory: true, description: 'Hotel reservation for all nights OR Verpflichtungserklärung (formal obligation letter) from German host, notarized at local foreigner\'s office.' },
        { category: 'employment', requirement: 'Cover letter / purpose letter', mandatory: true, description: 'Detailed explanation of travel purpose, itinerary, and dates. Can be in English or German.' },
        { category: 'employment', requirement: 'Employment letter / leave approval', mandatory: true, description: 'Employer NOC on letterhead with position, salary, and leave dates. Establishes ties to Pakistan.' },
        { category: 'financial', requirement: 'Income tax returns (FBR)', mandatory: false, description: 'Last 2 years tax returns strengthen financial credibility.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 38, currency: 'EUR', visaFeeLocal: 80, visaFeeLocalLabel: 'EUR 80 + VFS ~EUR 33' },
    },
    {
      type: 'Student Visa',
      description: 'The Germany Student Visa (Type D - National Visa for Study Purposes) allows Pakistani students to pursue full-time higher education at German universities. The process: (1) Get university admission (Zulassungsbescheid), (2) Open a blocked account (Sperrkonto) with EUR 11,208/year (as of 2024), (3) Get health insurance (public: TK, AOK, etc., or private for language courses), (4) Apply for the visa at the German Embassy in Islamabad. Processing takes 4-8 weeks. German public universities charge minimal or no tuition fees (only semester contribution of EUR 150-350), making Germany extremely attractive. Students must have either a university entrance qualification recognized in Germany (e.g., 12-year education + 1 year university in Pakistan, or FaSc/A-Levels) or complete a Studienkolleg (preparatory year). Students can work 120 full days or 240 half days per year. After graduation, the Job Seeker Visa (18 months) allows finding employment related to studies. Germany recently introduced the Chancenkarte (Opportunity Card) as an alternative pathway.',
      maxDuration: '1 year (renewable)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 25,
      processingDaysMax: 45,
      sourceUrl: 'https://www.diplo.de/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Must be valid for the entire study period.' },
        { category: 'photograph', requirement: 'Biometric photos (2)', mandatory: true, description: 'As per German visa specifications.' },
        { category: 'employment', requirement: 'University admission letter (Zulassungsbescheid)', mandatory: true, description: 'Official admission from a German university or proof of application + university confirmation.' },
        { category: 'financial', requirement: 'Blocked account (Sperrkonto) with EUR 11,208/year', mandatory: true, description: 'Opened at Expatrio, Fintiba, or Coracle. EUR 934/month. Blocked until arrival in Germany.' },
        { category: 'insurance', requirement: 'Health insurance (German public or travel + private)', mandatory: true, description: 'German public health insurance (TK, AOK ~EUR 110/month) OR travel insurance + private insurance for first 3 months until public kicks in.' },
        { category: 'employment', requirement: 'Academic certificates and transcripts (attested)', mandatory: true, description: 'SSC, HSSC, Bachelor\'s degree certificates and mark sheets. May need APS certificate for some institutions.' },
        { category: 'employment', requirement: 'Language proficiency (German or English)', mandatory: true, description: 'German-taught: TestDaF/DSH/Göthe B2-C1. English-taught: IELTS 6.0-6.5 or TOEFL 80-100.' },
        { category: 'financial', requirement: 'Proof of university entrance qualification', mandatory: true, description: 'Pakistani HSSC + 1 year university OR FA/FSc with strong grades for Studienkolleg.' },
      ],
      cost: { visaFeeUSD: 81, serviceFeeUSD: 38, currency: 'EUR', visaFeeLocal: 75, visaFeeLocalLabel: 'EUR 75 + VFS ~EUR 33 + blocked account EUR 11,208' },
    },
    {
      type: 'Job Seeker Visa',
      description: 'The Germany Job Seeker Visa allows Pakistani graduates and professionals to enter Germany for up to 6 months to search for employment. Requirements include a recognized university degree (minimum Bachelor\'s), sufficient funds (EUR 5,460 for 6 months via blocked account), health insurance, and relevant qualifications that are in demand in the German labor market. During the 6-month period, the visa holder cannot work (except for trial employment of up to 10 hours/week). Once a relevant job is secured, the visa holder can convert to a work permit/EU Blue Card without leaving Germany. As of June 2024, Germany also introduced the Chancenkarte (Opportunity Card) which provides more flexible entry for qualified professionals with a points-based system considering qualifications, experience, language skills, age, and connection to Germany. The Job Seeker Visa is a good option for Pakistani professionals with in-demand skills.',
      maxDuration: '6 months (non-extendable)',
      extensions: false,
      multipleEntry: true,
      processingDaysMin: 20,
      processingDaysMax: 45,
      sourceUrl: 'https://www.diplo.de/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Must be valid for the 6-month job search period.' },
        { category: 'photograph', requirement: 'Biometric photos (2)', mandatory: true, description: 'German visa photo specifications.' },
        { category: 'employment', requirement: 'Recognized university degree (minimum Bachelor\'s)', mandatory: true, description: 'Degree must be recognized in Germany (anabin.diplo.de for verification). Professional experience is a plus.' },
        { category: 'financial', requirement: 'Blocked account with EUR 5,460 (EUR 910/month x 6)', mandatory: true, description: 'Opened at Expatrio, Fintiba, or similar providers. Shows ability to support yourself during job search.' },
        { category: 'insurance', requirement: 'Health insurance for 6 months', mandatory: true, description: 'Travel health insurance or German public/private health insurance covering the full 6 months.' },
        { category: 'employment', requirement: 'Cover letter/motivation explaining job search plan', mandatory: true, description: 'Explain your target industry, companies, and qualifications for the German labor market.' },
        { category: 'employment', requirement: 'Updated CV (German format preferred)', mandatory: true, description: 'Professional CV highlighting relevant qualifications and experience. Lebeslauf format preferred.' },
        { category: 'financial', requirement: 'No intention to work during job search (self-declaration)', mandatory: true, description: 'Written declaration that you will not take up employment except trial employment.' },
      ],
      cost: { visaFeeUSD: 81, serviceFeeUSD: 38, currency: 'EUR', visaFeeLocal: 75, visaFeeLocalLabel: 'EUR 75 + VFS ~EUR 33 + blocked account EUR 5,460' },
    },
    {
      type: 'Work Visa',
      description: 'The Germany Work Visa / EU Blue Card (Blaue Karte EU) allows Pakistani professionals to live and work in Germany. The EU Blue Card is available for highly qualified workers earning at least EUR 43,992/year (2024) or EUR 39,682/year for shortage occupations (IT, engineering, mathematics, natural sciences, medicine). The employer must obtain approval from the Federal Employment Agency (Bundesagentur für Arbeit) — this is generally a formality for the EU Blue Card as these professions are in demand. The visa is issued for up to 4 years. Spouses of Blue Card holders can work without restriction. After 33 months of Blue Card holding (or 21 months with B1 German), the holder can apply for permanent settlement (Niederlassungserlaubnis). The new Chancenkarte (Opportunity Card, June 2024) offers a points-based alternative for job seekers. Germany\'s strong economy and labor shortage make this an attractive option.',
      maxDuration: 'Up to 4 years',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 30,
      processingDaysMax: 60,
      sourceUrl: 'https://www.diplo.de/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Must be valid for the work contract period.' },
        { category: 'photograph', requirement: 'Biometric photos (2)', mandatory: true, description: 'German visa specifications.' },
        { category: 'employment', requirement: 'Employment contract from German employer', mandatory: true, description: 'Signed employment contract specifying salary, position, and working conditions.' },
        { category: 'employment', requirement: 'Recognized professional qualifications', mandatory: true, description: 'University degree or professional qualification recognized in Germany. May need recognition procedure.' },
        { category: 'financial', requirement: 'Salary above EU Blue Card threshold (EUR 43,992/year)', mandatory: true, description: 'Must earn above the minimum threshold. Shortage occupation threshold: EUR 39,682/year.' },
        { category: 'insurance', requirement: 'German health insurance', mandatory: true, description: 'Public (gesetzliche) or private health insurance. Employer and employee share costs.' },
        { category: 'accommodation', requirement: 'Registration address (Anmeldung) in Germany', mandatory: true, description: 'Must register at the local Bürgeramt within 14 days of arrival.' },
        { category: 'employment', requirement: 'Federal Employment Agency approval (Bundesagentur für Arbeit)', mandatory: true, description: 'Usually approved quickly for in-demand professions. Employer typically handles this.' },
      ],
      cost: { visaFeeUSD: 81, serviceFeeUSD: 38, currency: 'EUR', visaFeeLocal: 75, visaFeeLocalLabel: 'EUR 75 + VFS ~EUR 33' },
    },
  ],

  'Australia': [
    {
      type: 'Visitor Visa (Subclass 600)',
      description: 'The Australian Visitor Visa (Subclass 600) allows Pakistani citizens to visit Australia for tourism, visiting family/friends, or short-term business (up to 3, 6, or 12 months). Pakistanis must apply online via ImmiAccount on the Department of Home Affairs website. The application is entirely online — no biometrics or in-person interview is typically required from Pakistan. Processing time varies significantly: 20-45 days for tourist stream, longer during peak season. Australia is known for rigorous assessment of Pakistani applications. Key factors for approval include: genuine purpose of visit, sufficient funds, strong ties to Pakistan, and clean immigration history. The visa fee is AUD 195. Pakistani applicants should provide comprehensive documentation including bank statements, employment letters, property documents, and if visiting family — their visa/residence status. A genuine temporary entrant (GTE) requirement means the applicant must convince the officer of their intent to return.',
      maxDuration: '3-12 months (varies by individual case)',
      extensions: true,
      multipleEntry: false,
      processingDaysMin: 20,
      processingDaysMax: 45,
      sourceUrl: 'https://immi.homeaffairs.gov.au/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid during stay', mandatory: true, description: 'Must be valid for the duration of the intended visit. All previous passports should be provided as certified copies.' },
        { category: 'photograph', requirement: 'Digital biometric photo', mandatory: true, description: 'Uploaded online with the application. Must meet Australian passport photo specifications.' },
        { category: 'financial', requirement: 'Proof of funds (AUD 5,000+)', mandatory: true, description: 'Bank statements for 3-6 months showing stable income and savings. Minimum recommended: AUD 5,000 for individual. Property and investment documents help.' },
        { category: 'travel', requirement: 'Travel itinerary', mandatory: true, description: 'Detailed travel plan including intended dates, cities to visit, and activities. Do NOT purchase flights before visa approval.' },
        { category: 'employment', requirement: 'Statement of purpose / cover letter', mandatory: true, description: 'Detailed letter explaining why Australia, planned activities, and why you will return to Pakistan.' },
        { category: 'employment', requirement: 'Ties to home country', mandatory: true, description: 'Employment letter, business ownership, property, family ties. Critical for Pakistani applicants.' },
        { category: 'health', requirement: 'Health examination (if requested by DHA)', mandatory: false, description: 'Not always required but may be requested. Panel physician examination if asked. Health insurance recommended.' },
        { category: 'insurance', requirement: 'Overseas Student Health Cover (OSHC)', mandatory: false, description: 'Not for visitor visa. OSHC is for student visa only.' },
        { category: 'accommodation', requirement: 'Accommodation details', mandatory: false, description: 'Hotel booking or invitation letter from Australian host (if applicable).' },
      ],
      cost: { visaFeeUSD: 130, serviceFeeUSD: 0, currency: 'AUD', visaFeeLocal: 195, visaFeeLocalLabel: 'AUD 195' },
    },
    {
      type: 'Student Visa (Subclass 500)',
      description: 'The Australian Student Visa (Subclass 500) allows Pakistani students to study full-time at Australian educational institutions (universities, TAFE, schools, ELICOS) for up to 5 years. Applications are made online via ImmiAccount. Key requirements include: Confirmation of Enrolment (CoE) from an Australian institution, Genuine Temporary Entrant (GTE) statement, proof of funds (at least AUD 29,710/year for living costs as of 2024 + tuition + travel), English language proficiency (IELTS usually 5.5-7.0 depending on course level), and Overseas Student Health Cover (OSHC). Students can work up to 48 hours per fortnight during term and unlimited hours during scheduled breaks. After graduation, the Temporary Graduate Visa (Subclass 485) allows 2-4 years of post-study work depending on qualification level and location (regional areas offer longer stays). Processing time from Pakistan is typically 4-8 weeks.',
      maxDuration: 'Up to 5 years',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 25,
      processingDaysMax: 56,
      sourceUrl: 'https://immi.homeaffairs.gov.au/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Must remain valid for the duration of the student visa.' },
        { category: 'photograph', requirement: 'Digital biometric photo', mandatory: true, description: 'Uploaded with the online application.' },
        { category: 'employment', requirement: 'Confirmation of Enrolment (CoE) from Australian institution', mandatory: true, description: 'Official CoE document from the CRICOS-registered institution. Contains course details and duration.' },
        { category: 'financial', requirement: 'Proof of funds: AUD 29,710/year + tuition + travel', mandatory: true, description: 'Bank statements, loan documents, or scholarship letter. AUD 29,710 is the annual living cost threshold (2024).' },
        { category: 'employment', requirement: 'GTE (Genuine Temporary Entrant) statement', mandatory: true, description: 'Written statement explaining genuine intention to study in Australia and return to Pakistan after completion.' },
        { category: 'insurance', requirement: 'Overseas Student Health Cover (OSHC)', mandatory: true, description: 'Mandatory health insurance from an Australian provider (Allianz, Bupa, Medibank, etc.). Covers the entire visa period.' },
        { category: 'employment', requirement: 'English language proficiency (IELTS/TOEFL/PTE)', mandatory: true, description: 'Minimum scores vary by course. Generally: IELTS 5.5-6.5. Must be from a test taken within 2 years.' },
        { category: 'employment', requirement: 'Academic certificates and transcripts', mandatory: true, description: 'Previous educational qualifications with mark sheets/transcripts.' },
        { category: 'health', requirement: 'Health examination (if required)', mandatory: false, description: 'Required if from a high-risk country or for courses involving healthcare/teaching. Panel physician examination.' },
      ],
      cost: { visaFeeUSD: 440, serviceFeeUSD: 0, currency: 'AUD', visaFeeLocal: 650, visaFeeLocalLabel: 'AUD 650' },
    },
    {
      type: 'Temporary Skill Shortage (482)',
      description: 'The Temporary Skill Shortage Visa (Subclass 482) allows Pakistani professionals to work in Australia for an approved employer for up to 2 years (Short-Term stream) or up to 4 years (Medium-Term stream). The employer must be an approved Standard Business Sponsor. The Short-Term stream requires the occupation to be on the Short-Term Skilled Occupation List (STSOL) and has no pathway to permanent residency. The Medium-Term stream requires the occupation on the Medium and Long-Term Strategic Skills List (MLTSSL) and offers a pathway to permanent residence (TRT stream) after 3 years. Key requirements: relevant skills and at least 2 years work experience in the nominated occupation, English proficiency (IELTS 5.0 overall for Short-Term, 5.0 for Medium-Term with minimum 4.5 in each band), and health insurance. The employer handles the nomination process. Processing time is typically 1-3 months from Pakistan.',
      maxDuration: '2-4 years',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 30,
      processingDaysMax: 90,
      sourceUrl: 'https://immi.homeaffairs.gov.au/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Must be valid for the work visa period.' },
        { category: 'photograph', requirement: 'Digital photo', mandatory: true, description: 'Uploaded with application.' },
        { category: 'employment', requirement: 'Approved Standard Business Sponsor employer', mandatory: true, description: 'The Australian employer must be an approved sponsor with the Department of Home Affairs.' },
        { category: 'employment', requirement: 'Nomination by employer for a skilled occupation', mandatory: true, description: 'Occupation must be on STSOL (short-term) or MLTSSL (medium-term) list.' },
        { category: 'employment', requirement: 'At least 2 years relevant work experience', mandatory: true, description: 'Post-qualification work experience in the nominated occupation. Verified through references and employment letters.' },
        { category: 'employment', requirement: 'English proficiency: IELTS 5.0 overall (4.5 each band)', mandatory: true, description: 'IELTS Academic or General. TOEFL, PTE, and CAE also accepted. Must be from a test taken within 3 years.' },
        { category: 'health', requirement: 'Health examination from panel physician', mandatory: true, description: 'Medical and chest X-ray examination from a DHA-approved panel physician in Pakistan.' },
        { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'Overseas Visitors Health Cover (OVHC) for the duration of the visa.' },
        { category: 'financial', requirement: 'No personal financial proof required (employer-sponsored)', mandatory: false, description: 'The employer sponsors the applicant. No personal financial evidence needed.' },
      ],
      cost: { visaFeeUSD: 455, serviceFeeUSD: 0, currency: 'AUD', visaFeeLocal: 675, visaFeeLocalLabel: 'AUD 675' },
    },
  ],
};

async function main() {
  console.log('=== Milestone 1: Visa Knowledge Base Expansion ===');
  console.log(`Verified till: ${VERIFIED_TILL}\n`);

  const countries = Object.keys(MILESTONE_DATA);
  let totalUpdated = 0;
  let totalRequirements = 0;
  let totalCostProfiles = 0;

  for (const countryName of countries) {
    const visaTypesData = MILESTONE_DATA[countryName];
    console.log(`\n--- ${countryName} (${visaTypesData.length} visa types) ---`);

    // Get the country
    const country = await db.country.findFirst({ where: { name: countryName } });
    if (!country) {
      console.log(`  ❌ Country not found: ${countryName}`);
      continue;
    }

    for (const vtData of visaTypesData) {
      // Find or verify the visa type exists
      const existingVT = await db.visaType.findFirst({
        where: { countryId: country.id, type: vtData.type },
      });

      let visaType: { id: string };
      if (existingVT) {
        // Update existing visa type
        await db.visaType.update({
          where: { id: existingVT.id },
          data: {
            description: vtData.description,
            maxDuration: vtData.maxDuration,
            extensions: vtData.extensions,
            multipleEntry: vtData.multipleEntry,
            processingDaysMin: vtData.processingDaysMin,
            processingDaysMax: vtData.processingDaysMax,
            sourceUrl: vtData.sourceUrl,
            verifiedTill: VERIFIED_TILL,
            fetchTimestamp: new Date(TODAY),
            parserConfidence: 0.95,
          },
        });
        visaType = existingVT;
        console.log(`  ✅ Updated: ${vtData.type}`);
      } else {
        // Create new visa type
        const newVT = await db.visaType.create({
          data: {
            countryId: country.id,
            type: vtData.type,
            description: vtData.description,
            maxDuration: vtData.maxDuration,
            extensions: vtData.extensions,
            multipleEntry: vtData.multipleEntry,
            processingDaysMin: vtData.processingDaysMin,
            processingDaysMax: vtData.processingDaysMax,
            sourceUrl: vtData.sourceUrl,
            verifiedTill: VERIFIED_TILL,
            fetchTimestamp: new Date(TODAY),
            parserConfidence: 0.95,
          },
        });
        visaType = newVT;
        console.log(`  🆕 Created: ${vtData.type}`);
      }
      totalUpdated++;

      // Create per-visa-type requirements
      for (const req of vtData.requirements) {
        // Check if this requirement already exists for this visa type
        const existingReq = await db.visaRequirement.findFirst({
          where: {
            countryId: country.id,
            visaTypeId: visaType.id,
            category: req.category,
            requirement: req.requirement,
          },
        });

        if (!existingReq) {
          await db.visaRequirement.create({
            data: {
              countryId: country.id,
              visaTypeId: visaType.id,
              category: req.category,
              requirement: req.requirement,
              mandatory: req.mandatory,
              description: req.description,
              sourceUrl: vtData.sourceUrl,
              fetchTimestamp: new Date(TODAY),
              parserConfidence: 0.95,
            },
          });
          totalRequirements++;
        }
      }
      console.log(`    📋 Added ${vtData.requirements.length} requirements (linked to visa type)`);

      // Create per-visa-type cost profile
      const existingCost = await db.costProfile.findFirst({
        where: {
          countryId: country.id,
          visaTypeId: visaType.id,
        },
      });

      if (!existingCost) {
        await db.costProfile.create({
          data: {
            countryId: country.id,
            visaTypeId: visaType.id,
            visaTypeName: vtData.type,
            visaFeeUSD: vtData.cost.visaFeeUSD,
            serviceFeeUSD: vtData.cost.serviceFeeUSD,
            processingDays: Math.round((vtData.processingDaysMin + vtData.processingDaysMax) / 2),
            processingDaysMin: vtData.processingDaysMin,
            processingDaysMax: vtData.processingDaysMax,
            currency: vtData.cost.currency,
            sourceUrl: vtData.sourceUrl,
            verifiedTill: VERIFIED_TILL,
            fetchTimestamp: new Date(TODAY),
            parserConfidence: 0.95,
          },
        });
        totalCostProfiles++;
        console.log(`    💰 Added cost profile: ${vtData.cost.visaFeeLocalLabel}`);
      } else {
        await db.costProfile.update({
          where: { id: existingCost.id },
          data: {
            visaTypeName: vtData.type,
            visaFeeUSD: vtData.cost.visaFeeUSD,
            serviceFeeUSD: vtData.cost.serviceFeeUSD,
            processingDays: Math.round((vtData.processingDaysMin + vtData.processingDaysMax) / 2),
            processingDaysMin: vtData.processingDaysMin,
            processingDaysMax: vtData.processingDaysMax,
            currency: vtData.cost.currency,
            sourceUrl: vtData.sourceUrl,
            verifiedTill: VERIFIED_TILL,
          },
        });
        totalCostProfiles++;
        console.log(`    💰 Updated cost profile: ${vtData.cost.visaFeeLocalLabel}`);
      }
    }
  }

  console.log('\n=== MILESTONE 1 COMPLETE ===');
  console.log(`Countries processed: ${countries.length}`);
  console.log(`Visa types enriched: ${totalUpdated}`);
  console.log(`Per-visa-type requirements created: ${totalRequirements}`);
  console.log(`Per-visa-type cost profiles created: ${totalCostProfiles}`);
  console.log(`Verified till: ${VERIFIED_TILL}`);

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
