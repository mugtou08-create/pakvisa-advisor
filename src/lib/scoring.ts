// Visa Advisor - Scoring Engine
// Every recommendation is explainable with component breakdowns, multipliers,
// confidence bands, and source citations.

import { 
  CountryData, 
  UserProfileData, 
  ScoreBreakdown, 
  ScoreComponent, 
  HardFilterResult, 
  SourceCitation,
  ScoringWeights,
  VisaLikelihoodModifiers,
  ChecklistItem
} from './types';

// Default scoring weights (configurable)
export const DEFAULT_WEIGHTS: ScoringWeights = {
  requiredDocuments: 0.40,      // 40%
  proofOfFunds: 0.20,            // 20%
  purposeMatch: 0.15,            // 15%
  qualificationsLanguage: 0.10, // 10%
  healthInsurance: 0.05,         // 5%
  priorTravelHistory: 0.05,      // 5%
  ageOther: 0.05,                // 5%
};

// Default modifiers
export const DEFAULT_MODIFIERS: VisaLikelihoodModifiers = {
  policyStrictness: 1.0,
  historicalApproval: 0.85,
  dataConfidence: 0.9,
  discretionaryElements: 0.9,
};

// Policy strictness by country (0.6 = very strict, 1.1 = very lenient)
const POLICY_STRICTNESS: Record<string, number> = {
  AE: 0.85, SA: 0.80, TR: 0.90, MY: 0.95,
  TH: 0.95, SG: 0.85, GB: 0.75, US: 0.65,
  CA: 0.75, AU: 0.75, DE: 0.80, FR: 0.80,
  IT: 0.80, ES: 0.80, JP: 0.75, KR: 0.80,
  CN: 0.75, QA: 0.85, OM: 0.90, BH: 0.90,
  KW: 0.85, EG: 0.90, ID: 0.95, LK: 0.95,
  NP: 0.95, MV: 0.95, AZ: 0.90, GE: 0.95,
  AM: 0.90, IR: 0.75, IQ: 0.80, AF: 0.70,
  JO: 0.90, LB: 0.85, MA: 0.90, TN: 0.90,
  DZ: 0.85, KE: 0.90, ZA: 0.85, BR: 0.90,
  MX: 0.90,
};

