'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, BarChart3, Search, ChevronRight, Star, Clock,
  DollarSign, Shield, Calendar, Heart, Plane, Building, MapPin,
  Users, Lightbulb, TrendingUp, TrendingDown,
  ArrowRight, ArrowUpDown, Printer, ExternalLink, Zap, Target, Sparkles,
  Eye, ClipboardList, Send, ChevronDown, ChevronUp, Compass, Gavel, CheckCircle2, X, XCircle,
  AlertTriangle, Info, Lock, FileWarning, PackageOpen, PlaneTakeoff, UtensilsCrossed, Bookmark, SearchX, Timer, Wallet, Languages, BadgePercent,
  RotateCcw,
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { CountryData, UserProfileData, ScoreBreakdown, ChatMessage, ChecklistItem } from '@/lib/types';
import { FlagImage, ComparisonTable } from '../shared-components-1';
import { ComparisonRadarChart, VisaFeeComparisonChart } from '../shared-components-2';
import { QuickCompareCards } from '../shared-components-3';
import { emptyProfile } from './questionnaire-tab';

export function CompareTab() {
  const { comparisonCountries, setComparisonCountries, scoreResults } = useAppStore();
  const [allCountries, setAllCountries] = useState<{ code: string; name: string; flagEmoji: string; flagUrl: string }[]>([]);
  const [selectedCountriesData, setSelectedCountriesData] = useState<CountryData[]>([]);
  const [results, setResults] = useState<ScoreBreakdown[]>([]);
  const [comparing, setComparing] = useState(false);
  const [compareSearch, setCompareSearch] = useState('');
  const [compareVisibleCount, setCompareVisibleCount] = useState(16);

  const POPULAR_COMPARISONS: { label: string; codes: string[] }[] = [
    { label: 'UAE vs Turkey', codes: ['AE', 'TR'] },
    { label: 'Malaysia vs Saudi Arabia', codes: ['MY', 'SA'] },
    { label: 'UK vs Schengen', codes: ['GB', 'DE'] },
  ];

  useEffect(() => {
    fetch('/api/countries?limit=100').then(r => r.json()).then(data => {
      setAllCountries((data.data || []).map((c: CountryData) => ({ code: c.code, name: c.name, flagEmoji: c.flagEmoji, flagUrl: c.flagUrl || '' })));
    });
  }, []);

  // Fetch full country data when selection changes
  useEffect(() => {
    if (comparisonCountries.length === 0) return;
    fetch('/api/countries?limit=100').then(r => r.json()).then(data => {
      const all = (data.data || []) as CountryData[];
      setSelectedCountriesData(all.filter(c => comparisonCountries.includes(c.code)));
    });
  }, [comparisonCountries]);

  const filteredCountries = useMemo(() => {
    if (!compareSearch.trim()) return allCountries;
    return allCountries.filter(c => c.name.toLowerCase().includes(compareSearch.toLowerCase()) || c.code.toLowerCase().includes(compareSearch.toLowerCase()));
  }, [allCountries, compareSearch]);

  const toggleCountry = (code: string) => {
    setComparisonCountries(
      comparisonCountries.includes(code)
        ? comparisonCountries.filter(c => c !== code)
        : comparisonCountries.length < 5
          ? [...comparisonCountries, code]
          : comparisonCountries
    );
  };

  const compare = async () => {
    if (comparisonCountries.length < 2) { toast.error('Select at least 2 countries'); return; }
    setComparing(true);
    try {
      const profile = useAppStore.getState().userProfile || emptyProfile;
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCodes: comparisonCountries, profile }),
      });
      const data = await res.json();
      if (data.data) {
        setResults(data.data.countries || []);
        toast.success('Comparison complete!');
      }
    } catch { toast.error('Comparison failed'); }
    setComparing(false);
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      <Card className="glass-card card-warm-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="card-section-title">Compare Countries</CardTitle>
              <CardDescription>Select 2-5 countries to compare visa eligibility side by side</CardDescription>
            </div>
            {comparisonCountries.length > 0 && (
              <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:text-amber-400">
                {comparisonCountries.length}/5 selected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Countries as Chips */}
          {comparisonCountries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {comparisonCountries.map(code => {
                const c = allCountries.find(x => x.code === code);
                return (
                  <motion.span
                    key={code}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="chip-animate inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-sm font-medium"
                  >
                    <FlagImage code={c?.code || ''} flagUrl={c?.flagUrl} size={18} emoji={c?.flagEmoji} />
                    <span>{c?.name}</span>
                    <button onClick={() => toggleCountry(code)} className="ml-0.5 hover:text-red-600 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                );
              })}
              {comparisonCountries.length < 5 && (
                <span className="text-xs text-muted-foreground flex items-center px-2 py-1">
                  {5 - comparisonCountries.length} more available
                </span>
              )}
            </div>
          )}

          {/* No countries selected - enhanced empty state */}
          {comparisonCountries.length === 0 && (
            <div className="text-center py-8">
              <div className="mx-auto mb-4">
                <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                  {/* Left country card */}
                  <rect x="4" y="25" width="32" height="40" rx="6" stroke="#f59e0b" strokeWidth="2" fill="#fffbeb" />
                  <circle cx="20" cy="38" r="5" fill="#fcd34d" />
                  <rect x="12" y="48" width="16" height="3" rx="1.5" fill="#f59e0b" opacity="0.6" />
                  <rect x="12" y="54" width="12" height="2" rx="1" fill="#f59e0b" opacity="0.3" />
                  {/* Right country card */}
                  <rect x="84" y="25" width="32" height="40" rx="6" stroke="#f59e0b" strokeWidth="2" fill="#fffbeb" />
                  <circle cx="100" cy="38" r="5" fill="#fcd34d" />
                  <rect x="92" y="48" width="16" height="3" rx="1.5" fill="#f59e0b" opacity="0.6" />
                  <rect x="92" y="54" width="12" height="2" rx="1" fill="#f59e0b" opacity="0.3" />
                  {/* VS circle */}
                  <circle cx="60" cy="45" r="14" fill="#f59e0b" />
                  <text x="60" y="49" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">VS</text>
                  {/* Arrows */}
                  <path d="M38 45 L44 45" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                  <path d="M76 45 L82 45" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                  {/* Bottom sparkle */}
                  <circle cx="60" cy="75" r="3" fill="#fbbf24" />
                  <line x1="60" y1="68" x2="60" y2="72" stroke="#fbbf24" strokeWidth="1.5" />
                  <line x1="54" y1="72" x2="57" y2="74" stroke="#fbbf24" strokeWidth="1.5" />
                  <line x1="66" y1="72" x2="63" y2="74" stroke="#fbbf24" strokeWidth="1.5" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Compare Visa Requirements Side by Side</h3>
              <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
                Select 2-5 countries below to see eligibility scores, fees, processing times, and more — all in one place.
              </p>
              {/* Popular Comparisons */}
              <div className="space-y-2">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Popular Comparisons</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {POPULAR_COMPARISONS.map((pair) => (
                    <Button
                      key={pair.label}
                      variant="outline"
                      size="sm"
                      className="text-xs border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:border-amber-300 badge-3d"
                      onClick={() => setComparisonCountries(pair.codes)}
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      {pair.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search within compare */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search countries..."
              value={compareSearch}
              onChange={(e) => setCompareSearch(e.target.value)}
              className="pl-9 pr-8"
            />
            {compareSearch && (
              <button onClick={() => setCompareSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <div className="text-xs text-muted-foreground mb-2">
            Showing {Math.min(compareVisibleCount, filteredCountries.length)} of {filteredCountries.length} countries
          </div>

          <div className="flex flex-wrap gap-2 pb-2">
            {filteredCountries.slice(0, compareVisibleCount).map(c => (
              <Button
                key={c.code}
                size="sm"
                variant={comparisonCountries.includes(c.code) ? 'default' : 'outline'}
                className={`hover-lift-smooth ${comparisonCountries.includes(c.code) ? 'bg-amber-600' : ''}`}
                onClick={() => toggleCountry(c.code)}
              >
                <span className="inline-flex items-center gap-1"><FlagImage code={c.code} flagUrl={c.flagUrl} size={18} emoji={c.flagEmoji} /> {c.name}</span>
              </Button>
            ))}
          </div>
          {filteredCountries.length > compareVisibleCount && (
            <Button variant="ghost" size="sm" className="w-full mt-2 text-amber-600 hover:text-amber-700" onClick={() => setCompareVisibleCount(prev => prev + 16)}>
              Show {Math.min(16, filteredCountries.length - compareVisibleCount)} More Countries
              <ChevronDown className="w-4 h-4 ml-1" />
            </Button>
          )}
          {compareVisibleCount > 16 && (
            <Button variant="ghost" size="sm" className="w-full mt-1 text-muted-foreground hover:text-foreground" onClick={() => setCompareVisibleCount(16)}>
              Show Less
              <ChevronUp className="w-4 h-4 ml-1" />
            </Button>
          )}
          {/* Visa Requirements Matrix - shown when 3+ countries selected */}
          {selectedCountriesData.length >= 3 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                Visa Requirements Matrix
              </p>
              <div className="card-elevated-2 rounded-xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar-thin">
                  <table className="w-full text-xs table-amber table-hover-row">
                    <thead>
                      <tr className="border-b bg-amber-50/50 dark:bg-amber-950/20">
                        <th className="text-left p-2.5 font-semibold text-amber-700 dark:text-amber-400 sticky left-0 bg-amber-50/80 dark:bg-amber-950/40 backdrop-blur-sm">Country</th>
                        <th className="text-left p-2.5 font-semibold text-amber-700 dark:text-amber-400">Visa Type</th>
                        <th className="text-left p-2.5 font-semibold text-amber-700 dark:text-amber-400">Processing</th>
                        <th className="text-left p-2.5 font-semibold text-amber-700 dark:text-amber-400">Fee</th>
                        <th className="text-left p-2.5 font-semibold text-amber-700 dark:text-amber-400">Safety</th>
                        <th className="text-left p-2.5 font-semibold text-amber-700 dark:text-amber-400">Documents</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedCountriesData.map((c) => {
                        const visaType = c.visaFree ? 'Visa-Free' : c.visaOnArrival ? 'VOA' : c.etaAvailable ? 'eTA' : 'Embassy';
                        const visaColor = c.visaFree ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : c.visaOnArrival ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : c.etaAvailable ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-400';
                        const processing = c.processingDaysMin === 0 && c.processingDaysMax === 0 ? 'N/A' : c.processingDaysMin === c.processingDaysMax ? `${c.processingDaysMin}d` : `${c.processingDaysMin}-${c.processingDaysMax}d`;
                        const fee = c.costProfile?.visaFeeUSD ?? 0;
                        const docCount = c.requirements?.length ?? 0;
                        return (
                          <tr key={c.code} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                            <td className="p-2.5 font-medium sticky left-0 bg-background">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base leading-none">{c.flagEmoji}</span>
                                <span className="whitespace-nowrap">{c.name}</span>
                              </div>
                            </td>
                            <td className="p-2.5">
                              <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 font-medium ${visaColor}`}>{visaType}</Badge>
                            </td>
                            <td className="p-2.5 text-muted-foreground">{processing}</td>
                            <td className="p-2.5 font-mono">{fee > 0 ? `$${fee}` : 'Free'}</td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${(c.safetyRating / 10) * 100}%` }} />
                                </div>
                                <span className="text-muted-foreground">{c.safetyRating}/10</span>
                              </div>
                            </td>
                            <td className="p-2.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">{docCount}</Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {/* Quick Compare Cards Preview */}
          {comparisonCountries.length >= 2 && selectedCountriesData.length >= 2 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Quick Preview</p>
              <QuickCompareCards countries={selectedCountriesData} onRemove={(code) => toggleCountry(code)} />
            </div>
          )}

          <Button onClick={compare} disabled={comparing || comparisonCountries.length < 2} className="bg-amber-600 hover:bg-amber-700">
            {comparing ? 'Comparing...' : 'Compare Now'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-6 pb-4 list-group">
          {/* Fee Comparison Chart */}
          <VisaFeeComparisonChart results={results} />

          {/* Radar Chart */}
          <ComparisonRadarChart results={results} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((r, i) => (
            <Card key={i} className={`glass-card hover-lift-smooth card-elevated-2 card-glow-border card-accent-top card-3d-tilt ${i === 0 ? 'ring-2 ring-amber-500' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base card-section-title">{r.country}</CardTitle>
                  <div className="stat-card-compact flex flex-col items-center">
                    <span className="text-2xl font-bold text-amber-600 stat-card-number stat-number-amber">{Math.round(r.finalScore)}</span>
                    <span className="stat-card-label text-[10px] text-muted-foreground">Score</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {r.components.map((c, j) => (
                  <div key={j} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="data-bar-amber data-bar-animated w-20 h-1.5">
                        <div className="data-bar-fill" style={{ width: `${Math.round(c.score)}%` }} />
                      </div>
                      <span className="w-8 text-right">{Math.round(c.score)}%</span>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Confidence</span>
                  <span>{Math.round(r.confidence * 100)}%</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

          {/* Comparison Table - Task 10 B4 */}
          <ComparisonTable results={results} />
        </div>
      )}
    </div>
  );
}
// ============ WHAT-IF SIMULATOR ============
export function WhatIfSimulator({ scoreResult, userProfile }: { scoreResult: ScoreBreakdown; userProfile: UserProfileData }) {
  const [healthInsurance, setHealthInsurance] = useState(userProfile.hasHealthInsurance);
  const [returnTicket, setReturnTicket] = useState(userProfile.hasReturnTicket);
  const [hotelBooking, setHotelBooking] = useState(userProfile.hasHotelBooking);
  const [sponsor, setSponsor] = useState(userProfile.hasSponsor);
  const [priorTravel, setPriorTravel] = useState(userProfile.hasPriorTravel);
  const [income, setIncome] = useState(userProfile.monthlyIncomeUSD);
  const [savings, setSavings] = useState(userProfile.savingsUSD);
  const [budget, setBudget] = useState(userProfile.budgetUSD);
  const [recalculating, setRecalculating] = useState(false);
  const [afterScore, setAfterScore] = useState<ScoreBreakdown | null>(null);

  const applyChanges = async () => {
    setRecalculating(true);
    const modifiedProfile = {
      ...userProfile,
      hasHealthInsurance: healthInsurance,
      hasReturnTicket: returnTicket,
      hasHotelBooking: hotelBooking,
      hasSponsor: sponsor,
      hasPriorTravel: priorTravel,
      monthlyIncomeUSD: income,
      savingsUSD: savings,
      budgetUSD: budget,
    };
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode: scoreResult.countryCode, profile: modifiedProfile }),
      });
      const data = await res.json();
      if (data.data) {
        setAfterScore(data.data);
      } else {
        toast.error(data.error || 'Recalculation failed');
      }
    } catch {
      toast.error('Network error during recalculation');
    }
    setRecalculating(false);
  };

  const delta = afterScore ? afterScore.finalScore - scoreResult.finalScore : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 responsive-stack-mobile">
        {/* Toggle Switches */}
        <div className="space-y-3">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</h5>
          {[
            { label: 'Add Health Insurance', desc: '+5% health component', checked: healthInsurance, onChange: setHealthInsurance, icon: Shield },
            { label: 'Book Return Ticket', desc: '+15% purpose component', checked: returnTicket, onChange: setReturnTicket, icon: Plane },
            { label: 'Book Hotel', desc: '+10% purpose component', checked: hotelBooking, onChange: setHotelBooking, icon: Home },
            { label: 'Add Financial Sponsor', desc: '+20% funds component', checked: sponsor, onChange: setSponsor, icon: Users },
            { label: 'Have Prior Travel', desc: '+10% travel history', checked: priorTravel, onChange: setPriorTravel, icon: Globe },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">{item.desc}</div>
                </div>
              </div>
              <Switch checked={item.checked} onCheckedChange={item.onChange} />
            </div>
          ))}
        </div>

        {/* Sliders */}
        <div className="space-y-4">
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Adjustments</h5>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label className="text-muted-foreground">Monthly Income</Label>
              <span className="font-mono text-xs font-medium">${income.toLocaleString()}</span>
            </div>
            <Slider value={[income]} onValueChange={(v) => setIncome(v[0])} min={0} max={10000} step={100} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label className="text-muted-foreground">Savings</Label>
              <span className="font-mono text-xs font-medium">${savings.toLocaleString()}</span>
            </div>
            <Slider value={[savings]} onValueChange={(v) => setSavings(v[0])} min={0} max={100000} step={1000} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <Label className="text-muted-foreground">Travel Budget</Label>
              <span className="font-mono text-xs font-medium">${budget.toLocaleString()}</span>
            </div>
            <Slider value={[budget]} onValueChange={(v) => setBudget(v[0])} min={0} max={50000} step={500} />
          </div>
        </div>
      </div>

      {/* Apply Button */}
      <Button
        onClick={applyChanges}
        disabled={recalculating}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        size="lg"
      >
        {recalculating ? (
          <><RotateCcw className="w-4 h-4 mr-2 animate-spin" /> Recalculating...</>
        ) : (
          <><Zap className="w-4 h-4 mr-2" /> Apply Changes & Recalculate</>
        )}
      </Button>

      {/* Comparison Result */}
      {afterScore && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
            <h5 className="text-sm font-semibold">Score Comparison</h5>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Before</div>
                <div className="text-3xl font-bold">{Math.round(scoreResult.finalScore)}</div>
              </div>
              <div className="flex flex-col items-center">
                <ArrowRight className={`w-6 h-6 ${delta >= 0 ? 'text-amber-500' : 'text-red-500'}`} />
                <span className={`text-sm font-bold ${delta >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
                </span>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">After</div>
                <div className={`text-3xl font-bold ${delta >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {Math.round(afterScore.finalScore)}
                </div>
              </div>
            </div>
            {/* Component-level comparison */}
            <div className="space-y-1.5 pt-2 border-t">
              {[
                { label: 'Eligibility', before: scoreResult.eligibility, after: afterScore.eligibility },
                { label: 'Visa Likelihood', before: scoreResult.visaLikelihood, after: afterScore.visaLikelihood },
                { label: 'Cost Suitability', before: scoreResult.costSuitability, after: afterScore.costSuitability },
              ].map((item) => {
                const diff = item.after - item.before;
                return (
                  <div key={item.label} className="flex items-center gap-2 text-sm">
                    <span className="w-28 text-muted-foreground text-xs">{item.label}</span>
                    <span className="w-12 text-right font-mono text-xs">{Math.round(item.before)}</span>
                    <span className={`text-xs font-medium ${diff >= 0 ? 'text-amber-600' : 'text-red-600'} w-12 text-center`}>
                      {diff >= 0 ? '+' : ''}{diff.toFixed(1)}
                    </span>
                    <span className="w-12 text-right font-mono text-xs font-medium">{Math.round(item.after)}</span>
                  </div>
                );
              })}
            </div>
            {delta >= 0 ? (
              <p className="text-xs text-amber-600 text-center">
                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                Changes improved your score! Consider applying these in your application.
              </p>
            ) : (
              <p className="text-xs text-red-600 text-center">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                These changes would lower your score. Reconsider before proceeding.
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============ SMART CHECKLIST ============
export function SmartChecklist({ scoreResult }: { scoreResult: ScoreBreakdown }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const checklistRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => {
    const generated: ChecklistItem[] = [];

    // From hard filter failures - high priority documents
    scoreResult.hardFilters.filter(f => !f.passed).forEach((f) => {
      generated.push({
        task: `Resolve: ${f.filter} - ${f.message}`,
        priority: 'high',
        effort: f.severity === 'critical' ? 'time-consuming' : 'moderate',
        completed: false,
        category: 'Documents',
        notes: f.severity,
      });
    });

    // From missing items
    scoreResult.missingItems.forEach((item, i) => {
      generated.push({
        task: item,
        priority: i < 3 ? 'high' : i < 6 ? 'medium' : 'low',
        effort: i < 2 ? 'quick' : i < 5 ? 'moderate' : 'time-consuming',
        completed: false,
        category: 'Documents',
      });
    });

    // Financial items from tips
    const financialTips = scoreResult.tips.filter(t => /income|fund|bank|financial|money|salary|savings/i.test(t));
    financialTips.forEach((tip) => {
      generated.push({
        task: tip,
        priority: 'high',
        effort: 'moderate',
        completed: false,
        category: 'Financial',
      });
    });

    // Travel items from tips
    const travelTips = scoreResult.tips.filter(t => /ticket|book|flight|hotel|travel|itinerary/i.test(t));
    travelTips.forEach((tip) => {
      generated.push({
        task: tip,
        priority: 'medium',
        effort: 'quick',
        completed: false,
        category: 'Travel',
      });
    });

    // Health items
    if (scoreResult.components.find(c => /health|insurance/i.test(c.name))?.score < 70) {
      generated.push({
        task: 'Purchase travel health insurance covering your entire stay duration',
        priority: 'high',
        effort: 'quick',
        completed: false,
        category: 'Health',
      });
    }

    // Remaining tips
    const usedTips = new Set([...financialTips, ...travelTips]);
    scoreResult.tips.filter(t => !usedTips.has(t)).forEach((tip) => {
      generated.push({
        task: tip,
        priority: 'low',
        effort: 'moderate',
        completed: false,
        category: 'Tips',
      });
    });

    // General documents
    generated.push(
      { task: 'Ensure passport validity extends 6+ months beyond travel dates', priority: 'high', effort: 'quick', completed: false, category: 'Documents' },
      { task: 'Get passport-sized photographs (as per destination requirements)', priority: 'medium', effort: 'quick', completed: false, category: 'Documents' },
      { task: 'Prepare bank statements for last 6 months', priority: 'high', effort: 'moderate', completed: false, category: 'Financial' },
      { task: 'Book refundable accommodation for visa application', priority: 'medium', effort: 'quick', completed: false, category: 'Travel' },
      { task: 'Create a day-by-day travel itinerary', priority: 'low', effort: 'time-consuming', completed: false, category: 'Travel' },
    );

    return generated;
  }, [scoreResult]);

  const toggleCheck = (idx: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(String(idx))) next.delete(String(idx));
      else next.add(String(idx));
      return next;
    });
  };

  const progress = items.length > 0 ? (checked.size / items.length) * 100 : 0;

  const exportChecklist = () => {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const categories = ['Documents', 'Financial', 'Travel', 'Health', 'Tips'];
    let html = `<html><head><title>Visa Checklist - ${scoreResult.country}</title>
      <style>body{font-family:system-ui;max-width:700px;margin:40px auto;padding:20px;color:#1a1a1a}
      h1{color:#d97706}h2{color:#374151;margin-top:24px;border-bottom:2px solid #e5e7eb;padding-bottom:4px}
      .item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f3f4f6}
      .item input{width:18px;height:18px}.priority{font-size:11px;padding:2px 8px;border-radius:9999px;font-weight:600}
      .high{background:#fef2f2;color:#dc2626}.medium{background:#fffbeb;color:#d97706}.low{background:#f0fdf4;color:#16a34a}
      .effort{font-size:10px;color:#6b7280;margin-left:8px}</style></head><body>`;
    html += `<h1>Visa Checklist: ${scoreResult.country}</h1>`;
    html += `<p>Generated by PakVisa Advisor · Score: ${Math.round(scoreResult.finalScore)}/100</p>`;
    categories.forEach(cat => {
      const catItems = items.filter(it => it.category === cat);
      if (catItems.length === 0) return;
      html += `<h2>${cat}</h2>`;
      catItems.forEach((it, i) => {
        const realIdx = items.indexOf(it);
        html += `<div class="item"><input type="checkbox" /><span>${it.task}</span><span class="priority ${it.priority}">${it.priority}</span><span class="effort">${it.effort}</span></div>`;
      });
    });
    html += `</body></html>`;
    printWin.document.write(html);
    printWin.document.close();
    printWin.print();
  };

  const categoryIcons: Record<string, React.ReactNode> = {
    Documents: <FileText className="w-4 h-4" />,
    Financial: <DollarSign className="w-4 h-4" />,
    Travel: <Plane className="w-4 h-4" />,
    Health: <Heart className="w-4 h-4" />,
    Tips: <Lightbulb className="w-4 h-4" />,
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    low: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  const effortColors = {
    quick: 'text-amber-600',
    moderate: 'text-amber-600',
    'time-consuming': 'text-red-600',
  };

  const categories = ['Documents', 'Financial', 'Travel', 'Health', 'Tips'];

  return (
    <div ref={checklistRef} className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">{checked.size} of {items.length} completed</span>
        </div>
        <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-amber-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {progress === 100 && items.length > 0 && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> All items completed! You are well prepared.
          </p>
        )}
      </div>

      {/* Checklist Items by Category */}
      <ScrollArea className="max-h-96 overflow-y-auto">
        <div className="space-y-4 pr-2">
          {categories.map(cat => {
            const catItems = items.filter(it => it.category === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-600">{categoryIcons[cat]}</span>
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat}</h5>
                  <Badge variant="secondary" className="text-[10px]">{catItems.length}</Badge>
                </div>
                <div className="space-y-1">
                  {catItems.map((item) => {
                    const idx = items.indexOf(item);
                    const isChecked = checked.has(String(idx));
                    return (
                      <motion.div
                        key={idx}
                        className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${isChecked ? 'bg-muted/50' : 'hover:bg-muted/30'}`}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleCheck(idx)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${isChecked ? 'line-through text-muted-foreground' : ''}`}>{item.task}</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge className={`${priorityColors[item.priority]} text-[9px] px-1.5 py-0`} variant="secondary">
                              {item.priority}
                            </Badge>
                            <span className={`text-[10px] ${effortColors[item.effort]}`}>{item.effort}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Export Button */}
      <Button variant="outline" size="sm" className="w-full" onClick={exportChecklist}>
        <Printer className="w-4 h-4 mr-2" /> Export Checklist
      </Button>
    </div>
  );
}
