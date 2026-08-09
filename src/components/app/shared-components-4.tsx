'use client';

import React, { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, ShieldCheck, DollarSign, Clock, FileWarning,
  Globe, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck,
  PlaneTakeoff, FileText, MapPin, Phone, Wifi, Banknote,
  Building, AlertCircle, Briefcase, GraduationCap, Users, RotateCcw,
  ExternalLink, Shield, TrendingUp, BarChart3, Map as MapIcon,
  User, Wallet, FileCheck, ArrowRight, Sparkles, Lightbulb,
  Search, HelpCircle, BookOpen, Plane, CheckCircle, UserCircle,
  AlertTriangle, CircleCheckBig, X, ChevronUp, Calendar, Download, Plus, Trash2, Compass, SearchX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { CountryData, UserProfileData } from '@/lib/types';
import type { TripDestination } from '@/lib/store';
import { getFlagUrl } from './constants';
import Image from 'next/image';

// ============================================================
// Feature 1: VisaPolicyChangeTracker
// ============================================================

type ChangeType = 'visa-free' | 'fee-change' | 'processing' | 'requirement' | 'evisa';

interface PolicyChangeEntry {
  id: string;
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  flagUrl: string;
  changeType: ChangeType;
  title: string;
  description: string;
  detail: string;
  daysAgo: number;
}

const CHANGE_TYPE_CONFIG: Record<ChangeType, { label: string; color: string; dotClass: string; badgeClass: string }> = {
  'visa-free': { label: 'New Visa-Free', color: 'text-green-600 dark:text-green-400', dotClass: 'bg-green-500', badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-green-200 dark:border-green-800' },
  'fee-change': { label: 'Fee Change', color: 'text-amber-600 dark:text-amber-400', dotClass: 'bg-amber-500', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  'processing': { label: 'Processing Update', color: 'text-orange-600 dark:text-orange-400', dotClass: 'bg-orange-500', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
  'requirement': { label: 'New Requirement', color: 'text-red-600 dark:text-red-400', dotClass: 'bg-red-500', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-red-200 dark:border-red-800' },
  'evisa': { label: 'e-Visa Launch', color: 'text-emerald-600 dark:text-emerald-400', dotClass: 'bg-emerald-500', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
};

function relativeTime(daysAgo: number): string {
  if (daysAgo === 0) return 'Today';
  if (daysAgo === 1) return 'Yesterday';
  if (daysAgo < 7) return `${daysAgo} days ago`;
  if (daysAgo < 14) return '1 week ago';
  if (daysAgo < 21) return `${Math.floor(daysAgo / 7)} weeks ago`;
  if (daysAgo < 30) return '3 weeks ago';
  if (daysAgo < 45) return '1 month ago';
  return `${Math.floor(daysAgo / 30)} months ago`;
}

function generatePolicyChanges(countries: CountryData[]): PolicyChangeEntry[] {
  if (!countries || countries.length === 0) return [];

  const entries: PolicyChangeEntry[] = [];
  const used = new Set<string>();
  const timestamps = [0, 1, 2, 3, 5, 7, 10, 14, 21, 28, 35, 42, 49, 56];

  // Pick visa-free countries
  const vfCountries = countries.filter(c => c.visaFree);
  const voaCountries = countries.filter(c => c.visaOnArrival && !c.visaFree);
  const etaCountries = countries.filter(c => c.etaAvailable && !c.visaFree && !c.visaOnArrival);
  const embassyCountries = countries.filter(c => !c.visaFree && !c.visaOnArrival && !c.etaAvailable);

  const pick = (list: CountryData[]) => {
    for (const c of list) {
      if (!used.has(c.code) && entries.length < 10) return c;
    }
    return null;
  };

  // Visa-free entries (2-3)
  for (let i = 0; i < 3; i++) {
    const c = pick(vfCountries);
    if (!c) break;
    used.add(c.code);
    entries.push({
      id: `vf-${c.code}`, countryCode: c.code, countryName: c.name,
      flagEmoji: c.flagEmoji, flagUrl: c.flagUrl,
      changeType: 'visa-free',
      title: 'Visa-free access confirmed',
      description: `Pakistan passport holders enjoy visa-free entry to ${c.name} for up to ${c.visaTypes?.[0]?.maxDuration || '30 days'}.`,
      detail: `This visa-free arrangement allows Pakistani citizens to enter ${c.name} without any prior visa application. Ensure your passport has at least 6 months validity. Best travel months: ${c.bestTravelMonths}. Average temperature: ${c.avgTempC}°C.`,
      daysAgo: timestamps[entries.length] ?? 10,
    });
  }

  // VOA entries (1-2)
  for (let i = 0; i < 2; i++) {
    const c = pick(voaCountries);
    if (!c) break;
    used.add(c.code);
    entries.push({
      id: `voa-${c.code}`, countryCode: c.code, countryName: c.name,
      flagEmoji: c.flagEmoji, flagUrl: c.flagUrl,
      changeType: 'processing',
      title: 'Visa on arrival policy updated',
      description: `${c.name} has streamlined its VOA process. Processing now takes approximately ${c.processingDaysMin}-${c.processingDaysMax} business days.`,
      detail: `Pakistan passport holders can obtain a visa on arrival at ${c.name} ports of entry. The fee is approximately $${c.costProfile?.visaFeeUSD || 'varies'}. Maximum stay: ${c.visaTypes?.[0]?.maxDuration || '30 days'}. Extensions may be available.`,
      daysAgo: timestamps[entries.length] ?? 15,
    });
  }

  // e-Visa entries (2)
  for (let i = 0; i < 2; i++) {
    const c = pick(etaCountries);
    if (!c) break;
    used.add(c.code);
    entries.push({
      id: `eta-${c.code}`, countryCode: c.code, countryName: c.name,
      flagEmoji: c.flagEmoji, flagUrl: c.flagUrl,
      changeType: 'evisa',
      title: 'e-Visa/eTA system launched',
      description: `${c.name} has launched an electronic visa system for Pakistani passport holders. Apply online before travel.`,
      detail: `The new e-Visa portal allows Pakistanis to apply for a ${c.name} visa entirely online. Processing time: ${c.processingDaysMin}-${c.processingDaysMax} days. Fee: $${c.costProfile?.visaFeeUSD || 'TBD'}. Required documents: valid passport, photographs, and travel itinerary.`,
      daysAgo: timestamps[entries.length] ?? 20,
    });
  }

  // Embassy/fee entries (2-3)
  for (let i = 0; i < 3; i++) {
    const c = pick([...embassyCountries, ...etaCountries, ...voaCountries]);
    if (!c) break;
    used.add(c.code);
    const isFee = i % 2 === 0;
    entries.push({
      id: `emb-${c.code}`, countryCode: c.code, countryName: c.name,
      flagEmoji: c.flagEmoji, flagUrl: c.flagUrl,
      changeType: isFee ? 'fee-change' : 'requirement',
      title: isFee ? 'Visa fee adjustment' : 'New document requirement added',
      description: isFee
        ? `${c.name} has adjusted its visa fee to $${c.costProfile?.visaFeeUSD || 'updated rate'} (previously $${Math.max(1, (c.costProfile?.visaFeeUSD || 50) - 10)}). Service fee: $${c.costProfile?.serviceFeeUSD || 'varies'}.`
        : `${c.name} now requires additional documentation: ${c.requirements?.[0]?.requirement || 'updated proof of funds'} for all visa applications.`,
      detail: isFee
        ? `The revised fee structure for ${c.name} visas: Visa fee $${c.costProfile?.visaFeeUSD || 'TBD'}, Service fee $${c.costProfile?.serviceFeeUSD || 'TBD'}. Health insurance: $${c.costProfile?.healthInsuranceUSD || 'N/A'}. Budget estimate: $${c.costProfile?.totalMonthlyUSD || 'TBD'}/month for living expenses. `
        : `Updated requirements for ${c.name}: ${c.requirements?.slice(0, 3).map(r => r.requirement).join(', ') || 'Standard documentation'}. Processing time: ${c.processingDaysMin}-${c.processingDaysMax} business days. Check official sources for the most current information.`,
      daysAgo: timestamps[entries.length] ?? 25,
    });
  }

  return entries.slice(0, 10);
}

export const VisaPolicyChangeTracker = React.memo(function VisaPolicyChangeTracker({ countries }: { countries: CountryData[] }) {
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const entries = useMemo(() => generatePolicyChanges(countries), [countries]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  // Mobile: horizontal scroll cards
  if (isMobile) {
    return (
      <Card className="card-elevated-1 glass-card overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="text-lg">🛂</span>
              Recent Visa Policy Updates
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 text-amber-500 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar-thin">
            {entries.map((entry, idx) => {
              const cfg = CHANGE_TYPE_CONFIG[entry.changeType];
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.3 }}
                  className="flex-shrink-0 w-64"
                >
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="w-full text-left p-3 rounded-xl border border-amber-200/50 dark:border-amber-800/30 bg-white/60 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors press-effect"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {entry.flagUrl ? (
                        <Image src={entry.flagUrl} alt={entry.countryName} width={20} height={14} className="rounded-sm object-cover" unoptimized />
                      ) : (
                        <span className="text-base">{entry.flagEmoji}</span>
                      )}
                      <span className="text-xs font-medium truncate">{entry.countryName}</span>
                    </div>
                    <Badge className={`badge-3d text-[10px] px-1.5 py-0 ${cfg.badgeClass}`}>
                      {cfg.label}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{entry.description}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{relativeTime(entry.daysAgo)}</p>
                    <AnimatePresence>
                      {expandedId === entry.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <Separator className="my-2" />
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{entry.detail}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              );
            })}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
            View All Changes <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Desktop: vertical timeline
  return (
    <Card className="card-elevated-1 glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-lg">🛂</span>
            Recent Visa Policy Updates
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 text-amber-500 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="relative pl-6">
          {/* Timeline line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-amber-400 via-orange-400 to-amber-300 dark:from-amber-600 dark:via-orange-600 dark:to-amber-500" />

          {entries.map((entry, idx) => {
            const cfg = CHANGE_TYPE_CONFIG[entry.changeType];
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.35, ease: 'easeOut' }}
                className="relative mb-4 last:mb-0"
              >
                {/* Timeline dot */}
                <div className={`absolute -left-6 top-2.5 w-[7px] h-[7px] rounded-full ${cfg.dotClass} ring-2 ring-background`} />

                <button
                  onClick={() => toggleExpand(entry.id)}
                  className="w-full text-left group"
                >
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-200/40 dark:border-amber-800/20 bg-white/50 dark:bg-amber-950/10 hover:bg-amber-50/80 dark:hover:bg-amber-950/30 transition-all hover:shadow-sm press-effect">
                    <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
                      {entry.flagUrl ? (
                        <Image src={entry.flagUrl} alt={entry.countryName} width={22} height={15} className="rounded-sm object-cover" unoptimized />
                      ) : (
                        <span className="text-base">{entry.flagEmoji}</span>
                      )}
                      <span className="text-sm font-medium truncate">{entry.countryName}</span>
                    </div>
                    <Badge className={`badge-3d text-[10px] px-1.5 py-0 flex-shrink-0 ${cfg.badgeClass}`}>
                      {cfg.label}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground/60 flex-shrink-0 ml-auto">{relativeTime(entry.daysAgo)}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground flex-shrink-0 transition-transform ${expandedId === entry.id ? 'rotate-180' : ''}`} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 px-1">{entry.description}</p>
                  <AnimatePresence>
                    {expandedId === entry.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 mx-1 p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/20">
                          <p className="text-xs text-muted-foreground leading-relaxed">{entry.detail}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            );
          })}
        </div>

        <Button variant="outline" size="sm" className="w-full mt-4 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
          View All Changes <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
});


// ============================================================
// Feature 2: TravelChecklistGenerator
// ============================================================

interface ChecklistSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  colorClass: string;
  items: { id: string; label: string }[];
}

function buildChecklistSections(country: CountryData | null, userProfile: UserProfileData | null): ChecklistSection[] {
  const sections: ChecklistSection[] = [];

  // Section 1: Pre-Departure
  const preDepartureItems: { id: string; label: string }[] = [
    { id: 'pre-passport', label: 'Check passport validity (6+ months)' },
    { id: 'pre-insurance', label: 'Purchase travel insurance' },
    { id: 'pre-flights', label: 'Book flights' },
    { id: 'pre-accommodation', label: 'Book accommodation' },
    { id: 'pre-currency', label: `Exchange currency${country ? ` (${country.currencyCode || 'local currency'})` : ''}` },
    { id: 'pre-maps', label: 'Download offline maps' },
    { id: 'pre-bank', label: 'Notify your bank about travel' },
  ];

  if (country) {
    if (country.visaFree) {
      preDepartureItems.unshift({ id: 'pre-vf-check', label: 'Confirm visa-free entry requirements' });
    } else if (country.visaOnArrival) {
      preDepartureItems.unshift({ id: 'pre-voa-docs', label: 'Prepare VOA documents (return ticket, hotel booking)' });
      preDepartureItems.splice(1, 0, { id: 'pre-voa-fee', label: `Carry VOA fee in cash (~$${country.costProfile?.visaFeeUSD || 'check amount'})` });
    } else if (country.etaAvailable) {
      preDepartureItems.unshift({ id: 'pre-eta-apply', label: 'Apply for e-Visa/eTA online' });
      preDepartureItems.splice(1, 0, { id: 'pre-eta-print', label: 'Print e-Visa approval letter' });
    } else {
      preDepartureItems.unshift({ id: 'pre-embassy-apply', label: 'Apply for visa at embassy/consulate' });
      preDepartureItems.splice(1, 0, { id: 'pre-embassy-appt', label: 'Book embassy appointment' });
      preDepartureItems.splice(2, 0, { id: 'pre-embassy-docs', label: 'Prepare and organize all documents' });
    }
  }

  if (userProfile) {
    if (userProfile.occupation && userProfile.occupation !== 'Unemployed' && userProfile.occupation !== 'Student') {
      preDepartureItems.push({ id: 'pre-leave', label: 'Request leave from employer' });
    }
    if (userProfile.maritalStatus === 'Married' || (userProfile.dependents && userProfile.dependents > 0)) {
      preDepartureItems.push({ id: 'pre-family', label: 'Arrange family care during travel' });
    }
    if (userProfile.occupation === 'Student') {
      preDepartureItems.push({ id: 'pre-student-docs', label: 'Get student documents / NOC from institution' });
    }
  }

  sections.push({
    id: 'pre-departure',
    title: `Pre-Departure Checklist${country ? ` — ${country.name}` : ''}`,
    icon: <PlaneTakeoff className="h-4 w-4 text-amber-500" />,
    colorClass: 'text-amber-600 dark:text-amber-400',
    items: preDepartureItems,
  });

  // Section 2: Required Documents
  const docItems: { id: string; label: string }[] = [
    { id: 'doc-passport', label: 'Valid passport (6+ months validity)' },
    { id: 'doc-photos', label: 'Passport-sized photographs (2x)' },
    { id: 'doc-bank', label: 'Bank statements (last 6 months)' },
    { id: 'doc-flights', label: 'Flight itinerary / booking confirmation' },
    { id: 'doc-hotel', label: 'Hotel reservation confirmation' },
    { id: 'doc-insurance', label: 'Travel insurance certificate' },
    { id: 'doc-employment', label: 'Employment letter / NOC from employer' },
    { id: 'doc-tax', label: 'Income tax returns' },
  ];

  if (country && country.requirements && country.requirements.length > 0) {
    country.requirements.forEach((req, i) => {
      if (i < 4 && !docItems.some(d => d.label.toLowerCase().includes(req.requirement.toLowerCase().slice(0, 15)))) {
        docItems.push({ id: `doc-req-${i}`, label: req.requirement });
      }
    });
  }

  sections.push({
    id: 'documents',
    title: 'Required Documents',
    icon: <FileText className="h-4 w-4 text-orange-500" />,
    colorClass: 'text-orange-600 dark:text-orange-400',
    items: docItems,
  });

  // Section 3: At Destination
  sections.push({
    id: 'at-destination',
    title: 'At Destination',
    icon: <MapPin className="h-4 w-4 text-yellow-500" />,
    colorClass: 'text-yellow-600 dark:text-yellow-400',
    items: [
      { id: 'dest-embassy', label: 'Register with Pakistan embassy/consulate' },
      { id: 'dest-emergency', label: 'Save emergency numbers (police, ambulance, embassy)' },
      { id: 'dest-sim', label: 'Check local SIM card options' },
      { id: 'dest-transport', label: 'Familiarize with local transport' },
      { id: 'dest-customs', label: 'Note local customs and laws' },
    ],
  });

  return sections;
}

export const TravelChecklistGenerator = React.memo(function TravelChecklistGenerator({ country, userProfile }: { country: CountryData | null; userProfile?: UserProfileData | null }) {
  const storageKey = country ? `pakvisa-checklist-${country.code}` : 'pakvisa-checklist-generic';

  const sections = useMemo(() => buildChecklistSections(country, userProfile || null), [country, userProfile]);
  const allItemIds = useMemo(() => sections.flatMap(s => s.items.map(i => i.id)), [sections]);

  // Detect client-side mount without setState (useSyncExternalStore)
  const mounted = useSyncExternalStore(
    () => () => {}, // noop subscribe
    () => true,     // client: always mounted
    () => false     // server: not mounted
  );

  // Combined state for all country checklists — no reset needed when country changes
  const [allChecked, setAllChecked] = useState<Record<string, Record<string, boolean>>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { [storageKey]: JSON.parse(saved) as Record<string, boolean> } : {};
    } catch {
      return {};
    }
  });

  // Derive current country's checked items (no setState needed)
  const checked = allChecked[storageKey] || {};

  const toggleItem = useCallback((id: string) => {
    setAllChecked(prev => {
      const current = prev[storageKey] || {};
      return { ...prev, [storageKey]: { ...current, [id]: !current[id] } };
    });
  }, [storageKey]);

  const clearAll = useCallback(() => {
    const cleared: Record<string, boolean> = {};
    allItemIds.forEach(id => { cleared[id] = true; });
    setAllChecked(prev => ({ ...prev, [storageKey]: cleared }));
  }, [allItemIds, storageKey]);

  const resetAll = useCallback(() => {
    setAllChecked(prev => ({ ...prev, [storageKey]: {} }));
  }, [storageKey]);

  // Persist to localStorage (external system sync — no setState)
  useEffect(() => {
    if (!mounted) return;
    const current = allChecked[storageKey];
    if (current) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(current));
      } catch {
        // ignore
      }
    }
  }, [allChecked, storageKey, mounted]);

  const totalItems = allItemIds.length;
  const checkedCount = allItemIds.filter(id => checked[id]).length;
  const pct = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
  const isReady = pct >= 90;

  if (!mounted) {
    return (
      <Card className="card-elevated-1">
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
            <div className="h-2 w-full bg-muted rounded" />
            <div className="space-y-2 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 w-full bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated-1 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <span className="text-lg">📋</span>
            Travel Checklist
            {country && (
              <span className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground">
                {country.flagUrl ? (
                  <Image src={country.flagUrl} alt={country.name} width={18} height={12} className="rounded-sm object-cover" unoptimized />
                ) : (
                  <span>{country.flagEmoji}</span>
                )}
                {country.name}
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700" onClick={clearAll}>
              Clear All
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={resetAll}>
              <RotateCcw className="h-3 w-3 mr-1" /> Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">{checkedCount}/{totalItems} completed</span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{pct}%</span>
          </div>
          <Progress value={pct} className="progress-amber h-2.5" />
          {isReady && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-semibold text-glow-amber mt-2 flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Ready to travel! ✈️
            </motion.p>
          )}
        </div>

        {/* Checklist accordion */}
        <Accordion type="multiple" defaultValue={typeof window !== 'undefined' && window.innerWidth >= 768 ? ['pre-departure', 'documents', 'at-destination'] : []} className="w-full">
          {sections.map((section) => (
            <AccordionItem key={section.id} value={section.id} className="border-amber-200/40 dark:border-amber-800/20">
              <AccordionTrigger className={`text-sm font-semibold ${section.colorClass} hover:no-underline py-2.5`}>
                <span className="flex items-center gap-2">
                  {section.icon}
                  {section.title}
                  <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                    {section.items.filter(i => checked[i.id]).length}/{section.items.length}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-2">
                <div className="space-y-2">
                  {section.items.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-start gap-3 cursor-pointer group py-1 px-2 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors"
                    >
                      <Checkbox
                        checked={checked[item.id] || false}
                        onCheckedChange={() => toggleItem(item.id)}
                        className="mt-0.5 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                      />
                      <span className={`text-sm leading-snug transition-colors ${checked[item.id] ? 'line-through text-muted-foreground' : 'text-foreground group-hover:text-amber-700 dark:group-hover:text-amber-400'}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
});

// ============================================================
// Feature 3: ContinentQuickStats
// ============================================================

interface ContinentStat {
  name: string;
  count: number;
  avgFee: number;
  topVisaType: string;
  avgSafety: number;
}

const CONTINENT_COLORS: Record<string, { bg: string; border: string; text: string; accent: string; bar: string }> = {
  'Asia': { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-800 dark:text-amber-200', accent: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  'Europe': { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800/50', text: 'text-orange-800 dark:text-orange-200', accent: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
  'Middle East': { bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800/50', text: 'text-yellow-800 dark:text-yellow-200', accent: 'text-yellow-600 dark:text-yellow-400', bar: 'bg-yellow-500' },
  'Africa': { bg: 'bg-stone-50 dark:bg-stone-950/30', border: 'border-stone-300 dark:border-stone-700/50', text: 'text-stone-700 dark:text-stone-300', accent: 'text-stone-600 dark:text-stone-400', bar: 'bg-amber-700' },
  'Americas': { bg: 'bg-orange-50/70 dark:bg-orange-950/20', border: 'border-orange-200/70 dark:border-orange-800/40', text: 'text-orange-700 dark:text-orange-300', accent: 'text-orange-500 dark:text-orange-400', bar: 'bg-orange-400' },
  'Oceania': { bg: 'bg-amber-50/80 dark:bg-amber-950/20', border: 'border-amber-200/80 dark:border-amber-800/40', text: 'text-amber-700 dark:text-amber-300', accent: 'text-amber-500 dark:text-amber-400', bar: 'bg-amber-400' },
};

const CONTINENT_ORDER = ['Asia', 'Middle East', 'Europe', 'Africa', 'Americas', 'Oceania'];

function getVisaTypeLabel(c: CountryData): string {
  if (c.visaFree) return 'Visa-Free';
  if (c.visaOnArrival) return 'VOA';
  if (c.etaAvailable) return 'eTA';
  return 'Embassy';
}

export const ContinentQuickStats = React.memo(function ContinentQuickStats({ countries }: { countries: CountryData[] }) {
  const stats = useMemo<ContinentStat[]>(() => {
    if (!countries.length) return [];

    const byContinent = new Map<string, CountryData[]>();
    for (const c of countries) {
      const cont = c.continent || 'Other';
      if (!byContinent.has(cont)) byContinent.set(cont, []);
      byContinent.get(cont)!.push(c);
    }

    return CONTINENT_ORDER
      .filter((name) => {
        const list = byContinent.get(name);
        return list && list.length > 0;
      })
      .map((name) => {
        const list = byContinent.get(name)!;
        const fees = list.map((c) => c.costProfile?.visaFeeUSD ?? 0).filter((f) => f > 0);
        const avgFee = fees.length > 0 ? Math.round(fees.reduce((a, b) => a + b, 0) / fees.length) : 0;
        const avgSafety = list.reduce((a, c) => a + (c.safetyRating || 5), 0) / list.length;

        const typeCounts: Record<string, number> = {};
        for (const c of list) {
          const label = getVisaTypeLabel(c);
          typeCounts[label] = (typeCounts[label] || 0) + 1;
        }
        const topVisaType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        return { name, count: list.length, avgFee, topVisaType, avgSafety: Math.round(avgSafety * 10) / 10 };
      });
  }, [countries]);

  if (stats.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold">Continent Overview</h2>
        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          {stats.length} regions
        </Badge>
      </div>
      <div className="flex gap-3 overflow-x-auto custom-scrollbar-thin pb-2 -mx-1 px-1">
        {stats.map((s, idx) => {
          const colors = CONTINENT_COLORS[s.name] || CONTINENT_COLORS['Asia'];
          return (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              className={`shrink-0 w-40 sm:w-48 rounded-xl border ${colors.border} ${colors.bg} card-elevated-1 press-effect p-3 sm:p-4`}
            >
              <p className={`text-sm font-bold ${colors.accent} mb-2`}>{s.name}</p>

              <div className="flex items-center gap-1.5 mb-2">
                <MapIcon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  <span className={`font-semibold ${colors.text}`}>{s.count}</span> {s.count === 1 ? 'country' : 'countries'}
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Avg fee: <span className={`font-semibold ${colors.text}`}>${s.avgFee || '—'}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 mb-2.5">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Top: <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-semibold">{s.topVisaType}</Badge>
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Safety
                  </span>
                  <span className={`text-[10px] font-bold ${s.avgSafety >= 7 ? 'text-amber-600 dark:text-amber-400' : s.avgSafety >= 5 ? 'text-orange-500' : 'text-red-500'}`}>
                    {s.avgSafety}/10
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${colors.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(s.avgSafety / 10) * 100}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.06 + 0.2 }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
});

// ============================================================
// Feature: TripPlannerTimeline
// ============================================================

function getPhaseForDestination(index: number, total: number): string {
  if (index === 0 && total > 1) return 'Pre-trip';
  if (index === total - 1 && total > 1) return 'Post-trip';
  if (total === 1) return 'Pre-trip';
  return 'At-destination';
}

function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'Pre-trip': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    case 'In-transit': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
    case 'At-destination': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    case 'Post-trip': return 'bg-amber-200 text-amber-900 dark:bg-amber-800/50 dark:text-amber-200';
    default: return 'bg-muted text-muted-foreground';
  }
}

export function TripPlannerTimeline({ countries }: { countries: CountryData[] }) {
  const { tripPlan, addTripDestination, removeTripDestination, reorderTripDestination, clearTripPlan } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);

  const filteredCountries = useMemo(() => {
    const existing = new Set(tripPlan.map(d => d.countryCode));
    return countries
      .filter(c => !existing.has(c.code))
      .filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 20);
  }, [countries, tripPlan, searchQuery]);

  const handleAddDestination = (c: CountryData) => {
    const today = new Date();
    const start = today.toISOString().slice(0, 10);
    const end = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);
    const cost = c.costProfile
      ? c.costProfile.totalMonthlyUSD / 30 * 7
      : 1500;
    const dest: TripDestination = {
      countryCode: c.code,
      countryName: c.name,
      flagEmoji: c.flagEmoji,
      startDate: start,
      endDate: end,
      estimatedDays: 7,
      estimatedCost: Math.round(cost),
      visaType: getVisaTypeLabel(c),
    };
    addTripDestination(dest);
    setShowAddPanel(false);
    setSearchQuery('');
    toast.success(`${c.flagEmoji} ${c.name} added to trip plan`);
  };

  const handleDateChange = (index: number, field: 'startDate' | 'endDate', value: string) => {
    const current = tripPlan[index];
    const updated = { ...current, [field]: value };
    if (updated.startDate && updated.endDate) {
      const days = Math.max(1, Math.ceil(
        (new Date(updated.endDate).getTime() - new Date(updated.startDate).getTime()) / 86400000
      ));
      updated.estimatedDays = days;
      const country = countries.find(c => c.code === current.countryCode);
      updated.estimatedCost = country?.costProfile
        ? Math.round(country.costProfile.totalMonthlyUSD / 30 * days)
        : Math.round(1500 / 7 * days);
    }
    // Update via remove + re-add at same index
    const newPlan = [...tripPlan];
    newPlan[index] = updated;
    useAppStore.setState({ tripPlan: newPlan });
  };

  const totalDays = tripPlan.reduce((s, d) => s + d.estimatedDays, 0);
  const totalCost = tripPlan.reduce((s, d) => s + d.estimatedCost, 0);
  const totalVisaFees = tripPlan.reduce((s, d) => {
    const c = countries.find(co => co.code === d.countryCode);
    if (d.visaType === 'Visa-Free') return s;
    return s + (c?.costProfile?.visaFeeUSD || 80);
  }, 0);
  const visaFreeCount = tripPlan.filter(d => d.visaType === 'Visa-Free').length;

  const handleExport = () => {
    const lines = [
      '🧭 PakVisa Trip Itinerary',
      `Generated: ${new Date().toLocaleString()}`,
      '─'.repeat(40),
      '',
    ];
    tripPlan.forEach((d, i) => {
      lines.push(`${i + 1}. ${d.flagEmoji} ${d.countryName}`);
      lines.push(`   Visa: ${d.visaType}`);
      lines.push(`   Dates: ${d.startDate} → ${d.endDate} (${d.estimatedDays} days)`);
      lines.push(`   Est. Cost: $${d.estimatedCost.toLocaleString()}`);
      lines.push('');
    });
    lines.push('─'.repeat(40));
    lines.push(`Total: ${totalDays} days | $${totalCost.toLocaleString()} | Visa fees: $${totalVisaFees}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pakvisa-itinerary-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Itinerary exported successfully!');
  };

  return (
    <div className="space-y-4">
      {/* Summary Panel */}
      {tripPlan.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="glass-card rounded-lg p-3 text-center">
            <Clock className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{totalDays}</p>
            <p className="text-[10px] text-muted-foreground">Total Days</p>
          </div>
          <div className="glass-card rounded-lg p-3 text-center">
            <DollarSign className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">${totalCost.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Est. Total Cost</p>
          </div>
          <div className="glass-card rounded-lg p-3 text-center">
            <FileText className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">${totalVisaFees}</p>
            <p className="text-[10px] text-muted-foreground">Visa Fees</p>
          </div>
          <div className="glass-card rounded-lg p-3 text-center">
            <CheckCircle2 className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{visaFreeCount}/{tripPlan.length}</p>
            <p className="text-[10px] text-muted-foreground">Visa-Free</p>
          </div>
        </motion.div>
      )}

      {/* Timeline - Desktop Horizontal / Mobile Vertical */}
      <div className="hidden md:block">
        {tripPlan.length > 1 && (
          <div className="relative flex items-start gap-0 mb-6 overflow-x-auto pb-4">
            {/* Horizontal line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-amber-200 dark:bg-amber-800 z-0" />
            {tripPlan.map((dest, idx) => {
              const phase = getPhaseForDestination(idx, tripPlan.length);
              return (
                <div key={`${dest.countryCode}-${idx}`} className="relative flex flex-col items-center flex-shrink-0" style={{ minWidth: 160 }}>
                  {/* Dot */}
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold z-10 ring-4 ring-background">
                    {idx + 1}
                  </div>
                  {/* Connector label */}
                  {idx < tripPlan.length - 1 && (
                    <div className="absolute top-2 left-[60px] text-[10px] text-amber-600 dark:text-amber-400 font-medium whitespace-nowrap">
                      {dest.estimatedDays}d
                    </div>
                  )}
                  <p className="mt-2 text-xs font-semibold text-center">{dest.flagEmoji} {dest.countryName}</p>
                  <Badge variant="outline" className={`mt-1 text-[9px] ${getPhaseColor(phase)}`}>
                    {phase}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile vertical timeline */}
      <div className="md:hidden">
        {tripPlan.length > 0 && (
          <div className="relative pl-6 border-l-2 border-amber-300 dark:border-amber-700 space-y-4 mb-4">
            {tripPlan.map((dest, idx) => {
              const phase = getPhaseForDestination(idx, tripPlan.length);
              return (
                <div key={`${dest.countryCode}-${idx}`} className="relative">
                  <div className="absolute -left-[31px] w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">
                    {idx + 1}
                  </div>
                  <p className="text-xs font-semibold">{dest.flagEmoji} {dest.countryName}</p>
                  <Badge variant="outline" className={`mt-0.5 text-[9px] ${getPhaseColor(phase)}`}>
                    {phase}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Destination Cards */}
      <AnimatePresence mode="popLayout">
        {tripPlan.map((dest, idx) => (
          <motion.div
            key={`${dest.countryCode}-${idx}`}
            layout
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="card-elevated-1"
          >
            <div className="p-4 flex flex-col sm:flex-row gap-3">
              {/* Left: Flag + info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{dest.flagEmoji}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{dest.countryName}</p>
                    <Badge variant="outline" className={`badge-3d text-[10px] ${
                      dest.visaType === 'Visa-Free'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800'
                        : dest.visaType === 'Visa on Arrival'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                    }`}>
                      {dest.visaType}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span className="font-medium">{dest.estimatedDays} days</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3" />
                    <span className="font-medium">${dest.estimatedCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Right: Date inputs + controls */}
              <div className="flex flex-col gap-2 items-end shrink-0">
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={dest.startDate}
                    onChange={e => handleDateChange(idx, 'startDate', e.target.value)}
                    className="text-[11px] border rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  <input
                    type="date"
                    value={dest.endDate}
                    onChange={e => handleDateChange(idx, 'endDate', e.target.value)}
                    className="text-[11px] border rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => idx > 0 && reorderTripDestination(idx, idx - 1)}
                    disabled={idx === 0}
                    className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-30 transition-colors press-effect"
                    aria-label="Move up"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => idx < tripPlan.length - 1 && reorderTripDestination(idx, idx + 1)}
                    disabled={idx === tripPlan.length - 1}
                    className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-30 transition-colors press-effect"
                    aria-label="Move down"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeTripDestination(idx)}
                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors press-effect"
                    aria-label="Remove destination"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Progress bar */}
      {tripPlan.length > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Trip progress</span>
            <span>{tripPlan.length}/5 destinations</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full progress-amber transition-all duration-500" style={{ width: `${(tripPlan.length / 5) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Add / Export Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => setShowAddPanel(!showAddPanel)}
          disabled={tripPlan.length >= 5}
          variant="outline"
          size="sm"
          className="gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 press-effect"
        >
          <Plus className="w-4 h-4" />
          {tripPlan.length >= 5 ? 'Max 5 Destinations' : 'Add Destination'}
        </Button>
        {tripPlan.length > 0 && (
          <>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
              className="gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 press-effect"
            >
              <Download className="w-4 h-4" />
              Export Itinerary
            </Button>
            <Button
              onClick={() => { clearTripPlan(); toast.info('Trip plan cleared'); }}
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-red-500"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear All
            </Button>
          </>
        )}
      </div>

      {/* Add Destination Panel */}
      <AnimatePresence>
        {showAddPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card rounded-lg p-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs input-amber"
                />
              </div>
              <div className="max-h-48 overflow-y-auto custom-scrollbar-thin space-y-1">
                {filteredCountries.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No matching countries found</p>
                ) : (
                  filteredCountries.map(c => (
                    <button
                      key={c.code}
                      onClick={() => handleAddDestination(c)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-left press-effect"
                    >
                      <span className="text-base">{c.flagEmoji}</span>
                      <span className="text-xs font-medium flex-1 truncate">{c.name}</span>
                      <Badge variant="outline" className={`text-[9px] shrink-0 ${
                        c.visaFree
                          ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800'
                          : c.visaOnArrival
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                            : 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                      }`}>
                        {getVisaTypeLabel(c)}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {tripPlan.length === 0 && !showAddPanel && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Compass className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Plan your multi-destination trip</p>
          <p className="text-xs text-muted-foreground mt-1">Add up to 5 destinations to build your itinerary</p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Feature 3: VisaReadinessDashboard
// ============================================================

export function VisaReadinessDashboard({ countries, userProfile }: { countries: CountryData[]; userProfile: UserProfileData | null }) {
  const { setActiveTab, setSelectedCountry } = useAppStore();

  const metrics = useMemo(() => {
    // 1. Profile Completeness
    const profileFields: (keyof UserProfileData)[] = [
      'fullName', 'age', 'gender', 'passportNumber', 'passportExpiry',
      'occupation', 'monthlyIncomeUSD', 'education', 'travelPurpose', 'budgetUSD',
      'maritalStatus', 'intendedStayDays', 'languages', 'hasReturnTicket', 'hasHotelBooking',
    ];
    const filledCount = userProfile
      ? profileFields.filter(k => {
          const v = userProfile[k];
          if (Array.isArray(v)) return v.length > 0;
          return v !== null && v !== undefined && v !== '' && v !== 0;
        }).length
      : 0;
    const profilePct = userProfile ? Math.round((filledCount / profileFields.length) * 100) : 0;

    // 2. Financial Readiness
    const countriesWithCost = countries.filter(c => c.costProfile);
    const avgVisaFee = countriesWithCost.length > 0
      ? countriesWithCost.reduce((s, c) => s + (c.costProfile!.visaFeeUSD || 0), 0) / countriesWithCost.length
      : 100;
    const income = userProfile?.monthlyIncomeUSD || 0;
    const financialPct = income > 0 ? Math.min(100, Math.round((income / (avgVisaFee * 3)) * 100)) : 0;

    // 3. Document Status (proxy from profile + financial readiness)
    const docPct = userProfile
      ? Math.round((profilePct * 0.6) + (financialPct > 50 ? 40 : financialPct > 20 ? 25 : 10))
      : 0;

    // 4. Passport Health
    let passportPct = 0;
    if (userProfile?.passportExpiry) {
      const diffMs = new Date(userProfile.passportExpiry).getTime() - Date.now();
      const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);
      passportPct = diffMonths >= 12 ? 100 : diffMonths >= 6 ? Math.round((diffMonths / 12) * 100) : diffMonths > 0 ? Math.round((diffMonths / 6) * 30) : 0;
    }

    const overall = Math.round((profilePct + financialPct + docPct + passportPct) / 4);

    return { profilePct, financialPct, docPct, passportPct, overall };
  }, [countries, userProfile]);

  const statusConfig = metrics.overall >= 70
    ? { label: 'Ready to Apply', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CircleCheckBig }
    : metrics.overall >= 40
      ? { label: 'Almost There', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertTriangle }
      : { label: 'Needs Preparation', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20', icon: AlertCircle };

  const StatusIcon = statusConfig.icon;

  // SVG circular gauge
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (metrics.overall / 100) * circumference;
  const gaugeColor = metrics.overall >= 70 ? '#10b981' : metrics.overall >= 40 ? '#f59e0b' : '#ef4444';

  const miniCards = [
    { label: 'Profile', value: metrics.profilePct, icon: User, color: 'text-amber-500' },
    { label: 'Financial', value: metrics.financialPct, icon: Wallet, color: 'text-orange-500' },
    { label: 'Documents', value: metrics.docPct, icon: FileCheck, color: 'text-yellow-600' },
    { label: 'Passport', value: metrics.passportPct, icon: Shield, color: 'text-amber-600' },
  ];

  const handleSelectCountry = () => {
    const easy = countries.find(c => c.visaFree || c.visaOnArrival);
    if (easy) setSelectedCountry(easy);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      {/* Status Banner */}
      <div className={`flex items-center gap-2 rounded-lg border p-3 mb-4 ${statusConfig.bg}`}>
        <StatusIcon className={`w-4 h-4 ${statusConfig.color} shrink-0`} />
        <span className={`text-xs font-semibold ${statusConfig.color}`}>{statusConfig.label}</span>
        <span className="text-xs text-muted-foreground ml-auto">Overall score: {metrics.overall}%</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-5">
        {/* Circular Gauge */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-[120px] h-[120px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r={radius} fill="none" stroke={gaugeColor} strokeWidth="8"
                strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }} transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span className="text-2xl font-bold" style={{ color: gaugeColor }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                {metrics.overall}%
              </motion.span>
              <span className="text-[10px] text-muted-foreground">Readiness</span>
            </div>
          </div>
        </div>

        {/* Right column: Mini cards + Quick Actions */}
        <div className="space-y-4">
          {/* 2x2 Mini Metric Cards */}
          <div className="grid grid-cols-2 gap-3">
            {miniCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.08 }} className="stat-card-compact rounded-lg p-3"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className={`w-3.5 h-3.5 ${card.color}`} />
                    <span className="text-[10px] text-muted-foreground font-medium">{card.label}</span>
                  </div>
                  <div className="text-lg font-bold">{card.value}%</div>
                  <div className="h-1 w-full rounded-full bg-muted mt-1.5 overflow-hidden">
                    <motion.div className="h-full rounded-full progress-amber" initial={{ width: 0 }}
                      animate={{ width: `${card.value}%` }} transition={{ duration: 0.6, delay: 0.2 + i * 0.08 }} />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="text-xs gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              onClick={() => setActiveTab('questionnaire')}>
              <User className="w-3.5 h-3.5" /> Complete Profile
            </Button>
            <Button size="sm" variant="outline" className="text-xs gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              onClick={handleSelectCountry}>
              <FileCheck className="w-3.5 h-3.5" /> Check Documents
            </Button>
            <Button size="sm" className="text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => setActiveTab('questionnaire')}>
              <ArrowRight className="w-3.5 h-3.5" /> Start Application
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Feature 4: SmartRecommendations
// ============================================================

interface RecommendationResult {
  country: CountryData;
  matchScore: number;
  reasons: string[];
}

export function SmartRecommendations({ countries, userProfile }: { countries: CountryData[]; userProfile: UserProfileData | null }) {
  const { setSelectedCountry } = useAppStore();

  const recommendations = useMemo<RecommendationResult[]>(() => {
    if (countries.length === 0) return [];

    const scored = countries.map(c => {
      let score = 50;
      const reasons: string[] = [];

      // Visa ease (up to +30)
      if (c.visaFree) { score += 30; reasons.push('Visa-free entry for Pakistani citizens'); }
      else if (c.visaOnArrival) { score += 22; reasons.push('Visa on arrival — no prior application needed'); }
      else if (c.etaAvailable) { score += 15; reasons.push('e-Visa available — apply online'); }

      // Safety (up to +15)
      if (c.safetyRating >= 8) { score += 15; reasons.push(`High safety rating (${c.safetyRating}/10)`); }
      else if (c.safetyRating >= 6) { score += 8; }

      // Processing speed (up to +10)
      const avgProcessing = (c.processingDaysMin + c.processingDaysMax) / 2;
      if (avgProcessing <= 5) { score += 10; reasons.push(`Fast processing (${c.processingDaysMin}-${c.processingDaysMax} days)`); }
      else if (avgProcessing <= 15) { score += 5; }

      // Budget alignment (up to +20) — only if profile exists
      if (userProfile?.budgetUSD && userProfile.budgetUSD > 0 && c.costProfile?.totalMonthlyUSD) {
        const ratio = userProfile.budgetUSD / c.costProfile.totalMonthlyUSD;
        if (ratio >= 1.5) { score += 20; reasons.push('Well within your budget'); }
        else if (ratio >= 1) { score += 12; reasons.push('Fits your budget'); }
        else if (ratio >= 0.7) { score += 5; }
      }

      return { country: c, matchScore: Math.min(99, score), reasons: reasons.slice(0, 2) };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored.slice(0, 6);
  }, [countries, userProfile]);

  const getVisaBadge = (c: CountryData) => {
    if (c.visaFree) return { label: 'Visa-Free', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' };
    if (c.visaOnArrival) return { label: 'VOA', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20' };
    if (c.etaAvailable) return { label: 'e-Visa', cls: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/20' };
    return { label: 'Embassy', cls: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/20' };
  };

  if (recommendations.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold">Smart Picks For You</h2>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {recommendations.map((rec, i) => {
          const badge = getVisaBadge(rec.country);
          return (
            <motion.div
              key={rec.country.code}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4 }}
              className="card-elevated-1 rounded-xl p-4 group hover:shadow-amber-500/10 hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedCountry(rec.country)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{rec.country.flagEmoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{rec.country.name}</p>
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border ${badge.cls}`}>{badge.label}</Badge>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{rec.matchScore}%</span>
                  <p className="text-[9px] text-muted-foreground">match</p>
                </div>
              </div>
              <div className="space-y-1 mb-3">
                {rec.reasons.map((r, ri) => (
                  <div key={ri} className="flex items-start gap-1.5">
                    <Lightbulb className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                    <span className="text-[11px] text-muted-foreground leading-tight">{r}</span>
                  </div>
                ))}
              </div>
              <Button size="sm" variant="ghost" className="w-full text-xs gap-1 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-300">
                View Details <ArrowRight className="w-3 h-3" />
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Feature 5: EnhancedFAQ
// ============================================================

type FAQCategory = 'Visa Basics' | 'Application Process' | 'Documents & Requirements' | 'After Arrival';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  icon: React.ElementType;
}

const FAQ_DATA: FAQItem[] = [
  { id: 'e-faq-1', question: 'Which countries can Pakistani citizens visit visa-free?', answer: 'Pakistani passport holders can visit several countries visa-free, including Malaysia (30 days), Dominica, Micronesia, Vanuatu, Trinidad & Tobago, and Saint Vincent & the Grenadines. Always verify requirements with the official embassy before travel as policies can change.', category: 'Visa Basics', icon: Globe },
  { id: 'e-faq-2', question: 'How strong is the Pakistani passport globally?', answer: 'The Pakistani passport is ranked around 100-110th on the Henley Passport Index. However, more countries are introducing e-Visa and visa on arrival facilities. Middle Eastern and Southeast Asian countries are generally the most accessible for Pakistani travelers.', category: 'Visa Basics', icon: Shield },
  { id: 'e-faq-3', question: 'What is the difference between e-Visa and Visa on Arrival?', answer: 'An e-Visa must be applied for online before travel and takes 1-5 business days. Visa on Arrival is issued at the airport/border when you arrive, taking 5-30 minutes. Popular e-Visa: Turkey, Kenya. Popular VOA: UAE, Saudi Arabia, Maldives.', category: 'Visa Basics', icon: Plane },
  { id: 'e-faq-4', question: 'Can I travel with a passport that expires in less than 6 months?', answer: 'Most countries require at least 6 months of passport validity beyond your planned stay. Some require only 3 months. Traveling with less validity may result in denied boarding. Always check the specific country requirement and renew your passport early.', category: 'Visa Basics', icon: AlertTriangle },
  { id: 'e-faq-5', question: 'How do I apply for a Schengen visa from Pakistan?', answer: 'Apply at the embassy/consulate of your primary destination country. Required documents: valid passport (6+ months), bank statements (6 months), travel insurance (€30,000+), flight itinerary, hotel bookings, employment letter, and tax returns. Processing takes 15-30 business days.', category: 'Application Process', icon: Building },
  { id: 'e-faq-6', question: 'What is the typical visa processing time for popular destinations?', answer: 'Processing times vary: UAE/Saudi VOA (instant), Malaysia e-Visa (2-3 days), Turkey e-Visa (1-2 days), UK visitor visa (15-30 days), Schengen visa (15-30 days), USA visa (varies, often weeks). Apply at least 4-6 weeks before travel.', category: 'Application Process', icon: Clock },
  { id: 'e-faq-7', question: 'How do I book a visa appointment at an embassy?', answer: 'Most embassies in Pakistan (Islamabad, Karachi, Lahore) require online appointment booking through their official website or VFS Global. Appointments can fill up quickly during peak season (May-August). Book 4-8 weeks in advance and bring all required documents.', category: 'Application Process', icon: Calendar },
  { id: 'e-faq-8', question: 'Can I track my visa application status?', answer: 'Yes. Most embassies provide online tracking through their website or VFS Global. You typically need your application reference number and passport number. Some countries also send SMS/email updates at each processing stage.', category: 'Application Process', icon: Search },
  { id: 'e-faq-9', question: 'What documents are commonly required for a tourist visa?', answer: 'Common requirements include: valid passport, completed application form, passport-size photographs, bank statements (3-6 months), employment letter, hotel/flight bookings, travel insurance, and purpose letter. Specific requirements vary by country.', category: 'Documents & Requirements', icon: FileText },
  { id: 'e-faq-10', question: 'How much bank balance do I need to show for a visa?', answer: 'Requirements vary: Schengen requires €50-100/day, UK requires enough to cover trip costs, Middle Eastern countries may require less. Show consistent balance over 3-6 months, not just a recent deposit. A stable income flow is more convincing than a large sudden deposit.', category: 'Documents & Requirements', icon: Banknote },
  { id: 'e-faq-11', question: 'Is travel insurance mandatory for visa applications?', answer: 'Yes for most destinations. Schengen requires minimum €30,000 coverage. UK, Australia, Canada also mandate it. Even where not required, it is strongly recommended. Ensure coverage includes medical emergencies, trip cancellation, and repatriation.', category: 'Documents & Requirements', icon: ShieldCheck },
  { id: 'e-faq-12', question: 'Do I need an NOC from my employer for a visa?', answer: 'An NOC (No Objection Certificate) is not always mandatory but significantly strengthens your application. It shows strong ties to Pakistan. Self-employed applicants should bring business registration documents and tax returns instead.', category: 'Documents & Requirements', icon: Briefcase },
  { id: 'e-faq-13', question: 'What should I do upon arrival at my destination?', answer: 'Have printed copies of your visa, hotel booking, return ticket, and travel insurance. Fill arrival cards if required. Know the local emergency number. Keep embassy contact info handy. Declare currency if above the limit.', category: 'After Arrival', icon: PlaneTakeoff },
  { id: 'e-faq-14', question: 'Can I extend my visa while abroad?', answer: 'Some countries allow visa extensions (e.g., Malaysia, Thailand, Turkey). Apply before your current visa expires at the local immigration office. Overstaying can lead to fines, deportation, or future visa bans. Check extension rules before traveling.', category: 'After Arrival', icon: RotateCcw },
  { id: 'e-faq-15', question: 'What happens if my visa application is rejected?', answer: 'You will receive a rejection letter with reasons. Common reasons: insufficient funds, incomplete documents, weak ties to home country. You can reapply after addressing the issues. Some countries allow appeals within a specific timeframe. Each rejection makes future applications harder.', category: 'After Arrival', icon: AlertCircle },
];

const FAQ_CATEGORIES: { label: FAQCategory | 'All'; icon: React.ElementType }[] = [
  { label: 'All', icon: HelpCircle },
  { label: 'Visa Basics', icon: Globe },
  { label: 'Application Process', icon: FileText },
  { label: 'Documents & Requirements', icon: ClipboardCheck },
  { label: 'After Arrival', icon: PlaneTakeoff },
];

export function EnhancedFAQ() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<FAQCategory | 'All'>('All');

  const filtered = useMemo(() => {
    return FAQ_DATA.filter(item => {
      const matchCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchSearch = !search || item.question.toLowerCase().includes(search.toLowerCase()) || item.answer.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [search, activeCategory]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center gap-2 mb-4">
        <HelpCircle className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-bold">Frequently Asked Questions</h2>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="pl-9 input-amber h-9 text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {FAQ_CATEGORIES.map(cat => {
          const CatIcon = cat.icon;
          return (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1 ${activeCategory === cat.label
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300'
              }`}
            >
              <CatIcon className="w-3 h-3" /> {cat.label}
            </button>
          );
        })}
      </div>

      {/* FAQ Items */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <SearchX className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No questions match your search.</p>
          <button onClick={() => { setSearch(''); setActiveCategory('All'); }} className="text-xs text-amber-500 hover:underline mt-1">Clear filters</button>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {filtered.map((item, i) => {
            const ItemIcon = item.icon;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <AccordionItem value={item.id}>
                  <AccordionTrigger className="text-sm font-medium text-left gap-2 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <ItemIcon className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{item.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pl-6">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            );
          })}
        </Accordion>
      )}
    </motion.div>
  );
}
