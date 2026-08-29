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

const MILESTONE_DATA: Record<string, VisaTypeData[]> = {
  'Turkey': [
    {
      type: 'e-Visa',
      description: 'Pakistanis are eligible for the Turkish e-Visa, which can be obtained online at evisa.gov.tr. The e-Visa is valid for 180 days and allows a single entry stay of up to 30 days for tourism or business purposes. The application is straightforward: fill the online form, pay the fee (USD 50) via credit/debit card, and receive the e-Visa via email within minutes. Requirements include a valid passport (6 months validity), a return ticket, sufficient funds (USD 50/day), and hotel reservation or accommodation details. Pakistani citizens aged 18-35 must also provide a Schengen, US, UK, or Ireland visa/residence permit OR a valid OECD member visa. The e-Visa cannot be extended — for longer stays, a regular visa must be obtained from the Turkish Embassy. Turkish Airlines and PIA passengers may get e-Visa on special terms.',
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
        { category: 'employment', requirement: 'Supporting visa (Schengen/US/UK/Ireland/OECD) for ages 18-35', mandatory: true, description: 'Pakistani citizens aged 18-35 must hold a valid visa or residence permit from Schengen, US, UK, Ireland, or an OECD country. Those over 35 are exempt from this requirement.' },
        { category: 'photograph', requirement: 'Digital photo (uploaded during online application)', mandatory: true, description: 'Uploaded as part of the e-Visa application form.' },
        { category: 'financial', requirement: 'Valid credit/debit card for online payment', mandatory: true, description: 'Visa or Mastercard for the USD 50 e-Visa fee payment.' },
      ],
      cost: { visaFeeUSD: 50, serviceFeeUSD: 0, currency: 'TRY', visaFeeLocal: 50, visaFeeLocalLabel: 'USD 50' },
    },
    {
      type: 'Tourist Visa (Sticker)',
      description: 'The Turkish Sticker Visa is for Pakistani citizens who do not qualify for the e-Visa (e.g., those aged 18-35 without a supporting visa/residence permit) or who need a longer stay. Applications are made at the Turkish Embassy in Islamabad or Consulate in Karachi. Processing typically takes 5-10 working days. The sticker visa allows stays of up to 30 or 90 days depending on the visa issued. It can be single or multiple entry. For stays beyond what the e-Visa allows, or for those who prefer embassy processing, this is the alternative route. The Turkish Embassy may request an interview in some cases. Required documents include passport, photographs, bank statements, hotel booking, return ticket, and a cover letter. For Pakistani nationals under 18, parental consent and birth certificate are additionally required.',
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
      description: 'The Turkish Student Visa allows Pakistani students to study at Turkish universities and educational institutions. Turkey has become an increasingly popular destination for Pakistani students due to affordable tuition (some universities offer programs in English), the Turkiye Burslari (Turkey Scholarships) program, and cultural proximity. The process involves: (1) Obtain admission/acceptance from a Turkish university, (2) Apply for a student visa at the Turkish Embassy with the acceptance letter, (3) Upon arrival in Turkey, apply for a residence permit (ikamet) within 30 days at the local Goc Idaresi (Immigration Office). The student visa itself is typically valid for 90 days — the actual authorization comes from the residence permit. Students can work part-time (limited hours) with permission. Turkey offers undergraduate and postgraduate programs, many taught in English. Medical insurance is required for the residence permit.',
      maxDuration: '90 days (entry) + residence permit (1 year, renewable)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 7,
      processingDaysMax: 15,
      sourceUrl: 'https://www.evisa.gov.tr/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Valid for at least 6 months beyond the intended stay.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'Biometric photos as per specifications.' },
        { category: 'employment', requirement: 'Acceptance letter from Turkish university', mandatory: true, description: 'Official admission/acceptance letter. Must be from a recognized Turkish institution.' },
        { category: 'financial', requirement: 'Proof of sufficient funds or scholarship letter', mandatory: true, description: 'Bank statements showing at least USD 500/month, OR Turkiye Burslari scholarship letter covering all expenses.' },
        { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'Required for the residence permit. Can be Turkish SGK (social security) or private insurance.' },
        { category: 'employment', requirement: 'Academic certificates and transcripts', mandatory: true, description: 'Previous educational qualifications.' },
        { category: 'employment', requirement: 'Notarized translation of documents (Turkish)', mandatory: false, description: 'Educational documents may need Turkish notarized translations.' },
      ],
      cost: { visaFeeUSD: 30, serviceFeeUSD: 0, currency: 'TRY', visaFeeLocal: 30, visaFeeLocalLabel: 'USD 30 (visa) + residence permit fees in Turkey' },
    },
    {
      type: 'Work Visa',
      description: 'The Turkish Work Visa (Calisma Izni) requires the employer in Turkey to first obtain a work permit from the Turkish Ministry of Labor and Social Security (MLSS). The employer submits the application on behalf of the foreign worker. The process involves: (1) Turkish employer applies for work permit at MLSS (takes 30-45 days), (2) If approved, the employee applies for a work visa at the Turkish Embassy in Pakistan, (3) Upon arrival, register for residence permit within 30 days. The work permit is typically valid for 1 year and renewable. Turkish employers must demonstrate they could not find a suitable Turkish or EU/Turkey bilateral agreement national for the position. The minimum salary for foreign workers is generally the Turkish minimum wage (TRY 20,002.50/month in 2024). Spouses can apply for a family residence permit. After 5 years of continuous legal work and residence, workers may be eligible to apply for Turkish citizenship or long-term residence permits.',
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
        { category: 'employment', requirement: 'Employment contract from Turkish employer', mandatory: true, description: 'Signed employment contract with salary meeting minimum wage requirements.' },
        { category: 'employment', requirement: 'Educational certificates (attested)', mandatory: true, description: 'Relevant professional qualifications. May need notarized Turkish translations.' },
        { category: 'health', requirement: 'Medical certificate from approved doctor', mandatory: true, description: 'General health certificate. May require specific tests.' },
        { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'Required for residence permit.' },
      ],
      cost: { visaFeeUSD: 50, serviceFeeUSD: 0, currency: 'TRY', visaFeeLocal: 50, visaFeeLocalLabel: 'USD 50 + work permit fees (employer pays)' },
    },
  ],

  'Malaysia': [
    {
      type: 'Visa Free',
      description: 'Pakistani citizens can enter Malaysia visa-free for up to 30 days. This facility was reintroduced in 2023 as part of Malaysia\'s tourism promotion. The visa-free entry is for tourism and social visits only — employment and study are NOT permitted. At the immigration counter, travelers should present: a valid passport (6+ months validity), return or onward flight ticket, hotel booking or accommodation details, and proof of sufficient funds. The immigration officer has the right to ask additional questions and can deny entry if they are not satisfied with the purpose of visit. Extensions are possible through the Immigration Department of Malaysia (Jabatan Imigresen Malaysia) for up to an additional 30 days, but approval is not guaranteed. For business or longer stays, a proper visa must be obtained in advance. This visa-free facility does not allow entry into Singapore or other neighboring countries from Malaysia.',
      maxDuration: '30 days',
      extensions: true,
      multipleEntry: false,
      processingDaysMin: 0,
      processingDaysMax: 0,
      sourceUrl: 'https://www.imi.gov.my/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months', mandatory: true, description: 'Must have blank pages for entry stamp.' },
        { category: 'travel', requirement: 'Return or onward flight ticket', mandatory: true, description: 'Must show confirmed return travel within 30 days. Check-in staff may verify.' },
        { category: 'accommodation', requirement: 'Hotel booking or accommodation details', mandatory: true, description: 'Confirmed hotel reservation or address of host in Malaysia.' },
        { category: 'financial', requirement: 'Proof of sufficient funds', mandatory: true, description: 'Recommended: USD 500-1,000 equivalent. Bank statement or cash. Immigration may ask to see this.' },
        { category: 'employment', requirement: 'Employment proof or student card (for ties to Pakistan)', mandatory: false, description: 'Not mandatory at entry but helps demonstrate intent to return.' },
      ],
      cost: { visaFeeUSD: 0, serviceFeeUSD: 0, currency: 'MYR', visaFeeLocal: 0, visaFeeLocalLabel: 'Free (no visa fee)' },
    },
    {
      type: 'Social Visit Pass',
      description: 'The Malaysia Social Visit Pass is for Pakistani citizens who want to stay longer than the 30-day visa-free period for social visits, tourism, visiting family/friends, or medical treatment. Applications can be made at the Malaysian Embassy in Islamabad or online through e-Visa. The pass is typically issued for up to 90 days and can be extended in Malaysia for another 30-90 days at the Immigration Department (Jabatan Imigresen). For visiting family, a sponsorship letter from the Malaysian host is required. For medical tourism, a medical appointment letter from a Malaysian hospital is needed. The Social Visit Pass does NOT allow employment or study. Pakistani applicants should provide a cover letter, bank statements, and proof of accommodation. The e-Visa option provides a faster processing route for eligible applicants.',
      maxDuration: '90 days (extendable by 30-90 days in Malaysia)',
      extensions: true,
      multipleEntry: false,
      processingDaysMin: 3,
      processingDaysMax: 7,
      sourceUrl: 'https://www.imi.gov.my/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'White background, recent.' },
        { category: 'travel', requirement: 'Return flight ticket', mandatory: true, description: 'Confirmed return travel booking.' },
        { category: 'accommodation', requirement: 'Hotel booking or host invitation', mandatory: true, description: 'Hotel reservation or invitation letter from Malaysian host.' },
        { category: 'financial', requirement: 'Bank statements (3 months)', mandatory: true, description: 'Showing sufficient funds for extended stay.' },
        { category: 'employment', requirement: 'Cover letter explaining purpose of visit', mandatory: true, description: 'Detailed letter about visit purpose and planned activities.' },
        { category: 'employment', requirement: 'Employment NOC or leave approval', mandatory: false, description: 'Helps establish ties to Pakistan.' },
      ],
      cost: { visaFeeUSD: 28, serviceFeeUSD: 0, currency: 'MYR', visaFeeLocal: 130, visaFeeLocalLabel: 'MYR 130' },
    },
    {
      type: 'Work Permit',
      description: 'Malaysia offers several work permit categories for Pakistani professionals. The most common are: (1) Employment Pass (EP) — for professionals with minimum salary of MYR 3,000/month (EP1: MYR 10,000+, EP2: MYR 5,000-9,999, EP3: MYR 3,000-4,999), valid 1-5 years; (2) Professional Visit Pass (PVP) — for short-term professional assignments up to 12 months; (3) Temporary Employment Pass — for semi-skilled workers in specific sectors, MYR 1,500-2,999/month, up to 2 years. The employer in Malaysia must apply to the Immigration Department or through the Expatriate Services Division (ESD) online portal. The employer also needs approval from relevant agencies (e.g., MDEC for tech, MOE for education). Pakistani workers in construction and manufacturing may face additional requirements. Malaysia has strict foreign worker quotas and sector-specific restrictions. The process is employer-driven.',
      maxDuration: '1-5 years (depending on pass type)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 14,
      processingDaysMax: 30,
      sourceUrl: 'https://www.imi.gov.my/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Valid for the work permit duration.' },
        { category: 'photograph', requirement: 'Passport-size photographs (4)', mandatory: true, description: 'As per Malaysian specifications.' },
        { category: 'employment', requirement: 'Employment contract from Malaysian employer', mandatory: true, description: 'Contract with salary meeting EP/PVP threshold. Minimum MYR 3,000/month for Employment Pass.' },
        { category: 'employment', requirement: 'Employer approval from Immigration Department (ESD)', mandatory: true, description: 'Employer must obtain approval through the ESD portal. This is the primary step — employee cannot apply independently.' },
        { category: 'employment', requirement: 'Relevant educational/professional qualifications', mandatory: true, description: 'Degrees, diplomas, or professional certifications relevant to the job.' },
        { category: 'health', requirement: 'Medical examination', mandatory: true, description: 'From approved clinic in Pakistan or upon arrival. FOMEMA medical screening required.' },
        { category: 'insurance', requirement: 'Medical insurance', mandatory: true, description: 'Required as part of the employment package in Malaysia.' },
      ],
      cost: { visaFeeUSD: 50, serviceFeeUSD: 0, currency: 'MYR', visaFeeLocal: 230, visaFeeLocalLabel: 'MYR 200-500 (employer typically pays)' },
    },
  ],

  'Indonesia': [
    {
      type: 'Visa on Arrival',
      description: 'Pakistani citizens can obtain a Visa on Arrival (VoA) at major Indonesian airports and seaports. The VoA costs IDR 500,000 (approximately USD 32) and allows a stay of up to 30 days, extendable once for another 30 days at an immigration office in Indonesia (total maximum 60 days). The VoA is for tourism, business meetings, social/cultural visits, and transit. It does NOT permit employment. At the arrival counter, present your passport (6+ months validity), return ticket, and payment. The VoA can also be applied for online in advance via the e-VOA system at molina.imigrasi.go.id. The e-VOA allows faster processing at the airport. For stays longer than 60 days, or for other purposes (study, work), a proper visa must be obtained from the Indonesian Embassy before travel. Bali is the most popular destination for Pakistani tourists visiting Indonesia.',
      maxDuration: '30 days (extendable once for 30 more days = 60 total)',
      extensions: true,
      multipleEntry: false,
      processingDaysMin: 0,
      processingDaysMax: 0,
      sourceUrl: 'https://www.imigrasi.go.id/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months', mandatory: true, description: 'Must have blank pages for the VoA sticker.' },
        { category: 'travel', requirement: 'Return or onward flight ticket', mandatory: true, description: 'Airlines may deny boarding without a return ticket.' },
        { category: 'financial', requirement: 'Proof of sufficient funds', mandatory: true, description: 'Recommended: USD 500-2,000 equivalent. Cash or bank statement.' },
        { category: 'accommodation', requirement: 'Hotel booking or accommodation address', mandatory: true, description: 'First night hotel booking is often checked. Full stay booking recommended.' },
        { category: 'health', requirement: 'COVID-19 vaccination proof (may be required)', mandatory: false, description: 'As of 2024, most COVID restrictions have been lifted. Check current requirements before travel.' },
      ],
      cost: { visaFeeUSD: 32, serviceFeeUSD: 0, currency: 'IDR', visaFeeLocal: 500000, visaFeeLocalLabel: 'IDR 500,000 (~USD 32)' },
    },
    {
      type: 'B211A Visa',
      description: 'The Indonesia B211A Visa (Social/Cultural Visa) is a 60-day visa for Pakistani citizens visiting Indonesia for social, cultural, educational, business meetings, or volunteer purposes. It must be obtained before travel through an Indonesian sponsor (individual or company) who applies online on the applicant\'s behalf via the immigration e-visa system. The visa is valid for 90 days from issue, allowing a 60-day stay. It can be extended up to 4 times (each extension = 30 days) at immigration offices in Indonesia, for a theoretical maximum stay of 180 days. The B211A is popular among digital nomads, volunteers, and those wanting extended stays. A sponsor (an Indonesian citizen or company) is required — they submit the application through the immigration portal and pay the sponsorship fee. The visa does NOT permit direct employment, though some remote work is tolerated. Each extension costs approximately IDR 500,000.',
      maxDuration: '60 days + up to 4 extensions of 30 days each (180 days max)',
      extensions: true,
      multipleEntry: false,
      processingDaysMin: 3,
      processingDaysMax: 7,
      sourceUrl: 'https://www.imigrasi.go.id/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months', mandatory: true, description: 'Must have blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photograph (1, red background)', mandatory: true, description: 'Indonesian visa photo specifications: 4x6cm, red background.' },
        { category: 'employment', requirement: 'Indonesian sponsor (citizen or company)', mandatory: true, description: 'A sponsor in Indonesia must initiate the application. They submit it through the immigration e-visa portal.' },
        { category: 'employment', requirement: 'Sponsor letter (surat sponsor)', mandatory: true, description: 'Letter from the Indonesian sponsor explaining the purpose and duration of visit.' },
        { category: 'financial', requirement: 'Bank statement (last 3 months)', mandatory: true, description: 'Showing sufficient funds for the stay period.' },
        { category: 'travel', requirement: 'Return flight ticket', mandatory: true, description: 'Confirmed return or onward flight booking.' },
        { category: 'accommodation', requirement: 'Accommodation details', mandatory: true, description: 'Hotel booking or address of residence in Indonesia.' },
      ],
      cost: { visaFeeUSD: 30, serviceFeeUSD: 30, currency: 'IDR', visaFeeLocal: 500000, visaFeeLocalLabel: 'IDR 500,000 (~USD 32) + sponsor agent fee' },
    },
    {
      type: 'Work Permit (KITAS)',
      description: 'The Indonesian Work Permit (KITAS - Kartu Izin Tinggal Terbatas) is a limited stay permit for Pakistani citizens employed in Indonesia. The process is employer-driven: (1) The Indonesian employer applies for a RPTKA (Plan for Use of Foreign Workers) from the Ministry of Manpower, (2) Then applies for an IMTA (Work Permit), (3) The employee gets a VITAS (limited stay visa) from the Indonesian Embassy, (4) Upon arrival, the employee registers for KITAS and KTP (temporary identity card). The KITAS is typically valid for 1-2 years. For foreign workers, Indonesia requires a DPKK (compensation fund for training Indonesian workers) of USD 100/month. Critical requirement: the employer must hire at least 10 Indonesian workers per foreign worker. Certain sectors (IT, energy, mining) have more favorable rules. After 5 years on KITAS, one may apply for KITAP (permanent stay permit) and eventually for Indonesian citizenship. The process involves significant employer costs and paperwork.',
      maxDuration: '1-2 years (renewable)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 30,
      processingDaysMax: 60,
      sourceUrl: 'https://www.imigrasi.go.id/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Valid for the work permit duration.' },
        { category: 'photograph', requirement: 'Passport-size photographs (4, red background)', mandatory: true, description: 'Indonesian specifications: 4x6cm, red background.' },
        { category: 'employment', requirement: 'RPTKA and IMTA approval (employer obtains)', mandatory: true, description: 'Employer must obtain work permit approval from Ministry of Manpower. This is the primary requirement.' },
        { category: 'employment', requirement: 'Employment contract from Indonesian employer', mandatory: true, description: 'Signed contract with position, salary, and terms.' },
        { category: 'employment', requirement: 'Educational certificates and CV', mandatory: true, description: 'Relevant professional qualifications and detailed CV.' },
        { category: 'health', requirement: 'Medical examination', mandatory: true, description: 'From approved medical center. Includes blood tests, chest X-ray, and general physical exam.' },
        { category: 'insurance', requirement: 'Health insurance and BPJS Ketenagakerjaan (employment insurance)', mandatory: true, description: 'Required by Indonesian law for all foreign workers.' },
        { category: 'financial', requirement: 'DPKK fee (USD 100/month, employer pays)', mandatory: false, description: 'Compensation fund for training local workers. Paid by the employer.' },
      ],
      cost: { visaFeeUSD: 100, serviceFeeUSD: 0, currency: 'IDR', visaFeeLocal: 1500000, visaFeeLocalLabel: 'IDR 1,500,000+ (employer bears most costs)' },
    },
  ],

  'China': [
    {
      type: 'L Visa (Tourist)',
      description: 'The Chinese L Visa (Tourist Visa) allows Pakistani citizens to visit China for tourism, sightseeing, and visiting family/friends. Applications are made at the Chinese Embassy/Consulate in Islamabad, Karachi, or Lahore. Processing typically takes 4-5 working days (regular) or 2-3 days (express, with additional fee). The standard L Visa allows a single entry stay of 30 days, but 60-day and 90-day stays are also possible. Multiple-entry L visas (6-12 months validity) may be issued to applicants with previous China travel history. The Chinese visa application form (Form V.2013) must be completed online. Pakistani applicants may be required to provide additional documentation or attend an interview. Since 2023, China has been gradually easing visa requirements — group tours from Pakistan may be eligible for visa-free entry to certain regions (Hainan, etc.). The visa fee for Pakistani nationals is typically USD 30-60 depending on the number of entries and processing speed.',
      maxDuration: '30 days (extendable, up to 90 days possible)',
      extensions: true,
      multipleEntry: false,
      processingDaysMin: 4,
      processingDaysMax: 5,
      sourceUrl: 'https://www.visaforchina.org/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months with blank pages', mandatory: true, description: 'Original passport with at least 2 blank visa pages.' },
        { category: 'photograph', requirement: 'Passport-size photograph (1, 48x33mm, white background)', mandatory: true, description: 'Recent photo showing full face, no head covering.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Confirmed or reserved round-trip flights.' },
        { category: 'accommodation', requirement: 'Hotel booking or invitation letter from Chinese host', mandatory: true, description: 'Hotel reservation OR invitation letter with host\'s Chinese ID/foreign resident permit copy and accommodation proof.' },
        { category: 'financial', requirement: 'Bank statements (last 3-6 months)', mandatory: true, description: 'Showing sufficient funds. Recommended: USD 100/day or PKR 500,000+.' },
        { category: 'employment', requirement: 'Employment letter or student enrollment proof', mandatory: true, description: 'From employer or educational institution in Pakistan. Establishes ties to Pakistan.' },
        { category: 'employment', requirement: 'Completed visa application form (V.2013)', mandatory: true, description: 'Filled online at visaforchina.org. Print the confirmation page.' },
      ],
      cost: { visaFeeUSD: 30, serviceFeeUSD: 0, currency: 'CNY', visaFeeLocal: 200, visaFeeLocalLabel: 'USD 30 (single entry, 4-5 days)' },
    },
    {
      type: 'M Visa (Business)',
      description: 'The Chinese M Visa (Business Visa) is for Pakistani citizens traveling to China for trade, business meetings, exhibitions, or technical exchanges. The key requirement is an official invitation letter (PU Letter / Invitation Letter of Duly Authorized Unit) from a Chinese business entity or government department. This letter is obtained by the Chinese business partner from their local Foreign Affairs Office or Commerce Department. Without this PU letter, the M Visa is extremely difficult to obtain. The M Visa allows stays of 30-60 days and can be single or multiple entry. Multiple-entry M visas (6-12 months validity) are available for frequent business travelers with strong China trade relations. The processing time and fee are similar to the L Visa. Pakistani businesspeople engaged in China-Pakistan trade (especially CPEC-related activities) may receive favorable consideration. The applicant should also provide their business card, company registration, and trade documents.',
      maxDuration: '30-60 days (multiple entry 6-12 months possible)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 4,
      processingDaysMax: 7,
      sourceUrl: 'https://www.visaforchina.org/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months', mandatory: true, description: 'Original with blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photograph (1)', mandatory: true, description: '48x33mm, white background.' },
        { category: 'employment', requirement: 'PU Letter / Invitation Letter from Chinese entity', mandatory: true, description: 'CRITICAL: Official invitation from a Chinese company/government unit. Obtained through their local FAO. This is the most important document.' },
        { category: 'travel', requirement: 'Round-trip flight booking', mandatory: true, description: 'Confirmed or reserved flights.' },
        { category: 'financial', requirement: 'Bank statements (3 months)', mandatory: true, description: 'Showing sufficient funds for the business trip.' },
        { category: 'employment', requirement: 'Business card and company registration', mandatory: true, description: 'Pakistani company business card, NTN, and chamber of commerce membership.' },
        { category: 'employment', requirement: 'Trade documents / business correspondence with Chinese partner', mandatory: false, description: 'Previous trade records, contracts, invoices, or correspondence strengthen the application.' },
      ],
      cost: { visaFeeUSD: 60, serviceFeeUSD: 0, currency: 'CNY', visaFeeLocal: 400, visaFeeLocalLabel: 'USD 60 (double entry) / USD 90 (multi entry)' },
    },
    {
      type: 'X Visa (Student)',
      description: 'The Chinese X Visa (Student Visa) allows Pakistani students to study at Chinese universities. China is a major destination for Pakistani students — over 28,000 Pakistani students study in China, making them one of the largest international student groups. The process: (1) Apply to and receive admission from a Chinese university (JW201 or JW202 form), (2) Apply for the X Visa at the Chinese Embassy with the JW form and university letter, (3) Upon arrival in China, register at the university within 24 hours and convert the X Visa to a Residence Permit within 30 days at the local Entry-Exit Administration. The X1 Visa (long-term, 1 year) is for programs over 180 days, and X2 Visa (short-term) for programs under 180 days. Pakistani students benefit from the Pakistani government\'s quota-based scholarships (PHEC) and Chinese Government Scholarships (CSC). Many Chinese universities offer programs in English, especially in engineering, medicine (MBBS), and business. The Residence Permit is valid for the duration of the study program.',
      maxDuration: '1 year (residence permit covers full program)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 5,
      processingDaysMax: 10,
      sourceUrl: 'https://www.visaforchina.org/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Valid for the duration of study.' },
        { category: 'photograph', requirement: 'Passport-size photograph (1)', mandatory: true, description: '48x33mm, white background.' },
        { category: 'employment', requirement: 'JW201 or JW202 form from Chinese university', mandatory: true, description: 'Official visa application form for foreign students issued by the university. JW201 for government scholarship, JW202 for self-funded.' },
        { category: 'employment', requirement: 'University admission letter', mandatory: true, description: 'Official admission/acceptance letter from the Chinese university.' },
        { category: 'financial', requirement: 'Proof of funds or scholarship letter', mandatory: true, description: 'Bank statements showing CNY 60,000-100,000/year OR CSC/PHEC scholarship letter covering tuition and living.' },
        { category: 'health', requirement: 'Medical examination record (from approved clinic)', mandatory: true, description: 'Physical examination form and blood test results from a Chinese embassy-approved clinic. Valid for 6 months.' },
        { category: 'insurance', requirement: 'Medical insurance (can be arranged in China)', mandatory: true, description: 'Required for residence permit. University may provide or recommend insurance.' },
        { category: 'employment', requirement: 'Academic certificates (notarized)', mandatory: true, description: 'Previous educational qualifications with notarized Chinese translations.' },
      ],
      cost: { visaFeeUSD: 30, serviceFeeUSD: 0, currency: 'CNY', visaFeeLocal: 200, visaFeeLocalLabel: 'USD 30 (X1) / USD 20 (X2)' },
    },
    {
      type: 'Z Visa (Work)',
      description: 'The Chinese Z Visa (Work Visa) is for Pakistani citizens employed in China. The process is employer-driven: (1) The Chinese employer obtains a Foreigner\'s Work Permit (FWP) from the Ministry of Human Resources and Social Security, (2) The employer sends the Work Permit Notice and Invitation Letter to the employee, (3) The employee applies for the Z Visa at the Chinese Embassy in Pakistan, (4) Upon arrival in China, the employee must obtain a Residence Permit within 30 days. The Z Visa is typically valid for 30 days (entry only) — the actual work authorization comes from the Residence Permit which is valid for 1 year. Requirements for the Work Permit include: at least 2 years relevant work experience, bachelor\'s degree or higher, clean criminal record, and no serious diseases. The employer must prove that no qualified Chinese citizen is available for the position. CPEC-related projects have facilitated many Z Visa applications for Pakistani engineers and professionals.',
      maxDuration: '30 days entry (1 year residence permit)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 5,
      processingDaysMax: 10,
      sourceUrl: 'https://www.visaforchina.org/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Original passport.' },
        { category: 'photograph', requirement: 'Passport-size photograph (1)', mandatory: true, description: '48x33mm, white background.' },
        { category: 'employment', requirement: 'Foreigner\'s Work Permit Notice (from employer)', mandatory: true, description: 'The most critical document. Chinese employer must obtain this from MOHRSS before the employee can apply.' },
        { category: 'employment', requirement: 'Employment contract from Chinese employer', mandatory: true, description: 'Signed contract with salary, position, and terms.' },
        { category: 'employment', requirement: 'At least 2 years relevant work experience', mandatory: true, description: 'Verified through employment letters and experience certificates.' },
        { category: 'employment', requirement: 'Bachelor\'s degree or higher', mandatory: true, description: 'Educational qualification relevant to the job. Attested by HEC and MoFA.' },
        { category: 'health', requirement: 'Medical examination (from approved clinic)', mandatory: true, description: 'Physical exam form from Chinese embassy-approved clinic. Includes blood tests and chest X-ray.' },
        { category: 'financial', requirement: 'Non-criminal record certificate (attested)', mandatory: true, description: 'From Pakistani police/Ministry of Interior, attested by MoFA.' },
      ],
      cost: { visaFeeUSD: 30, serviceFeeUSD: 0, currency: 'CNY', visaFeeLocal: 200, visaFeeLocalLabel: 'USD 30 + work permit fees (employer pays)' },
    },
  ],

  'Russia': [
    {
      type: 'Tourist Visa',
      description: 'The Russian Tourist Visa allows Pakistani citizens to visit Russia for tourism and sightseeing. The application requires a tourist invitation letter (turisticheskoe priglashenie) issued by a Russian travel agency registered with the Federal Tourism Agency (Rosturizm). The visa is typically single-entry, valid for 30 days, and must be used within 90 days of issue. Applications are submitted through VFS Global in Islamabad or directly at the Russian Embassy/Consulate. Processing takes 4-10 working days for standard processing or 1-3 days for urgent processing (additional fee). Russian tourist visas are relatively straightforward for Pakistani citizens — the key requirement is the hotel/tour operator voucher. Pakistan and Russia have been strengthening bilateral relations, and Russia has been relatively accessible as a tourist destination. The visa fee for Pakistani citizens is approximately USD 50-80 depending on processing speed and number of entries.',
      maxDuration: '30 days (single entry, visa valid 90 days)',
      extensions: false,
      multipleEntry: false,
      processingDaysMin: 4,
      processingDaysMax: 10,
      sourceUrl: 'https://visa.kdmid.ru/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid at least 6 months beyond stay', mandatory: true, description: 'Must have at least 2 blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photograph (1, 35x45mm)', mandatory: true, description: 'As per Russian visa photo specifications.' },
        { category: 'employment', requirement: 'Tourist invitation/voucher from Russian travel agency', mandatory: true, description: 'Official tourist voucher (turvoucher) from a Rosturizm-registered Russian travel agency, including hotel confirmation.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Confirmed or reserved flights.' },
        { category: 'financial', requirement: 'Bank statements (3 months)', mandatory: true, description: 'Showing sufficient funds. No strict minimum but recommended USD 1,000+.' },
        { category: 'insurance', requirement: 'Travel health insurance', mandatory: true, description: 'Required for Schengen visa. For Russia, recommended but not always mandatory. Some consulates require it.' },
        { category: 'employment', requirement: 'Employment letter / student letter', mandatory: false, description: 'Supporting document showing ties to Pakistan.' },
      ],
      cost: { visaFeeUSD: 50, serviceFeeUSD: 35, currency: 'RUB', visaFeeLocal: 3700, visaFeeLocalLabel: 'USD 50 (standard, 4-10 days)' },
    },
    {
      type: 'Business Visa',
      description: 'The Russian Business Visa is for Pakistani citizens traveling to Russia for business meetings, negotiations, conferences, or trade fairs. The key requirement is an official business invitation letter (biznes priglashenie) from a Russian company or organization. This invitation must be issued through the Russian Ministry of Foreign Affairs (MID) or its regional offices. The business visa can be single, double, or multiple-entry (valid for 1-12 months). Multiple-entry business visas require a longer and more involved invitation process. Processing time is similar to the tourist visa (4-10 days standard). The business visa is essential for Pakistani businesspeople engaged in trade with Russia, particularly in sectors like textiles, rice, surgical instruments, and IT services. The applicant should also provide a cover letter explaining the business purpose, their company details, and the Russian partner\'s information.',
      maxDuration: '30-90 days per entry (multi-entry 1-12 months)',
      extensions: false,
      multipleEntry: true,
      processingDaysMin: 4,
      processingDaysMax: 10,
      sourceUrl: 'https://visa.kdmid.ru/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'At least 6 months validity with blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photograph (1)', mandatory: true, description: '35x45mm, as per specifications.' },
        { category: 'employment', requirement: 'Official business invitation from Russian entity (via MID)', mandatory: true, description: 'CRITICAL: Invitation letter processed through the Russian Ministry of Foreign Affairs. The Russian partner submits a request to MID.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Confirmed or reserved flights.' },
        { category: 'financial', requirement: 'Bank statements (3 months)', mandatory: true, description: 'Showing sufficient funds for the business trip.' },
        { category: 'employment', requirement: 'Cover letter explaining business purpose', mandatory: true, description: 'On company letterhead explaining the business activities, Russian partner details, and trip objectives.' },
        { category: 'employment', requirement: 'Company registration and business documents', mandatory: false, description: 'Pakistani company registration (SECP), NTN, and business profile.' },
      ],
      cost: { visaFeeUSD: 80, serviceFeeUSD: 35, currency: 'RUB', visaFeeLocal: 5900, visaFeeLocalLabel: 'USD 80 (double entry) / USD 150 (multi entry, 1 year)' },
    },
    {
      type: 'Student Visa',
      description: 'The Russian Student Visa allows Pakistani students to study at Russian universities. Russia offers affordable education, especially in medicine (MBBS), engineering, and sciences, with many programs available in English. The process: (1) Apply to a Russian university (directly or through Russian Center for Science and Culture in Islamabad), (2) Receive an official invitation letter from the university (processed through the Russian Ministry of Internal Affairs or MID), (3) Apply for the student visa at the Russian Embassy, (4) Upon arrival, register with the university and obtain a multi-entry student visa/residence permit. The initial student visa is typically valid for 90 days, then extended to cover the full study period (up to 6 years for MBBS, 4-5 years for engineering). Pakistani students benefit from Russian Government Quota Scholarships. Medical education in Russia is particularly popular due to affordable fees (USD 3,000-6,000/year) and recognition by PMDC. Students can work part-time with university permission.',
      maxDuration: '90 days initial (extended for full program duration, up to 6 years)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 7,
      processingDaysMax: 14,
      sourceUrl: 'https://visa.kdmid.ru/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'For the full study period.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'As per Russian specifications.' },
        { category: 'employment', requirement: 'Official invitation from Russian university (via MVD/MID)', mandatory: true, description: 'The university obtains the invitation through the Ministry of Internal Affairs. This is the primary document.' },
        { category: 'employment', requirement: 'University admission letter / acceptance', mandatory: true, description: 'Official admission documents from the Russian educational institution.' },
        { category: 'financial', requirement: 'Proof of funds or scholarship letter', mandatory: true, description: 'Bank statements showing USD 5,000-10,000/year OR Russian Government Scholarship letter.' },
        { category: 'health', requirement: 'Medical examination (HIV test mandatory)', mandatory: true, description: 'HIV test result (negative) is mandatory for Russian student visa. Also general health check.' },
        { category: 'health', requirement: 'Medical insurance valid in Russia', mandatory: true, description: 'Must be purchased or arranged through the university. Covers the study period.' },
        { category: 'employment', requirement: 'Educational certificates (notarized, Russian translation)', mandatory: true, description: 'Previous qualifications with notarized translations into Russian.' },
      ],
      cost: { visaFeeUSD: 50, serviceFeeUSD: 35, currency: 'RUB', visaFeeLocal: 3700, visaFeeLocalLabel: 'USD 50 (single entry)' },
    },
  ],

  'Italy': [
    {
      type: 'Schengen Visa',
      description: 'The Italy Schengen Visa (Type C) allows Pakistani citizens to visit Italy and other Schengen countries for tourism, business, visiting family/friends, or short-term study (up to 90 days in 180 days). Applications are processed through VFS Global in Islamabad, Karachi, or Lahore. Italy is the primary Schengen entry point for many Pakistani applicants due to relatively more accessible processing compared to other Schengen countries. Processing time is typically 15 calendar days but can extend to 30-45 days. Key requirements include passport (3+ months validity beyond stay), travel insurance with EUR 30,000 coverage, proof of accommodation, flight itinerary, proof of funds (EUR 40-50/day), and strong ties to Pakistan. The Italian Embassy may request an interview. Multiple-entry visas (1-5 years) are possible for applicants with previous compliant Schengen travel. Italy has specific requirements for minors traveling and for those visiting family.',
      maxDuration: '90 days within 180-day period',
      extensions: false,
      multipleEntry: false,
      processingDaysMin: 10,
      processingDaysMax: 30,
      sourceUrl: 'https://vistoperitalia.esteri.it/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 3 months beyond planned stay', mandatory: true, description: 'With at least 2 blank pages, issued within last 10 years.' },
        { category: 'photograph', requirement: 'ID photos (2, 35x45mm, white background)', mandatory: true, description: 'Recent Schengen-compliant photos.' },
        { category: 'insurance', requirement: 'Travel insurance EUR 30,000 coverage', mandatory: true, description: 'Must cover Schengen area, entire stay, including medical evacuation and repatriation.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Reserved (not purchased) round-trip flights.' },
        { category: 'accommodation', requirement: 'Hotel reservation or invitation letter with host documents', mandatory: true, description: 'Hotel bookings OR invitation letter from Italian host with their ID/passport, proof of address (bollettino/posta), and registration certificate.' },
        { category: 'financial', requirement: 'Bank statements (3 months) + proof of sufficient funds', mandatory: true, description: 'Recommended: EUR 40-50/day. Bank statements, property documents, and income proof.' },
        { category: 'employment', requirement: 'Cover letter + employment NOC', mandatory: true, description: 'Explaining purpose of visit, dates, and employment letter with leave approval.' },
        { category: 'financial', requirement: 'Income tax returns (FBR)', mandatory: false, description: 'Strengthens financial credibility.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 35, currency: 'EUR', visaFeeLocal: 80, visaFeeLocalLabel: 'EUR 80 + VFS ~EUR 30' },
    },
    {
      type: 'National D Visa',
      description: 'The Italy National D Visa is a long-stay visa for Pakistani citizens planning to stay in Italy for more than 90 days for work, study, or joining family. The D Visa must be converted to a Residence Permit (Permesso di Soggiorno) within 8 days of arrival at the local Questura (police headquarters). The D Visa categories include: (1) Study Visa — for university enrollment, (2) Work Visa — requires employer approval from the Sportello Unico (one-stop shop for immigration), (3) Self-Employment Visa — requires approval from the relevant Chamber of Commerce, (4) Family Reunification. For Pakistani students, the D Visa for Study requires university admission, proof of funds (EUR 6,063.54/year as set by INPS), health insurance, and accommodation proof. The D Visa application is processed by the Italian Embassy in Islamabad. After obtaining the D Visa and arriving in Italy, the residence permit is typically issued within 2-4 months. Students can work up to 20 hours/week.',
      maxDuration: '1 year (converts to residence permit)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 20,
      processingDaysMax: 45,
      sourceUrl: 'https://vistoperitalia.esteri.it/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport for entire stay', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'ID photos (2, 35x45mm)', mandatory: true, description: 'Italian visa specifications.' },
        { category: 'employment', requirement: 'Acceptance/enrollment letter from Italian institution or employer approval', mandatory: true, description: 'For study: university enrollment. For work: Sportello Unico approval (Nulla Osta). For family: sponsor documents.' },
        { category: 'financial', requirement: 'Proof of funds (EUR 6,063.54/year for students)', mandatory: true, description: 'Bank statements, scholarship letter, or guarantor letter. The amount is set by INPS annually.' },
        { category: 'insurance', requirement: 'Health insurance covering Italy', mandatory: true, description: 'Italian National Health Service (SSN) registration or private health insurance.' },
        { category: 'employment', requirement: 'Language proficiency (Italian or English)', mandatory: true, description: 'For Italian-taught programs: B1/B2 Italian (CILS/CELI). For English-taught: IELTS/TOEFL.' },
        { category: 'accommodation', requirement: 'Accommodation proof in Italy', mandatory: true, description: 'Rental contract, university housing confirmation, or host declaration.' },
        { category: 'employment', requirement: 'Academic certificates (for study visa)', mandatory: false, description: 'Previous qualifications with apostille and Italian translations.' },
      ],
      cost: { visaFeeUSD: 58, serviceFeeUSD: 35, currency: 'EUR', visaFeeLocal: 50, visaFeeLocalLabel: 'EUR 50 + VFS ~EUR 30' },
    },
    {
      type: 'Elective Residence Visa',
      description: 'The Italy Elective Residence Visa (Residenza Elettiva) is designed for non-EU citizens (including Pakistanis) who wish to live in Italy without working. It is ideal for retirees, individuals with passive income, or digital nomads. The key requirement is demonstrating a stable and regular passive income of at least EUR 31,000/year (2024 threshold, approximately 3x the Italian minimum social pension). This income can come from pensions, investments, rental income, or savings. The applicant must also show proof of accommodation in Italy and comprehensive health insurance. Employment (even self-employment) is NOT permitted on this visa. After 5 years of continuous legal residence in Italy, the holder can apply for long-term EC residence status. After 10 years, Italian citizenship may be possible. The application is submitted to the Italian Embassy in Islamabad. Processing takes 2-4 months. This visa is increasingly popular among Pakistani retirees and those with overseas income.',
      maxDuration: '1 year (renewable)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 30,
      processingDaysMax: 90,
      sourceUrl: 'https://vistoperitalia.esteri.it/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'Valid for the intended residence period.' },
        { category: 'photograph', requirement: 'ID photos (2)', mandatory: true, description: 'As per Italian specifications.' },
        { category: 'financial', requirement: 'Passive income of at least EUR 31,000/year', mandatory: true, description: 'From pensions, investments, rental income, or annuities. Must be stable and regular. Bank statements for 12+ months.' },
        { category: 'financial', requirement: 'Additional EUR 5,000/year for each dependent', mandatory: false, description: 'If bringing family members, additional income proof needed.' },
        { category: 'insurance', requirement: 'Comprehensive health insurance covering Italy', mandatory: true, description: 'Must cover all medical expenses. Private insurance or registration with Italian SSN (if eligible).' },
        { category: 'accommodation', requirement: 'Proof of suitable accommodation in Italy', mandatory: true, description: 'Rental contract or property ownership deed meeting minimum space requirements.' },
        { category: 'financial', requirement: 'No intention to work in Italy (self-declaration)', mandatory: true, description: 'Written declaration that the applicant will not engage in any employment or business activity in Italy.' },
        { category: 'employment', requirement: 'Police clearance certificate from Pakistan', mandatory: true, description: 'From Pakistani police/authorities, attested by MoFA.' },
      ],
      cost: { visaFeeUSD: 58, serviceFeeUSD: 35, currency: 'EUR', visaFeeLocal: 50, visaFeeLocalLabel: 'EUR 50 + VFS ~EUR 30' },
    },
  ],

  'Portugal': [
    {
      type: 'Schengen Tourist Visa',
      description: 'The Portugal Schengen Visa allows Pakistani citizens to visit Portugal and the broader Schengen Area for tourism, business, or family visits for up to 90 days within any 180-day period. Applications are submitted through VFS Global in Islamabad. Portugal has become a popular destination due to its Golden Visa program (though investment-based and separate from tourist visas). Processing typically takes 15 calendar days but can extend to 30-45 days. Key requirements include passport validity (3+ months beyond stay), travel insurance (EUR 30,000), accommodation proof, round-trip flights, and proof of sufficient funds (approximately EUR 40/day). Portugal\'s immigration authority (AIMA, formerly SEF) processes Schengen applications. Pakistani applicants should demonstrate strong ties to Pakistan. Portugal is relatively welcoming compared to some other Schengen countries, and the tourism industry is English-friendly.',
      maxDuration: '90 days within 180-day period',
      extensions: false,
      multipleEntry: false,
      processingDaysMin: 15,
      processingDaysMax: 30,
      sourceUrl: 'https://www.sef.pt/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 3 months beyond stay', mandatory: true, description: 'With blank pages, issued within last 10 years.' },
        { category: 'photograph', requirement: 'ID photos (2, 35x45mm)', mandatory: true, description: 'White background, recent.' },
        { category: 'insurance', requirement: 'Travel insurance EUR 30,000', mandatory: true, description: 'Must cover Schengen area and entire stay period.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Reserved (not purchased) flights showing entry/exit.' },
        { category: 'accommodation', requirement: 'Hotel reservation or host invitation', mandatory: true, description: 'Hotel bookings OR invitation letter from Portuguese host with their ID and proof of address.' },
        { category: 'financial', requirement: 'Bank statements (3 months) + proof of sufficient funds', mandatory: true, description: 'Recommended EUR 40/day minimum. Bank statements, income proof, property documents.' },
        { category: 'employment', requirement: 'Cover letter + employment NOC', mandatory: true, description: 'Explaining visit purpose and employment letter with leave approval.' },
        { category: 'employment', requirement: 'Ties to Pakistan evidence', mandatory: false, description: 'Property documents, family ties, business ownership.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 30, currency: 'EUR', visaFeeLocal: 80, visaFeeLocalLabel: 'EUR 80 + VFS ~EUR 27' },
    },
    {
      type: 'Student Visa',
      description: 'The Portugal Student Visa (Residence Visa for Study) allows Pakistani students to study at Portuguese educational institutions for programs longer than 90 days. The process: (1) Obtain admission from a Portuguese university (many offer programs in English, especially at postgraduate level), (2) Apply for a residence visa at the Portuguese Embassy in Islamabad, (3) Upon arrival, register at AIMA (formerly SEF) within 3 months for a residence permit. Key requirements include proof of enrollment, proof of funds (EUR 614.80/month as per 2024 IPSS threshold), health insurance, and accommodation proof. Portuguese public university tuition is relatively affordable (EUR 1,000-7,000/year for EU-equivalent rates, though non-EU students may pay higher fees). Portugal\'s D7 Visa (passive income) and Job Seeker Visa are alternative pathways. Students can work part-time. After graduation, a job search residence permit may be available. Portugal offers a high quality of life at a lower cost than most Western European countries.',
      maxDuration: '1 year (renewable for program duration)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 30,
      processingDaysMax: 60,
      sourceUrl: 'https://www.sef.pt/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport for entire stay', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'ID photos (2)', mandatory: true, description: 'As per specifications.' },
        { category: 'employment', requirement: 'Enrollment letter from Portuguese institution', mandatory: true, description: 'Official enrollment/acceptance from a recognized Portuguese educational institution.' },
        { category: 'financial', requirement: 'Proof of funds (EUR 614.80/month)', mandatory: true, description: 'Bank statements showing minimum EUR 7,378/year for living costs + tuition.' },
        { category: 'insurance', requirement: 'Health insurance covering Portugal', mandatory: true, description: 'Portuguese National Health Service (SNS) registration or private insurance.' },
        { category: 'accommodation', requirement: 'Accommodation proof in Portugal', mandatory: true, description: 'Rental contract, university housing, or host family arrangement.' },
        { category: 'employment', requirement: 'Language proficiency (if applicable)', mandatory: false, description: 'Many programs are in English. For Portuguese-taught programs, B1/B2 Portuguese required.' },
        { category: 'employment', requirement: 'Academic certificates and transcripts', mandatory: true, description: 'Previous qualifications. May need apostille and Portuguese translation.' },
      ],
      cost: { visaFeeUSD: 58, serviceFeeUSD: 30, currency: 'EUR', visaFeeLocal: 50, visaFeeLocalLabel: 'EUR 50 + VFS ~EUR 27' },
    },
    {
      type: 'Work Visa',
      description: 'The Portugal Work Visa requires the employer in Portugal to first obtain a work permit (Autorização de Trabalho) from AIMA (formerly SEF) and IEFP (Institute for Employment and Vocational Training). The employer must demonstrate that no qualified EU/EEA/Swiss citizen was available for the position. Once approved, the employee applies for a residence visa at the Portuguese Embassy in Pakistan. Portugal has introduced the D3 Visa for highly qualified professionals, and the Tech Visa for IT professionals (fast-track processing). The D7 Visa is for those with passive income (pensions, rentals, royalties). The D8 Visa (Digital Nomad Visa) allows remote workers earning at least 4x the Portuguese minimum wage (EUR 3,280/month in 2024). The regular work visa process can take 2-6 months. After 5 years of legal residence, permanent residence is possible, and after 6 years, Portuguese citizenship can be applied for.',
      maxDuration: '1 year (renewable)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 30,
      processingDaysMax: 90,
      sourceUrl: 'https://www.sef.pt/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'For the intended work period.' },
        { category: 'photograph', requirement: 'ID photos (2)', mandatory: true, description: 'As per specifications.' },
        { category: 'employment', requirement: 'Work permit (Autorização de Trabalho) from AIMA', mandatory: true, description: 'Employer must obtain this approval. Labor market test is typically required.' },
        { category: 'employment', requirement: 'Employment contract from Portuguese employer', mandatory: true, description: 'Signed contract meeting Portuguese minimum wage and working conditions.' },
        { category: 'financial', requirement: 'Proof of salary meeting Portuguese minimum wage', mandatory: true, description: 'Minimum wage EUR 820/month (2024). The contract salary must meet or exceed this.' },
        { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'Portuguese SNS registration or private health insurance.' },
        { category: 'accommodation', requirement: 'Accommodation proof', mandatory: true, description: 'Rental contract or employer-provided housing.' },
        { category: 'employment', requirement: 'Educational qualifications and CV', mandatory: false, description: 'Relevant professional qualifications.' },
      ],
      cost: { visaFeeUSD: 58, serviceFeeUSD: 30, currency: 'EUR', visaFeeLocal: 50, visaFeeLocalLabel: 'EUR 50 + VFS ~EUR 27' },
    },
  ],

  'Spain': [
    {
      type: 'Schengen Visa',
      description: 'The Spain Schengen Visa allows Pakistani citizens to visit Spain and the Schengen Area for up to 90 days within any 180-day period for tourism, business, visiting family, or short-term study. Applications are processed through BLS International in Islamabad or Karachi. Processing time is typically 15 calendar days but can extend to 30-45 days. Spain has become increasingly popular as a tourist and business destination for Pakistanis. Key requirements: passport (3+ months validity), travel insurance (EUR 30,000), accommodation proof, round-trip flights, and proof of sufficient funds (approximately EUR 60-100/day for hotel stays, EUR 30/day if hosted). Spanish authorities are known for careful assessment of Pakistani applications. Multiple-entry visas (1-5 years) may be issued to applicants with prior compliant Schengen travel. Spain\'s tourism infrastructure is well-developed and English is widely understood in tourist areas.',
      maxDuration: '90 days within 180-day period',
      extensions: false,
      multipleEntry: false,
      processingDaysMin: 15,
      processingDaysMax: 30,
      sourceUrl: 'https://www.exteriores.gob.es/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 3 months beyond stay', mandatory: true, description: 'With blank pages, issued within last 10 years.' },
        { category: 'photograph', requirement: 'ID photos (2, 35x45mm)', mandatory: true, description: 'White background, recent, Schengen-compliant.' },
        { category: 'insurance', requirement: 'Travel insurance EUR 30,000 coverage', mandatory: true, description: 'Must cover Schengen area and entire stay.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Reserved flights, not purchased.' },
        { category: 'accommodation', requirement: 'Hotel reservation or Carta de Invitación', mandatory: true, description: 'Hotel bookings OR a Carta de Invitación (invitation letter) from Spanish host, registered at the local police station.' },
        { category: 'financial', requirement: 'Bank statements (3 months) + proof of sufficient funds', mandatory: true, description: 'EUR 60-100/day if staying in hotels, EUR 30/day if hosted. Bank statements, property, income proof.' },
        { category: 'employment', requirement: 'Cover letter + employment NOC / leave approval', mandatory: true, description: 'Explaining visit purpose with employment proof from Pakistan.' },
        { category: 'employment', requirement: 'FBR tax returns', mandatory: false, description: 'Strengthens financial credibility of the application.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 30, currency: 'EUR', visaFeeLocal: 80, visaFeeLocalLabel: 'EUR 80 + BLS service fee ~EUR 26' },
    },
    {
      type: 'Student Visa',
      description: 'The Spain Student Visa allows Pakistani students to study at Spanish educational institutions for programs exceeding 90 days. Spain offers affordable education, especially at public universities (EUR 1,000-4,000/year for EU rates; non-EU students may pay EUR 2,000-8,000/year depending on the region and program). The process: (1) Obtain admission from a Spanish institution, (2) Apply for the student visa at the Spanish Embassy/Consulate through BLS International, (3) Upon arrival, apply for the TIE (Tarjeta de Identidad de Extranjero) student card within 30 days. Key requirements include proof of enrollment, proof of funds (approximately EUR 600/month IPROO minimum), health insurance, and accommodation proof. Students can work up to 20 hours/week (new regulation from 2024). Spain offers programs in both Spanish and English (especially at postgraduate level). After graduation, students may be eligible for a job search permit (busqueda de empleo) to stay and work.',
      maxDuration: '1 year (renewable for program duration)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 20,
      processingDaysMax: 45,
      sourceUrl: 'https://www.exteriores.gob.es/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport for entire stay', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'ID photos (2)', mandatory: true, description: 'As per Spanish visa specifications.' },
        { category: 'employment', requirement: 'Enrollment/admission letter from Spanish institution', mandatory: true, description: 'Official enrollment from a recognized Spanish university or institution.' },
        { category: 'financial', requirement: 'Proof of funds (EUR 600/month = EUR 7,200/year)', mandatory: true, description: 'Bank statements, scholarship letter, or guarantor documents. IPROO sets the annual minimum.' },
        { category: 'insurance', requirement: 'Health insurance covering Spain', mandatory: true, description: 'Private health insurance with full coverage. Required for TIE application.' },
        { category: 'accommodation', requirement: 'Accommodation proof in Spain', mandatory: true, description: 'Rental contract, university housing, or host arrangement.' },
        { category: 'employment', requirement: 'Language proficiency (Spanish or English)', mandatory: true, description: 'DELE/SIELE for Spanish-taught programs. IELTS/TOEFL for English-taught.' },
        { category: 'employment', requirement: 'Academic certificates (apostilled, translated)', mandatory: true, description: 'Previous qualifications with Hague apostille and Spanish sworn translation.' },
      ],
      cost: { visaFeeUSD: 58, serviceFeeUSD: 30, currency: 'EUR', visaFeeLocal: 60, visaFeeLocalLabel: 'EUR 60 (student visa) + BLS ~EUR 26' },
    },
    {
      type: 'Work Visa',
      description: 'The Spain Work Visa requires the employer to first obtain a work permit from the Spanish immigration office (Oficina de Extranjería). The employer must prove that no qualified EU/EEA citizen was available. For highly qualified professionals, the EU Blue Card is available with a minimum salary of approximately EUR 51,000/year (2024). Spain also has the Highly Qualified Professional Visa for strategic sectors (IT, engineering, healthcare). The D-Visa work authorization process involves: (1) Employer applies for work authorization at the Oficina de Extranjería, (2) Once approved, employee applies for the D Visa at the Spanish Embassy, (3) Upon arrival, register and obtain the TIE. Processing time varies from 2-4 months for the work permit. Spain\'s minimum wage is EUR 1,184/month (2024, 14 payments/year). After 5 years of legal residence, permanent residency is available. After 10 years (2 years for citizens of former Spanish colonies — Pakistan is NOT included), citizenship can be applied for.',
      maxDuration: '1 year (renewable)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 30,
      processingDaysMax: 90,
      sourceUrl: 'https://www.exteriores.gob.es/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'For the work contract period.' },
        { category: 'photograph', requirement: 'ID photos (2)', mandatory: true, description: 'As per specifications.' },
        { category: 'employment', requirement: 'Work authorization (Autorización de Trabajo) from Oficina de Extranjería', mandatory: true, description: 'Employer must obtain this. Involves labor market test.' },
        { category: 'employment', requirement: 'Employment contract from Spanish employer', mandatory: true, description: 'Signed contract meeting minimum wage (EUR 1,184/month) and working conditions.' },
        { category: 'financial', requirement: 'Proof of salary meeting minimum threshold', mandatory: true, description: 'As stated in the employment contract.' },
        { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'Spanish Social Security registration or private insurance.' },
        { category: 'accommodation', requirement: 'Accommodation proof (empadronamiento)', mandatory: true, description: 'Municipal registration (padrón municipal) or rental contract.' },
        { category: 'employment', requirement: 'Professional qualifications', mandatory: false, description: 'Relevant qualifications. May need homologación (credential recognition) for regulated professions.' },
      ],
      cost: { visaFeeUSD: 58, serviceFeeUSD: 30, currency: 'EUR', visaFeeLocal: 60, visaFeeLocalLabel: 'EUR 60 + BLS ~EUR 26' },
    },
    {
      type: 'Digital Nomad Visa',
      description: 'Spain\'s Digital Nomad Visa (Visa de Nómada Digital) was introduced in 2023 and allows Pakistani remote workers to live in Spain for up to 1 year (renewable for up to 5 years). Requirements: (1) Minimum income of EUR 2,800-3,200/month (approximately 200% of the SMI — Spanish Minimum Wage), (2) Employment contract or business activity that has existed for at least 3 months, (3) Work must be done remotely (more than 50% for companies outside Spain), (4) Health insurance, (5) Clean criminal record. The visa allows the holder to live in Spain and work remotely for foreign companies. It does NOT permit working for Spanish companies or clients (unless through a Spanish company). Family members can be included on the application. After 5 years, permanent residence may be possible. The application is submitted at the Spanish Embassy in Islamabad. This visa has made Spain one of Europe\'s most attractive digital nomad destinations.',
      maxDuration: '1 year (renewable up to 5 years)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 20,
      processingDaysMax: 45,
      sourceUrl: 'https://www.exteriores.gob.es/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport', mandatory: true, description: 'For the intended stay period.' },
        { category: 'photograph', requirement: 'ID photos (2)', mandatory: true, description: 'As per Spanish specifications.' },
        { category: 'employment', requirement: 'Employment contract or proof of business activity (3+ months)', mandatory: true, description: 'Contract with foreign company OR proof of freelance/consultancy business existing for at least 3 months.' },
        { category: 'financial', requirement: 'Monthly income of EUR 2,800-3,200 (200% of SMI)', mandatory: true, description: 'Bank statements and salary slips or business income proof. Must be consistent and stable.' },
        { category: 'insurance', requirement: 'Health insurance with no co-pays in Spain', mandatory: true, description: 'Private health insurance providing full coverage in Spain without co-pays.' },
        { category: 'employment', requirement: 'Clean criminal record certificate from Pakistan', mandatory: true, description: 'From Pakistani police, attested by MoFA.' },
        { category: 'financial', requirement: 'Proof of remote work arrangement (50%+ work for non-Spanish entities)', mandatory: true, description: 'Employer declaration or business proof showing most work is for entities outside Spain.' },
        { category: 'accommodation', requirement: 'Accommodation proof or address in Spain', mandatory: false, description: 'Rental contract or property ownership in Spain. Can be arranged after arrival.' },
      ],
      cost: { visaFeeUSD: 70, serviceFeeUSD: 30, currency: 'EUR', visaFeeLocal: 60, visaFeeLocalLabel: 'EUR 60 (residence visa) + BLS ~EUR 26' },
    },
  ],

  'Norway': [
    {
      type: 'Schengen Tourist Visa',
      description: 'The Norway Schengen Visa allows Pakistani citizens to visit Norway and the Schengen Area for up to 90 days within 180 days for tourism, visiting family/friends, business, or short-term study. Applications are processed by VFS Global on behalf of the Norwegian Embassy. Processing typically takes 15 calendar days but can take up to 30-45 days. Norway has strict assessment for Pakistani applicants — thorough financial documentation and strong ties to Pakistan are essential. Key requirements include passport (3+ months validity), travel insurance (EUR 30,000), comprehensive accommodation proof, and proof of sufficient funds (NOK 500/day recommended). Norway is one of the most expensive countries, so financial evidence must be particularly strong. Interview may be required. The Norwegian Embassy in Islamabad handles visa processing. Multiple-entry visas are possible for applicants with established travel history.',
      maxDuration: '90 days within 180-day period',
      extensions: false,
      multipleEntry: false,
      processingDaysMin: 15,
      processingDaysMax: 30,
      sourceUrl: 'https://www.udi.no/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 3 months beyond stay', mandatory: true, description: 'With blank pages, issued within last 10 years.' },
        { category: 'photograph', requirement: 'Biometric photos (2, 35x45mm)', mandatory: true, description: 'Norwegian/Schengen specifications.' },
        { category: 'insurance', requirement: 'Travel insurance EUR 30,000 coverage', mandatory: true, description: 'Must cover Schengen area and entire stay.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Reserved flights showing entry and exit dates.' },
        { category: 'accommodation', requirement: 'Hotel reservation or invitation from Norwegian host', mandatory: true, description: 'Hotel bookings for all nights OR invitation letter from Norwegian resident with their ID and proof of address.' },
        { category: 'financial', requirement: 'Bank statements (6 months) + proof of sufficient funds (NOK 500/day)', mandatory: true, description: 'Norway is expensive. Recommended NOK 500/day (approx. USD 50/day). Strong bank statements essential.' },
        { category: 'employment', requirement: 'Employment letter + leave approval + cover letter', mandatory: true, description: 'Establishing strong ties to Pakistan is crucial for Norwegian applications.' },
        { category: 'financial', requirement: 'FBR tax returns + property documents', mandatory: false, description: 'Additional financial evidence strongly recommended for Norway.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 35, currency: 'NOK', visaFeeLocal: 950, visaFeeLocalLabel: 'EUR 80 + VFS ~EUR 30' },
    },
    {
      type: 'Student Visa',
      description: 'The Norway Student Visa (Residence Permit for Higher Education) allows Pakistani students to study at Norwegian universities and colleges. Norway offers tuition-free education at public universities for all students regardless of nationality — a major attraction. However, living costs are very high (approximately NOK 13,000/month or USD 1,200/month). The process: (1) Get admission from a Norwegian institution, (2) Apply online at UDI (Norwegian Directorate of Immigration), (3) Submit documents and biometrics at the Norwegian Embassy or VFS, (4) Receive the residence permit decision. Key requirements: proof of enrollment, proof of funds (NOK 151,690/year for 2024 — the subsistence requirement set by UDI), health insurance, and accommodation proof. Students must demonstrate they can support themselves without working. Part-time work (up to 20 hours/week) is allowed during term. After completing studies, a job seeker permit (1 year) is available. Norway offers programs in English, especially at Masters and PhD level.',
      maxDuration: '1 year (renewable for program duration)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 30,
      processingDaysMax: 60,
      sourceUrl: 'https://www.udi.no/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport for entire study period', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'Norwegian visa specifications.' },
        { category: 'employment', requirement: 'Admission letter from Norwegian institution', mandatory: true, description: 'From a recognized Norwegian university or college. Must be full-time.' },
        { category: 'financial', requirement: 'Proof of funds: NOK 151,690/year (2024 subsistence requirement)', mandatory: true, description: 'Bank statements or Norwegian bank guarantee letter. This is a strict UDI requirement. Must be in a Norwegian bank or documented in a way UDI accepts.' },
        { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'If from a country without reciprocal healthcare agreement with Norway (Pakistan), private insurance for first 3 months, then register with Norwegian National Insurance.' },
        { category: 'accommodation', requirement: 'Accommodation proof (student housing or rental)', mandatory: true, description: 'Student housing (Sammen) or private rental contract in Norway.' },
        { category: 'employment', requirement: 'Previous educational certificates and transcripts', mandatory: true, description: 'Previous qualifications. May need credential evaluation.' },
        { category: 'employment', requirement: 'English language proficiency (IELTS/TOEFL)', mandatory: true, description: 'For English-taught programs. Minimum varies by institution (typically IELTS 6.0-6.5).' },
      ],
      cost: { visaFeeUSD: 350, serviceFeeUSD: 35, currency: 'NOK', visaFeeLocal: 3700, visaFeeLocalLabel: 'NOK 3,700 (residence permit application)' },
    },
  ],

  'Sweden': [
    {
      type: 'Schengen Tourist Visa',
      description: 'The Sweden Schengen Visa allows Pakistani citizens to visit Sweden and the Schengen Area for tourism, business, visiting family, or short-term study (up to 90 days in 180 days). Applications are submitted through VFS Global in Islamabad or Karachi. The Swedish Migration Agency (Migrationsverket) processes applications. Processing typically takes 15 calendar days but can extend to 30-45 days. Sweden has detailed requirements and may request interviews for Pakistani applicants. Key requirements include passport (3+ months validity), travel insurance (EUR 30,000), accommodation proof, round-trip flights, and proof of sufficient funds (SEK 500/day or SEK 370/day if staying with host). Sweden is known for thorough document verification. For visiting family in Sweden, a formal invitation with the host\'s financial guarantee and a copy of their passport/personnummer is required. Multiple-entry visas may be issued to those with prior compliant travel history.',
      maxDuration: '90 days within 180-day period',
      extensions: false,
      multipleEntry: false,
      processingDaysMin: 15,
      processingDaysMax: 30,
      sourceUrl: 'https://www.swedenabroad.se/',
      requirements: [
        { category: 'passport', requirement: 'Passport valid 3 months beyond stay', mandatory: true, description: 'With blank pages, issued within last 10 years.' },
        { category: 'photograph', requirement: 'Biometric photos (2, 35x45mm)', mandatory: true, description: 'Schengen/Swedish specifications.' },
        { category: 'insurance', requirement: 'Travel insurance EUR 30,000 coverage', mandatory: true, description: 'Must cover Schengen area and entire stay.' },
        { category: 'travel', requirement: 'Round-trip flight itinerary', mandatory: true, description: 'Reserved flights.' },
        { category: 'accommodation', requirement: 'Hotel booking or invitation from Swedish host with financial guarantee', mandatory: true, description: 'Hotel bookings OR an Invitation form (inbjudan) from the Swedish host with their personnummer, copy of passport, and maintenance undertaking.' },
        { category: 'financial', requirement: 'Bank statements (3-6 months) + proof of sufficient funds (SEK 500/day)', mandatory: true, description: 'SEK 500/day if staying in hotel, SEK 370/day if hosted. Strong bank statements needed.' },
        { category: 'employment', requirement: 'Employment letter + leave approval + cover letter', mandatory: true, description: 'Establishing ties to Pakistan is important.' },
        { category: 'employment', requirement: 'Purpose-specific supporting documents', mandatory: false, description: 'Business: invitation from Swedish company. Tourism: detailed itinerary.' },
      ],
      cost: { visaFeeUSD: 92, serviceFeeUSD: 35, currency: 'SEK', visaFeeLocal: 1000, visaFeeLocalLabel: 'EUR 80 + VFS ~EUR 30' },
    },
    {
      type: 'Student Visa',
      description: 'The Sweden Student Residence Permit allows Pakistani students to study at Swedish universities. Sweden offers tuition-free education at public universities for EU/EEA students, but non-EU students (including Pakistanis) pay tuition fees (typically SEK 80,000-180,000/year depending on the program). However, Sweden offers numerous scholarships for Pakistani students through SI (Swedish Institute) scholarships and university-specific grants. The application is made online at Migrationsverket. Key requirements include proof of admission to a full-time program, proof of funds (SEK 10,566/month for 2024 — the maintenance requirement), health insurance (if under 18 or for the first weeks until Swedish insurance kicks in), and accommodation proof. Students can work unlimited hours during their studies. After graduation, a 6-month job search permit is available. Sweden is known for innovation, sustainability, and a strong startup ecosystem, making it attractive for tech and engineering students.',
      maxDuration: '1 year (renewable for program duration)',
      extensions: true,
      multipleEntry: true,
      processingDaysMin: 30,
      processingDaysMax: 60,
      sourceUrl: 'https://www.swedenabroad.se/',
      requirements: [
        { category: 'passport', requirement: 'Valid passport for entire study period', mandatory: true, description: 'With blank pages.' },
        { category: 'photograph', requirement: 'Passport-size photographs (2)', mandatory: true, description: 'As per Swedish specifications.' },
        { category: 'employment', requirement: 'Admission letter from Swedish university', mandatory: true, description: 'From a recognized Swedish university for a full-time program.' },
        { category: 'financial', requirement: 'Proof of funds: SEK 10,566/month (2024)', mandatory: true, description: 'Bank statements showing SEK 126,792/year. Must be in applicant\'s own account. Swedish bank account or documented foreign account.' },
        { category: 'financial', requirement: 'Tuition fee payment receipt (if applicable)', mandatory: true, description: 'First semester/year tuition payment receipt from the university. Some scholarship holders are exempt.' },
        { category: 'insurance', requirement: 'Health insurance', mandatory: true, description: 'If staying less than 1 year: comprehensive health insurance. If staying 1+ year: register with Swedish social insurance after arrival.' },
        { category: 'accommodation', requirement: 'Accommodation proof', mandatory: true, description: 'Student housing or rental contract. Swedish student housing is competitive — apply early.' },
        { category: 'employment', requirement: 'English language proficiency (IELTS/TOEFL)', mandatory: true, description: 'For English-taught programs. Typically IELTS 6.5 (no band below 5.5) or equivalent.' },
      ],
      cost: { visaFeeUSD: 110, serviceFeeUSD: 35, currency: 'SEK', visaFeeLocal: 1500, visaFeeLocalLabel: 'SEK 1,500 (residence permit fee)' },
    },
  ],
};

