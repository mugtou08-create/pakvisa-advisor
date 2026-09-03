'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2, Circle, Clock, Phone, Bell, ArrowRight,
  ChevronDown, ChevronUp, AlertTriangle, Sparkles, Crown,
  Calendar, MessageSquare, Send, Zap, Shield, FileText,
  Plane, MapPin, Users, Milestone, Award, Star, X, Info,
  CheckCircle, Lock, Timer, Globe, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuthStore, isProUser } from '@/lib/auth-store';
import { toast } from 'sonner';
import type { CountryData } from '@/lib/types';

// ============================================================
// Types
// ============================================================
interface TimelineStep {
  id: string;
  title: string;
  description: string;
  typicalDaysMin: number;
  typicalDaysMax: number;
  isCompleted: boolean;
  completedDate?: string;
  dueDate?: string;
  tips: string[];
  requiredDocs?: string[];
}

interface TimelineState {
  countryCode: string;
  countryName: string;
  startDate: string;
  steps: TimelineStep[];
  whatsappNumber: string;
  whatsappVerified: boolean;
  reminderFrequency: 'daily' | '2days' | 'weekly';
  estimatedCompletionDate: string;
}

// ============================================================
// Default timeline templates by visa difficulty
// ============================================================
function getVisaTimelineSteps(country: CountryData | null): TimelineStep[] {
  const isEasy = country?.visaFree || country?.visaOnArrival || country?.etaAvailable;

  if (isEasy) {
    return [
      {
        id: 'check-req', title: 'Check Requirements', description: 'Review visa requirements and eligibility for your destination.',
        typicalDaysMin: 0, typicalDaysMax: 1, isCompleted: false,
        tips: ['Most requirements are listed on our country page', 'e-Visa can often be done entirely online'],
        requiredDocs: ['Valid passport (6+ months)', 'Return ticket proof'],
      },
      {
        id: 'gather-docs', title: 'Gather Documents', description: 'Collect all required documents for your application.',
        typicalDaysMin: 1, typicalDaysMax: 3, isCompleted: false,
        tips: ['Bank statements need to be recent (last 3 months)', 'Passport photos must meet exact specifications'],
        requiredDocs: ['Passport', 'Passport photos', 'Bank statements', 'Travel itinerary'],
      },
      {
        id: 'apply-online', title: 'Apply Online', description: 'Fill out the online visa application form.',
        typicalDaysMin: 0, typicalDaysMax: 1, isCompleted: false,
        tips: ['Double-check all information before submitting', 'Save your application reference number'],
        requiredDocs: ['Completed application form', 'Digital passport photo'],
      },
      {
        id: 'pay-fee', title: 'Pay Visa Fee', description: 'Pay the required visa processing fee.',
        typicalDaysMin: 0, typicalDaysMax: 1, isCompleted: false,
        tips: ['Keep payment receipt for records', 'Some fees are non-refundable'],
        requiredDocs: ['Payment confirmation'],
      },
      {
        id: 'receive-visa', title: 'Receive e-Visa', description: 'Your e-Visa will be sent to your email.',
        typicalDaysMin: 1, typicalDaysMax: 5, isCompleted: false,
        tips: ['Check spam folder if you don\'t see the email', 'Print a copy to carry with you'],
        requiredDocs: ['Printed e-Visa approval'],
      },
      {
        id: 'prepare-travel', title: 'Prepare for Travel', description: 'Book flights, accommodation, and travel insurance.',
        typicalDaysMin: 3, typicalDaysMax: 14, isCompleted: false,
        tips: ['Book flights after visa approval', 'Travel insurance is recommended'],
        requiredDocs: ['Flight booking', 'Hotel reservation', 'Travel insurance'],
      },
    ];
  }

  // Embassy-required visa (harder)
  return [
    {
      id: 'check-req', title: 'Check Requirements', description: 'Review full visa requirements and eligibility criteria.',
      typicalDaysMin: 0, typicalDaysMax: 2, isCompleted: false,
      tips: ['Check our detailed country page for the latest requirements', 'Some requirements vary by visa type'],
      requiredDocs: ['Valid passport (6+ months validity)', 'Previous visas (if any)'],
    },
    {
      id: 'gather-docs', title: 'Gather Documents', description: 'Collect all mandatory and supporting documents.',
      typicalDaysMin: 3, typicalDaysMax: 10, isCompleted: false,
      tips: ['Bank statements must be from last 3-6 months', 'Employment letters must be on company letterhead', 'Get documents translated if required'],
      requiredDocs: ['Passport', 'Passport photos (2-4)', 'Bank statements', 'Employment letter', 'Travel itinerary', 'Hotel booking', 'Travel insurance'],
    },
    {
      id: 'fill-application', title: 'Fill Application Form', description: 'Complete the visa application form online or on paper.',
      typicalDaysMin: 1, typicalDaysMax: 3, isCompleted: false,
      tips: ['Fill form carefully — errors can cause rejection', 'Save your application ID/reference number', 'Some countries require online forms, others paper'],
      requiredDocs: ['Completed visa application form'],
    },
    {
      id: 'book-appointment', title: 'Book Embassy Appointment', description: 'Schedule your visa appointment at the embassy or visa center.',
      typicalDaysMin: 2, typicalDaysMax: 14, isCompleted: false,
      tips: ['Book early — appointment slots fill up fast', 'Some countries use VFS Global or similar centers', 'Check for premium/slot availability options'],
      requiredDocs: ['Appointment confirmation letter'],
    },
    {
      id: 'attend-appointment', title: 'Attend Appointment', description: 'Visit the embassy/visa center with all documents.',
      typicalDaysMin: 1, typicalDaysMax: 1, isCompleted: false,
      tips: ['Arrive 15 minutes early', 'Bring ALL original documents + photocopies', 'Dress formally', 'Answer questions honestly and concisely'],
      requiredDocs: ['All original documents', 'Photocopies of all documents', 'Appointment letter', 'Application fee payment'],
    },
    {
      id: 'biometrics', title: 'Submit Biometrics', description: 'Provide fingerprints and photograph if required.',
      typicalDaysMin: 0, typicalDaysMax: 1, isCompleted: false,
      tips: ['Usually done at the same appointment', 'Some countries waive biometrics for certain visa types'],
      requiredDocs: ['Biometrics confirmation receipt'],
    },
    {
      id: 'wait-decision', title: 'Wait for Decision', description: 'Your application is being processed by the embassy.',
      typicalDaysMin: 7, typicalDaysMax: 30, isCompleted: false,
      tips: ['Do NOT book non-refundable flights during this period', 'Check application status online if available', 'Some embassies may request additional documents'],
      requiredDocs: ['Application tracking number'],
    },
    {
      id: 'collect-passport', title: 'Collect Passport', description: 'Collect your passport with visa from the embassy or center.',
      typicalDaysMin: 1, typicalDaysMax: 3, isCompleted: false,
      tips: ['Check visa details (dates, type, entries) before leaving', 'Report any errors immediately'],
      requiredDocs: ['Collection receipt', 'Original ID'],
    },
    {
      id: 'prepare-travel', title: 'Prepare for Travel', description: 'Book flights, arrange accommodation, and finalize travel plans.',
      typicalDaysMin: 3, typicalDaysMax: 14, isCompleted: false,
      tips: ['Book flights only after visa is confirmed', 'Register with your embassy if staying long-term', 'Check health/vaccination requirements'],
      requiredDocs: ['Flight booking', 'Accommodation proof', 'Travel insurance', 'Currency/cash arrangement'],
    },
  ];
}

