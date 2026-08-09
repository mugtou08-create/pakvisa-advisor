'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, BarChart3, Search, ChevronRight, ChevronLeft, Star, Clock,
  DollarSign, Shield, Calendar, Heart,
  Send, Bot, User, Plus, Minus, ArrowUpDown,
  CheckCircle2, AlertTriangle, XCircle, Info,
  Globe, Plane, Building, GraduationCap, Briefcase, Landmark, Map,
  CreditCard, Home, Users, Lock, Lightbulb,
  RotateCcw, ToggleLeft, ToggleRight, Zap,
  TrendingUp, TrendingDown, ArrowRight, Printer, Share2,
  Eye, ClipboardList, Play, Save, Upload, ChevronUp, Compass,
  Gavel, BadgePercent, Timer, Wallet, Trophy, Phone, Mail,
  Keyboard, HelpCircle, Sparkles, ChevronDown, History, Target, SearchX,
  LayoutGrid, List, RefreshCw, Passports, Flame, Languages, CircleDollarSign, CircleCheckBig, FileWarning,
  Bell, Bookmark, AlertCircle, CalendarClock, Luggage, FileCheck2,
  Check, CalendarDays, AlarmClock, PackageOpen, PlaneTakeoff, UtensilsCrossed, MoreHorizontal, Calculator,
  Copy, SlidersHorizontal, BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { CountryData, UserProfileData, ScoreBreakdown, ChatMessage, ChecklistItem } from '@/lib/types';
import { FlagImage, AnimatedCounter, QuickDashboard, ConfettiDot, ColorProgress } from '../shared-components-1';
import { ScoringHistoryPanel, TravelCostCalculator, RadialGauge, AnimatedScoreNumber, ConfettiAnimation, ScoreQuickViewDialog, ApplicationTipsPanel, ProfileStrengthMeter, CheckFlash, AnimatedScoreRing, VisaDocumentChecklist } from '../shared-components-2';
import { VisaReadinessGauge } from '../shared-components-3';

export const emptyProfile: UserProfileData = {
  fullName: '', age: 25, gender: '', nationality: 'Pakistani', passportNumber: '',
  passportExpiry: '', occupation: '', monthlyIncomeUSD: 0, savingsUSD: 0,
  education: '', languages: ['english'], hasCriminalRecord: false, hasPriorTravel: false,
  priorCountries: [], hasHealthInsurance: false, hasSponsor: false, sponsorRelation: '',
  sponsorIncomeUSD: 0, travelPurpose: '', intendedStayDays: 30, hasReturnTicket: false,
  hasHotelBooking: false, budgetUSD: 0, maritalStatus: '', dependents: 0,
  hasSpecialNeeds: false, additionalNotes: '',
};

export const STEPS = [
  { title: 'Personal Information', icon: User, description: 'Basic details and passport info' },
  { title: 'Professional', icon: Briefcase, description: 'Occupation, education, and languages' },
  { title: 'Financial', icon: DollarSign, description: 'Income, savings, and sponsor details' },
  { title: 'Travel Details', icon: Plane, description: 'Purpose, duration, and bookings' },
  { title: 'Additional', icon: Users, description: 'Health, travel history, and other' },
  { title: 'Review & Score', icon: BarChart3, description: 'Summary and eligibility check' },
];

