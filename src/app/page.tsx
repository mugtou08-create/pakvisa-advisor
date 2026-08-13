'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Globe, Search, Sun, Moon, HelpCircle, Sparkles, MessageSquare,
  BarChart3, ClipboardList, Shield, Clock, DollarSign, Plane,
  ChevronDown, ChevronUp, Heart, X, ArrowRight, Check, Lock,
  Star, Zap, Crown, MapPin, FileText, Download, ExternalLink, SearchX,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle,
  CheckCircle2, Info, Users, Award, TrendingUp, Share2, Phone, Building,
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
import { CountryDetailPanel } from '@/components/visa/country-detail';
import { PricingModal, HelpModal, AboutModal, PrivacyModal, TermsModal, ContactModal } from '@/components/visa/modals';
import { getFlagUrl, REGIONS, MONTH_NAMES, getRegion, SUCCESS_STORIES } from '@/components/app/constants';

// ============================================================
// Testimonials
// ============================================================
const TESTIMONIALS = [
  { text: "Found out I can get Turkey e-visa in 5 minutes! Saved me a trip to the embassy.", author: "Ahmed K., Lahore", rating: 5 },
  { text: "Compared 4 countries side by side. Chose Malaysia — visa free, no hassle!", author: "Sara M., Karachi", rating: 5 },
  { text: "The AI told me exactly which documents I was missing. Got approved first try.", author: "Bilal R., Islamabad", rating: 5 },
];

// ============================================================
// Popular Countries
// ============================================================
const POPULAR_COUNTRIES = [
  'UAE', 'Saudi Arabia', 'Turkey', 'Malaysia',
  'Thailand', 'UK', 'USA', 'China',
];

// ============================================================
// Visa Policy Alerts
// ============================================================
const VISA_ALERTS = [
  { id: 1, icon: CheckCircle2, color: 'text-emerald-600', title: 'Turkey e-Visa Now Available', desc: 'Pakistani citizens can now apply for a Turkish e-Visa online in minutes.', source: 'evisa.gov.tr' },
  { id: 2, icon: Plane, color: 'text-amber-600', title: 'Malaysia Visa-Free Extended', desc: 'Malaysia has extended visa-free entry for Pakistani passport holders through 2025.', source: 'imi.gov.my' },
  { id: 3, icon: Info, color: 'text-sky-600', title: 'Saudi e-Visa for Tourism', desc: 'Saudi Arabia now offers e-Visa for Pakistani tourists including Umrah travelers.', source: 'visa.visitsaudi.com' },
  { id: 4, icon: AlertTriangle, color: 'text-orange-600', title: 'UAE Insurance Requirement', desc: 'UAE now requires travel insurance for visa on arrival. Check latest rules.', source: 'uaevisaonline.com' },
  { id: 5, icon: CheckCircle2, color: 'text-emerald-600', title: 'Azerbaijan Visa-Free Access', desc: 'Pakistani passport holders enjoy visa-free entry to Azerbaijan for up to 90 days.', source: 'mfa.gov.az' },
  { id: 6, icon: Info, color: 'text-sky-600', title: 'Thailand Visa on Arrival Updated', desc: 'Thailand offers VoA for Pakistani tourists. Ensure you have 10,000 THB in cash proof.', source: 'thaievisa.go.th' },
];

