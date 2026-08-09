'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, BarChart3, Search, ChevronRight, Star, Clock,
  DollarSign, Shield, Calendar, Heart, Plane, Building, MapPin, Globe,
  Home, Users, Lightbulb, TrendingUp, TrendingDown,
  ArrowRight, ArrowUpDown, Printer, ExternalLink, Zap, Target, Sparkles,
  Eye, ClipboardList, Send, ChevronDown, ChevronUp, Compass, Gavel, CheckCircle2, X, XCircle,
  AlertTriangle, Info, Lock, FileWarning, PackageOpen, PlaneTakeoff, UtensilsCrossed, Bookmark, SearchX, Timer, Wallet, Languages, BadgePercent,
  Share2, Thermometer, CreditCard, CircleDollarSign, Save, History, RotateCcw, CalendarClock, Phone, Mail,
  ShoppingBag, Banknote, Hotel,
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
import type { CountryData, UserProfileData, ScoreBreakdown, ChecklistItem } from '@/lib/types';
import { getFlagUrl, VISA_CATEGORY_COLORS, COUNTRY_NAME_ALIASES, QUICK_FILTERS, EXCHANGE_RATES, EMBASSY_DATA, GENERIC_EMBASSY, MONTH_NAMES, RECENT_SEARCHES_KEY, REGIONS, getRegion } from './constants';
import { FlagImage, AnimatedCounter, ScoreCircle, SafetyDots, ColorProgress, ConfettiDot, QuickScoreInline, TravelChecklist } from './shared-components-1';
import { PremiumBadge } from './dialogs';