async function main() {
  console.log('=== Milestone 2: Visa Knowledge Base Expansion ===');
  console.log(`Verified till: ${VERIFIED_TILL}\n`);

  const countries = Object.keys(MILESTONE_DATA);
  let totalUpdated = 0;
  let totalRequirements = 0;
  let totalCostProfiles = 0;

  for (const countryName of countries) {
    const visaTypesData = MILESTONE_DATA[countryName];
    console.log(`\n--- ${countryName} (${visaTypesData.length} visa types) ---`);

    const country = await db.country.findFirst({ where: { name: countryName } });
    if (!country) {
      console.log(`  ❌ Country not found: ${countryName}`);
      continue;
    }

    for (const vtData of visaTypesData) {
      const existingVT = await db.visaType.findFirst({
        where: { countryId: country.id, type: vtData.type },
      });

      let visaType: { id: string };
      if (existingVT) {
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

      for (const req of vtData.requirements) {
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

  console.log('\n=== MILESTONE 2 COMPLETE ===');
  console.log(`Countries processed: ${countries.length}`);
  console.log(`Visa types enriched: ${totalUpdated}`);
  console.log(`Per-visa-type requirements created: ${totalRequirements}`);
  console.log(`Per-visa-type cost profiles created/updated: ${totalCostProfiles}`);
  console.log(`Verified till: ${VERIFIED_TILL}`);

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