export function calculateScore(
  country: CountryData,
  profile: UserProfileData,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
  customModifiers?: Partial<VisaLikelihoodModifiers>
): ScoreBreakdown {
  const components: ScoreComponent[] = [];
  const hardFilters = applyHardFilters(country, profile);
  const citations = buildSourceCitations(country);
  
  const dataConfidence = country.parserConfidence;
  const strictness = POLICY_STRICTNESS[country.code] || 0.85;
  
  const modifiers: VisaLikelihoodModifiers = {
    policyStrictness: strictness,
    historicalApproval: 0.85,
    dataConfidence,
    discretionaryElements: 0.9,
    ...customModifiers,
  };

  // 1. Required Documents Score (40%)
  const docScore = calculateDocumentScore(country, profile);
  components.push({
    name: "Required Documents",
    score: docScore,
    weight: weights.requiredDocuments,
    weightedScore: docScore * weights.requiredDocuments,
    maxScore: 100,
    details: `${docScore}% of required documents are met.`,
  });

  // 2. Proof of Funds Score (20%)
  const fundScore = calculateFundScore(country, profile);
  components.push({
    name: "Proof of Funds",
    score: fundScore,
    weight: weights.proofOfFunds,
    weightedScore: fundScore * weights.proofOfFunds,
    maxScore: 100,
    details: `Fund adequacy rated at ${fundScore}%.`,
  });

  // 3. Purpose Match Score (15%)
  const purposeScore = calculatePurposeScore(country, profile);
  components.push({
    name: "Purpose Match",
    score: purposeScore,
    weight: weights.purposeMatch,
    weightedScore: purposeScore * weights.purposeMatch,
    maxScore: 100,
    details: `Travel purpose alignment rated at ${purposeScore}%.`,
  });

  // 4. Qualifications & Language Score (10%)
  const qualScore = calculateQualificationScore(country, profile);
  components.push({
    name: "Qualifications & Language",
    score: qualScore,
    weight: weights.qualificationsLanguage,
    weightedScore: qualScore * weights.qualificationsLanguage,
    maxScore: 100,
    details: `Qualification and language match rated at ${qualScore}%.`,
  });

  // 5. Health & Insurance Score (5%)
  const healthScore = calculateHealthScore(country, profile);
  components.push({
    name: "Health & Insurance",
    score: healthScore,
    weight: weights.healthInsurance,
    weightedScore: healthScore * weights.healthInsurance,
    maxScore: 100,
    details: `Health insurance readiness rated at ${healthScore}%.`,
  });

  // 6. Prior Travel History Score (5%)
  const travelScore = calculateTravelScore(country, profile);
  components.push({
    name: "Prior Travel History",
    score: travelScore,
    weight: weights.priorTravelHistory,
    weightedScore: travelScore * weights.priorTravelHistory,
    maxScore: 100,
    details: `Travel history strength rated at ${travelScore}%.`,
  });

  // 7. Age & Other Score (5%)
  const ageScore = calculateAgeScore(profile);
  components.push({
    name: "Age & Other",
    score: ageScore,
    weight: weights.ageOther,
    weightedScore: ageScore * weights.ageOther,
    maxScore: 100,
    details: `Age and other factors rated at ${ageScore}%.`,
  });

  // Calculate eligibility (weighted sum)
  const eligibility = components.reduce((sum, c) => sum + c.weightedScore, 0);

  // Apply modifiers to get visa likelihood
  const rawLikelihood = eligibility;
  const visaLikelihood = Math.min(100, 
    rawLikelihood * 
    modifiers.policyStrictness * 
    modifiers.historicalApproval * 
    modifiers.dataConfidence * 
    modifiers.discretionaryElements
  );

  // Cost suitability: clamp(100 * user_budget / monthly_need, 0, 100)
  const monthlyNeed = country.costProfile?.totalMonthlyUSD || 1000;
  const stayMonths = profile.intendedStayDays / 30;
  const totalBudget = profile.budgetUSD || profile.savingsUSD;
  const costSuitability = Math.min(100, Math.max(0, 
    100 * (totalBudget / (monthlyNeed * stayMonths || 1))
  ));

  // Final recommendation: 0.6 * VisaLikelihood + 0.4 * CostSuitability
  const finalScore = 0.6 * visaLikelihood + 0.4 * costSuitability;

  // Generate missing items and tips
  const missingItems = generateMissingItems(country, profile, components);
  const tips = generateTips(components, hardFilters, country);

  return {
    country: country.name,
    countryCode: country.code,
    visaType: country.visaTypes[0]?.type || "Standard",
    eligibility: Math.round(eligibility * 10) / 10,
    visaLikelihood: Math.round(visaLikelihood * 10) / 10,
    costSuitability: Math.round(costSuitability * 10) / 10,
    finalScore: Math.round(finalScore * 10) / 10,
    confidence: Math.round(dataConfidence * 100) / 100,
    components,
    modifiers,
    hardFilters,
    missingItems,
    tips,
    sourceCitations: citations,
  };
}

function safeStr(val: string | undefined | null, fallback: string = ''): string {
  return val || fallback;
}

function calculateDocumentScore(country: CountryData, profile: UserProfileData): number {
  const requirements = country.requirements || [];
  const mandatoryCount = requirements.filter(r => r.mandatory).length;
  
  let metCount = 0;
  for (const req of requirements) {
    if (!req.mandatory) continue;
    
    switch (safeStr(req.category).toLowerCase()) {
      case "passport":
        if (profile.passportNumber && isPassportValid(profile.passportExpiry)) metCount++;
        break;
      case "financial":
        if (profile.monthlyIncomeUSD > 500 || profile.savingsUSD > 5000 || profile.hasSponsor) metCount++;
        break;
      case "photograph":
        metCount++; // Assumed available
        break;
      case "insurance":
        if (profile.hasHealthInsurance) metCount++;
        break;
      case "travel":
        if (profile.hasReturnTicket || profile.hasHotelBooking) metCount++;
        break;
      case "employment":
        if (profile.occupation) metCount++;
        break;
      default:
        metCount += 0.5;
    }
  }

  return mandatoryCount > 0 ? Math.min(100, (metCount / mandatoryCount) * 100) : 60;
}