// ============================================================
// FAQ Data
// ============================================================
const FAQ_DATA = [
  { q: 'Do Pakistani citizens need a visa for UAE?', a: 'Pakistani citizens can get a Visa on Arrival in the UAE for up to 30 days. You need a valid passport with 6 months validity, a return ticket, hotel booking confirmation, and travel insurance. The visa is stamped at the airport immigration counter.' },
  { q: 'What is the easiest country to visit with a Pakistani passport?', a: 'Several countries are easy to visit. Malaysia offers visa-free entry. UAE, Qatar, and Saudi Arabia offer Visa on Arrival. Turkey offers a simple e-Visa that can be obtained online in minutes. These are generally the most straightforward options for Pakistani travelers.' },
  { q: 'How many countries can Pakistani citizens visit visa-free?', a: 'Pakistani citizens can visit approximately 30+ countries visa-free or with visa on arrival. This includes several African nations, some Asian countries, and Caribbean destinations. Check our full list above for the most up-to-date information.' },
  { q: 'Is the e-Visa process safe and reliable?', a: 'Yes, e-Visas are official government-issued visas. Countries like Turkey, Saudi Arabia, and others process e-Visas through their official government portals. Always apply through the official government website and never through unauthorized third-party agencies.' },
  { q: 'What documents do I need for a visa application?', a: 'Common requirements include: a valid passport (6+ months validity), passport-sized photographs, bank statements (3-6 months), employment letter or business documents, travel itinerary, hotel bookings, and travel insurance. Specific requirements vary by country.' },
  { q: 'How long does visa processing take?', a: 'Processing times vary significantly. e-Visas like Turkey can be approved within 24 hours. Visa on Arrival is instant at the airport. Embassy visas for countries like UK, USA, or Schengen states can take 2-6 weeks. Check individual country pages for specific timelines.' },
  { q: 'Can I travel to Europe with a Pakistani passport?', a: 'Pakistani citizens need a Schengen visa to visit most European countries. This requires applying at the embassy or consulate of your main destination. The process typically takes 2-4 weeks and requires comprehensive documentation including financial proof, travel insurance, and accommodation bookings.' },
  { q: 'What is the cost of a visa for popular destinations?', a: 'Costs vary widely. Turkey e-Visa costs around $50. Saudi Arabia e-Visa is approximately $80-120. UAE Visa on Arrival is free but requires insurance. Schengen visa fees are around €80. UK visa costs approximately $130-200. Check each country page for exact fees.' },
  { q: 'How accurate is the information on PakVisa Advisor?', a: 'We source our data from official embassy websites and government portals. Our data is regularly verified and updated. However, visa policies can change with little notice, so we always recommend verifying with the official embassy or consulate before making travel plans.' },
  { q: 'Is PakVisa Advisor free to use?', a: 'Yes! Basic visa search, requirements viewing, and limited AI queries are completely free. We offer a premium plan (PakVisa Pro) for additional features like document checklists, step-by-step guides, and unlimited AI access at $14.90/month (≈ PKR 4,150).' },
  { q: 'What is the best time to apply for a visa?', a: 'Apply at least 4-6 weeks before your planned travel date for embassy visas. For e-Visas, 1-2 weeks is usually sufficient. Avoid peak travel seasons (summer, December holidays) as processing times may be longer. Some countries have specific application windows.' },
  { q: 'Can I get a visa if I have been previously rejected?', a: 'A previous rejection does not automatically disqualify you, but you must address the reasons for the previous rejection in your new application. Provide additional documentation, stronger financial proof, and a clear explanation of any changes in your circumstances. Consult our AI advisor for personalized guidance.' },
  { q: 'Does PakVisa Advisor help with the actual visa application?', a: 'PakVisa Advisor provides information, guidance, and tools to help you prepare. We show you requirements, costs, processing times, and provide AI-powered advice. However, you must submit your application directly to the relevant embassy, consulate, or official e-Visa portal.' },
];

// ============================================================
// Passport Power Rankings
// ============================================================
const PASSPORT_RANKINGS = [
  { country: 'Pakistan', flag: '🇵🇰', rank: 106, score: 36, visaFree: 33 },
  { country: 'India', flag: '🇮🇳', rank: 82, score: 58, visaFree: 58 },
  { country: 'Bangladesh', flag: '🇧🇩', rank: 101, score: 40, visaFree: 40 },
  { country: 'Afghanistan', flag: '🇦🇫', rank: 111, score: 26, visaFree: 26 },
];

// ============================================================
// Filter State Type
// ============================================================
type FilterState = {
  access: string | null;
  region: string | null;
  sortDir: string;
};

// ============================================================
// Pagination Helper
// ============================================================
function generatePageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) pages.push('ellipsis');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('ellipsis');
  if (total > 1) pages.push(total);
  return pages;
}

