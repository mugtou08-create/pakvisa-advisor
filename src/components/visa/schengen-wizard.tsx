'use client';

import React, { useState, useMemo } from 'react';
import {
  Plane,
  Briefcase,
  GraduationCap,
  Users,
  ChevronRight,
  ChevronLeft,
  Check,
  FileText,
  Shield,
  DollarSign,
  Lightbulb,
  AlertTriangle,
  ExternalLink,
  Camera,
  CreditCard,
  Hotel,
  Mail,
  Heart,
  UserCheck,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ============================================================
// Types & Data
// ============================================================

type TravelPurpose = 'Tourism' | 'Business' | 'Study' | 'Family Visit';
type Duration = '<15 days' | '15-30 days' | '>30 days';
type EmploymentStatus = 'Employed' | 'Self-Employed' | 'Student' | 'Retired';
type IncomeRange = 'Under PKR 50K' | 'PKR 50K-100K' | 'PKR 100K-300K' | 'PKR 300K-500K' | 'Over PKR 500K';

type WizardData = {
  purpose: TravelPurpose | null;
  duration: Duration | null;
  visitedBefore: boolean | null;
  employment: EmploymentStatus | null;
  income: IncomeRange | null;
  hasInsurance: boolean | null;
  hasBookings: boolean | null;
};

const PURPOSE_OPTIONS: { value: TravelPurpose; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'Tourism', label: 'Tourism', icon: <Plane className="w-5 h-5" />, desc: 'Sightseeing, vacation, leisure travel' },
  { value: 'Business', label: 'Business', icon: <Briefcase className="w-5 h-5" />, desc: 'Meetings, conferences, trade fairs' },
  { value: 'Study', label: 'Study', icon: <GraduationCap className="w-5 h-5" />, desc: 'University, courses, research programs' },
  { value: 'Family Visit', label: 'Family Visit', icon: <Users className="w-5 h-5" />, desc: 'Visiting relatives or friends' },
];

const DURATION_OPTIONS: Duration[] = ['<15 days', '15-30 days', '>30 days'];
const EMPLOYMENT_OPTIONS: EmploymentStatus[] = ['Employed', 'Self-Employed', 'Student', 'Retired'];
const INCOME_OPTIONS: IncomeRange[] = ['Under PKR 50K', 'PKR 50K-100K', 'PKR 100K-300K', 'PKR 300K-500K', 'Over PKR 500K'];

// Recommended country by purpose
function getRecommendedCountry(purpose: TravelPurpose): { country: string; reason: string } {
  switch (purpose) {
    case 'Tourism':
      return { country: 'France', reason: 'France is the top tourism destination in the Schengen area. The French embassy in Islamabad processes a high volume of tourist visas and has established procedures for Pakistani applicants.' };
    case 'Business':
      return { country: 'Germany', reason: 'Germany is the largest economy in the EU with extensive business ties to Pakistan. The German embassy has well-defined business visa procedures and faster processing for legitimate business travelers.' };
    case 'Study':
      return { country: 'Germany', reason: 'Germany offers tuition-free or low-cost education at public universities and has the most student-friendly visa process among Schengen countries for Pakistani applicants.' };
    case 'Family Visit':
      return { country: 'Italy', reason: 'Italy has a significant Pakistani diaspora and the Italian embassy processes family visit visas with relatively straightforward documentation requirements for visiting family members.' };
  }
}

// Document checklist based on purpose
function getDocumentChecklist(data: WizardData): { id: string; label: string; required: boolean; note?: string }[] {
  const docs = [
    { id: 'passport', label: 'Valid passport (6+ months validity, 2+ blank pages)', required: true },
    { id: 'photos', label: '2 passport-sized photos (35x45mm, white background)', required: true },
    { id: 'form', label: 'Completed Schengen visa application form', required: true },
    { id: 'bank', label: 'Bank statements (last 6 months)', required: true },
    { id: 'insurance', label: 'Travel insurance (€30,000+ coverage, Schengen-wide)', required: true, note: data.hasInsurance ? 'You confirmed having insurance — great!' : 'Mandatory! You cannot get a visa without this.' },
    { id: 'flight', label: 'Round-trip flight booking / itinerary', required: true, note: data.hasBookings ? 'You confirmed having bookings — great!' : 'Book refundable flights or get a flight itinerary.' },
    { id: 'hotel', label: 'Hotel reservation for entire stay', required: true, note: data.hasBookings ? 'You confirmed having bookings — great!' : 'Book refundable hotels or get an invitation letter.' },
    { id: 'cover', label: 'Cover letter explaining purpose of visit', required: true },
    { id: 'employment', label: 'Employment letter / NOC from employer', required: data.employment === 'Employed' || data.employment === 'Self-Employed' },
    { id: 'business', label: 'Business registration documents (SECP)', required: data.employment === 'Self-Employed' },
    { id: 'student', label: 'Admission letter / enrollment proof', required: data.purpose === 'Study' || data.employment === 'Student' },
    { id: 'invitation', label: 'Invitation letter from host / family member', required: data.purpose === 'Family Visit' || data.purpose === 'Business' },
    { id: 'tax', label: 'Tax returns (last 2 years)', required: data.employment === 'Employed' || data.employment === 'Self-Employed' },
    { id: 'medical', label: 'Medical fitness certificate', required: false, note: 'Sometimes requested by certain embassies' },
    { id: 'police', label: 'Police clearance certificate', required: false, note: 'May be requested for long-stay visas' },
    { id: 'salary', label: 'Salary slips (last 3 months)', required: data.employment === 'Employed' },
    { id: 'retirement', label: 'Pension / retirement proof', required: data.employment === 'Retired' },
  ];
  return docs;
}