export function QuestionnaireTab() {
  const { userProfile, setUserProfile, scoreResults, addScoreResult, setActiveTab } = useAppStore();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfileData>(userProfile || emptyProfile);
  const [scoring, setScoring] = useState(false);
  const [scores, setScores] = useState<ScoreBreakdown[]>([]);
  const [quickViewScore, setQuickViewScore] = useState<ScoreBreakdown | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Save/Load profile to localStorage
  const saveProfile = useCallback(() => {
    try {
      localStorage.setItem('pakvisa-profile', JSON.stringify(profile));
      toast.success('Profile saved to browser storage!');
    } catch {
      toast.error('Failed to save profile');
    }
  }, [profile]);

  const loadProfile = useCallback(() => {
    try {
      const saved = localStorage.getItem('pakvisa-profile');
      if (saved) {
        const parsed = JSON.parse(saved) as UserProfileData;
        setProfile(parsed);
        toast.success('Profile loaded from saved data!');
      } else {
        toast.error('No saved profile found');
      }
    } catch {
      toast.error('Failed to load profile');
    }
  }, []);

  const updateProfile = (field: keyof UserProfileData, value: string | number | boolean | string[]) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const calculateScores = async () => {
    setScoring(true);
    try {
      const res = await fetch('/api/score-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      const allScores: ScoreBreakdown[] = data.data || [];
      setScores(allScores);
      allScores.forEach(s => addScoreResult(s));
      setUserProfile(profile);
      // Show rich toast with top score
      const topResult = allScores.reduce((best, s) => s.finalScore > best.finalScore ? s : best, allScores[0]);
      if (topResult) {
        toast.custom(() => (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-background shadow-lg max-w-sm">
            <div className="toast-score-ring" style={{ backgroundColor: topResult.finalScore >= 70 ? '#f59e0b' : topResult.finalScore >= 40 ? '#f59e0b' : '#ef4444' }}>
              {Math.round(topResult.finalScore)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Scores Calculated!</p>
              <p className="text-xs text-muted-foreground truncate">Top: {topResult.country} ({topResult.visaType})</p>
            </div>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs shrink-0"
              onClick={() => { setActiveTab('reports'); }}
            >
              View Report
            </Button>
          </div>
        ), { duration: 5000 });
      }
      // Save to scoring history
      try {
        const historyEntry: ScoringSession = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          profile: { age: profile.age, occupation: profile.occupation || 'N/A', purpose: profile.travelPurpose || 'N/A' },
          topCountries: allScores.sort((a, b) => b.finalScore - a.finalScore).slice(0, 3).map(s => s.country),
          scores: allScores,
        };
        const stored = localStorage.getItem(SCORING_HISTORY_KEY);
        const existing: ScoringSession[] = stored ? JSON.parse(stored) : [];
        existing.unshift(historyEntry);
        localStorage.setItem(SCORING_HISTORY_KEY, JSON.stringify(existing.slice(0, 10)));
      } catch { /* empty */ }
      // No more duplicate toast - rich toast above handles it
    } catch {
      toast.error('Failed to calculate scores');
    }
    setScoring(false);
  };

  const nextStep = () => {
    const newStep = Math.min(step + 1, 5);
    setStep(newStep);
    if (newStep < 6) {
      toast(`Step ${newStep}/6 complete \u2713`, {
        description: STEPS[newStep - 1]?.title || '',
        duration: 2000,
      });
    }
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  // Summary stats
  const bestMatch = useMemo(() => {
    if (scores.length === 0) return null;
    return scores.reduce((best, s) => s.finalScore > best.finalScore ? s : best);
  }, [scores]);

  const easiest = useMemo(() => {
    if (scores.length === 0) return null;
    return scores.reduce((best, s) => s.visaLikelihood > best.visaLikelihood ? s : best);
  }, [scores]);

  const cheapest = useMemo(() => {
    if (scores.length === 0) return null;
    return scores.reduce((best, s) => s.costSuitability > best.costSuitability ? s : best);
  }, [scores]);

  const openQuickView = (score: ScoreBreakdown) => {
    setQuickViewScore(score);
    setQuickViewOpen(true);
  };

  // Prominent completion percentage calculation
  const completionPct = useMemo(() => {
    const checks = [
      !!profile.fullName.trim(),
      profile.age > 0,
      !!profile.gender,
      !!profile.passportNumber.trim(),
      !!profile.passportExpiry,
      !!profile.occupation.trim(),
      profile.monthlyIncomeUSD > 0,
      !!profile.education && profile.education !== 'other',
      profile.languages.length >= 1,
      profile.savingsUSD > 0,
      profile.budgetUSD > 0,
      !!profile.travelPurpose,
      profile.hasReturnTicket,
      profile.hasHotelBooking,
      profile.hasHealthInsurance,
      !!profile.maritalStatus,
      profile.hasCriminalRecord !== undefined,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile]);

  return (
    <div className="space-y-6">
      {/* Progress Header with dots */}
      <div className="bg-muted/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Visa Eligibility Questionnaire</h2>
          <div className="flex items-center gap-3">
            {/* Prominent Completion Percentage */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border shadow-sm">
              <div className="relative w-8 h-8">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke={completionPct >= 80 ? '#f59e0b' : completionPct >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 15}`} strokeDashoffset={`${2 * Math.PI * 15 * (1 - completionPct / 100)}`} className="transition-all duration-700" />
                </svg>
                <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${completionPct >= 80 ? 'text-amber-600' : completionPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{completionPct}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold leading-tight">Profile</span>
                <span className={`text-[10px] leading-tight ${completionPct >= 80 ? 'text-amber-600' : completionPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{completionPct >= 80 ? 'Strong' : completionPct >= 50 ? 'Moderate' : 'Needs Work'}</span>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
          </div>
        </div>
        <div className="relative">
          <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
          {/* Override the progress indicator with gradient fill */}
          <div
            className="absolute top-0 left-0 h-2 rounded-full progress-gradient-fill transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
          {/* Confetti dot at end of progress */}
          <div className="absolute top-0 h-2" style={{ '--progress-end': `${((step + 1) / STEPS.length) * 100}%`, left: 0, right: 0, pointerEvents: 'none' } as React.CSSProperties}>
            <ConfettiDot show />
          </div>
        </div>
        {/* Step progress dots */}
        <div className="flex justify-between mt-3 relative">
          {/* Connecting line */}
          <div className="absolute top-3 left-[5%] right-[5%] h-0.5 bg-muted rounded-full" />
          <div
            className={`absolute top-3 left-[5%] h-0.5 bg-amber-500 rounded-full transition-all duration-500 ${step > 0 ? 'step-connector-active' : ''}`}
            style={{ width: `${(step / (STEPS.length - 1)) * 90}%` }}
          />
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 relative z-10">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < step ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30' :
                i === step ? 'bg-amber-600 text-white ring-4 ring-amber-200 dark:ring-amber-800 shadow-md shadow-amber-600/30 step-badge-fill' :
                'bg-background border-2 border-muted-foreground/30 text-muted-foreground'
              }`}>
                {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-[10px] hidden sm:block transition-colors ${i <= step ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>{s.title.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Profile Strength Meter */}
      <ProfileStrengthMeter profile={profile} />

      {/* Save/Load Profile Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={saveProfile} className="flex-1">
          <Save className="w-3.5 h-3.5 mr-1.5" /> Save Profile
        </Button>
        <Button variant="outline" size="sm" onClick={loadProfile} className="flex-1">
          <Upload className="w-3.5 h-3.5 mr-1.5" /> Load Saved Profile
        </Button>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
          <Card className="dark-surface-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(STEPS[step].icon, { className: 'w-5 h-5 text-amber-500' })}
                {STEPS[step].title}
              </CardTitle>
              <CardDescription>{STEPS[step].description}</CardDescription>
            </CardHeader>
            <CardContent>
              {step === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <Input id="fullName" placeholder="Enter your full name" value={profile.fullName} onChange={e => updateProfile('fullName', e.target.value)} className={`input-glow-focus ${profile.fullName.trim() ? 'field-valid' : ''}`} />
                      <CheckFlash show={!!profile.fullName.trim()} />
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="age">Age</Label>
                    <div className="relative">
                      <Input id="age" type="number" min={16} max={100} value={profile.age} onChange={e => updateProfile('age', parseInt(e.target.value) || 0)} className={`input-glow-focus ${profile.age > 0 ? 'field-valid' : ''}`} />
                      <CheckFlash show={profile.age > 0} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={profile.gender} onValueChange={v => updateProfile('gender', v)}>
                      <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="passportNumber">Passport Number</Label>
                    <div className="relative">
                      <Input id="passportNumber" placeholder="e.g. AB1234567" value={profile.passportNumber} onChange={e => updateProfile('passportNumber', e.target.value)} className={`input-glow-focus ${profile.passportNumber.trim() ? 'field-valid' : ''}`} />
                      <CheckFlash show={!!profile.passportNumber.trim()} />
                    </div>
                  </div>
                  <div className="space-y-2 relative md:col-span-2">
                    <Label htmlFor="passportExpiry">Passport Expiry Date</Label>
                    <div className="relative">
                      <Input id="passportExpiry" type="date" value={profile.passportExpiry} onChange={e => updateProfile('passportExpiry', e.target.value)} className={`input-glow-focus ${profile.passportExpiry ? 'field-valid' : ''}`} />
                      <CheckFlash show={!!profile.passportExpiry} />
                    </div>
                    <p className="text-xs text-muted-foreground">Must be valid for at least 6 months beyond intended stay</p>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <Label htmlFor="occupation">Occupation</Label>
                    <div className="relative">
                      <Input id="occupation" placeholder="e.g. Software Engineer" value={profile.occupation} onChange={e => updateProfile('occupation', e.target.value)} className={`input-glow-focus ${profile.occupation.trim() ? 'field-valid' : ''}`} />
                      <CheckFlash show={!!profile.occupation.trim()} />
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="monthlyIncome">Monthly Income (USD)</Label>
                    <div className="relative">
                      <Input id="monthlyIncome" type="number" min={0} value={profile.monthlyIncomeUSD} onChange={e => updateProfile('monthlyIncomeUSD', parseFloat(e.target.value) || 0)} className={`input-glow-focus ${profile.monthlyIncomeUSD > 0 ? 'field-valid' : ''}`} />
                      <CheckFlash show={profile.monthlyIncomeUSD > 0} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Education Level</Label>
                    <Select value={profile.education} onValueChange={v => updateProfile('education', v)}>
                      <SelectTrigger><SelectValue placeholder="Select education" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="diploma">Diploma / College</SelectItem>
                        <SelectItem value="bachelors">Bachelor&apos;s Degree</SelectItem>
                        <SelectItem value="masters">Master&apos;s Degree</SelectItem>
                        <SelectItem value="phd">PhD / Doctorate</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Languages</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {['English', 'Urdu', 'Arabic', 'French', 'German', 'Turkish', 'Chinese', 'Other'].map(lang => {
                        const key = lang.toLowerCase();
                        const checked = profile.languages.includes(key);
                        return (
                          <Badge
                            key={lang}
                            variant={checked ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              const newLangs = checked
                                ? profile.languages.filter(l => l !== key)
                                : [...profile.languages, key];
                              updateProfile('languages', newLangs);
                            }}
                          >
                            {lang}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 relative">
                    <Label htmlFor="savings">Total Savings (USD)</Label>
                    <div className="relative">
                      <Input id="savings" type="number" min={0} value={profile.savingsUSD} onChange={e => updateProfile('savingsUSD', parseFloat(e.target.value) || 0)} className={`input-glow-focus ${profile.savingsUSD > 0 ? 'field-valid' : ''}`} />
                      <CheckFlash show={profile.savingsUSD > 0} />
                    </div>
                  </div>
                  <div className="space-y-2 relative">
                    <Label htmlFor="budget">Travel Budget (USD)</Label>
                    <div className="relative">
                      <Input id="budget" type="number" min={0} value={profile.budgetUSD} onChange={e => updateProfile('budgetUSD', parseFloat(e.target.value) || 0)} className={`input-glow-focus ${profile.budgetUSD > 0 ? 'field-valid' : ''}`} />
                      <CheckFlash show={profile.budgetUSD > 0} />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 md:col-span-2">
                    <Switch checked={profile.hasSponsor} onCheckedChange={v => updateProfile('hasSponsor', v)} />
                    <Label>I have a sponsor</Label>
                  </div>
                  {profile.hasSponsor && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                      <div className="space-y-2">
                        <Label>Sponsor Relation</Label>
                        <Select value={profile.sponsorRelation} onValueChange={v => updateProfile('sponsorRelation', v)}>
                          <SelectTrigger><SelectValue placeholder="Select relation" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="parent">Parent</SelectItem>
                            <SelectItem value="spouse">Spouse</SelectItem>
                            <SelectItem value="sibling">Sibling</SelectItem>
                            <SelectItem value="employer">Employer</SelectItem>
                            <SelectItem value="friend">Friend</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sponsorIncome">Sponsor Monthly Income (USD)</Label>
                        <Input id="sponsorIncome" type="number" min={0} value={profile.sponsorIncomeUSD} onChange={e => updateProfile('sponsorIncomeUSD', parseFloat(e.target.value) || 0)} className="input-glow-focus" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Travel Purpose</Label>
                    <Select value={profile.travelPurpose} onValueChange={v => updateProfile('travelPurpose', v)}>
                      <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tourism">Tourism / Holiday</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="study">Study / Education</SelectItem>
                        <SelectItem value="work">Work / Employment</SelectItem>
                        <SelectItem value="medical">Medical Treatment</SelectItem>
                        <SelectItem value="family">Family Visit</SelectItem>
                        <SelectItem value="religious">Religious Pilgrimage</SelectItem>
                        <SelectItem value="transit">Transit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stayDays">Intended Stay (Days)</Label>
                    <Input id="stayDays" type="number" min={1} max={365} value={profile.intendedStayDays} onChange={e => updateProfile('intendedStayDays', parseInt(e.target.value) || 30)} className="input-glow-focus" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch checked={profile.hasReturnTicket} onCheckedChange={v => updateProfile('hasReturnTicket', v)} />
                    <Label>I have a return flight ticket</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch checked={profile.hasHotelBooking} onCheckedChange={v => updateProfile('hasHotelBooking', v)} />
                    <Label>I have hotel/accommodation booking</Label>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marital Status</Label>
                    <Select value={profile.maritalStatus} onValueChange={v => updateProfile('maritalStatus', v)}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dependents">Number of Dependents</Label>
                    <Input id="dependents" type="number" min={0} max={20} value={profile.dependents} onChange={e => updateProfile('dependents', parseInt(e.target.value) || 0)} className="input-glow-focus" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch checked={profile.hasHealthInsurance} onCheckedChange={v => updateProfile('hasHealthInsurance', v)} />
                    <Label>I have travel health insurance</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Switch checked={profile.hasPriorTravel} onCheckedChange={v => updateProfile('hasPriorTravel', v)} />
                    <Label>I have prior international travel history</Label>
                  </div>
                  {profile.hasCriminalRecord !== undefined && (
                    <div className="flex items-center space-x-3 md:col-span-2">
                      <Switch checked={profile.hasCriminalRecord} onCheckedChange={v => updateProfile('hasCriminalRecord', v)} />
                      <Label className="text-destructive">I have a criminal record</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger><Info className="w-3.5 h-3.5 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent><p className="max-w-xs">This is a hard filter. Having a criminal record may disqualify you from many visa applications.</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">Profile Summary</h3>
                    <p className="text-sm text-muted-foreground">Review your information before calculating scores</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { label: 'Age', value: profile.age, icon: User },
                      { label: 'Occupation', value: profile.occupation || 'Not set', icon: Briefcase },
                      { label: 'Education', value: profile.education || 'Not set', icon: GraduationCap },
                      { label: 'Income', value: `$${profile.monthlyIncomeUSD}/mo`, icon: DollarSign },
                      { label: 'Savings', value: `$${profile.savingsUSD}`, icon: CreditCard },
                      { label: 'Budget', value: `$${profile.budgetUSD}`, icon: DollarSign },
                      { label: 'Purpose', value: profile.travelPurpose || 'Not set', icon: Plane },
                      { label: 'Stay', value: `${profile.intendedStayDays} days`, icon: Calendar },
                      { label: 'Insurance', value: profile.hasHealthInsurance ? 'Yes' : 'No', icon: Shield },
                      { label: 'Return Ticket', value: profile.hasReturnTicket ? 'Yes' : 'No', icon: Plane },
                      { label: 'Accommodation', value: profile.hasHotelBooking ? 'Yes' : 'No', icon: Home },
                      { label: 'Sponsor', value: profile.hasSponsor ? 'Yes' : 'No', icon: Users },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2 p-3 rounded-lg border text-sm">
                        <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="text-xs text-muted-foreground">{item.label}</div>
                          <div className="font-medium">{item.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button onClick={calculateScores} disabled={scoring} className="w-full bg-amber-600 hover:bg-amber-700 text-white" size="lg">
                    {scoring ? (
                      <><RotateCcw className="w-4 h-4 mr-2 animate-spin" /> Calculating Scores...</>
                    ) : (
                      <><Zap className="w-4 h-4 mr-2" /> Calculate My Visa Scores</>
                    )}
                  </Button>
                </div>
              )}
              {/* B4: Document Upload Zone */}
              {step === 5 && (
                <div className="mt-4 space-y-3">
                  {/* Privacy Consent */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                    <input type="checkbox" id="doc-consent" className="mt-0.5 accent-amber-600" defaultChecked />
                    <label htmlFor="doc-consent" className="text-xs cursor-pointer">
                      <strong>Privacy Notice:</strong> Your documents are processed securely in-memory only. Images are NEVER stored on our servers and are deleted immediately after analysis.
                    </label>
                  </div>
                  <div className="p-4 rounded-xl border-2 border-dashed border-border hover:border-amber-500/50 transition-colors cursor-pointer"
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dropzone-active'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('dropzone-active'); }}
                    onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('dropzone-active'); toast.info('Document upload is a preparation feature - files are noted for your records.'); }}
                    onClick={() => toast.info('Drag & drop your documents here to prepare for your visa application.')}
                  >
                    <div className="flex flex-col items-center gap-2 py-4">
                      <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <p className="text-sm font-medium">Drag & drop your documents here</p>
                      <p className="text-xs text-muted-foreground">or click to browse</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['PDF', 'JPG', 'PNG', 'DOC'].map((ext) => (
                          <Badge key={ext} variant="outline" className="text-[10px]">.{ext.toLowerCase()}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div className="btn-group-amber">
              <Button variant="outline" onClick={prevStep} disabled={step === 0}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={nextStep} disabled={step === 5} className="bg-amber-600 hover:bg-amber-700">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Score Results Table - Improved */}
      {scores.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ConfettiAnimation trigger={scores.length > 0} />
          <Card className="card-warm-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                Visa Eligibility Results ({scores.length} countries)
                {bestMatch && <RadialGauge score={bestMatch.finalScore} size={90} />}
              </CardTitle>
              <CardDescription>Ranked by final recommendation score. Click any row for detailed breakdown.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {bestMatch && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Best Match</div>
                      <div className="text-sm font-semibold truncate">{bestMatch.country}</div>
                      <div className="text-xs text-amber-600 font-medium">{bestMatch.finalScore.toFixed(1)}</div>
                    </div>
                  </div>
                )}
                {easiest && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Easiest</div>
                      <div className="text-sm font-semibold truncate">{easiest.country}</div>
                      <div className="text-xs text-orange-600 font-medium">{easiest.visaLikelihood.toFixed(1)} likelihood</div>
                    </div>
                  </div>
                )}
                {cheapest && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Cheapest</div>
                      <div className="text-sm font-semibold truncate">{cheapest.country}</div>
                      <div className="text-xs text-amber-600 font-medium">{cheapest.costSuitability.toFixed(1)} cost fit</div>
                    </div>
                  </div>
                )}
              </div>

              <ScrollArea className="max-h-[500px]">
                <div className="space-y-2">
                  {scores.map((score, idx) => (
                    <motion.div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => openQuickView(score)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                    >
                      <div className="w-8 text-center shrink-0">
                        <span className="text-lg font-bold text-muted-foreground">{idx + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate text-sm">{score.country}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0">{score.visaType}</Badge>
                        </div>
                        {/* Color-coded score bar */}
                        <div className="mt-1.5">
                          <ColorProgress value={score.finalScore} className="h-1.5" useGradient />
                        </div>
                        {/* Component mini bars */}
                        <div className="flex gap-1 mt-1.5 items-end h-3">
                          {score.components.slice(0, 6).map((c, i) => {
                            const barColor = c.score >= 70 ? '#f59e0b' : c.score >= 40 ? '#f59e0b' : '#ef4444';
                            return (
                              <TooltipProvider key={i}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className="flex-1 rounded-t-sm cursor-default transition-all hover:opacity-80"
                                      style={{
                                        height: `${Math.max(2, (c.score / 100) * 100)}%`,
                                        backgroundColor: barColor,
                                        minHeight: '2px',
                                      }}
                                    />
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">{c.name}: {Math.round(c.score)}%</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`text-2xl font-bold ${score.finalScore >= 70 ? 'text-amber-600' : score.finalScore >= 40 ? 'text-amber-600' : 'text-red-600'} ${score.finalScore > 80 ? 'score-pulse rounded-full p-1' : ''}`}>
                          <AnimatedScoreNumber value={Math.round(score.finalScore)} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">Final</span>
                      </div>
                      {score.hardFilters.some(f => !f.passed && f.severity === 'critical') && (
                        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                      )}
                      <Button variant="ghost" size="sm" className="shrink-0" onClick={(e) => { e.stopPropagation(); openQuickView(score); }}>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Quick View Dialog */}
          <ScoreQuickViewDialog score={quickViewScore} open={quickViewOpen} onClose={() => setQuickViewOpen(false)} />
        </motion.div>
      )}
    </div>
  );
}

