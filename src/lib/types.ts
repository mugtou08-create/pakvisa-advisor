// Visa Advisor - Core Type Definitions

export interface CountryData {
  id: string;
  code: string;
  name: string;
  flagEmoji: string;
  flagUrl: string;
  continent: string;
  currency: string;
  currencyCode: string;
  timezone: string;
  visaFree: boolean;
  visaOnArrival: boolean;
  etaAvailable: boolean;
  safetyRating: number;
  safetySummary: string;
  bestTravelMonths: string;
  avgTempC: string;
  monthlyTemps: Record<string, number>;
  processingDaysMin: number;
  processingDaysMax: number;
  sourceUrl: string;
  fetchTimestamp: string;
  fetchHash: string;
  parserVersion: string;
  parserConfidence: number;
  visaTypes: VisaTypeData[];
  costProfile: CostProfileData | null;
  requirements: VisaRequirementData[];
  createdAt?: string;
}

export interface VisaTypeData {
  id: string;
  type: string;
  description: string;
  maxDuration: string;
  extensions: boolean;
  multipleEntry: boolean;
  processingDaysMin: number;
  processingDaysMax: number;
  sourceUrl: string;
  verifiedTill: string;
  parserConfidence: number;
  // Per-visa-type nested data (populated from API)
  costProfile?: VisaTypeCostData | null;
  requirements?: VisaRequirementData[];
}

export interface VisaTypeCostData {
  id: string;
  visaFeeUSD: number;
  serviceFeeUSD: number;
  processingDaysMin: number;
  processingDaysMax: number;
  totalMonthlyUSD: number;
  currency: string;
  verifiedTill: string;
}

export interface VisaRequirementData {
  id: string;
  category: string;
  requirement: string;
  mandatory: boolean;
  description: string;
  scoringWeight: number;
  sourceUrl: string;
  parserConfidence: number;
  needsReview: boolean;
}

export interface CostProfileData {
  id: string;
  visaFeeUSD: number;
  serviceFeeUSD: number;
  processingDays: number;
  monthlyLivingUSD: number;
  monthlyRentUSD: number;
  monthlyFoodUSD: number;
  monthlyTransportUSD: number;
  healthInsuranceUSD: number;
  totalMonthlyUSD: number;
  currency: string;
  parserConfidence: number;
}

export interface UserProfileData {
  id?: string;
  fullName: string;
  age: number;
  gender: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  occupation: string;
  monthlyIncomeUSD: number;
  savingsUSD: number;
  education: string;
  languages: string[];
  hasCriminalRecord: boolean;
  hasPriorTravel: boolean;
  priorCountries: string[];
  hasHealthInsurance: boolean;
  hasSponsor: boolean;
  sponsorRelation: string;
  sponsorIncomeUSD: number;
  travelPurpose: string;
  intendedStayDays: number;
  hasReturnTicket: boolean;
  hasHotelBooking: boolean;
  budgetUSD: number;
  maritalStatus: string;
  dependents: number;
  hasSpecialNeeds: boolean;
  additionalNotes: string;
}

export interface ScoringWeights {
  requiredDocuments: number;    // 40%
  proofOfFunds: number;        // 20%
  purposeMatch: number;        // 15%
  qualificationsLanguage: number; // 10%
  healthInsurance: number;     // 5%
  priorTravelHistory: number;  // 5%
  ageOther: number;            // 5%
}

export interface VisaLikelihoodModifiers {
  policyStrictness: number;    // 0.6 - 1.1
  historicalApproval: number;   // 0.6 - 1.0
  dataConfidence: number;      // 0.5 - 1.0
  discretionaryElements: number; // 0.7 - 1.0
}

export interface ScoreBreakdown {
  country: string;
  countryCode: string;
  visaType: string;
  eligibility: number;
  visaLikelihood: number;
  costSuitability: number;
  finalScore: number;
  confidence: number;
  components: ScoreComponent[];
  modifiers: VisaLikelihoodModifiers;
  hardFilters: HardFilterResult[];
  missingItems: string[];
  tips: string[];
  sourceCitations: SourceCitation[];
}

export interface ScoreComponent {
  name: string;
  score: number;
  weight: number;
  weightedScore: number;
  maxScore: number;
  details: string;
}

export interface HardFilterResult {
  filter: string;
  passed: boolean;
  message: string;
  severity: "critical" | "warning";
}

export interface SourceCitation {
  url: string;
  title: string;
  fetchedAt: string;
  confidence: number;
}

export interface QuestionnaireStep {
  id: string;
  title: string;
  description: string;
  fields: QuestionField[];
  condition?: QuestionCondition;
  helpText?: string;
}

export interface QuestionField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "multiselect" | "date" | "boolean" | "radio";
  options?: { value: string; label: string }[];
  required: boolean;
  placeholder?: string;
  helpText?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  scoringWeight?: number;
  scoringCategory?: string;
  hardFilter?: {
    field: string;
    operator: "gt" | "lt" | "eq" | "neq" | "contains";
    value: string | number | boolean;
    message: string;
  };
}

export interface QuestionCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "lt" | "contains" | "in";
  value: string | number | boolean | string[];
}

export interface WhatIfScenario {
  description: string;
  field: string;
  change: "increase" | "decrease" | "set";
  value: number | string | boolean;
  impact: "high" | "medium" | "low";
}

export interface CompareResult {
  countries: ScoreBreakdown[];
  bestMatch: ScoreBreakdown;
  cheapest: ScoreBreakdown;
  easiest: ScoreBreakdown;
  fastest: ScoreBreakdown;
  recommendation: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: SourceCitation[];
  timestamp: string;
}

export interface ChecklistItem {
  task: string;
  priority: "high" | "medium" | "low";
  effort: "quick" | "moderate" | "time-consuming";
  completed: boolean;
  category: string;
  sourceUrl?: string;
  notes?: string;
}

export interface VisaDocChecklistItem {
  id: string;
  name: string;
  category: 'required' | 'recommended';
  checked: boolean;
  note?: string;
}