// Cost breakdown in PKR (approximate)
function getCostBreakdown(data: WizardData) {
  const EUR_TO_PKR = 305;
  const visaFeeEur = 80;
  const visaServiceCharge = 3500; // VFS Global service fee
  const insuranceCost = data.duration === '<15 days' ? 2500 : data.duration === '15-30 days' ? 4000 : 6000;
  const photos = 800;
  const travelToEmbassy = 3000; // avg transport cost to Islamabad
  const courier = 1500;
  const translation = 2000;
  const total = visaFeeEur * EUR_TO_PKR + visaServiceCharge + insuranceCost + photos + travelToEmbassy + courier + translation;
  return [
    { item: 'Visa Application Fee', detail: `€${visaFeeEur}`, amount: visaFeeEur * EUR_TO_PKR },
    { item: 'VFS Service Charge', detail: 'Standard processing', amount: visaServiceCharge },
    { item: 'Travel Insurance', detail: data.duration || '15-30 days', amount: insuranceCost },
    { item: 'Passport Photos', detail: '4 copies', amount: photos },
    { item: 'Transport to Embassy', detail: 'Round trip', amount: travelToEmbassy },
    { item: 'Courier / Courier return', detail: 'TCS / DHL', amount: courier },
    { item: 'Document Translation', detail: 'If needed', amount: translation },
    { item: 'ESTIMATED TOTAL', detail: '', amount: total },
  ];
}

// Tips for Pakistani applicants
const PAK_TIPS = [
  'Apply at least 4-6 weeks before your planned travel date.',
  'Schedule your VFS Global appointment well in advance — slots fill up quickly during peak seasons (June-August, December).',
  'Ensure your bank statement shows consistent deposits, not just a sudden lump sum.',
  'If self-employed, bring your NTN certificate, SECP registration, and business bank statements.',
  'Dress professionally for your biometrics appointment at VFS.',
  'Bring original + 2 photocopies of every document.',
  'For family visit visas, the invitation letter should include the host\'s residence permit copy.',
  'Mobile phones are not allowed inside VFS Global — leave them at home or in a locker.',
  'Students should bring a No Objection Certificate (NOC) from their educational institution.',
  'Previous Schengen visa stamps in your passport significantly improve approval chances.',
];

// ============================================================
// Component
// ============================================================