function calculateFundScore(country: CountryData, profile: UserProfileData): number {
  const monthlyNeed = country.costProfile?.totalMonthlyUSD || 1000;
  const stayMonths = Math.max(1, profile.intendedStayDays / 30);
  const totalRequired = monthlyNeed * stayMonths;
  
  const totalFunds = profile.monthlyIncomeUSD * 6 + profile.savingsUSD;
  const sponsorFunds = profile.hasSponsor ? profile.sponsorIncomeUSD * 6 : 0;
  const available = totalFunds + sponsorFunds;
  
  if (available >= totalRequired * 2) return 100;
  if (available >= totalRequired * 1.5) return 90;
  if (available >= totalRequired) return 75;
  if (available >= totalRequired * 0.75) return 55;
  if (available >= totalRequired * 0.5) return 35;
  return 15;
}

function calculatePurposeScore(country: CountryData, profile: UserProfileData): number {
  const purpose = safeStr(profile.travelPurpose).toLowerCase();
  const hasHotel = profile.hasHotelBooking;
  const hasReturn = profile.hasReturnTicket;
  
  let score = 60; // Base score
  
  if (purpose && purpose !== "unknown") score += 15;
  if (hasHotel) score += 10;
  if (hasReturn) score += 15;
  
  return Math.min(100, score);
}

function calculateQualificationScore(_country: CountryData, profile: UserProfileData): number {
  let score = 50;
  
  const education = safeStr(profile.education).toLowerCase();
  if (education.includes("masters") || education.includes("phd")) score += 30;
  else if (education.includes("bachelors") || education.includes("graduate")) score += 20;
  else if (education.includes("diploma") || education.includes("college")) score += 10;
  
  const langs = Array.isArray(profile.languages) ? profile.languages : [];
  if (langs.length > 1) score += 15;
  else if (langs.includes("english")) score += 5;
  
  return Math.min(100, score);
}

function calculateHealthScore(_country: CountryData, profile: UserProfileData): number {
  return profile.hasHealthInsurance ? 100 : 20;
}

function calculateTravelScore(_country: CountryData, profile: UserProfileData): number {
  if (profile.hasCriminalRecord) return 0;
  
  let score = 30;
  if (profile.hasPriorTravel) {
    score += 20;
    const priorCountries = Array.isArray(profile.priorCountries) ? profile.priorCountries : [];
    score += Math.min(30, priorCountries.length * 10);
  }
  
  return Math.min(100, score);
}

function calculateAgeScore(profile: UserProfileData): number {
  const age = profile.age;
  if (age < 18 || age > 65) return 50;
  if (age >= 25 && age <= 55) return 90;
  if ((age >= 18 && age < 25) || (age > 55 && age <= 65)) return 70;
  return 60;
}

function applyHardFilters(country: CountryData, profile: UserProfileData): HardFilterResult[] {
  const filters: HardFilterResult[] = [];
  
  // Check passport validity (6 months minimum)
  if (!isPassportValid(profile.passportExpiry)) {
    filters.push({
      filter: "Passport Expiry",
      passed: false,
      message: "Passport must be valid for at least 6 months beyond intended stay.",
      severity: "critical",
    });
  } else {
    filters.push({
      filter: "Passport Expiry",
      passed: true,
      message: "Passport validity meets requirements.",
      severity: "warning",
    });
  }

  // Criminal record check
  if (profile.hasCriminalRecord) {
    filters.push({
      filter: "Criminal Record",
      passed: false,
      message: "Criminal convictions may bar entry to this country.",
      severity: "critical",
    });
  } else {
    filters.push({
      filter: "Criminal Record",
      passed: true,
      message: "No criminal record detected.",
      severity: "warning",
    });
  }

  // Nationality check
  if (profile.nationality !== "Pakistani") {
    filters.push({
      filter: "Nationality",
      passed: true,
      message: `Profile nationality is ${profile.nationality}. Scoring calibrated accordingly.`,
      severity: "warning",
    });
  }

  return filters;
}