export function CountryDetailDialog({ country, open, onClose }: { country: CountryData | null; open: boolean; onClose: () => void }) {
  const { addScoreResult, setSelectedCountry, setActiveTab } = useAppStore();
  const [printMode, setPrintMode] = useState(false);
  if (!country) return null;
  let monthlyTemps: number[] = [];
  try {
    monthlyTemps = typeof country.monthlyTemps === 'string' ? JSON.parse(country.monthlyTemps) : (country.monthlyTemps || []);
  } catch { monthlyTemps = []; }
  const months = MONTH_NAMES;

  const handleScored = (score: ScoreBreakdown) => {
    addScoreResult(score);
  };

  const handlePrintReport = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 300);
  };

  const difficultyLevel = country.visaFree ? 1 : country.visaOnArrival ? 1 : country.etaAvailable ? 2 : 4;
  const difficultyClass = difficultyLevel <= 2 ? 'active-easy' : difficultyLevel <= 3 ? 'active-medium' : 'active-hard';
  const headerGradient = country.visaFree ? 'bg-gradient-to-r from-amber-600 to-amber-500' : country.visaOnArrival ? 'bg-gradient-to-r from-amber-500 to-yellow-500' : country.etaAvailable ? 'bg-gradient-to-r from-amber-600 to-sky-500' : 'bg-gradient-to-r from-orange-500 to-red-500';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0" id="country-detail-print-area">
        {/* Colored gradient header strip */}
        <div className={`${headerGradient} h-2 rounded-t-lg`} />
        <div className="px-6 pt-4">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <FlagImage code={country.code} flagUrl={country.flagUrl} size={48} className="rounded" />
            <div className="flex-1">
              <DialogTitle className="text-xl">{country.name}</DialogTitle>
              <DialogDescription>{country.code} · {country.continent} · {country.timezone}</DialogDescription>
            </div>
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="text-xs gap-1" onClick={handlePrintReport}>
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Report <PremiumBadge />
              </Button>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => { navigator.clipboard.writeText(`${window.location.origin} — ${country.name} Visa Guide for Pakistani Passport`); toast.success('Link copied to clipboard!'); }}>
                <Share2 className="w-3.5 h-3.5 mr-1" /> Share
              </Button>
            </div>
          </div>
          {/* Difficulty Indicator */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-muted-foreground">Visa Difficulty:</span>
            <div className="difficulty-bar flex-1 max-w-[200px]">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`difficulty-segment ${i <= difficultyLevel ? difficultyClass : ''}`} />
              ))}
            </div>
            <span className={`text-xs font-medium ${difficultyLevel <= 2 ? 'text-amber-600' : difficultyLevel <= 3 ? 'text-amber-600' : 'text-red-600'}`}>
              {difficultyLevel <= 2 ? 'Easy' : difficultyLevel <= 3 ? 'Medium' : 'Hard'}
            </span>
          </div>
        </DialogHeader>
        </div>

        <div className="space-y-6 px-6 pb-6">
          {/* Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Shield className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <div className="text-xs text-muted-foreground">Safety</div>
              <div className="font-semibold">{country.safetyRating}/10</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Thermometer className="w-5 h-5 mx-auto mb-1 text-orange-500" />
              <div className="text-xs text-muted-foreground">Avg Temp</div>
              <div className="font-semibold">{country.avgTempC}°C</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Calendar className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <div className="text-xs text-muted-foreground">Processing</div>
              <div className="font-semibold">{country.processingDaysMin}-{country.processingDaysMax} days</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <CreditCard className="w-5 h-5 mx-auto mb-1 text-amber-500" />
              <div className="text-xs text-muted-foreground">Visa Fee</div>
              <div className="font-semibold">${country.costProfile?.visaFeeUSD || 0}</div>
            </div>
          </div>

          {/* Safety Summary with accent dot */}
          <div className="p-3 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="section-dot" />
              <span className="text-sm font-medium">Safety Summary</span>
            </div>
            <p className="text-sm text-muted-foreground">{country.safetySummary}</p>
          </div>

          {/* Temperature Chart with accent dot */}
          <div className="overflow-hidden">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="section-dot" style={{ background: '#f97316', boxShadow: '0 0 6px rgba(249,115,22,0.4)' }} />
              Monthly Temperatures (°C)
            </h3>
            <div className="flex items-end gap-1" style={{ height: '120px' }}>
              {months.map((m) => {
                const temp = monthlyTemps[m] || 0;
                const maxTemp = Math.max(...Object.values(monthlyTemps));
                const height = maxTemp > 0 ? (temp / maxTemp) * 100 : 50;
                const isBest = country.bestTravelMonths.toLowerCase().includes(m.toLowerCase());
                return (
                  <div key={m} className="flex-1 flex flex-col items-center justify-end min-w-0">
                    <span className="text-[8px] font-medium tabular-nums leading-none mb-1">{temp}°</span>
                    <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                      <div
                        className={`w-full rounded-t-sm transition-all ${isBest ? 'bg-amber-500' : 'bg-muted-foreground/30'}`}
                        style={{ height: `${Math.max(4, height)}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-muted-foreground leading-none mt-1">{m}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Essential Travel Services - Monetization */}
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-600" />
                Essential Travel Services
              </CardTitle>
              <CardDescription>Everything you need for your {country.name} trip</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <a href="#" className="flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-card border hover:border-orange-300 hover:shadow-sm transition-all">
                <Shield className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-sm font-medium">Travel Insurance</div>
                  <div className="text-[10px] text-muted-foreground">From $3/day</div>
                </div>
              </a>
              <a href="#" className="flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-card border hover:border-orange-300 hover:shadow-sm transition-all">
                <Plane className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-sm font-medium">Book Flights</div>
                  <div className="text-[10px] text-muted-foreground">Compare prices</div>
                </div>
              </a>
              <a href="#" className="flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-card border hover:border-orange-300 hover:shadow-sm transition-all">
                <Hotel className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-sm font-medium">Find Hotels</div>
                  <div className="text-[10px] text-muted-foreground">Best rates</div>
                </div>
              </a>
              <a href="#" className="flex items-center gap-2 p-3 rounded-lg bg-white dark:bg-card border hover:border-orange-300 hover:shadow-sm transition-all">
                <Banknote className="w-5 h-5 text-orange-500" />
                <div>
                  <div className="text-sm font-medium">Send Money</div>
                  <div className="text-[10px] text-muted-foreground">Forex rates</div>
                </div>
              </a>
            </CardContent>
          </Card>

          {/* Visa Types with accent dot */}
          <div className="overflow-hidden">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="section-dot" style={{ background: '#f97316', boxShadow: '0 0 6px rgba(249,115,22,0.4)' }} />
              Available Visa Types
            </h3>
            <div className="space-y-2">
              {country.visaTypes.map((vt) => (
                <div key={vt.id} className="p-2 rounded-lg border text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{vt.type}</span>
                    <Badge variant="outline" className="text-xs shrink-0">{vt.maxDuration}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 break-words">{vt.description}</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {vt.extensions && <Badge variant="secondary" className="text-[10px]">Extendable</Badge>}
                    {vt.multipleEntry && <Badge variant="secondary" className="text-[10px]">Multiple Entry</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements with accent dot */}
          <div className="overflow-hidden">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="section-dot" style={{ background: '#f59e0b', boxShadow: '0 0 6px rgba(245,158,11,0.4)' }} />
              Requirements
            </h3>
            <div className="space-y-2">
              {country.requirements.map((req, i) => (
                <div key={req.id || i} className="flex items-start gap-2 text-sm">
                  <Badge variant={req.mandatory ? 'default' : 'secondary'} className="text-[10px] mt-0.5 shrink-0">
                    {req.category}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <span className="text-sm break-words">{req.requirement}</span>
                    {req.description && (
                      <p className="text-xs text-muted-foreground break-words mt-0.5">{req.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Breakdown - Enhanced with bar chart */}
          {country.costProfile && (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-500" />
                Cost Breakdown (Monthly, USD)
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Visa Fee', value: country.costProfile.visaFeeUSD, icon: CreditCard, color: '#f59e0b' },
                  { label: 'Service Fee', value: country.costProfile.serviceFeeUSD, icon: Building, color: '#f59e0b' },
                  { label: 'Rent', value: country.costProfile.monthlyRentUSD, icon: Home, color: '#f97316' },
                  { label: 'Food', value: country.costProfile.monthlyFoodUSD, icon: Heart, color: '#f97316' },
                  { label: 'Transport', value: country.costProfile.monthlyTransportUSD, icon: Plane, color: '#8b5cf6' },
                  { label: 'Insurance', value: country.costProfile.healthInsuranceUSD, icon: Shield, color: '#ec4899' },
                ].map((item) => {
                  const maxVal = Math.max(country.costProfile.monthlyRentUSD, country.costProfile.totalMonthlyUSD);
                  const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">{item.label}</span>
                        </div>
                        <span className="font-medium">${item.value}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(3, pct)}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-sm font-semibold">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-amber-500" />
                    Total Monthly
                  </div>
                  <span className="text-amber-600 dark:text-amber-400 text-base">${country.costProfile.totalMonthlyUSD}</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Score This Country */}
          <Separator />
          <div className="overflow-hidden">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" /> Quick Score Assessment
            </h3>
            <QuickScoreInline countryCode={country.code} onScored={handleScored} />
          </div>

          {/* Visa Timeline Estimator */}
          <Separator />
          <div className="overflow-hidden">
            <VisaTimelineEstimator country={country} />
          </div>

          {/* Application Tips Panel */}
          <div className="overflow-hidden">
            <ApplicationTipsPanel country={country} />
          </div>

          {/* Visa Document Checklist */}
          <Separator />
          <div className="overflow-hidden">
            <VisaDocumentChecklist country={country} />
          </div>

          {/* Currency Converter - Links to Tools tab instead of duplicating */}
          <div className="overflow-hidden">
            <div className="p-3 rounded-lg border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground mb-2">Need to convert {country.currencyCode} to PKR?</p>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => { setSelectedCountry(null); setActiveTab('tools'); }}>
                <CircleDollarSign className="w-3.5 h-3.5 mr-1" /> Open Currency Converter
              </Button>
            </div>
          </div>

          {/* Travel Checklist - Task 10 */}
          <Separator />
          <div className="overflow-hidden">
            <TravelChecklist country={country} />
          </div>

          {/* Budget Calculator - Links to Tools tab instead of duplicating */}
          <div className="overflow-hidden">
            <div className="p-3 rounded-lg border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground mb-2">Estimate your total trip cost to {country.name}</p>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => { setSelectedCountry(null); setActiveTab('tools'); }}>
                <Wallet className="w-3.5 h-3.5 mr-1" /> Open Budget Calculator
              </Button>
            </div>
          </div>

          {/* Similar Countries */}
          <Separator />
          <div className="overflow-hidden">
            <SimilarCountriesPanel country={country} />
          </div>

          {/* Embassy Information */}
          <div className="overflow-hidden">
            <EmbassyInfoSection countryCode={country.code} countryName={country.name} />
          </div>

          {/* Source & Confidence with accent dot */}
          <div className="p-3 rounded-lg border bg-muted/30 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="section-dot" style={{ background: '#fb923c', boxShadow: '0 0 6px rgba(251,146,60,0.4)' }} />
              <span className="font-medium">Data Source</span>
            </div>
            <a href={country.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-amber-500 underline break-all">
              {country.sourceUrl}
            </a>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span>Confidence: {Math.round((country.parserConfidence || 0.8) * 100)}%</span>
              <span>·</span>
              <span>Parser: v{country.parserVersion}</span>
              <span>·</span>
              <span>Fetched: {new Date(country.fetchTimestamp).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ SCORE QUICK VIEW DIALOG ============
export function ScoreQuickViewDialog({ score, open, onClose }: { score: ScoreBreakdown | null; open: boolean; onClose: () => void }) {
  if (!score) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            {score.country} - Full Breakdown
          </DialogTitle>
          <DialogDescription>{score.visaType} · Confidence: {Math.round(score.confidence * 100)}%</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Eligibility', value: score.eligibility },
              { label: 'Likelihood', value: score.visaLikelihood },
              { label: 'Cost Fit', value: score.costSuitability },
              { label: 'Final', value: score.finalScore },
            ].map((item) => (
              <div key={item.label} className="text-center p-2 rounded-lg bg-muted/50">
                <div className={`text-xl font-bold ${item.value >= 70 ? 'text-amber-600' : item.value >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                  {Math.round(item.value)}
                </div>
                <div className="text-[10px] text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Components</h4>
            {score.components.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-32 text-xs text-muted-foreground truncate">{c.name}</span>
                <ColorProgress value={c.score} className="flex-1" />
                <span className="w-10 text-xs text-right font-medium">{Math.round(c.score)}%</span>
                <span className="w-10 text-[10px] text-muted-foreground">×{(c.weight * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
          {score.hardFilters.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Hard Filters</h4>
              {score.hardFilters.map((f, i) => (
                <div key={i} className={`flex items-center gap-2 p-2 rounded text-xs mb-1 ${f.passed ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  {f.passed ? <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> : <XCircle className="w-3.5 h-3.5 text-red-600" />}
                  <span>{f.filter}: {f.message}</span>
                </div>
              ))}
            </div>
          )}
          {score.tips.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Tips</h4>
              {score.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 text-xs mb-1">
                  <Star className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ APPLICATION TIPS PANEL ============
export function ApplicationTipsPanel({ country }: { country: CountryData }) {
  const { userProfile } = useAppStore();
  const profile = userProfile;

  const tips = useMemo(() => {
    if (!profile) {
      return [
        { tip: 'Complete the questionnaire to get personalized tips', severity: 'info' as const },
      ];
    }

    const result: { tip: string; severity: 'critical' | 'warning' | 'success' | 'info' }[] = [];

    // Financial tips
    if (profile.monthlyIncomeUSD < 500 && !profile.hasSponsor) {
      result.push({ tip: 'Your income is low — consider showing additional bank statements or adding a financial sponsor to boost approval chances.', severity: 'warning' });
    }
    if (profile.savingsUSD < 2000) {
      result.push({ tip: 'Low savings detected. Most embassies require 3-6 months of bank statements showing sufficient balance.', severity: 'warning' });
    }

    // Insurance tip
    if (!profile.hasHealthInsurance) {
      result.push({ tip: `Adding travel health insurance will boost your health score by ~80 points and is mandatory for ${country.name}.`, severity: 'critical' });
    }

    // Travel documents
    if (!profile.hasReturnTicket) {
      result.push({ tip: 'Booking a return flight ticket (even a refundable one) significantly improves your purpose-of-travel score.', severity: 'warning' });
    }
    if (!profile.hasHotelBooking) {
      result.push({ tip: 'Hotel booking or a letter of invitation from a host in ' + country.name + ' will strengthen your application.', severity: 'warning' });
    }

    // Education/Language
    if (profile.education === 'other' || !profile.education) {
      result.push({ tip: 'Providing your highest education level helps the qualification score. If you have a degree, make sure to include it.', severity: 'info' });
    }
    if (profile.languages.length <= 1) {
      result.push({ tip: 'Speaking additional languages (especially the destination country language) can improve your language score.', severity: 'info' });
    }

    // Prior travel
    if (!profile.hasPriorTravel) {
      result.push({ tip: 'Having prior travel history to other countries demonstrates you are a genuine traveler and return to your home country.', severity: 'info' });
    }

    // Passport
    if (!profile.passportExpiry || new Date(profile.passportExpiry) < new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)) {
      result.push({ tip: 'Your passport must be valid for at least 6 months beyond your intended stay. Renew it before applying.', severity: 'critical' });
    }

    // Country-specific tips
    if (country.visaFree) {
      result.push({ tip: `Great news! ${country.name} offers visa-free entry for Pakistani passport holders. Just ensure you have a valid passport and return ticket.`, severity: 'success' });
    } else if (country.visaOnArrival) {
      result.push({ tip: `${country.name} offers visa on arrival. Carry printed proof of accommodation, return ticket, and sufficient funds.`, severity: 'success' });
    } else if (country.etaAvailable) {
      result.push({ tip: `${country.name} requires an e-Visa. Apply online at least 2 weeks before travel through the official portal.`, severity: 'info' });
    } else {
      result.push({ tip: `${country.name} requires an embassy visa. Book your appointment early as slots fill quickly. Processing takes ${country.processingDaysMin}-${country.processingDaysMax} days.`, severity: 'info' });
    }

    // Cost
    if (country.costProfile) {
      const monthlyNeed = country.costProfile.totalMonthlyUSD;
      const stayMonths = profile.intendedStayDays / 30;
      if (profile.budgetUSD < monthlyNeed * stayMonths * 0.5) {
        result.push({ tip: `Your budget ($${profile.budgetUSD}) may not cover ${stayMonths.toFixed(1)} months in ${country.name} (estimated $${monthlyNeed * stayMonths}/mo total). Consider a shorter stay or more savings.`, severity: 'warning' });
      }
    }

    return result.slice(0, 6);
  }, [country, profile]);

  const severityStyles = {
    critical: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    warning: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    success: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    info: 'bg-amber-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400',
  };

  const severityIcons = {
    critical: <XCircle className="w-3.5 h-3.5" />,
    warning: <AlertTriangle className="w-3.5 h-3.5" />,
    success: <CheckCircle2 className="w-3.5 h-3.5" />,
    info: <Info className="w-3.5 h-3.5" />,
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        Application Tips for {country.name}
      </h3>
      <div className="space-y-2">
        {tips.map((item, i) => (
          <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs overflow-hidden ${severityStyles[item.severity]}`}>
            <span className="shrink-0 mt-0.5">{severityIcons[item.severity]}</span>
            <span className="min-w-0 break-words">{item.tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ PROFILE STRENGTH METER ============
export function ProfileStrengthMeter({ profile }: { profile: UserProfileData }) {
  const strength = useMemo(() => {
    let filled = 0;
    let total = 0;

    const fields: { label: string; check: boolean }[] = [
      { label: 'Full Name', check: !!profile.fullName },
      { label: 'Age', check: profile.age > 0 },
      { label: 'Gender', check: !!profile.gender },
      { label: 'Passport Number', check: !!profile.passportNumber },
      { label: 'Passport Expiry', check: !!profile.passportExpiry },
      { label: 'Occupation', check: !!profile.occupation },
      { label: 'Monthly Income', check: profile.monthlyIncomeUSD > 0 },
      { label: 'Education', check: !!profile.education && profile.education !== 'other' },
      { label: 'Languages', check: profile.languages.length >= 1 },
      { label: 'Savings', check: profile.savingsUSD > 0 },
      { label: 'Travel Budget', check: profile.budgetUSD > 0 },
      { label: 'Travel Purpose', check: !!profile.travelPurpose },
      { label: 'Return Ticket', check: profile.hasReturnTicket },
      { label: 'Hotel Booking', check: profile.hasHotelBooking },
      { label: 'Health Insurance', check: profile.hasHealthInsurance },
      { label: 'Marital Status', check: !!profile.maritalStatus },
      { label: 'Criminal Record', check: profile.hasCriminalRecord !== undefined },
    ];

    total = fields.length;
    filled = fields.filter(f => f.check).length;

    const missing = fields.filter(f => !f.check).map(f => f.label);

    return {
      percentage: Math.round((filled / total) * 100),
      filled,
      total,
      missing,
    };
  }, [profile]);

  const color = strength.percentage >= 80 ? '#f59e0b' : strength.percentage >= 50 ? '#f59e0b' : '#ef4444';
  const label = strength.percentage >= 80 ? 'Strong' : strength.percentage >= 50 ? 'Moderate' : 'Needs Work';

  return (
    <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <BadgePercent className="w-4 h-4 text-amber-500" />
          Profile Strength
        </h4>
        <Badge variant="outline" className="text-xs" style={{ borderColor: color, color }}>
          {label} · {strength.percentage}%
        </Badge>
      </div>
      <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full profile-gradient-bar"
          style={{ width: `${strength.percentage}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{strength.filled} of {strength.total} fields</span>
        <span className="text-sm font-bold tabular-nums" style={{ color }}>{strength.percentage}%</span>
      </div>
      {strength.missing.length > 0 && strength.missing.length < 10 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Add these to improve your profile:</p>
          <div className="flex flex-wrap gap-1.5">
            {strength.missing.slice(0, 5).map((item, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {item}
              </Badge>
            ))}
            {strength.missing.length > 5 && (
              <Badge variant="secondary" className="text-[10px]">
                +{strength.missing.length - 5} more
              </Badge>
            )}
          </div>
        </div>
      )}
      {strength.missing.length === 0 && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Profile is complete! Ready for scoring.
        </p>
      )}
    </div>
  );
}

// ============ SKELETON COUNTRY CARDS ============
export function SkeletonCountryCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-xl border overflow-hidden">
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full skeleton-shimmer" />
                <div className="space-y-2">
                  <div className="w-24 h-3.5 rounded skeleton-shimmer" />
                  <div className="w-16 h-2.5 rounded skeleton-shimmer" />
                </div>
              </div>
              <div className="w-16 h-5 rounded-full skeleton-shimmer" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-4 rounded skeleton-shimmer" />
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="w-16 h-3 rounded skeleton-shimmer" />
              <div className="w-12 h-3 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="h-[4px] skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}

// ============ CONFETTI ANIMATION ============
export function ConfettiAnimation({ trigger }: { trigger: boolean }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (trigger && !active) {
      setActive(true);
      setTimeout(() => setActive(false), 4000);
    }
  }, [trigger, active]);

  if (!active) return null;

  const colors = ['#f59e0b', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: colors[i % colors.length],
    size: 6 + Math.random() * 8,
  }));

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

// ============ TYPING TEXT ANIMATION ============
export function TypingText({ phrases, className = '' }: { phrases: string[]; className?: string }) {
  const [current, setCurrent] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[current];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(phrase.substring(0, text.length + 1));
        if (text.length === phrase.length) {
          setTimeout(() => setIsDeleting(true), 2200);
        }
      } else {
        setText(phrase.substring(0, text.length - 1));
        if (text.length === 0) {
          setIsDeleting(false);
          setCurrent((current + 1) % phrases.length);
        }
      }
    }, isDeleting ? 25 : 55);
    return () => clearTimeout(timeout);
  }, [text, isDeleting, current, phrases]);

  return (
    <span className={className}>
      {text}
      <span className="inline-block w-[2px] h-[1em] bg-white/80 ml-0.5 align-middle typing-cursor-blink" />
    </span>
  );
}

// ============ HELPERS ============
export function formatCountryCode(code: string): string {
  return code.replace(/([a-z])([A-Z])/g, '$1 $2');
}

// ============ FLOATING PARTICLES (CSS ONLY) ============
export function FloatingParticles() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    left: number;
    size: number;
    delay: number;
    duration: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Client-only initialization for particles to avoid hydration mismatch with random values
    setParticles(Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 2 + Math.random() * 5,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 14,
      opacity: 0.15 + Math.random() * 0.25,
    })));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white/20 particle-float"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

// ============ MINI RADAR CHART (3-axis for country cards) ============
export function MiniRadarChart({ safety, cost, ease }: { safety: number; cost: number; ease: number }) {
  const cx = 28, cy = 28, r = 22;
  const axes = 3;
  const angleStep = (2 * Math.PI) / axes;
  const startAngle = -Math.PI / 2;
  const s = safety / 10;
  const c = Math.max(0.05, 1 - cost / 3000);
  const e = ease;
  const values = [s, c, e];
  const points = values.map((val, i) => {
    const angle = startAngle + i * angleStep;
    return `${cx + val * r * Math.cos(angle)},${cy + val * r * Math.sin(angle)}`;
  }).join(' ');
  const gridLines = [0.33, 0.66, 1].map(level => {
    const pts = Array.from({ length: axes }, (_, i) => {
      const angle = startAngle + i * angleStep;
      return `${cx + level * r * Math.cos(angle)},${cy + level * r * Math.sin(angle)}`;
    }).join(' ');
    return <polygon key={level} points={pts} fill="none" stroke="currentColor" strokeWidth="0.3" className="text-white/20" />;
  });

  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="inline-block opacity-80">
      {gridLines}
      {Array.from({ length: axes }, (_, i) => {
        const angle = startAngle + i * angleStep;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="currentColor" strokeWidth="0.3" className="text-white/20" />;
      })}
      <polygon points={points} fill="rgba(249,115,22,0.15)" stroke="#fbbf24" strokeWidth="1" />
      {values.map((val, i) => {
        const angle = startAngle + i * angleStep;
        return <circle key={i} cx={cx + val * r * Math.cos(angle)} cy={cy + val * r * Math.sin(angle)} r="1.5" fill="#fbbf24" />;
      })}
    </svg>
  );
}

// ============ RADIAL GAUGE (SEMICIRCLE) ============
export function RadialGauge({ score, size = 140 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size - 15;
  const startX = cx - r;
  const endX = cx + r;
  const arcLength = Math.PI * r;
  const filledLength = (score / 100) * arcLength;
  const color = score >= 70 ? '#f59e0b' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 25} viewBox={`0 0 ${size} ${size / 2 + 25}`}>
        <path d={`M ${startX} ${cy} A ${r} ${r} 0 0 1 ${endX} ${cy}`} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" strokeLinecap="round" />
        <path
          d={`M ${startX} ${cy} A ${r} ${r} 0 0 1 ${endX} ${cy}`}
          fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeDasharray={`${arcLength}`}
          strokeDashoffset={arcLength - filledLength}
          className="transition-all duration-1000 ease-out"
        />
        <text x={cx} y={cy - 12} textAnchor="middle" dominantBaseline="middle" style={{ fill: color, fontSize: '28px', fontWeight: 'bold' }}>{Math.round(score)}</text>
        <text x={cx} y={cy + 8} textAnchor="middle" style={{ fill: 'var(--muted-foreground)', fontSize: '10px' }}>Final Score</text>
      </svg>
    </div>
  );
}

// ============ ANIMATED SCORE NUMBER ============
export function AnimatedScoreNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const start = performance.now() + delay;
    const duration = 1200;
    const animate = (now: number) => {
      const elapsed = now - start;
      if (elapsed < 0) { requestAnimationFrame(animate); return; }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, delay]);

  return <span>{displayed}</span>;
}

// ============ VISA DOCUMENT CHECKLIST ============
export function VisaDocumentChecklist({ country }: { country: CountryData }) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const categories = useMemo(() => {
    // Normalize category names from DB to match our standard categories
    const categoryMap: Record<string, string> = {
      passport: 'Identity', photograph: 'Identity', identity: 'Identity',
      financial: 'Financial', bank: 'Financial', income: 'Financial',
      travel: 'Travel', flight: 'Travel', hotel: 'Travel', accommodation: 'Travel',
      health: 'Health', medical: 'Health', vaccination: 'Health', insurance: 'Health',
      employment: 'Supporting', supporting: 'Supporting', education: 'Supporting',
    };
    const cats: Record<string, { name: string; items: { name: string; mandatory: boolean; time: string }[] }> = {
      Identity: { name: 'Identity Documents', items: [] },
      Financial: { name: 'Financial Documents', items: [] },
      Travel: { name: 'Travel Documents', items: [] },
      Health: { name: 'Health Documents', items: [] },
      Supporting: { name: 'Supporting Documents', items: [] },
    };
    // Add DB requirements with normalized category names
    country.requirements.forEach(req => {
      const cat = categoryMap[(req.category || '').toLowerCase()] || 'Supporting';
      if (!cats[cat]) cats[cat] = { name: cat, items: [] };
      cats[cat].items.push({ name: req.requirement, mandatory: req.mandatory, time: req.mandatory ? '1-3 days' : '3-7 days' });
    });
    // Extract keywords from existing DB requirements for dedup
    const existingKeywords = new Set<string>();
    country.requirements.forEach(r => {
      const words = r.requirement.toLowerCase().split(/[\s(),]+/).filter(w => w.length > 3);
      words.forEach(w => existingKeywords.add(w));
    });
    const standard = [
      { cat: 'Identity', name: 'Valid Passport (6+ months validity)', mandatory: true, time: '1-2 weeks', keywords: ['passport', 'valid'] },
      { cat: 'Identity', name: 'Passport-sized Photographs (2x2 inch)', mandatory: true, time: '1 day', keywords: ['photograph', 'passport', 'photo'] },
      { cat: 'Financial', name: 'Bank Statements (last 6 months)', mandatory: true, time: '1-2 days', keywords: ['bank', 'statement', 'financial'] },
      { cat: 'Financial', name: 'Income Tax Returns (last 2 years)', mandatory: false, time: '3-5 days', keywords: ['tax', 'income', 'return'] },
      { cat: 'Financial', name: 'Sponsorship Letter (if applicable)', mandatory: false, time: '2-3 days', keywords: ['sponsor', 'sponsorship'] },
      { cat: 'Travel', name: 'Flight Itinerary / Return Ticket', mandatory: true, time: '1 day', keywords: ['flight', 'return', 'ticket', 'itinerary'] },
      { cat: 'Travel', name: 'Hotel Reservation / Accommodation Proof', mandatory: true, time: '1 day', keywords: ['hotel', 'reservation', 'accommodation'] },
      { cat: 'Travel', name: 'Travel Itinerary (day-by-day plan)', mandatory: false, time: '2-4 hours', keywords: ['itinerary', 'travel', 'plan'] },
      { cat: 'Health', name: 'Travel Health Insurance Certificate', mandatory: true, time: '1-3 days', keywords: ['insurance', 'health'] },
      { cat: 'Health', name: 'Vaccination Certificate (if required)', mandatory: false, time: '1-4 weeks', keywords: ['vaccination', 'vaccine'] },
      { cat: 'Supporting', name: 'Employment Verification Letter', mandatory: false, time: '1-3 days', keywords: ['employment', 'verification', 'letter'] },
      { cat: 'Supporting', name: 'Leave Approval from Employer', mandatory: false, time: '1 day', keywords: ['leave', 'approval'] },
      { cat: 'Supporting', name: 'Cover Letter explaining purpose of visit', mandatory: false, time: '2-4 hours', keywords: ['cover', 'letter', 'purpose'] },
    ];
    // Add standard items only if no similar requirement already exists from DB (keyword-based dedup)
    standard.forEach(item => {
      const hasOverlap = item.keywords.some(kw => existingKeywords.has(kw));
      if (!hasOverlap) {
        cats[item.cat].items.push({ name: item.name, mandatory: item.mandatory, time: item.time });
      }
    });
    return Object.entries(cats).filter(([, v]) => v.items.length > 0);
  }, [country]);

  const allItems = categories.flatMap(([, v]) => v.items);
  const progress = allItems.length > 0 ? (checked.size / allItems.length) * 100 : 0;
  const toggle = (key: string) => {
    setChecked(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2"><ClipboardList className="w-4 h-4 text-amber-500" /> Document Checklist</h3>
        <Badge variant="outline" className="text-xs">{Math.round(progress)}%</Badge>
      </div>
      <ColorProgress value={progress} />
      <ScrollArea className="max-h-64">
        <div className="space-y-3 pr-2">
          {categories.map(([catKey, cat]) => (
            <div key={catKey}>
              <h5 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{cat.name}</h5>
              <div className="space-y-1">
                {cat.items.map((item, idx) => {
                  const key = `${catKey}-${idx}`;
                  const isChecked = checked.has(key);
                  return (
                    <label key={key} className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors text-xs min-w-0 ${isChecked ? 'bg-muted/50' : 'hover:bg-muted/30'}`}>
                      <Checkbox checked={isChecked} onCheckedChange={() => toggle(key)} className="w-3.5 h-3.5 shrink-0" />
                      <span className={`flex-1 min-w-0 truncate ${isChecked ? 'line-through text-muted-foreground' : ''}`}>{item.name}</span>
                      <Badge variant={item.mandatory ? 'default' : 'secondary'} className="text-[8px] px-1 py-0 shrink-0">{item.mandatory ? 'Required' : 'Optional'}</Badge>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap hidden sm:inline shrink-0">{item.time}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============ TRAVEL COST CALCULATOR (ENHANCED) ============
export function TravelCostCalculator({ country }: { country: CountryData }) {
  const { saveBudget } = useAppStore();
  const [days, setDays] = useState(14);
  const [tier, setTier] = useState<'budget' | 'moderate' | 'luxury'>('moderate');
  const [foodPerDay, setFoodPerDay] = useState(25);
  const [transportPerDay, setTransportPerDay] = useState(15);
  const [activities, setActivities] = useState(100);
  const cp = country.costProfile;
  if (!cp) return null;

  const tierMultipliers = { budget: 0.6, moderate: 1, luxury: 1.8 };
  const tierMultiplier = tierMultipliers[tier];
  const daysRatio = days / 30;
  const accommodationCost = (cp.monthlyRentUSD || 300) * daysRatio * tierMultiplier;
  const foodCost = foodPerDay * days;
  const transportCost = transportPerDay * days;
  const visaFee = cp.visaFeeUSD;
  const insuranceEstimate = Math.max(2, Math.ceil(days / 30)) * (cp.healthInsuranceUSD || 30);
  const exchangeRate = EXCHANGE_RATES[country.currencyCode] || 278.5;

  const breakdown = [
    { name: 'Visa Fee', value: visaFee, color: '#f59e0b' },
    { name: 'Accommodation', value: accommodationCost, color: '#f59e0b' },
    { name: 'Food', value: foodCost, color: '#f97316' },
    { name: 'Transport', value: transportCost, color: '#f97316' },
    { name: 'Activities', value: activities, color: '#8b5cf6' },
    { name: 'Insurance', value: insuranceEstimate, color: '#ec4899' },
  ];
  const grandTotal = breakdown.reduce((s, b) => s + b.value, 0);
  const totalPKR = Math.round(grandTotal * exchangeRate);

  // Donut chart params
  const donutR = 50;
  const donutC = 2 * Math.PI * donutR;
  let cumulativeOffset = 0;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-amber-500" /> Travel Cost Calculator</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label className="text-xs">Trip Duration</Label><span className="text-xs font-mono font-medium">{days} days</span></div>
          <Slider value={[days]} onValueChange={v => setDays(v[0])} min={1} max={90} step={1} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Accommodation Tier</Label>
          <div className="flex gap-1">
            {(['budget', 'moderate', 'luxury'] as const).map(t => (
              <Button key={t} size="sm" variant={tier === t ? 'default' : 'outline'} className={`flex-1 text-xs capitalize ${tier === t ? 'bg-amber-600 hover:bg-amber-700' : ''}`} onClick={() => setTier(t)}>{t}</Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label className="text-xs">Food Budget</Label><span className="text-xs font-mono font-medium">${foodPerDay}/day</span></div>
          <Slider value={[foodPerDay]} onValueChange={v => setFoodPerDay(v[0])} min={10} max={100} step={5} />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label className="text-xs">Transport</Label><span className="text-xs font-mono font-medium">${transportPerDay}/day</span></div>
          <Slider value={[transportPerDay]} onValueChange={v => setTransportPerDay(v[0])} min={5} max={50} step={5} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between"><Label className="text-xs">Activities</Label><span className="text-xs font-mono font-medium">${activities}/trip</span></div>
          <Slider value={[activities]} onValueChange={v => setActivities(v[0])} min={0} max={200} step={10} />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        {/* Donut Chart */}
        <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
          {breakdown.map((item, i) => {
            const pct = grandTotal > 0 ? item.value / grandTotal : 0;
            const dashLen = donutC * pct;
            const offset = donutC - cumulativeOffset;
            cumulativeOffset += dashLen;
            return (
              <circle
                key={i}
                cx="60" cy="60" r={donutR}
                fill="none"
                stroke={item.color}
                strokeWidth="14"
                strokeDasharray={`${dashLen} ${donutC - dashLen}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                transform="rotate(-90 60 60)"
                className="donut-segment-animated"
                opacity="0.85"
              />
            );
          })}
          <text x="60" y="56" textAnchor="middle" className="text-sm font-bold" fill="var(--foreground)" fontSize="14" fontWeight="bold">${Math.round(grandTotal)}</text>
          <text x="60" y="70" textAnchor="middle" fill="var(--muted-foreground)" fontSize="8">Total</text>
        </svg>
        {/* Breakdown list */}
        <div className="flex-1 space-y-2 w-full">
          {breakdown.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-medium">${Math.round(item.value).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between font-bold text-base pt-2 border-t">
        <span className="text-amber-600 dark:text-amber-400">Grand Total</span>
        <span className="text-amber-600 dark:text-amber-400">${Math.round(grandTotal).toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>≈ PKR {totalPKR.toLocaleString()}</span>
        <span className="text-[10px]">Rate: 1 {country.currencyCode} = {exchangeRate} PKR</span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs"
        onClick={() => {
          saveBudget(country.code, { duration: days, tier, foodPerDay, transportPerDay, activities });
          toast.success(`Budget saved for ${country.name}!`);
        }}
      >
        <Save className="w-3 h-3 mr-1" />
        Save Budget
      </Button>
    </div>
  );
}

// ============ COMPARISON RADAR CHART ============
export function ComparisonRadarChart({ results }: { results: ScoreBreakdown[] }) {
  if (results.length < 2) return null;
  const labels = results[0].components.map(c => c.name);
  const numAxes = labels.length;
  const cx = 150, cy = 150, maxR = 100;
  const angleStep = (2 * Math.PI) / numAxes;
  const startAngle = -Math.PI / 2;
  const colors = ['#f59e0b', '#f59e0b', '#f97316', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
      <h4 className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-amber-500" /> Radar Comparison</h4>
      <div className="flex justify-center">
        <svg width="300" height="300" viewBox="0 0 300 300">
          {[0.25, 0.5, 0.75, 1].map(level => {
            const pts = Array.from({ length: numAxes }, (_, i) => {
              const angle = startAngle + i * angleStep;
              return `${cx + level * maxR * Math.cos(angle)},${cy + level * maxR * Math.sin(angle)}`;
            }).join(' ');
            return <polygon key={level} points={pts} fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/15" />;
          })}
          {Array.from({ length: numAxes }, (_, i) => {
            const angle = startAngle + i * angleStep;
            return <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(angle)} y2={cy + maxR * Math.sin(angle)} stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/15" />;
          })}
          {results.map((r, rIdx) => {
            const pts = r.components.map((c, i) => {
              const angle = startAngle + i * angleStep;
              const val = c.score / 100;
              return `${cx + val * maxR * Math.cos(angle)},${cy + val * maxR * Math.sin(angle)}`;
            }).join(' ');
            return <polygon key={rIdx} points={pts} fill={colors[rIdx % colors.length]} fillOpacity="0.12" stroke={colors[rIdx % colors.length]} strokeWidth="2" />;
          })}
          {labels.map((label, i) => {
            const angle = startAngle + i * angleStep;
            const lx = cx + (maxR + 18) * Math.cos(angle);
            const ly = cy + (maxR + 18) * Math.sin(angle);
            return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" style={{ fill: 'var(--muted-foreground)', fontSize: '8px' }}>{label.length > 14 ? label.substring(0, 14) + '…' : label}</text>;
          })}
        </svg>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        {results.map((r, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} /><span>{r.country}</span></div>
        ))}
      </div>
    </div>
  );
}

// ============ SCORING HISTORY PANEL ============
interface ScoringSession { id: string; date: string; profile: { age: number; occupation: string; purpose: string }; topCountries: string[]; scores: ScoreBreakdown[]; }
export function ScoringHistoryPanel({ onReload }: { onReload: (scores: ScoreBreakdown[]) => void }) {
  const [history, setHistory] = useState<ScoringSession[]>(() => {
    try { const stored = localStorage.getItem(SCORING_HISTORY_KEY); return stored ? JSON.parse(stored) : []; } catch { return []; }
  });
  const reloadSession = (session: ScoringSession) => {
    onReload(session.scores);
    toast.success(`Loaded ${session.scores.length} results from ${new Date(session.date).toLocaleDateString()}`);
  };
  const clearHistory = () => { setHistory([]); try { localStorage.removeItem(SCORING_HISTORY_KEY); } catch { /* empty */ } toast.success('History cleared'); };

  if (history.length === 0) {
    return (
      <Card className="p-6 text-center">
        <History className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
        <h4 className="text-sm font-semibold">No Scoring History</h4>
        <p className="text-xs text-muted-foreground mt-1">Complete a questionnaire to start tracking your assessments.</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><History className="w-4 h-4 text-amber-500" /> Recent Assessments</CardTitle>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={clearHistory}><RotateCcw className="w-3 h-3 mr-1" /> Clear</Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-64">
          <div className="space-y-2">
            {history.slice(0, 5).map((session) => (
              <button key={session.id} className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors" onClick={() => reloadSession(session)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium">{new Date(session.date).toLocaleString()}</span>
                  <Badge variant="outline" className="text-[9px]">{session.scores.length} countries</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground">Age {session.profile.age} · {session.profile.occupation} · {session.profile.purpose}</div>
                <div className="flex gap-1 mt-1.5 flex-wrap">{session.topCountries.map((c, i) => (<Badge key={i} variant="secondary" className="text-[9px]">{i + 1}. {c}</Badge>))}</div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ============ SMART QUICK SEARCH ============
export function SmartQuickSearch() {
  const { setSelectedCountry, setActiveTab } = useAppStore();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [countries, setCountries] = useState<{ code: string; name: string; flagEmoji: string; flagUrl: string; visaType: string }[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { const stored = localStorage.getItem(RECENT_SEARCHES_KEY); return stored ? JSON.parse(stored) : []; } catch { return []; }
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/countries?limit=100').then(r => r.json()).then(data => {
      setCountries((data.data || []).map((c: CountryData) => ({ code: c.code, name: c.name, flagEmoji: c.flagEmoji, flagUrl: c.flagUrl || '', visaType: c.visaFree ? 'Visa Free' : c.visaOnArrival ? 'On Arrival' : c.etaAvailable ? 'e-Visa' : 'Embassy' })));
    }).catch(() => {});
    const handleClick = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = query.length > 0 ? countries.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.code.toLowerCase().includes(query.toLowerCase())).slice(0, 6) : [];

  const handleSelect = async (code: string) => {
    const updated = [code, ...recentSearches.filter(c => c !== code)].slice(0, 5);
    setRecentSearches(updated);
    try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)); } catch { /* empty */ }
    try {
      const res = await fetch(`/api/countries/${code}`);
      const data = await res.json();
      if (data.data) { setSelectedCountry(data.data); setActiveTab('explore'); }
    } catch { /* empty */ }
    setQuery(''); setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalItems = filtered.length + (query.length === 0 ? recentSearches.length : 0);
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, totalItems - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      if (query.length === 0 && recentSearches[highlighted]) handleSelect(recentSearches[highlighted]);
      else if (filtered[highlighted]) handleSelect(filtered[highlighted].code);
    } else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  return (
    <div ref={containerRef} className="relative hidden md:block">
      <div className="search-input-expand relative rounded-lg border border-border bg-background">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input ref={inputRef} type="text" placeholder="Quick search... (Ctrl+K)" value={query} onChange={e => { setQuery(e.target.value); setOpen(true); setHighlighted(0); }} onFocus={() => setOpen(true)} onKeyDown={handleKeyDown} className="w-48 focus:w-72 pl-8 pr-7 py-1.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground" />
        {query && <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-muted-foreground hover:text-foreground" /></button>}
      </div>
      {open && (filtered.length > 0 || (query.length === 0 && recentSearches.length > 0)) && (
        <div className="absolute top-full mt-1 left-0 w-72 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
          {query.length === 0 && recentSearches.length > 0 && (
            <>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recent Searches</div>
              {recentSearches.map((code, i) => {
                const c = countries.find(x => x.code === code);
                if (!c) return null;
                return (<button key={code} className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors ${highlighted === i ? 'bg-muted/50' : ''}`} onClick={() => handleSelect(code)} onMouseEnter={() => setHighlighted(i)}><FlagImage code={c.code} flagUrl={c.flagUrl} size={20} emoji={c.flagEmoji} /><span className="flex-1 truncate">{c.name}</span><Badge variant="outline" className="text-[9px]">{c.visaType}</Badge></button>);
              })}
            </>
          )}
          {filtered.length > 0 && (
            <>
              {query.length > 0 && <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Countries</div>}
              {filtered.map((c, i) => (
                <button key={c.code} className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted/50 transition-colors ${highlighted === (query.length === 0 ? recentSearches.length + i : i) ? 'bg-muted/50' : ''}`} onClick={() => handleSelect(c.code)} onMouseEnter={() => setHighlighted(query.length === 0 ? recentSearches.length + i : i)}>
                  <FlagImage code={c.code} flagUrl={c.flagUrl} size={20} emoji={c.flagEmoji} /><span className="flex-1 truncate">{c.name}</span><Badge variant="outline" className="text-[9px]">{c.visaType}</Badge>
                  <div className="flex gap-1 ml-auto pl-2"><span className="p-0.5 rounded hover:bg-muted cursor-pointer" onClick={e => { e.stopPropagation(); handleSelect(c.code); }} title="View Details"><Eye className="w-3 h-3 text-muted-foreground" /></span></div>
                </button>
              ))}
            </>
          )}
          <div className="border-t px-3 py-1.5"><p className="text-[10px] text-muted-foreground">↑↓ Navigate · Enter Select · Esc Close</p></div>
        </div>
      )}
    </div>
  );
}

// ============ CHECK FLASH INDICATOR ============
export function CheckFlash({ show }: { show: boolean }) {
  if (!show) return null;
  return <span className="check-flash absolute right-2 top-1/2 -translate-y-1/2 text-amber-500"><CheckCircle2 className="w-4 h-4" /></span>;
}

// ============ ANIMATED SCORE RING ============
export function AnimatedScoreRing({ score, size = 80, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#f59e0b' : score >= 40 ? '#f59e0b' : '#ef4444';
  const [animatedOffset, setAnimatedOffset] = useState(circumference);
  const isHighScore = score > 80;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedOffset(offset), 100);
    return () => clearTimeout(timer);
  }, [offset, circumference]);

  return (
    <div className="flex flex-col items-center gap-1 relative">
      <div className={isHighScore ? 'score-pulse rounded-full' : ''}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={animatedOffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{Math.round(score)}</span>
        </div>
      </div>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

// ============ MICRO SPARKLINE ============
export function MicroSparkline({ data, color, width = 60, height = 20 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data);
  const minVal = Math.min(...data);
  const range = maxVal - minVal || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - minVal) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const lineColor = color || (data[data.length - 1] >= data[0] ? '#f59e0b' : '#ef4444');
  return (
    <svg width={width} height={height} className="inline-block" aria-hidden="true">
      <polyline points={points} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============ VISA TIMELINE ESTIMATOR ============
export function VisaTimelineEstimator({ country }: { country: CountryData }) {
  const today = new Date();
  const procMin = country.processingDaysMin || 5;
  const procMax = country.processingDaysMax || 30;
  const prepDays = Math.max(7, Math.round(procMin * 0.6));
  const avgProcDays = Math.round((procMin + procMax) / 2);

  const stages = [
    { id: 'prep', label: 'Preparation', icon: Lightbulb, start: 0, end: prepDays, color: '#f59e0b', desc: 'Gather documents, photos, forms' },
    { id: 'submit', label: 'Submission', icon: Send, start: prepDays, end: prepDays + 2, color: '#f97316', desc: 'Submit at embassy/online' },
    { id: 'proc', label: 'Processing', icon: Clock, start: prepDays + 2, end: prepDays + 2 + avgProcDays, color: '#8b5cf6', desc: `${procMin}-${procMax} business days` },
    { id: 'decision', label: 'Decision', icon: CheckCircle2, start: prepDays + 2 + avgProcDays, end: prepDays + 2 + avgProcDays + 3, color: '#f59e0b', desc: 'Receive visa decision' },
  ];

  const totalDays = stages[stages.length - 1].end;
  const earliestArrival = new Date(today); earliestArrival.setDate(today.getDate() + stages[1].end);
  const latestDecision = new Date(today); latestDecision.setDate(today.getDate() + totalDays);

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <CalendarClock className="w-4 h-4 text-violet-500" />
        Visa Timeline Estimator
        <Badge variant="secondary" className="text-[10px]">~{totalDays} days total</Badge>
      </h3>
      {/* Timeline Bar */}
      <div className="relative">
        <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
          {stages.map((s) => (
            <div key={s.id} className="relative flex-1 group" style={{ backgroundColor: s.color }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <s.icon className="w-3.5 h-3.5 text-white drop-shadow" />
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-md bg-popover border shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <span className="font-medium">{s.label}</span>
                <br /><span className="text-muted-foreground">{s.desc}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
          {stages.map((s) => (
            <span key={s.id}>Day {s.start}</span>
          ))}
          <span>Day {totalDays}</span>
        </div>
      </div>
      {/* Key dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2.5 rounded-lg border bg-muted/30 text-center">
          <div className="text-[10px] text-muted-foreground">Earliest Submission</div>
          <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">{formatDate(earliestArrival)}</div>
        </div>
        <div className="p-2.5 rounded-lg border bg-muted/30 text-center">
          <div className="text-[10px] text-muted-foreground">Expected Decision By</div>
          <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">{formatDate(latestDecision)}</div>
        </div>
      </div>
    </div>
  );
}

// ============ SIMILAR COUNTRIES PANEL ============
export function SimilarCountriesPanel({ country }: { country: CountryData }) {
  const { countries, setSelectedCountry } = useAppStore();

  const similar = useMemo(() => {
    const allCountries = countries || [];
    return allCountries
      .filter(c => c.code !== country.code)
      .filter(c => {
        // Same visa difficulty category
        const isFree = c.visaFree || c.visaOnArrival || c.etaAvailable;
        const isTargetFree = country.visaFree || country.visaOnArrival || country.etaAvailable;
        if (isFree !== isTargetFree) return false;
        // Same continent or similar safety rating
        if (c.continent === country.continent) return true;
        if (Math.abs(c.safetyRating - country.safetyRating) <= 1) return true;
        if (Math.abs((c.costProfile?.totalMonthlyUSD || 1000) - (country.costProfile?.totalMonthlyUSD || 1000)) <= 300) return true;
        return false;
      })
      .slice(0, 4);
  }, [countries, country]);

  if (similar.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Globe className="w-4 h-4 text-sky-500" />
        Similar Countries
        <Badge variant="secondary" className="text-[10px]">{similar.length} matches</Badge>
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {similar.map((c) => {
          const visaStatus = c.visaFree ? 'Visa Free' : c.visaOnArrival ? 'On Arrival' : c.etaAvailable ? 'e-Visa' : 'Embassy';
          const statusColor = c.visaFree ? 'text-amber-600' : c.visaOnArrival ? 'text-amber-600' : c.etaAvailable ? 'text-amber-600' : 'text-red-600';
          return (
            <button
              key={c.code}
              onClick={() => setSelectedCountry(c)}
              className="flex items-center gap-2 p-2 rounded-lg border text-left hover:bg-muted/50 hover:shadow-sm transition-all cursor-pointer"
            >
              <FlagImage code={c.code} flagUrl={c.flagUrl} size={24} emoji={c.flagEmoji} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{c.name}</p>
                <p className={`text-[10px] ${statusColor}`}>{visaStatus}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============ EMBASSY INFO SECTION ============
export function EmbassyInfoSection({ countryCode, countryName }: { countryCode: string; countryName: string }) {
  const embassy = EMBASSY_DATA[countryCode] || GENERIC_EMBASSY;
  const hasNote = 'note' in embassy && embassy.note;
  return (
    <div className="p-4 rounded-lg border bg-muted/30 space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Building className="w-4 h-4 text-amber-500" />
        Embassy & Consulate Information
      </h3>
      {hasNote && (
        <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span className="text-xs text-amber-700 dark:text-amber-400 break-words">{embassy.note}</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-start gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="break-words min-w-0">{embassy.address}</span>
        </div>
        <div className="flex items-start gap-2 min-w-0">
          <Phone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="break-words min-w-0">{embassy.phone}</span>
        </div>
        <div className="flex items-start gap-2 min-w-0">
          <Mail className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-xs break-all min-w-0">{embassy.email}</span>
        </div>
        <div className="flex items-start gap-2 min-w-0">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="break-words min-w-0">{embassy.hours}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" className="text-xs" asChild>
          <a href={embassy.website} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-3 h-3 mr-1" /> Official Website
          </a>
        </Button>
        <Button variant="outline" size="sm" className="text-xs bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800" asChild>
          <a href={embassy.appointmentUrl} target="_blank" rel="noopener noreferrer">
            <Calendar className="w-3 h-3 mr-1" /> Book Appointment
          </a>
        </Button>
      </div>
    </div>
  );
}

// ============ DESTINATION DISCOVERY PANEL ============
export function DestinationDiscoveryPanel({ countries, onSelectCountry }: { countries: CountryData[]; onSelectCountry: (c: CountryData) => void }) {
  const { userProfile } = useAppStore();

  const recommendations = useMemo(() => {
    const popular = countries
      .filter(c => c.visaFree || c.visaOnArrival)
      .sort((a, b) => b.safetyRating - a.safetyRating)
      .slice(0, 5);
    return popular;
  }, [countries]);

  if (recommendations.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-semibold">
          {userProfile ? 'Recommended for You' : 'Popular Destinations'}
        </h2>
        <Badge variant="secondary" className="text-[10px]">Visa-Free & On-Arrival</Badge>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {recommendations.map((country, idx) => {
          const visaStatus = country.visaFree ? 'Visa Free' : 'On Arrival';
          const statusColor = country.visaFree ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400';
          return (
            <motion.div
              key={country.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.03 }}
            >
              <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 group" onClick={() => onSelectCountry(country)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <FlagImage code={country.code} flagUrl={country.flagUrl} size={28} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{country.name}</p>
                      <Badge className={`${statusColor} text-[9px]`} variant="secondary">{visaStatus}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                    <div className="text-center">
                      <Shield className="w-3 h-3 mx-auto mb-0.5 text-amber-500" />
                      <span>{country.safetyRating}/10</span>
                    </div>
                    <div className="text-center">
                      <DollarSign className="w-3 h-3 mx-auto mb-0.5 text-amber-500" />
                      <span>${country.costProfile?.totalMonthlyUSD || 0}</span>
                    </div>
                    <div className="text-center">
                      <Thermometer className="w-3 h-3 mx-auto mb-0.5 text-orange-500" />
                      <span>{country.avgTempC}°C</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full text-xs btn-glow">
                    <Zap className="w-3 h-3 mr-1" /> Quick Score
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============ APPLICATION TIMELINE TRACKER ============
export function ApplicationTimelineTracker() {
  const [checkedStages, setCheckedStages] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const toggleStage = (stageId: string) => {
    setCheckedStages(prev => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  const toggleItem = (key: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const totalItems = TIMELINE_STAGES.reduce((sum, s) => sum + s.items.length, 0);
  const completedItems = checkedItems.size;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Application Progress</span>
          <span className="text-muted-foreground">{completedItems}/{totalItems} completed</span>
        </div>
        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: getScoreGradient(progress) }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {progress === 100 && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> All stages complete! Ready for submission.
          </p>
        )}
      </div>

      <div className="relative space-y-0">
        {TIMELINE_STAGES.map((stage, stageIdx) => {
          const stageComplete = checkedStages.has(stage.id);
          const stageItemsComplete = stage.items.filter((_, i) => checkedItems.has(`${stage.id}-${i}`)).length;
          const isLast = stageIdx === TIMELINE_STAGES.length - 1;
          return (
            <Fragment key={stage.id}>
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => toggleStage(stage.id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                      stageComplete
                        ? 'bg-amber-600 border-amber-600 text-white timeline-dot-active'
                        : 'bg-background border-muted-foreground/30 text-muted-foreground hover:border-amber-400'
                    }`}
                  >
                    {stageComplete ? <CheckCircle2 className="w-5 h-5" /> : React.createElement(stage.icon, { className: 'w-4 h-4' })}
                  </button>
                  {!isLast && (
                    <div className={`w-0.5 flex-1 min-h-[20px] transition-colors ${stageComplete ? 'bg-amber-500' : 'bg-muted-foreground/20'}`} />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-semibold ${stageComplete ? 'text-amber-600' : ''}`}>{stage.title}</h4>
                    <span className="text-[10px] text-muted-foreground">{stageItemsComplete}/{stage.items.length}</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {stage.items.map((item, itemIdx) => {
                      const key = `${stage.id}-${itemIdx}`;
                      const checked = checkedItems.has(key);
                      return (
                        <label key={key} className="flex items-center gap-2 cursor-pointer group">
                          <Checkbox checked={checked} onCheckedChange={() => toggleItem(key)} className="w-3.5 h-3.5" />
                          <span className={`text-xs transition-colors ${checked ? 'line-through text-muted-foreground' : 'group-hover:text-amber-600'}`}>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ============ VISA FEE COMPARISON CHART ============
export function VisaFeeComparisonChart({ results }: { results: ScoreBreakdown[] }) {
  if (results.length === 0) return null;
  const metrics = [
    { label: 'Eligibility', key: 'eligibility' as const, color: '#f59e0b' },
    { label: 'Visa Likelihood', key: 'visaLikelihood' as const, color: '#f97316' },
    { label: 'Cost Suitability', key: 'costSuitability' as const, color: '#f59e0b' },
  ];
  const maxScore = 100;
  return (
    <div className="space-y-4 p-4 rounded-lg border bg-muted/30">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-amber-500" />
        Side-by-Side Comparison
      </h4>
      {metrics.map(metric => (
        <div key={metric.key}>
          <p className="text-xs font-medium text-muted-foreground mb-2">{metric.label}</p>
          <div className="space-y-1.5">
            {results.map((r) => (
              <div key={r.country} className="flex items-center gap-2">
                <span className="w-20 text-xs truncate text-muted-foreground shrink-0">{r.country}</span>
                <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                  <motion.div
                    className="h-full rounded bar-animated"
                    style={{ backgroundColor: metric.color, width: `${(r[metric.key] / maxScore) * 100}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(r[metric.key] / maxScore) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  />
                </div>
                <span className="w-10 text-xs text-right font-mono">{Math.round(r[metric.key])}%</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

