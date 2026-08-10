'use client';

import React, { useState, useEffect, useMemo, useSyncExternalStore, useRef, useCallback } from 'react';
import {
  Globe, Search, Sun, Moon, HelpCircle, Sparkles, MessageSquare,
  BarChart3, ClipboardList, Shield, Clock, DollarSign, Plane,
  ChevronDown, ChevronUp, Heart, X, ArrowRight, Check, Lock,
  Star, Zap, Crown, MapPin, FileText, Download, ExternalLink, SearchX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store';
import type { CountryData } from '@/lib/types';
import { AiChatPanel } from '@/components/visa/ai-chat-panel';
import { VisaQuizPanel } from '@/components/visa/visa-quiz-panel';
import { ComparePanel } from '@/components/visa/compare-panel';
import { PricingModal, HelpModal, AboutModal, PrivacyModal, TermsModal, ContactModal } from '@/components/visa/modals';

// ============================================================
// Testimonials
// ============================================================
const TESTIMONIALS = [
  { text: "Found out I can get Turkey e-visa in 5 minutes! Saved me a trip to the embassy.", author: "Ahmed K., Lahore", rating: 5 },
  { text: "Compared 4 countries side by side. Chose Malaysia — visa on arrival, no hassle!", author: "Sara M., Karachi", rating: 5 },
  { text: "The AI told me exactly which documents I was missing. Got approved first try.", author: "Bilal R., Islamabad", rating: 5 },
];

// ============================================================
// Visa Type Helper
// ============================================================
function getVisaType(c: CountryData) {
  if (c.visaFree) return { label: 'Visa Free', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' };
  if (c.visaOnArrival) return { label: 'Visa on Arrival', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' };
  if (c.etaAvailable) return { label: 'e-Visa', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', dot: 'bg-sky-500' };
  return { label: 'Embassy Required', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400' };
}

// ============================================================
// Quick Tool Card
// ============================================================
function QuickToolCard({ icon, title, description, colorClass, onClick, badge }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  colorClass: string;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left rounded-xl border bg-card p-5 transition-all hover:shadow-md ${colorClass} group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
          {icon}
        </div>
        {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
      </div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      <div className="mt-3 text-xs font-medium text-primary flex items-center gap-1 group-hover:gap-1.5 transition-all">
        Try now <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  );
}

// ============================================================
// Country Result Card (Expandable)
// ============================================================
function CountryResultCard({ country, expanded, onToggle, isFavorited, onToggleFavorite, onAskAI }: {
  country: CountryData;
  expanded: boolean;
  onToggle: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onAskAI: () => void;
}) {
  const visa = getVisaType(country);
  const cost = country.costProfile;

  return (
    <div className={`rounded-xl border bg-card overflow-hidden transition-all duration-200 ${expanded ? 'shadow-md' : 'hover:shadow-sm'}`}>
      {/* Collapsed Row */}
      <div
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        role="button"
        tabIndex={0}
        className="w-full flex items-center gap-4 p-4 text-left cursor-pointer select-none"
      >
        <span className="text-3xl shrink-0">{country.flagEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-semibold">{country.name}</h4>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${visa.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${visa.dot}`} />
              {visa.label}
            </span>
            {country.safetyRating >= 7 && (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                <Shield className="w-3 h-3" /> Safe
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {cost && cost.visaFeeUSD > 0 && (
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> ${cost.visaFeeUSD}</span>
            )}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {country.processingDaysMin === country.processingDaysMax ? `${country.processingDaysMin} days` : `${country.processingDaysMin}–${country.processingDaysMax} days`}</span>
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {country.continent}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t px-4 pb-4 pt-4 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Requirements */}
          {country.requirements && country.requirements.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Requirements
              </h5>
              <ul className="space-y-1.5">
                {country.requirements.slice(0, 5).map((req) => (
                  <li key={req.id} className="flex items-start gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                    <span>
                      {req.requirement}
                      {req.mandatory && <span className="text-muted-foreground ml-1 text-xs">(required)</span>}
                    </span>
                  </li>
                ))}
                {country.requirements.length > 5 && (
                  <li className="text-xs text-muted-foreground pl-5.5">+{country.requirements.length - 5} more items
                    <span className="inline-flex items-center gap-0.5 ml-1 text-amber-600"><Lock className="w-3 h-3" /> Pro</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Cost Breakdown */}
          {cost && (
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Cost Breakdown
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Visa Fee', value: `$${cost.visaFeeUSD}` },
                  { label: 'Service Fee', value: `$${cost.serviceFeeUSD}` },
                  { label: 'Monthly Living', value: `$${Math.round(cost.totalMonthlyUSD)}` },
                  { label: 'Currency', value: cost.currency || country.currency },
                ].map(item => (
                  <div key={item.label} className="bg-muted/50 rounded-lg p-2.5">
                    <p className="text-[11px] text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Travel */}
          {country.bestTravelMonths && (
            <div>
              <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
                <Plane className="w-3.5 h-3.5" /> Best Travel Months
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {country.bestTravelMonths.split(',').map(m => (
                  <Badge key={m.trim()} variant="outline" className="text-xs font-normal">{m.trim()}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Visa Types (deduplicated) */}
          {country.visaTypes && country.visaTypes.length > 0 && (() => {
            const seen = new Set<string>();
            const unique = country.visaTypes.filter(vt => {
              const key = `${vt.type}::${vt.maxDuration || ''}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });
            return unique.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Available Visa Types</h5>
                <div className="flex flex-wrap gap-1.5">
                  {unique.map(vt => (
                    <Badge key={vt.id} variant="secondary" className="text-xs font-normal">
                      {vt.type} {vt.maxDuration ? `(${vt.maxDuration})` : ''}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onAskAI} className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Ask AI
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 opacity-70">
              <Download className="w-3.5 h-3.5" /> PDF Report <Lock className="w-3 h-3 text-amber-500" />
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 opacity-70">
              <ClipboardList className="w-3.5 h-3.5" /> Full Checklist <Lock className="w-3 h-3 text-amber-500" />
            </Button>
            {country.sourceUrl && (
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <a href={country.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" /> Official Source
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Page Component
// ============================================================
export default function HomePage() {
  const [search, setSearch] = useState('');
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);
  const [showAiChat, setShowAiChat] = useState(false);
  const [activeTool, setActiveTool] = useState<'quiz' | 'compare' | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeModal, setActiveModal] = useState<'about' | 'privacy' | 'terms' | 'contact' | null>(null);
  const { theme, setTheme } = useTheme();
  const { favorites, toggleFavorite } = useAppStore();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Fetch all countries on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/countries');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCountries(data.data || []);
        }
      } catch {}
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Filter countries by search query
  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return countries
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.continent.toLowerCase().includes(q)
      )
      .slice(0, 12);
  }, [search, countries]);

  // Open a country's result from tools
  const openCountryFromTool = useCallback((name: string) => {
    setSearch(name);
    setExpandedCountry(countries.find(c => c.name === name)?.code || null);
    setActiveTool(null);
    window.setTimeout(() => {
      document.getElementById('main-content')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [countries]);

  // Popular countries for quick access (ordered by popularity for Pakistani travelers)
  const popularCountries = useMemo(() => {
    const priority = [
      { match: 'Türkiye', rank: 0 }, { match: 'Malaysia', rank: 1 },
      { match: 'United Arab Emirates', rank: 2 }, { match: 'Saudi Arabia', rank: 3 },
      { match: 'Qatar', rank: 4 }, { match: 'Thailand', rank: 5 },
      { match: 'United Kingdom', rank: 6 }, { match: 'United States', rank: 7 },
      { match: 'Oman', rank: 8 }, { match: 'Bahrain', rank: 9 },
      { match: 'Indonesia', rank: 10 }, { match: 'China', rank: 11 },
    ];
    return countries
      .map(c => {
        const p = priority.find(p => c.name.includes(p.match));
        return p ? { ...c, _rank: p.rank } : null;
      })
      .filter((c): c is CountryData & { _rank: number } => c !== null)
      .sort((a, b) => a._rank - b._rank)
      .slice(0, 8);
  }, [countries]);

  // Stats
  const stats = useMemo(() => ({
    total: countries.length,
    visaFree: countries.filter(c => c.visaFree).length,
    voa: countries.filter(c => c.visaOnArrival).length,
    evisa: countries.filter(c => c.etaAvailable).length,
  }), [countries]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip to content */}
      <a href="#main-content" className="skip-to-content">Skip to main content</a>

      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => { setSearch(''); setExpandedCountry(null); }} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Globe className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="font-bold text-sm leading-none">PakVisa</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Free Visa Checker</p>
            </div>
          </button>
          <div className="flex items-center gap-0.5">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowPricing(true)} aria-label="Premium plans">
              <Crown className="w-4 h-4 text-amber-500" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowHelp(true)} aria-label="Help">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT (hidden when tool panel is open) ===== */}
      {!activeTool && (
        <>
          <main className="flex-1" id="main-content">

        {/* Hero Section */}
        <section className="pt-12 sm:pt-16 pb-6 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Visa Requirements for{' '}
              <span className="text-primary">Pakistani Passport</span>
            </h2>
            <p className="text-muted-foreground mb-8 text-sm sm:text-base">
              Search 70+ countries. Instant results. 100% free.
            </p>

            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setExpandedCountry(null); }}
                placeholder="Search a country... (e.g., Turkey, UAE, Malaysia)"
                className="w-full h-12 pl-12 pr-10 rounded-xl border-2 border-border bg-card text-sm sm:text-base
                  placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10
                  transition-all"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setExpandedCountry(null); searchRef.current?.focus(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Popular Countries (only when not searching) */}
            {!search && !loading && (
              <div className="flex flex-wrap justify-center gap-2">
                {popularCountries.map(c => (
                  <button
                    key={c.code}
                    onClick={() => { setSearch(c.name); setExpandedCountry(c.code); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border
                      hover:border-primary/30 hover:bg-primary/5 transition-all text-sm"
                  >
                    <span className="text-base">{c.flagEmoji}</span>
                    <span className="text-sm">{c.name}</span>
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getVisaType(c).color}`}>
                      <span className={`w-1 h-1 rounded-full ${getVisaType(c).dot}`} />
                      {getVisaType(c).label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Stats Bar */}
        {!loading && (
          <section className="px-4 pb-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-primary" />
                  <strong className="text-foreground font-semibold">{stats.total}+</strong> Countries
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <strong className="text-foreground font-semibold">{stats.visaFree}</strong> Visa Free
                </div>
                <div className="flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-amber-500" />
                  <strong className="text-foreground font-semibold">{stats.voa}</strong> Visa on Arrival
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-sky-500" />
                  <strong className="text-foreground font-semibold">{stats.evisa}</strong> e-Visa
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Loading State */}
        {loading && (
          <section className="px-4 pb-8">
            <div className="max-w-3xl mx-auto space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          </section>
        )}

        {/* Search Results */}
        {search && !loading && filtered.length > 0 && (
          <section className="px-4 pb-10">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm text-muted-foreground mb-3">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
              </p>
              <div className="space-y-3">
                {filtered.map(country => (
                  <CountryResultCard
                    key={country.code}
                    country={country}
                    expanded={expandedCountry === country.code}
                    onToggle={() => setExpandedCountry(expandedCountry === country.code ? null : country.code)}
                    isFavorited={favorites.includes(country.code)}
                    onToggleFavorite={() => toggleFavorite(country.code)}
                    onAskAI={() => setShowAiChat(true)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* No Results */}
        {search && !loading && filtered.length === 0 && (
          <section className="px-4 pb-10 text-center">
            <div className="max-w-md mx-auto">
              <SearchX className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="font-semibold mb-1">No countries found</h3>
              <p className="text-sm text-muted-foreground">Try searching for a different country name or check spelling</p>
            </div>
          </section>
        )}

        {/* Home Content (visible when not searching) */}
        {!search && !loading && (
          <>
            {/* Quick Tools */}
            <section className="px-4 pb-12">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-lg font-semibold text-center mb-6">More Tools</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <QuickToolCard
                    icon={<MessageSquare className="w-5 h-5 text-primary" />}
                    title="AI Visa Consultant"
                    description="Ask anything about visas, requirements, or travel plans. Get instant answers."
                    colorClass="hover:border-primary/30"
                    onClick={() => setShowAiChat(true)}
                  />
                  <QuickToolCard
                    icon={<ClipboardList className="w-5 h-5 text-amber-600" />}
                    title="Visa Quiz"
                    description="Answer 5 quick questions and get personalized country recommendations."
                    colorClass="hover:border-amber-300 dark:hover:border-amber-700"
                    onClick={() => setActiveTool('quiz')}
                    badge="Free"
                  />
                  <QuickToolCard
                    icon={<BarChart3 className="w-5 h-5 text-sky-600" />}
                    title="Compare Countries"
                    description="Side-by-side visa comparison for multiple countries at once."
                    colorClass="hover:border-sky-300 dark:hover:border-sky-700"
                    onClick={() => setActiveTool('compare')}
                    badge="Free"
                  />
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section className="px-4 pb-12">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-lg font-semibold text-center mb-6">What Travelers Say</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {TESTIMONIALS.map((t, i) => (
                    <Card key={i} className="border bg-card hover:shadow-sm transition-shadow">
                      <CardContent className="pt-5 pb-5">
                        <div className="flex gap-0.5 mb-3">
                          {Array.from({ length: t.rating }).map((_, j) => (
                            <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-3">&ldquo;{t.text}&rdquo;</p>
                        <p className="text-xs font-medium">{t.author}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* Premium CTA */}
            <section className="px-4 pb-12">
              <div className="max-w-2xl mx-auto text-center">
                <div className="rounded-2xl bg-primary/5 border border-primary/10 p-8 sm:p-10">
                  <Crown className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold mb-2">Get the Full Experience</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
                    Unlock document checklists, step-by-step guides, cost calculators,
                    and unlimited AI queries. Save $50–300+ per visa application.
                  </p>
                  <Button onClick={() => setShowPricing(true)} size="lg" className="gap-2">
                    <Crown className="w-4 h-4" />
                    View Premium Plans
                  </Button>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t bg-muted/30 py-6 px-4 mt-auto">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="w-4 h-4 text-primary" />
              <span>PakVisa Advisor &copy; {new Date().getFullYear()}</span>
              <span className="text-muted-foreground/50">•</span>
              <span>Free Visa Tool for Pakistani Passport</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <button onClick={() => setActiveModal('about')} className="hover:text-foreground transition-colors">About</button>
              <button onClick={() => setActiveModal('privacy')} className="hover:text-foreground transition-colors">Privacy</button>
              <button onClick={() => setActiveModal('terms')} className="hover:text-foreground transition-colors">Terms</button>
              <button onClick={() => setActiveModal('contact')} className="hover:text-foreground transition-colors">Contact</button>
              <a
                href="/api/download-backup"
                download
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-card hover:bg-muted transition-colors text-xs font-medium"
              >
                <Download className="w-3 h-3" /> Backup
              </a>
            </div>
          </div>
        </div>
      </footer>
      </>
      )}

      {/* ===== TOOL PANELS (replace main content) ===== */}
      {activeTool === 'quiz' && (
        <VisaQuizPanel
          countries={countries}
          onClose={() => setActiveTool(null)}
          onSelectCountry={openCountryFromTool}
        />
      )}
      {activeTool === 'compare' && (
        <ComparePanel
          countries={countries}
          onClose={() => setActiveTool(null)}
          onSelectCountry={openCountryFromTool}
        />
      )}

      {/* ===== MODALS ===== */}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showAiChat && <AiChatPanel onClose={() => setShowAiChat(false)} />}
      {activeModal === 'about' && <AboutModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'privacy' && <PrivacyModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'terms' && <TermsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'contact' && <ContactModal onClose={() => setActiveModal(null)} />}
    </div>
  );
}