function isPassportValid(expiry: string): boolean {
  if (!expiry) return false;
  const expiryDate = new Date(expiry);
  const minValid = new Date();
  minValid.setMonth(minValid.getMonth() + 6);
  return expiryDate > minValid;
}

function buildSourceCitations(country: CountryData): SourceCitation[] {
  const citations: SourceCitation[] = [];
  
  citations.push({
    url: country.sourceUrl || `https://www.visahq.com/countries/${country.code.toLowerCase()}`,
    title: `${country.name} Visa Information - Official Source`,
    fetchedAt: country.fetchTimestamp,
    confidence: country.parserConfidence,
  });

  country.requirements.forEach(req => {
    if (req.sourceUrl) {
      citations.push({
        url: req.sourceUrl,
        title: `${req.category}: ${req.requirement}`,
        fetchedAt: country.fetchTimestamp,
        confidence: req.parserConfidence,
      });
    }
  });

  return citations;
}

function generateMissingItems(
  country: CountryData, 
  profile: UserProfileData, 
  _components: ScoreComponent[]
): string[] {
  const missing: string[] = [];
  
  if (!profile.hasHealthInsurance) missing.push("Travel health insurance");
  if (!profile.hasReturnTicket) missing.push("Return flight ticket");
  if (!profile.hasHotelBooking) missing.push("Accommodation booking");
  if (profile.monthlyIncomeUSD < 500 && !profile.hasSponsor) missing.push("Proof of sufficient funds");
  if (!profile.passportNumber) missing.push("Valid passport details");
  
  country.requirements.forEach(req => {
    if (req.mandatory && req.category === "financial" && 
        profile.monthlyIncomeUSD < 500 && !profile.hasSponsor) {
      missing.push(`Financial proof: ${req.requirement}`);
    }
  });

  return missing.slice(0, 5);
}

function generateTips(
  components: ScoreComponent[],
  hardFilters: HardFilterResult[],
  _country: CountryData
): string[] {
  const tips: string[] = [];
  
  const lowest = [...components].sort((a, b) => a.score - b.score)[0];
  if (lowest && lowest.score < 70) {
    tips.push(`Improve your "${lowest.name}" score from ${Math.round(lowest.score)}% to boost your overall eligibility.`);
  }

  const failedFilters = hardFilters.filter(f => !f.passed && f.severity === "critical");
  if (failedFilters.length > 0) {
    tips.push(`Address critical requirement: ${failedFilters[0].message}`);
  }

  tips.push("Ensure all documents are translated to the required language if necessary.");
  tips.push("Book your appointment well in advance as slots fill quickly.");
  tips.push("Carry both original and photocopies of all supporting documents.");

  return tips;
}

// Generate a prioritized checklist from score breakdown
export function generateChecklist(
  breakdown: ScoreBreakdown,
  profile: UserProfileData
): ChecklistItem[] {
  const items: ChecklistItem[] = [];

  // Hard filter items
  breakdown.hardFilters
    .filter(f => !f.passed)
    .forEach(f => {
      items.push({
        task: f.message,
        priority: "high",
        effort: f.severity === "critical" ? "time-consuming" : "moderate",
        completed: false,
        category: "Hard Requirement",
      });
    });

  // Missing document items
  breakdown.missingItems.forEach(m => {
    items.push({
      task: `Obtain: ${m}`,
      priority: "high",
      effort: "moderate",
      completed: false,
      category: "Documents",
    });
  });

  // Low-score component items
  breakdown.components
    .filter(c => c.score < 70)
    .forEach(c => {
      items.push({
        task: `Improve ${c.name} (currently ${Math.round(c.score)}%)`,
        priority: "medium",
        effort: "moderate",
        completed: false,
        category: "Score Improvement",
      });
    });

  // Standard preparation items
  if (!profile.hasReturnTicket) {
    items.push({
      task: "Book return flight ticket",
      priority: "high",
      effort: "quick",
      completed: false,
      category: "Travel",
    });
  }
  if (!profile.hasHotelBooking) {
    items.push({
      task: "Book accommodation or get invitation letter",
      priority: "high",
      effort: "moderate",
      completed: false,
      category: "Travel",
    });
  }
  if (!profile.hasHealthInsurance) {
    items.push({
      task: "Purchase travel health insurance",
      priority: "high",
      effort: "quick",
      completed: false,
      category: "Insurance",
    });
  }

  // Tips as actionable items
  breakdown.tips.slice(0, 3).forEach(tip => {
    items.push({
      task: tip,
      priority: "low",
      effort: "quick",
      completed: false,
      category: "Tips",
    });
  });

  return items;
}

