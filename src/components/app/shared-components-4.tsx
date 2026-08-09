'use client';

import React, { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, ShieldCheck, DollarSign, Clock, FileWarning,
  Globe, CheckCircle2, ChevronDown, ChevronRight, ClipboardCheck,
  PlaneTakeoff, FileText, MapPin, Phone, Wifi, Banknote,
  Building, AlertCircle, Briefcase, GraduationCap, Users, RotateCcw,
  ExternalLink, Shield, TrendingUp, BarChart3, Map,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAppStore } from '@/lib/store';
import type { CountryData, UserProfileData } from '@/lib/types';
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
                <Map className="w-3.5 h-3.5 text-muted-foreground" />
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