// ============================================================
// Visa Type Helpers (single source of truth for access type)
// Priority: visaFree > visaOnArrival > etaAvailable > embassy
// ============================================================
function getPrimaryAccess(c: CountryData): string {
  if (c.visaFree) return 'visa-free';
  if (c.visaOnArrival) return 'visa-on-arrival';
  if (c.etaAvailable) return 'e-visa';
  return 'embassy';
}
function getVisaType(c: CountryData) {
  const access = getPrimaryAccess(c);
  switch (access) {
    case 'visa-free':     return { label: 'Visa Free', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' };
    case 'visa-on-arrival': return { label: 'Visa on Arrival', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' };
    case 'e-visa':       return { label: 'e-Visa', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', dot: 'bg-sky-500' };
    default:             return { label: 'Embassy Required', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400' };
  }
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
    </button>
  );
}

// ============================================================
// Country Result Card
// ============================================================
function CountryResultCard({ country, expanded, onToggle, isFav, onToggleFav }: {
  country: CountryData;
  expanded: boolean;
  onToggle: () => void;
  isFav: boolean;
  onToggleFav: () => void;
}) {
  const vt = getVisaType(country);

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <div
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}
        role="button"
        tabIndex={0}
        className="w-full text-left p-4 flex items-center gap-4 cursor-pointer select-none"
        aria-expanded={expanded}
 >
        {/* Flag */}
        <div className="w-12 h-8 rounded overflow-hidden bg-muted shrink-0 flex items-center justify-center">
          {country.flagUrl ? (
            <img src={country.flagUrl} alt={`${country.name} flag`} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">{country.flagEmoji}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{country.name}</span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${vt.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${vt.dot}`} />
              {vt.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {country.costProfile?.visaFeeUSD ? (
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${country.costProfile.visaFeeUSD}</span>
            ) : null}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{country.processingDaysMin}-{country.processingDaysMax}d</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{Math.min(country.safetyRating, 5)}/5</span>
            {country.currencyCode && (
              <span className="flex items-center gap-1 hidden sm:flex"><Globe className="w-3 h-3" />{country.currencyCode}</span>
            )}
          </div>
        </div>

        {/* Favorite & Expand */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded Details - Full Info Panel */}
      {expanded && <CountryDetailPanel country={country} />}
    </Card>
  );
}

// ============================================================
// ITEMS_PER_PAGE
// ============================================================
const ITEMS_PER_PAGE = 15;

// ============================================================
// Main Component
// ============================================================
export default function HomePage() {
  // Theme
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Store
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Tool panels
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({ access: null, region: null, sortDir: 'az' });
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  // Data
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [stats, setStats] = useState<{ totalCountries: number; visaFreeCount: number; visaOnArrivalCount: number; eVisaCount: number; embassyRequiredCount?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FAQ
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Fetch all countries (no limit — client-side filtering)
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [countriesRes, statsRes] = await Promise.all([
          fetch('/api/countries?limit=200'),
          fetch('/api/countries/stats'),
        ]);
        if (!countriesRes.ok || !statsRes.ok) {
          throw new Error('Failed to fetch data');
        }
        const countriesJson = await countriesRes.json();
        const statsJson = await statsRes.json();
        if (countriesJson.success) setCountries(countriesJson.data);
        else throw new Error('Invalid response');
        if (statsJson.success) setStats(statsJson.data);
      } catch (err) {
        console.error(err);
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filtered + sorted countries
  const filteredCountries = useMemo(() => {
    let result = [...countries];

    // Region filter
    if (filters.region) {
      result = result.filter((c) => getRegion(c) === filters.region);
    }

    // Access type filter — uses primary access type (same priority as display)
    if (filters.access) {
      result = result.filter((c) => getPrimaryAccess(c) === filters.access);
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }

    // Sort
    switch (filters.sortDir) {
      case 'az': result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'za': result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'cheapest': result.sort((a, b) => (a.costProfile?.visaFeeUSD ?? 9999) - (b.costProfile?.visaFeeUSD ?? 9999)); break;
      case 'fastest': result.sort((a, b) => a.processingDaysMin - b.processingDaysMin); break;
      case 'safest': result.sort((a, b) => b.safetyRating - a.safetyRating); break;
    }

    return result;
  }, [countries, filters, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredCountries.length / ITEMS_PER_PAGE));
  const paginatedCountries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCountries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCountries, currentPage]);
  const pageNumbers = useMemo(() => generatePageNumbers(currentPage, totalPages), [currentPage, totalPages]);

  // Reset page when filters/search change
  useEffect(() => { setCurrentPage(1); }, [filters, searchQuery]);

  // Scroll to country list when searching or expanding
  const countryListRef = useRef<HTMLDivElement>(null);

  const handlePopularClick = useCallback((name: string) => {
    setSearchQuery(name);
    setFilters({ access: null, region: null, sortDir: 'az' });
    setCurrentPage(1);
    // Expand the country if only one result
    setTimeout(() => {
      countryListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleDestClick = useCallback((name: string) => {
    setSearchQuery(name);
    setFilters({ access: null, region: null, sortDir: 'az' });
    setCurrentPage(1);
    // Find and expand
    setTimeout(() => {
      const match = filteredCountries.find((c) => c.name === name);
      if (match) setExpandedCountry(match.code);
      countryListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  }, [filteredCountries]);

  const clearAllFilters = useCallback(() => {
    setFilters({ access: null, region: null, sortDir: 'az' });
    setSearchQuery('');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = filters.access !== null || filters.region !== null || searchQuery.trim() !== '';

  // Share WhatsApp
  const handleShareWhatsApp = useCallback(() => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://pakvisa.vercel.app';
    const shareText = `Check out PakVisa — Free visa info for 70+ countries for Pakistani passport holders! ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  }, []);

  // Popular countries data (from fetched countries)
  const popularData = useMemo(() => {
    return POPULAR_COUNTRIES.map((name) => countries.find((c) => c.name === name)).filter(Boolean) as CountryData[];
  }, [countries]);

  // ============================================================
  // Render: Tool Panel View (replaces main content, footer stays)
  // ============================================================
  const closeTool = useCallback(() => setActiveTool(null), []);
  const selectCountryFromTool = useCallback((name: string) => {
    setActiveTool(null);
    // Find the country code by name and expand it
    const match = countries.find((c) => c.name === name);
    if (match) setExpandedCountry(match.code);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [countries]);

  const renderToolPanel = () => {
    if (activeTool === 'ai') return <AiChatPanel onClose={closeTool} />;
    if (activeTool === 'quiz') return <VisaQuizPanel countries={countries} onClose={closeTool} onSelectCountry={selectCountryFromTool} />;
    if (activeTool === 'compare') return <ComparePanel countries={countries} onClose={closeTool} onSelectCountry={selectCountryFromTool} />;
    return null;
  };

  // ============================================================
  // If a tool panel is active, render it with back button + footer
  // ============================================================
  if (activeTool) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setActiveTool(null)}>
                <ArrowRight className="w-4 h-4 rotate-180 mr-1" /> Back
              </Button>
              <div className="flex items-center gap-2 font-bold text-lg">
                <Globe className="w-5 h-5 text-emerald-600" />
                <span>PakVisa</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
                {mounted ? (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <Skeleton className="h-4 w-4 rounded" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Tool content */}
        <main className="flex-1">
          {renderToolPanel()}
        </main>

        {/* Footer (always visible) */}
        <footer className="border-t bg-muted/30 mt-auto">
          <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} PakVisa Advisor. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveModal('about')} className="hover:text-foreground transition-colors">About</button>
              <button onClick={() => setActiveModal('privacy')} className="hover:text-foreground transition-colors">Privacy</button>
              <button onClick={() => setActiveModal('terms')} className="hover:text-foreground transition-colors">Terms</button>
              <button onClick={() => setActiveModal('contact')} className="hover:text-foreground transition-colors">Contact</button>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 pb-4">
            <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed">
              <span className="font-medium">Disclaimer:</span> PakVisa Advisor provides visa information for educational and planning purposes only. We are not a government agency, embassy, or visa processing service. Visa policies change frequently — always verify requirements with the official embassy or consulate before making travel plans. We are not liable for decisions made based on the information provided.
            </p>
          </div>
        </footer>

        {/* Modals */}
        {activeModal === 'pricing' && <PricingModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'help' && <HelpModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'about' && <AboutModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'privacy' && <PrivacyModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'terms' && <TermsModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'contact' && <ContactModal onClose={() => setActiveModal(null)} />}
      </div>
    );
  }

  // ============================================================
  // Main Page Render
  // ============================================================
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ==================== SECTION 1: HEADER ==================== */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Globe className="w-5 h-5 text-emerald-600" />
            <span>PakVisa</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
              {mounted ? (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <Skeleton className="h-4 w-4 rounded" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveModal('pricing')} className="gap-1.5 text-xs">
              <Crown className="w-3.5 h-3.5 text-amber-500" /> Premium
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setActiveModal('help')} aria-label="Help">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1">
        {/* ==================== SECTION 2: HERO + SEARCH ==================== */}
        <section className="px-4 pt-10 pb-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              Pakistan&apos;s #1 Free Visa Checker
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto mb-6">
              Instant visa requirements, fees, and processing times for 70+ countries. Trusted by thousands of Pakistani travelers.
            </p>
            {/* Search bar */}
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search any country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-10 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Popular pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {POPULAR_COUNTRIES.map((name) => {
                const c = countries.find((x) => x.name === name);
                if (!c) return null;
                const vt = getVisaType(c);
                return (
                  <button
                    key={name}
                    onClick={() => handlePopularClick(name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-card text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <span className="text-sm">{c.flagEmoji}</span>
                    {name}
                    <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full ${vt.color}`}>{vt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 3: STATS BAR ==================== */}
        <section className="px-4 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats ? [
                { label: 'Countries', value: stats.totalCountries, suffix: '+', icon: Globe, color: 'text-emerald-600' },
                { label: 'Visa Free', value: stats.visaFreeCount, suffix: '', icon: CheckCircle2, color: 'text-emerald-600' },
                { label: 'Visa on Arrival', value: stats.visaOnArrivalCount, suffix: '', icon: Plane, color: 'text-amber-600' },
                { label: 'e-Visa', value: stats.eVisaCount, suffix: '', icon: FileText, color: 'text-sky-600' },
                { label: 'Embassy', value: stats.embassyRequiredCount || 0, suffix: '', icon: Building, color: 'text-gray-500' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 rounded-xl border bg-card p-4">
                  <stat.icon className={`w-5 h-5 ${stat.color} shrink-0`} />
                  <div>
                    <p className="text-lg font-bold">{stat.value}{stat.suffix}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              )) : (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border bg-card p-4">
                    <Skeleton className="w-5 h-5 rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-10" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 4: POPULAR DESTINATIONS GRID ==================== */}
        <section className="px-4 pb-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Popular Destinations</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Skeleton className="w-10 h-7 rounded" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                ))
              ) : popularData.map((c) => {
                const vt = getVisaType(c);
                return (
                  <button
                    key={c.code}
                    onClick={() => handleDestClick(c.name)}
                    className="rounded-xl border bg-card p-4 text-left hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-7 rounded overflow-hidden bg-muted shrink-0">
                        {c.flagUrl ? (
                          <img src={c.flagUrl} alt={`${c.name} flag`} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-base">{c.flagEmoji}</span>
                        )}
                      </div>
                      <span className="font-semibold text-sm group-hover:text-emerald-600 transition-colors truncate">{c.name}</span>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${vt.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${vt.dot}`} />
                      {vt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 5: VISA POLICY ALERTS ==================== */}
        <section className="px-4 pb-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Visa Policy Alerts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VISA_ALERTS.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                  <alert.icon className={`w-5 h-5 ${alert.color} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.desc}</p>
                    {alert.source && <p className="text-[10px] text-muted-foreground/70 mt-1">Source: {alert.source}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 6: FILTER BAR + COUNTRY LIST ==================== */}
        <section className="px-4 pb-10" ref={countryListRef}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold">All Destinations</h2>
              {!loading && filteredCountries.length > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">{filteredCountries.length} result{filteredCountries.length !== 1 ? 's' : ''}</Badge>
              )}
            </div>

            {/* Error state */}
            {error && (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20 p-4 mb-6">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="ml-auto shrink-0">Retry</Button>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && !error && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="rounded-xl border p-4 flex items-center gap-4">
                    <Skeleton className="w-12 h-8 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Filter bar + list (only when data is loaded) */}
            {!loading && !error && (
              <>
                {/* Filter Row 1: Region */}
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    onClick={() => setFilters((f) => ({ ...f, region: null }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filters.region === null ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card hover:bg-muted'}`}
                  >
                    All Regions
                  </button>
                  {REGIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setFilters((f) => ({ ...f, region: f.region === r ? null : r }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filters.region === r ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card hover:bg-muted'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                {/* Filter Row 2: Access Type */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => setFilters((f) => ({ ...f, access: null }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filters.access === null ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card hover:bg-muted'}`}
                  >
                    All Types
                  </button>
                  {[
                    { id: 'visa-free', label: 'Visa Free' },
                    { id: 'visa-on-arrival', label: 'Visa on Arrival' },
                    { id: 'e-visa', label: 'e-Visa' },
                    { id: 'embassy', label: 'Embassy' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setFilters((f) => ({ ...f, access: f.access === t.id ? null : t.id }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filters.access === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card hover:bg-muted'}`}
                    >
                      {t.label}
                    </button>
                  ))}

                  {/* Sort dropdown */}
                  <select
                    value={filters.sortDir}
                    onChange={(e) => setFilters((f) => ({ ...f, sortDir: e.target.value }))}
                    className="ml-auto px-3 py-1.5 rounded-full text-xs font-medium border bg-card hover:bg-muted cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  >
                    <option value="az">A → Z</option>
                    <option value="za">Z → A</option>
                    <option value="cheapest">Cheapest</option>
                    <option value="fastest">Fastest</option>
                    <option value="safest">Safest</option>
                  </select>
                </div>

                {/* Clear filters button */}
                {hasActiveFilters && (
                  <div className="mb-3">
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <X className="w-3 h-3" /> Clear all filters
                    </button>
                  </div>
                )}

                {/* Country list */}
                {paginatedCountries.length === 0 ? (
                  <div className="text-center py-12">
                    <SearchX className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No countries match your search or filters.</p>
                    <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-3">Clear Filters</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedCountries.map((c) => (
                      <CountryResultCard
                        key={c.code}
                        country={c}
                        expanded={expandedCountry === c.code}
                        onToggle={() => setExpandedCountry((prev) => prev === c.code ? null : c.code)}
                        isFav={favorites.includes(c.code)}
                        onToggleFav={() => toggleFavorite(c.code)}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredCountries.length)} of {filteredCountries.length} destinations
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="First page"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {pageNumbers.map((pn, idx) =>
                        pn === 'ellipsis' ? (
                          <span key={`e-${idx}`} className="px-1 text-muted-foreground">...</span>
                        ) : (
                          <button
                            key={pn}
                            onClick={() => setCurrentPage(pn)}
                            className={`w-8 h-8 rounded border text-xs font-medium transition-colors ${currentPage === pn ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card hover:bg-muted'}`}
                          >
                            {pn}
                          </button>
                        )
                      )}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Last page"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ==================== SECTION 7: QUICK TOOLS STRIP ==================== */}
        <section className="px-4 pb-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Quick Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuickToolCard
                icon={<MessageSquare className="w-5 h-5 text-emerald-600" />}
                title="AI Visa Consultant"
                description="Ask any visa question and get instant, personalized answers."
                colorClass="hover:border-emerald-200"
                onClick={() => setActiveTool('ai')}
                badge="Free"
              />
              <QuickToolCard
                icon={<ClipboardList className="w-5 h-5 text-amber-600" />}
                title="Free Visa Quiz"
                description="Answer a few questions and get personalized visa recommendations."
                colorClass="hover:border-amber-200"
                onClick={() => setActiveTool('quiz')}
                badge="Free"
              />
              <QuickToolCard
                icon={<BarChart3 className="w-5 h-5 text-sky-600" />}
                title="Compare Countries"
                description="Compare visa requirements, fees, and costs side by side."
                colorClass="hover:border-sky-200"
                onClick={() => setActiveTool('compare')}
              />
            </div>
          </div>
        </section>

        {/* ==================== SECTION 8: TESTIMONIALS ==================== */}
        <section className="px-4 pb-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold mb-4">What Travelers Say</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TESTIMONIALS.map((t, i) => (
                <Card key={i} className="p-5">
                  <div className="flex items-center gap-0.5 mb-3">
                    {Array.from({ length: t.rating }).map((_, si) => (
                      <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">&ldquo;{t.text}&rdquo;</p>
                  <p className="text-xs font-semibold">{t.author}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 9: PASSPORT POWER RANKING ==================== */}
        <section className="px-4 pb-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Pakistan Passport Power Ranking</h2>
            <Card className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">#106</p>
                  <p className="text-xs text-muted-foreground mt-1">Global Rank</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">36</p>
                  <p className="text-xs text-muted-foreground mt-1">Visa Score</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">33</p>
                  <p className="text-xs text-muted-foreground mt-1">Visa-Free Destinations</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600">70+</p>
                  <p className="text-xs text-muted-foreground mt-1">Total Destinations</p>
                </div>
              </div>
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Regional Comparison</h3>
              <div className="space-y-2">
                {PASSPORT_RANKINGS.map((p) => (
                  <div key={p.country} className={`flex items-center gap-3 rounded-lg p-3 ${p.country === 'Pakistan' ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800' : 'bg-muted/50'}`}>
                    <span className="text-lg">{p.flag}</span>
                    <span className={`text-sm font-medium flex-1 ${p.country === 'Pakistan' ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>{p.country}</span>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>Rank #{p.rank}</span>
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.country === 'Pakistan' ? 'bg-emerald-500' : 'bg-gray-400'}`}
                          style={{ width: `${(p.score / 70) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-medium">{p.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        {/* ==================== SECTION 10: COMMUNITY EXPERIENCES ==================== */}
        <section className="px-4 pb-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Community Experiences</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SUCCESS_STORIES.slice(0, 4).map((story) => (
                <Card key={story.id} className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{story.avatar}</span>
                    <div>
                      <p className="text-sm font-semibold">{story.name}</p>
                      <p className="text-xs text-muted-foreground">{story.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{story.flag}</span>
                    <span className="text-sm font-medium">{story.destination}</span>
                    <Badge variant="outline" className="text-[10px]">{story.visaType}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{story.story}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 11: FAQ ==================== */}
        <section className="px-4 pb-10">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {FAQ_DATA.map((faq, i) => (
                <div key={i} className="rounded-xl border bg-card overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq((prev) => prev === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                    aria-expanded={expandedFaq === i}
                  >
                    <span className="text-sm font-medium pr-4">{faq.q}</span>
                    {expandedFaq === i ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>
                  {expandedFaq === i && (
                    <div className="px-4 pb-4 border-t">
                      <p className="text-sm text-muted-foreground leading-relaxed pt-3">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 12: TRUST BAR ==================== */}
        <section className="px-4 pb-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              {[
                'Verified from Official Embassy Sources',
                'Data Updated August 2025',
                '70+ Destinations Tracked',
                '100% Free',
              ].map((text) => (
                <span key={text} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== SECTION 13: PREMIUM CTA ==================== */}
        <section className="px-4 pb-10">
          <div className="max-w-6xl mx-auto">
            <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10 border-amber-200 dark:border-amber-800">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <Crown className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-bold text-lg">Get the Full Experience</h3>
                  <p className="text-sm text-muted-foreground mt-1">Document checklists, step-by-step guides, PDF reports, and unlimited AI access.</p>
                </div>
                <Button onClick={() => setActiveModal('pricing')} className="gap-1.5">
                  View Premium Plans
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* ==================== SECTION 14: SHARE WHATSAPP ==================== */}
        <section className="px-4 pb-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Share PakVisa</p>
                  <p className="text-xs text-muted-foreground">Share with friends and family on WhatsApp</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleShareWhatsApp} className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950/30">
                <Share2 className="w-3.5 h-3.5" /> Share
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ==================== SECTION 15: FOOTER ==================== */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PakVisa Advisor. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveModal('about')} className="hover:text-foreground transition-colors">About</button>
            <button onClick={() => setActiveModal('privacy')} className="hover:text-foreground transition-colors">Privacy</button>
            <button onClick={() => setActiveModal('terms')} className="hover:text-foreground transition-colors">Terms</button>
            <button onClick={() => setActiveModal('contact')} className="hover:text-foreground transition-colors">Contact</button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed">
            <span className="font-medium">Disclaimer:</span> PakVisa Advisor provides visa information for educational and planning purposes only. We are not a government agency, embassy, or visa processing service. Visa policies change frequently — always verify requirements with the official embassy or consulate before making travel plans. We are not liable for decisions made based on the information provided.
          </p>
        </div>
      </footer>

      {/* ==================== MODALS ==================== */}
      {activeModal === 'pricing' && <PricingModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'help' && <HelpModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'about' && <AboutModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'privacy' && <PrivacyModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'terms' && <TermsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'contact' && <ContactModal onClose={() => setActiveModal(null)} />}
    </div>
  );
}