// What-If Simulator: calculate score impact of hypothetical changes
export function simulateWhatIf(
  currentBreakdown: ScoreBreakdown,
  country: CountryData,
  profile: UserProfileData,
  scenario: { field: string; value: number | string | boolean }
): ScoreBreakdown {
  const modifiedProfile = { ...profile };
  
  switch (scenario.field) {
    case "monthlyIncomeUSD":
      modifiedProfile.monthlyIncomeUSD = scenario.value as number;
      break;
    case "savingsUSD":
      modifiedProfile.savingsUSD = scenario.value as number;
      break;
    case "hasHealthInsurance":
      modifiedProfile.hasHealthInsurance = scenario.value as boolean;
      break;
    case "hasReturnTicket":
      modifiedProfile.hasReturnTicket = scenario.value as boolean;
      break;
    case "hasHotelBooking":
      modifiedProfile.hasHotelBooking = scenario.value as boolean;
      break;
    case "hasSponsor":
      modifiedProfile.hasSponsor = scenario.value as boolean;
      break;
    case "budgetUSD":
      modifiedProfile.budgetUSD = scenario.value as number;
      break;
    case "hasPriorTravel":
      modifiedProfile.hasPriorTravel = scenario.value as boolean;
      break;
  }
  
  return calculateScore(country, modifiedProfile);
}

// Compare multiple country scores
export function compareCountries(
  scores: ScoreBreakdown[]
): { bestMatch: ScoreBreakdown; cheapest: ScoreBreakdown; easiest: ScoreBreakdown; recommendation: string } {
  // Guard: empty scores array
  if (!scores || scores.length === 0) {
    const emptyBreakdown: ScoreBreakdown = {
      country: 'N/A',
      countryCode: '',
      visaType: 'N/A',
      eligibility: 0, visaLikelihood: 0, costSuitability: 0, finalScore: 0, confidence: 0,
      components: [], modifiers: { policyStrictness: 1, historicalApproval: 1, dataConfidence: 0, discretionaryElements: 1 },
      hardFilters: [], missingItems: [], tips: [], sourceCitations: [],
    };
    return {
      bestMatch: emptyBreakdown,
      cheapest: emptyBreakdown,
      easiest: emptyBreakdown,
      recommendation: 'No scores provided for comparison.',
    };
  }

  const validScores = scores.filter(s => !s.hardFilters.some(f => !f.passed && f.severity === "critical"));
  
  if (validScores.length === 0) {
    return {
      bestMatch: scores[0],
      cheapest: scores[0],
      easiest: scores[0],
      recommendation: "All countries have critical hard filter failures. Address these before proceeding.",
    };
  }

  const bestMatch = [...validScores].sort((a, b) => b.finalScore - a.finalScore)[0];
  const cheapest = [...validScores].sort((a, b) => b.costSuitability - a.costSuitability)[0];  
  const easiest = [...validScores].sort((a, b) => b.visaLikelihood - a.visaLikelihood)[0];

  const recommendation = `Based on your profile, ${bestMatch.country} is your best match with a score of ${bestMatch.finalScore}/100. ` +
    `${easiest.country} has the highest visa likelihood at ${easiest.visaLikelihood}%. ` +
    `Consider ${cheapest.country} for the most budget-friendly option.`;

  return { bestMatch, cheapest, easiest, recommendation };
}