export function SchengenWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    purpose: null,
    duration: null,
    visitedBefore: null,
    employment: null,
    income: null,
    hasInsurance: null,
    hasBookings: null,
  });
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const updateData = (partial: Partial<WizardData>) => setData((prev) => ({ ...prev, ...partial }));

  const canProceedStep1 = data.purpose && data.duration && data.visitedBefore !== null;
  const canProceedStep2 = data.employment && data.income && data.hasInsurance !== null && data.hasBookings !== null;

  const recommendation = useMemo(() => (data.purpose ? getRecommendedCountry(data.purpose) : null), [data.purpose]);
  const checklist = useMemo(() => getDocumentChecklist(data), [data]);
  const costs = useMemo(() => getCostBreakdown(data), [data]);

  const toggleDoc = (id: string) => setCheckedDocs((prev) => ({ ...prev, [id]: !prev[id] }));
  const checkedCount = Object.values(checkedDocs).filter(Boolean).length;

  const STEPS = [
    { num: 1, label: 'Travel Details' },
    { num: 2, label: 'Personal Info' },
    { num: 3, label: 'Results' },
  ];

  return (
    <div className="space-y-4">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.num}>
            <button
              onClick={() => {
                if (s.num < step) setStep(s.num);
              }}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                s.num === step
                  ? 'bg-emerald-600 text-white'
                  : s.num < step
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  s.num === step
                    ? 'bg-white/20 text-white'
                    : s.num < step
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted-foreground/20 text-muted-foreground'
                }`}
              >
                {s.num < step ? <Check className="w-3.5 h-3.5" /> : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-6 sm:w-12 rounded ${s.num < step ? 'bg-emerald-500' : 'bg-muted'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Travel Details */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Travel Purpose</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PURPOSE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateData({ purpose: opt.value })}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all hover:border-emerald-400 ${
                      data.purpose === opt.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className={`mt-0.5 rounded-md p-2 ${
                        data.purpose === opt.value ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {opt.icon}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Planned Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => updateData({ duration: d })}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      data.duration === d
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Previous Schengen Travel</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Have you visited any Schengen country before?</p>
              <div className="flex gap-3">
                <button
                  onClick={() => updateData({ visitedBefore: true })}
                  className={`flex-1 rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
                    data.visitedBefore === true
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
                  Yes
                </button>
                <button
                  onClick={() => updateData({ visitedBefore: false })}
                  className={`flex-1 rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
                    data.visitedBefore === false
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Plane className="w-5 h-5 mx-auto mb-1" />
                  No, First Time
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Personal & Financial Info */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Employment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EMPLOYMENT_OPTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => updateData({ employment: e })}
                    className={`rounded-lg border p-3 text-center text-sm font-medium transition-colors ${
                      data.employment === e
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Income Range</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={data.income || ''} onValueChange={(v) => updateData({ income: v as IncomeRange })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your monthly income range" />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_OPTIONS.map((inc) => (
                    <SelectItem key={inc} value={inc}>{inc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                This helps determine financial document requirements for your visa application.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Travel Preparation Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium">Travel Insurance</div>
                    <div className="text-xs text-muted-foreground">€30,000+ coverage required</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateData({ hasInsurance: true })}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      data.hasInsurance === true
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => updateData({ hasInsurance: false })}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      data.hasInsurance === false
                        ? 'bg-amber-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Plane className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium">Hotel & Flight Bookings</div>
                    <div className="text-xs text-muted-foreground">Confirmed or tentative reservations</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateData({ hasBookings: true })}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      data.hasBookings === true
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => updateData({ hasBookings: false })}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      data.hasBookings === false
                        ? 'bg-amber-600 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              View Results <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && recommendation && (
        <div className="space-y-4">
          {/* Recommended Country */}
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base">Recommended Country to Apply</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-emerald-600 text-white text-base px-4 py-1.5">{recommendation.country}</Badge>
                <Badge variant="outline" className="text-xs">for {data.purpose}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
              {data.visitedBefore && (
                <div className="mt-2 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  Previous Schengen travel strengthens your application
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Checklist */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-base">Document Checklist</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {checkedCount}/{checklist.filter((d) => d.required).length} required
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {checklist.map((doc) => (
                  <label
                    key={doc.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      checkedDocs[doc.id]
                        ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                        : 'border-border hover:bg-muted/30'
                    }`}
                  >
                    <Checkbox
                      checked={checkedDocs[doc.id] || false}
                      onCheckedChange={() => toggleDoc(doc.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {doc.label}
                        {doc.required ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-red-500 border-red-300 dark:border-red-800">
                            Required
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300 dark:border-amber-800">
                            Optional
                          </Badge>
                        )}
                      </div>
                      {doc.note && (
                        <p className="text-xs text-muted-foreground mt-0.5">{doc.note}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base">Estimated Cost Breakdown (PKR)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {costs.map((c, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between py-2 ${
                      i === costs.length - 1 ? 'border-t pt-3 font-bold text-emerald-700 dark:text-emerald-400' : 'text-sm'
                    }`}
                  >
                    <div>
                      <span>{c.item}</span>
                      {c.detail && <span className="text-xs text-muted-foreground ml-2">({c.detail})</span>}
                    </div>
                    <span className={i === costs.length - 1 ? 'text-base' : 'text-muted-foreground'}>
                      PKR {c.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                * Costs are approximate and may vary. Exchange rate used: €1 = PKR 305
              </p>
            </CardContent>
          </Card>

          {/* Tips for Pakistani Applicants */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <CardTitle className="text-base">Tips for Pakistani Applicants</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {PAK_TIPS.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong>Disclaimer:</strong> This tool provides general guidance only and does not guarantee visa approval.
              Visa requirements and fees are subject to change. Always verify with the official embassy or VFS Global
              before submitting your application. PakVisa Advisor is not responsible for any decisions made based on this information.
            </p>
          </div>

          {/* CTA */}
          <a
            href={"/api/go?p=ivisa&c=Schengen&page=/schengen-wizard"}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="block"
          >
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-12 text-base">
              Apply for e-Visa <ExternalLink className="w-4 h-4" />
            </Button>
          </a>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep(1);
                setData({ purpose: null, duration: null, visitedBefore: null, employment: null, income: null, hasInsurance: null, hasBookings: null });
                setCheckedDocs({});
              }}
              className="gap-2"
            >
              Start Over
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