// ============================================================
// Props
// ============================================================
interface VisaTimelineTrackerProps {
  countries: CountryData[];
  onClose: () => void;
  isProUser: boolean;
}

// ============================================================
// Component
// ============================================================
export function VisaTimelineTracker({ countries, onClose, isProUser }: VisaTimelineTrackerProps) {
  const { user } = useAuthStore();
  const isPro = isProUser;

  // State
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [timeline, setTimeline] = useState<TimelineState | null>(null);
  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);
  const [whatsappInput, setWhatsappInput] = useState('');
  const [showProGate, setShowProGate] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showBenefits, setShowBenefits] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'whatsapp' | 'benefits'>('benefits');

  // Country data
  const selectedCountryData = useMemo(
    () => countries.find(c => c.code === selectedCountry),
    [countries, selectedCountry]
  );

  // Calculate progress
  const progressPercent = useMemo(() => {
    if (!timeline) return 0;
    const completed = timeline.steps.filter(s => s.isCompleted).length;
    return Math.round((completed / timeline.steps.length) * 100);
  }, [timeline]);

  // Current step (first uncompleted)
  const currentStep = useMemo(() => {
    if (!timeline) return null;
    return timeline.steps.find(s => !s.isCompleted) || null;
  }, [timeline]);

  // Estimated days remaining
  const estimatedDaysRemaining = useMemo(() => {
    if (!timeline) return 0;
    const remaining = timeline.steps.filter(s => !s.isCompleted);
    return remaining.reduce((sum, s) => sum + s.typicalDaysMax, 0);
  }, [timeline]);

  // Initialize timeline when country is selected
  const initializeTimeline = useCallback((code: string) => {
    const country = countries.find(c => c.code === code);
    if (!country) return;
    const steps = getVisaTimelineSteps(country);
    setTimeline({
      countryCode: code,
      countryName: country.name,
      startDate: new Date().toISOString().split('T')[0],
      steps,
      whatsappNumber: '',
      whatsappVerified: false,
      reminderFrequency: '2days',
      estimatedCompletionDate: '',
    });
    setActiveTab('timeline');
  }, [countries]);

  // Toggle step completion
  const toggleStep = (stepId: string) => {
    if (!isPro) {
      window.dispatchEvent(new CustomEvent('open-pricing'));
      return;
    }
    if (!timeline) return;
    setTimeline(prev => {
      if (!prev) return prev;
      const steps = prev.steps.map(s => {
        if (s.id === stepId) {
          return {
            ...s,
            isCompleted: !s.isCompleted,
            completedDate: !s.isCompleted ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return s;
      });
      return { ...prev, steps };
    });
    const step = timeline.steps.find(s => s.id === stepId);
    if (step && !step.isCompleted) {
      toast.success(`Step completed: ${step.title}`, {
        description: 'Great progress! Keep going.',
      });
    }
  };

  // Set due date for a step
  const setStepDueDate = (stepId: string, date: string) => {
    if (!timeline) return;
    setTimeline(prev => {
      if (!prev) return prev;
      const steps = prev.steps.map(s => s.id === stepId ? { ...s, dueDate: date } : s);
      return { ...prev, steps };
    });
  };

  // Save WhatsApp number
  const saveWhatsApp = () => {
    if (!whatsappInput || whatsappInput.length < 10) {
      toast.error('Please enter a valid WhatsApp number');
      return;
    }
    if (!timeline) return;
    setTimeline(prev => prev ? { ...prev, whatsappNumber: whatsappInput, whatsappVerified: true } : prev);
    setShowWhatsAppSetup(false);
    toast.success('WhatsApp reminders activated!', {
      description: 'You\'ll receive timely reminders at every stage.',
    });
  };

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Get days until date
  const daysUntil = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Popular countries for quick selection
  const popularCountryCodes = ['uae', 'sau', 'tur', 'mys', 'tha', 'gbr', 'usa', 'chn'];

  // ============================================================
  // RENDER: Benefits / Introduction Tab
  // ============================================================
  const renderBenefits = () => (
    <div className="space-y-6">
      {/* Hero intro */}
      <div className="text-center space-y-4 pb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-medium">
          <Crown className="w-4 h-4" />
          Pro Feature
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
          Never Miss a Visa Deadline Again
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Applying for a visa is stressful. There are too many steps, too many documents, and too many deadlines.
          Our <strong>Visa Process Tracker</strong> turns the chaos into a clear, step-by-step roadmap —
          with <strong>WhatsApp reminders</strong> so you never fall behind.
        </p>
      </div>

      {/* Problem - Solution cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-700 dark:text-red-400">Without This Tool</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> You forget important deadlines</li>
            <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> You miss documents and get rejected</li>
            <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> You don&apos;t know what to do next</li>
            <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> You feel anxious and unsure</li>
            <li className="flex gap-2"><X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> You manage everything on paper</li>
          </ul>
        </Card>
        <Card className="p-5 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/10">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">With This Tool</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Clear step-by-step roadmap</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> WhatsApp nudges at every stage</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Never miss a deadline again</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Always know your next action</li>
            <li className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> Feel guided and confident</li>
          </ul>
        </Card>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="text-center p-5 rounded-xl border bg-card">
          <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-3">
            <Milestone className="w-6 h-6 text-sky-600" />
          </div>
          <h4 className="font-semibold mb-1">Visual Timeline</h4>
          <p className="text-sm text-muted-foreground">See every step from start to finish. Track progress like a project.</p>
        </div>
        <div className="text-center p-5 rounded-xl border bg-card">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-6 h-6 text-green-600" />
          </div>
          <h4 className="font-semibold mb-1">WhatsApp Reminders</h4>
          <p className="text-sm text-muted-foreground">Get timely nudges on WhatsApp — 98% open rate, never missed.</p>
        </div>
        <div className="text-center p-5 rounded-xl border bg-card">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
            <Timer className="w-6 h-6 text-amber-600" />
          </div>
          <h4 className="font-semibold mb-1">Smart Estimates</h4>
          <p className="text-sm text-muted-foreground">Know your expected completion date. Plan your travel with confidence.</p>
        </div>
      </div>

      {/* WhatsApp reminder example */}
      <Card className="p-5 border-green-200 dark:border-green-900/40 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400 mb-1">Example WhatsApp Reminder</p>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 text-sm space-y-1 border shadow-sm max-w-md">
              <p className="font-medium">PakVisa Pro Reminder</p>
              <p className="text-muted-foreground">Hi Ahmed! Your UK visa document deadline is in <strong>3 days</strong> (June 10). Make sure your bank statements and employment letter are ready.</p>
              <p className="text-xs text-muted-foreground mt-2">Reply HELP for assistance or tap to update your timeline.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Pricing comparison */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold mb-3">Why This Is Worth It</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">Rs. 5,000+</p>
            <p className="text-xs text-muted-foreground mt-1">Travel agent charges per visa</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">Rs. 0</p>
            <p className="text-xs text-muted-foreground mt-1">Cost of a missed deadline</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">Rs. 500</p>
            <p className="text-xs text-muted-foreground mt-1">Our Pro plan per application</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-3 text-center">
          Get the guidance and reminders of a travel agent at <strong>1/10th the cost</strong>.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center space-y-3 pb-4">
        {isPro ? (
          <div className="space-y-2">
            <p className="text-sm text-emerald-600 font-medium flex items-center justify-center gap-1">
              <Crown className="w-4 h-4" /> You have Pro access — start tracking now!
            </p>
            <Button size="lg" onClick={() => setActiveTab('timeline')} className="gap-2">
              <ArrowRight className="w-4 h-4" /> Start Your Visa Timeline
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button size="lg" onClick={() => window.dispatchEvent(new CustomEvent('open-pricing'))} className="gap-2">
              <Crown className="w-4 h-4" /> Upgrade to Pro to Start
            </Button>
            <p className="text-sm text-muted-foreground">
              Or explore the timeline below to see what you&apos;ll get
            </p>
            <Button variant="outline" onClick={() => setActiveTab('timeline')} className="gap-2">
              Preview Timeline <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // ============================================================
  // RENDER: Timeline Tab
  // ============================================================
  const renderTimeline = () => (
    <div className="space-y-6">
      {/* Country selection */}
      {!timeline ? (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Select Your Destination Country</h2>
          <p className="text-sm text-muted-foreground">Choose the country you&apos;re applying to, and we&apos;ll create a personalized timeline.</p>

          {/* Popular countries quick select */}
          <div>
            <p className="text-sm font-medium mb-3">Popular Destinations</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {countries
                .filter(c => popularCountryCodes.includes(c.code.toLowerCase()) || popularCountryCodes.includes(c.code))
                .slice(0, 8)
                .map(c => (
                  <button
                    key={c.code}
                    onClick={() => { setSelectedCountry(c.code); initializeTimeline(c.code); }}
                    className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all text-left"
                  >
                    {c.flagEmoji && <span className="text-2xl">{c.flagEmoji}</span>}
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.visaFree ? 'Visa Free' : c.visaOnArrival ? 'On Arrival' : c.etaAvailable ? 'e-Visa' : 'Embassy Required'}
                      </p>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Full country list */}
          <div>
            <p className="text-sm font-medium mb-3">All Countries</p>
            <div className="relative">
              <Select value={selectedCountry} onValueChange={(v) => { setSelectedCountry(v); initializeTimeline(v); }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Search and select a country..." />
                </SelectTrigger>
                <SelectContent>
                  {countries
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flagEmoji} {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ) : (
        /* Active timeline */
        <div className="space-y-6">
          {/* Timeline header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                {selectedCountryData?.flagEmoji && <span className="text-2xl">{selectedCountryData.flagEmoji}</span>}
                <h2 className="text-xl font-bold">{timeline.countryName} Visa Timeline</h2>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Started {formatDate(timeline.startDate)} &middot; {timeline.steps.length} steps
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setTimeline(null)} className="gap-1.5">
                Change Country
              </Button>
              {isPro && (
                <Button variant="outline" size="sm" onClick={() => setActiveTab('whatsapp')} className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30">
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </Button>
              )}
            </div>
          </div>

          {/* Progress overview */}
          <Card className="p-5 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/20 dark:to-blue-950/20 border-sky-200 dark:border-sky-900/40">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div>
                <p className="font-semibold">Overall Progress</p>
                <p className="text-sm text-muted-foreground">
                  {timeline.steps.filter(s => s.isCompleted).length} of {timeline.steps.length} steps completed
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-sky-600">{progressPercent}%</p>
                {estimatedDaysRemaining > 0 && (
                  <p className="text-xs text-muted-foreground">~{estimatedDaysRemaining} days remaining</p>
                )}
              </div>
            </div>
            <Progress value={progressPercent} className="h-3" />
            {currentStep && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-muted-foreground">Next action: <strong>{currentStep.title}</strong></span>
              </div>
            )}
            {progressPercent === 100 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">All steps complete! You&apos;re ready to travel.</span>
              </div>
            )}
          </Card>

          {/* Timeline steps */}
          <div className="space-y-0">
            {timeline.steps.map((step, index) => {
              const isExpanded = expandedStep === step.id;
              const isLast = index === timeline.steps.length - 1;
              const daysUntilDue = step.dueDate ? daysUntil(step.dueDate) : null;
              const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && !step.isCompleted;
              const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 2 && !step.isCompleted;

              return (
                <div key={step.id} className="relative">
                  {/* Connector line */}
                  {!isLast && (
                    <div className="absolute left-[19px] top-[44px] w-0.5 h-[calc(100%-44px)] bg-border" />
                  )}

                  <div
                    className={`flex gap-4 pb-6 ${isLast ? '' : ''}`}
                  >
                    {/* Step indicator */}
                    <button
                      onClick={() => toggleStep(step.id)}
                      className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 border-2 ${
                        step.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isOverdue
                          ? 'bg-red-100 dark:bg-red-900/30 border-red-400 text-red-500'
                          : isDueSoon
                          ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 text-amber-500'
                          : index === timeline.steps.filter(s => s.isCompleted).length
                          ? 'bg-sky-100 dark:bg-sky-900/30 border-sky-400 text-sky-500'
                          : 'bg-muted border-border text-muted-foreground'
                      }`}
                      title={step.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {step.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </button>

                    {/* Step content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`rounded-xl border p-4 transition-all cursor-pointer ${
                          step.isCompleted
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/40'
                            : isOverdue
                            ? 'bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/40'
                            : 'bg-card hover:shadow-sm'
                        }`}
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className={`font-semibold ${step.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                {step.title}
                              </h4>
                              {step.isCompleted && (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                                  Done
                                </Badge>
                              )}
                              {isOverdue && (
                                <Badge variant="destructive" className="text-[10px]">
                                  Overdue
                                </Badge>
                              )}
                              {isDueSoon && (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">
                                  Due Soon
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {step.typicalDaysMin === step.typicalDaysMax
                                  ? `${step.typicalDaysMin} day${step.typicalDaysMin !== 1 ? 's' : ''}`
                                  : `${step.typicalDaysMin}-${step.typicalDaysMax} days`
                                }
                              </span>
                              {step.completedDate && (
                                <span className="flex items-center gap-1 text-emerald-600">
                                  <CheckCircle2 className="w-3 h-3" /> Completed {formatDate(step.completedDate)}
                                </span>
                              )}
                              {step.dueDate && !step.isCompleted && (
                                <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : isDueSoon ? 'text-amber-500' : ''}`}>
                                  <Calendar className="w-3 h-3" /> Due {formatDate(step.dueDate)}
                                  {daysUntilDue !== null && ` (${daysUntilDue === 0 ? 'today' : daysUntilDue > 0 ? `${daysUntilDue}d left` : `${Math.abs(daysUntilDue)}d overdue`})`}
                                </span>
                              )}
                            </div>
                          </div>
                          <button className="shrink-0 p-1 rounded hover:bg-muted transition-colors">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="mt-4 space-y-4 border-t pt-4">
                            {/* Tips */}
                            {step.tips.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> Tips
                                </p>
                                <ul className="space-y-1.5">
                                  {step.tips.map((tip, ti) => (
                                    <li key={ti} className="flex gap-2 text-sm text-muted-foreground">
                                      <Info className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Required documents */}
                            {step.requiredDocs && step.requiredDocs.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> Documents Needed
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {step.requiredDocs.map((doc, di) => (
                                    <Badge key={di} variant="outline" className="text-xs">
                                      {doc}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Due date setter */}
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Set Due Date
                              </p>
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="date"
                                  value={step.dueDate || ''}
                                  onChange={(e) => setStepDueDate(step.id, e.target.value)}
                                  className="w-auto"
                                  disabled={!isPro}
                                />
                                {!isPro && (
                                  <Button variant="outline" size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-pricing'))} className="gap-1">
                                    <Crown className="w-3 h-3" /> Pro
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Completion celebration */}
          {progressPercent === 100 && (
            <Card className="p-6 text-center bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-emerald-950/20 dark:to-sky-950/20 border-emerald-200 dark:border-emerald-900/40">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
              <p className="text-muted-foreground mb-4">You&apos;ve completed all steps for your {timeline.countryName} visa. Safe travels!</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setTimeline(null)} className="gap-1.5">
                  Track Another Country
                </Button>
                <Button onClick={onClose} className="gap-1.5">
                  <Plane className="w-4 h-4" /> Back to Dashboard
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  // ============================================================
  // RENDER: WhatsApp Tab
  // ============================================================
  const renderWhatsApp = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-600" />
          WhatsApp Reminders
        </h2>
        <Button variant="outline" size="sm" onClick={() => setActiveTab('timeline')}>
          Back to Timeline
        </Button>
      </div>

      {!isPro ? (
        <Card className="p-6 text-center">
          <Crown className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">Pro Feature</h3>
          <p className="text-sm text-muted-foreground mb-4">
            WhatsApp reminders are available exclusively for Pro members. Upgrade to get timely nudges at every stage of your visa process.
          </p>
          <Button onClick={() => window.dispatchEvent(new CustomEvent('open-pricing'))} className="gap-1.5">
            <Crown className="w-4 h-4" /> Upgrade to Pro
          </Button>
        </Card>
      ) : (
        <>
          {/* WhatsApp setup */}
          <Card className="p-5 border-green-200 dark:border-green-900/40">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Set Up WhatsApp Reminders</h3>
                  <p className="text-sm text-muted-foreground">Enter your WhatsApp number to receive timely reminders</p>
                </div>
              </div>

              {timeline?.whatsappVerified ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">WhatsApp reminders active!</p>
                    <p className="text-xs text-muted-foreground">Sending to: {timeline.whatsappNumber}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 rounded-lg border bg-muted text-sm">
                      🇵🇰 +92
                    </div>
                    <Input
                      placeholder="3XX XXXXXXX"
                      value={whatsappInput}
                      onChange={(e) => setWhatsappInput(e.target.value.replace(/[^0-9]/g, ''))}
                      className="flex-1"
                      maxLength={12}
                    />
                  </div>
                  <Button onClick={saveWhatsApp} className="w-full gap-1.5 bg-green-600 hover:bg-green-700">
                    <Send className="w-4 h-4" /> Activate Reminders
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Reminder frequency */}
          <Card className="p-5">
            <h3 className="font-semibold mb-3">Reminder Frequency</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'daily' as const, label: 'Daily', desc: 'Every day' },
                { value: '2days' as const, label: 'Every 2 Days', desc: 'Recommended' },
                { value: 'weekly' as const, label: 'Weekly', desc: 'Less frequent' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (timeline) {
                      setTimeline(prev => prev ? { ...prev, reminderFrequency: opt.value } : prev);
                    }
                  }}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    timeline?.reminderFrequency === opt.value
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                      : 'bg-card hover:shadow-sm'
                  }`}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* What you'll receive */}
          <Card className="p-5">
            <h3 className="font-semibold mb-3">What You&apos;ll Receive</h3>
            <div className="space-y-3">
              {[
                { icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, title: 'Deadline Reminders', desc: '3 days before each step\'s due date' },
                { icon: <Zap className="w-4 h-4 text-sky-500" />, title: 'Next Action Alerts', desc: 'When you complete a step, get the next one' },
                { icon: <Clock className="w-4 h-4 text-red-500" />, title: 'Overdue Warnings', desc: 'If you fall behind schedule' },
                { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />, title: 'Weekly Progress Digest', desc: 'Monday morning summary of your progress' },
                { icon: <Sparkles className="w-4 h-4 text-purple-500" />, title: 'Status Change Alerts', desc: 'When anything changes in your timeline' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                  <div className="shrink-0 mt-0.5">{item.icon}</div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Example messages */}
          <Card className="p-5 border-green-200 dark:border-green-900/40 bg-green-50/30 dark:bg-green-950/10">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-600" />
              Example Messages You&apos;ll Receive
            </h3>
            <div className="space-y-3">
              {[
                'Your document deadline is in 3 days. Make sure your bank statements and employment letter are ready.',
                'Great progress! Next step: Book your embassy appointment. You should do this within 5 days.',
                'You planned to book your appointment by June 5 but haven\'t marked it done. Common issue: appointment slots fill up fast — book early!',
                'Weekly Progress: 5 of 9 steps done. Next: Attend appointment on June 15 (4 days away). You\'re on track!',
              ].map((msg, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-3 border shadow-sm">
                  <p className="text-xs font-semibold text-green-600 mb-1">PakVisa Pro Reminder</p>
                  <p className="text-sm text-muted-foreground">{msg}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Tab navigation */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg bg-muted">
          {[
            { key: 'benefits' as const, label: 'Overview', icon: <Sparkles className="w-4 h-4" /> },
            { key: 'timeline' as const, label: 'Timeline', icon: <Milestone className="w-4 h-4" /> },
            { key: 'whatsapp' as const, label: 'WhatsApp', icon: <MessageSquare className="w-4 h-4" />, proOnly: true },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.proOnly && !isPro && tab.key === 'whatsapp') {
                  window.dispatchEvent(new CustomEvent('open-pricing'));
                  return;
                }
                setActiveTab(tab.key);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.proOnly && <Crown className="w-3 h-3 text-amber-500" />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'benefits' && renderBenefits()}
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'whatsapp' && renderWhatsApp()}
      </div>
    </div>
  );
}
