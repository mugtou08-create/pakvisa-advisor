'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Globe, Search, Sun, Moon, HelpCircle, Sparkles,
  BarChart3, ClipboardList, Shield, Clock, DollarSign, Plane,
  ChevronDown, ChevronUp, Heart, X, ArrowRight, Check, Lock,
  Star, Zap, Crown, MapPin, FileText, Download, ExternalLink, SearchX,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle,
  CheckCircle2, Info, Users, Award, TrendingUp, Share2, Phone, Building, Mail,
  ArrowUp, LogIn, LogOut, User as UserIcon, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store';
import { useAuthStore, isProUser } from '@/lib/auth-store';
import type { CountryData, CostProfileData } from '@/lib/types';
import { CODE_TO_SLUG } from '@/lib/country-slug';
import dynamic from 'next/dynamic';

// Lazy-load heavy components — they only render on user interaction.
const CountryDetailPanel = dynamic(() => import('@/components/visa/country-detail').then(m => ({ default: m.CountryDetailPanel })), { loading: () => <div className="p-6"><Skeleton className="h-64 w-full" /></div> });
const AuthModal = dynamic(() => import('@/components/visa/auth-modal').then(m => ({ default: m.AuthModal })), { ssr: false });

const VisaQuizPanel = dynamic(() => import('@/components/visa/visa-quiz-panel').then(m => ({ default: m.VisaQuizPanel })), { ssr: false });
const ComparePanel = dynamic(() => import('@/components/visa/compare-panel').then(m => ({ default: m.ComparePanel })), { ssr: false });
const PricingModal = dynamic(() => import('@/components/visa/modals').then(m => ({ default: m.PricingModal })), { ssr: false });
const HelpModal = dynamic(() => import('@/components/visa/modals').then(m => ({ default: m.HelpModal })), { ssr: false });
const AboutModal = dynamic(() => import('@/components/visa/modals').then(m => ({ default: m.AboutModal })), { ssr: false });
const PrivacyModal = dynamic(() => import('@/components/visa/modals').then(m => ({ default: m.PrivacyModal })), { ssr: false });
const TermsModal = dynamic(() => import('@/components/visa/modals').then(m => ({ default: m.TermsModal })), { ssr: false });
const ContactModal = dynamic(() => import('@/components/visa/modals').then(m => ({ default: m.ContactModal })), { ssr: false });
const PaymentProofModal = dynamic(() => import('@/components/visa/payment-proof-modal').then(m => ({ default: m.PaymentProofModal })), { ssr: false });
const AdminDialog = dynamic(() => import('@/components/app/admin-dialog').then(m => ({ default: m.AdminDialog })), { ssr: false });
const WhatsAppButton = dynamic(() => import('@/components/app/whatsapp-button').then(m => ({ default: m.WhatsAppButton })), { ssr: false });
const SaraWidget = dynamic(() => import('@/components/app/sara-widget').then(m => ({ default: m.SaraWidget })), { ssr: false });
import { getFlagUrl, REGIONS, getRegion, SUCCESS_STORIES } from '@/components/app/constants';


// ============================================================
// Helpers
// ============================================================
function affiliateGo(partner: string, country?: string, isMounted?: boolean) {
  const params = new URLSearchParams({ p: partner });
  if (country) params.set('c', country);
  // Only include sid/page after mount to avoid hydration mismatch
  if (isMounted) {
    try {
      const sid = localStorage.getItem('_pvsid') || '';
      if (sid) params.set('sid', sid);
      params.set('page', window.location.pathname);
    } catch {}
  }
  return `/api/go?${params.toString()}`;
}
const toSlug = (name: string) => name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');

// ============================================================
// Testimonials
// ============================================================
const TESTIMONIALS = [
  { text: "Found out I can get Turkey e-visa in 5 minutes! Saved me a trip to the embassy.", author: "Ahmed K., Lahore", rating: 5 },
  { text: "Compared 4 countries side by side. Got Turkey e-Visa in 5 minutes — so easy!", author: "Sara M., Karachi", rating: 5 },
  { text: "The AI told me exactly which documents I was missing. Got approved first try.", author: "Bilal R., Islamabad", rating: 5 },
];

// ============================================================
// Popular Countries (used for hero search pills)
// ============================================================
const POPULAR_COUNTRIES = [
  'UAE', 'Saudi Arabia', 'Turkey', 'Malaysia',
  'Thailand', 'UK', 'USA', 'China',
];

// ============================================================
// Visa Policy Alerts
// ============================================================
const VISA_ALERTS = [
  { id: 1, icon: 'check', color: 'text-emerald-600', title: 'Turkey e-Visa Now Available', source: 'evisa.gov.tr', url: 'https://www.evisa.gov.tr/en/' },
  { id: 2, icon: 'plane', color: 'text-amber-600', title: 'Malaysia e-Visa Available', source: 'imi.gov.my', url: 'https://www.imi.gov.my/index.php/main/passport/visa-requirement' },
  { id: 3, icon: 'info', color: 'text-sky-600', title: 'Saudi Visa for Pakistani Tourists', source: 'visitsaudi.com', url: 'https://visitsaudi.com/' },
  { id: 4, icon: 'alert', color: 'text-orange-600', title: 'UAE Insurance Requirement', source: 'uaevisaonline.com', url: 'https://uaevisaonline.com/uae-visa-on-arrival/' },
  { id: 5, icon: 'check', color: 'text-emerald-600', title: 'Azerbaijan e-Visa Online', source: 'evisa.gov.az', url: 'https://evisa.gov.az/en/' },
  { id: 6, icon: 'info', color: 'text-sky-600', title: 'Thailand e-Visa for Pakistanis', source: 'thaievisa.go.th', url: 'https://www.thaievisa.go.th/' },
];

function getVisaTypeLabelStatic(c: { visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean }) {
  if (c.visaFree) return { label: 'Visa Free', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' };
  if (c.visaOnArrival) return { label: 'Visa on Arrival', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' };
  if (c.etaAvailable) return { label: 'e-Visa', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', dot: 'bg-sky-500' };
  return { label: 'Embassy Required', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400' };
}

function AlertIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'check': return <CheckCircle2 className={className} />;
    case 'plane': return <Plane className={className} />;
    case 'alert': return <AlertTriangle className={className} />;
    default: return <Info className={className} />;
  }
}

// ============================================================
// FAQ Data
// ============================================================
const FAQ_DATA = [
  { q: 'Do Pakistani citizens need a visa for UAE?', a: 'Yes. Pakistani citizens need to obtain a UAE visa before travel through airlines, hotels, or travel agencies. The process is straightforward — most airlines like Emirates and Etihad can arrange it. The government fee is approximately AED 200 (~$54), though agencies may charge more. Processing typically takes 3-5 working days.' },
  { q: 'What is the easiest country to visit with a Pakistani passport?', a: 'The easiest options include: Turkey (e-Visa in minutes for $50), Maldives (free visa on arrival, 30 days), Nepal (free visa on arrival as SAARC member), Cambodia and Indonesia (visa on arrival at the airport). These are the most straightforward options with minimal paperwork.' },
  { q: 'How many countries can Pakistani citizens visit easily?', a: 'Pakistani citizens can visit a handful of countries visa-free or with visa on arrival (like Maldives, Nepal, Cambodia, Indonesia). Many more countries offer e-Visas (Turkey, Armenia, Azerbaijan, Thailand, etc.) which can be obtained online. The total number of accessible countries with visa-free, VOA, or e-Visa is around 35-40. Check our full list for the most up-to-date information.' },
  { q: 'Is the e-Visa process safe and reliable?', a: 'Yes, e-Visas are official government-issued visas. Countries like Turkey, Saudi Arabia, and others process e-Visas through their official government portals. Always apply through the official government website and never through unauthorized third-party agencies.' },
  { q: 'What documents do I need for a visa application?', a: 'Common requirements include: a valid passport (6+ months validity), passport-sized photographs, bank statements (3-6 months), employment letter or business documents, travel itinerary, hotel bookings, and travel insurance. Specific requirements vary by country.' },
  { q: 'How long does visa processing take?', a: 'Processing times vary significantly. e-Visas like Turkey can be approved within 24 hours. Visa on Arrival is instant at the airport. Embassy visas for countries like UK, USA, or Schengen states can take 2-6 weeks. Check individual country pages for specific timelines.' },
  { q: 'Can I travel to Europe with a Pakistani passport?', a: 'Pakistani citizens need a Schengen visa to visit most European countries. This requires applying at the embassy or consulate of your main destination. The process typically takes 2-4 weeks and requires comprehensive documentation including financial proof, travel insurance, and accommodation bookings.' },
  { q: 'What is the cost of a visa for popular destinations?', a: 'Costs vary widely. Turkey e-Visa costs $50. UAE visa is approximately $90-120 via agencies. Schengen visa fee is €90 (~$97). UK visa costs approximately £135 (~$170). US visa MRV fee is $185. Many countries like Maldives and Nepal offer free visa on arrival. Check each country page for exact fees.' },
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
// Stats type
// ============================================================
interface StatsData {
  totalCountries: number;
  visaFreeCount: number;
  visaOnArrivalCount: number;
  eVisaCount: number;
  embassyRequiredCount: number;
}

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
      className={`text-left rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${colorClass} group`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 rounded-lg bg-muted group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-200">
          {icon}
        </div>
        {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
      </div>
      <div className="font-semibold mb-1">{title}</div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </button>
  );
}

// ============================================================
// Compact PDF Download Button (used inside CountryResultCard)
// ============================================================
function CountryPdfButton({ code, name }: { code: string; name: string }) {
  const { user } = useAuthStore();
  const isPro = isProUser(user);
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (!isPro) {
      window.dispatchEvent(new CustomEvent('open-pricing'));
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/pdf/visa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate PDF');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pakvisa-${name.replace(/\s+/g, '-').toLowerCase()}-guide.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
    }
    setGenerating(false);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      className={isPro
        ? 'h-7 gap-1.5 text-xs border-emerald-300 dark:border-emerald-700 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
        : 'h-7 gap-1.5 text-xs border-amber-300 dark:border-amber-700 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20'
      }
      onClick={handleDownload}
      disabled={generating}
    >
      {generating ? (
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isPro ? (
        <><Download className="w-3 h-3" /> PDF</>
      ) : (
        <><Crown className="w-3 h-3" /> PDF</>
      )}
    </Button>
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
            <img src={country.flagUrl} alt={`${country.name} flag`} className="w-full h-full object-cover" width={48} height={32} />
          ) : (() => {
            const flagSrc = getFlagUrl(country.code);
            return flagSrc ? (
              <img src={flagSrc} alt={`${country.name} flag`} className="w-full h-full object-cover" width={48} height={32} />
            ) : (
              <span className="text-lg">{country.flagEmoji}</span>
            );
          })()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-semibold text-sm truncate"
            >
              {country.name}
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${vt.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${vt.dot}`} />
              {vt.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {country.visaFree ? (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">Free</span>
            ) : country.costProfile?.visaFeeUSD ? (
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />${country.costProfile.visaFeeUSD}</span>
            ) : null}
            {country.visaFree ? null : (
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{country.processingDaysMin}-{country.processingDaysMax}d</span>
            )}
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{Math.min(country.safetyRating, 5)}/5</span>
            {country.currencyCode && (
              <span className="flex items-center gap-1 hidden sm:flex"><Globe className="w-3 h-3" />{country.currencyCode}</span>
            )}
          </div>
        </div>

        {/* Apply + Favorite + Expand */}
        <div className="flex items-center gap-2 shrink-0">
          {!country.visaFree && (
            <a
              href={affiliateGo('ivisa', country.name)}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors shadow-sm hover:shadow-md"
            >
              Apply for Visa <ArrowRight className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
            className="p-2.5 min-w-[44px] min-h-[44px] rounded-full hover:bg-muted transition-colors flex items-center justify-center"
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded Details - Full Info Panel */}
      {expanded && <CountryDetailPanel country={country} />}
      {expanded && (
        <div className="px-4 pb-3 flex items-center gap-3 flex-wrap">
          <a
            href={`/${CODE_TO_SLUG[country.code] || toSlug(country.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View Full Country Guide <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <CountryPdfButton code={country.code} name={country.name} />
        </div>
      )}
    </Card>
  );
}

// ============================================================
// ITEMS_PER_PAGE
// ============================================================
const ITEMS_PER_PAGE = 8;

// ============================================================
// Main Component
// ============================================================
export default function HomeClient({ initialCountries, initialStats, children }: {
  initialCountries: CountryData[];
  initialStats: StatsData;
  children?: React.ReactNode;
}) {
  // Theme
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Store
  const favorites = useAppStore((s) => s.favorites);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Auth
  const { user, isAuthenticated, checkAuth, logout: authLogout, latestProof } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentProof, setShowPaymentProof] = useState(false);

  // Check auth on mount
  useEffect(() => { checkAuth(); }, [checkAuth]);

  // Sync isProUser with auth store
  const setIsProUser = useAppStore((s) => s.setIsProUser);
  useEffect(() => {
    if (isAuthenticated && user) {
      const isPro = isProUser(user);
      setIsProUser(isPro);
    } else {
      setIsProUser(false);
    }
  }, [isAuthenticated, user, setIsProUser]);

  // User menu
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Admin
  const [adminOpen, setAdminOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  // Tool panels
  const [activeTool, setActiveTool] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({ access: null, region: null, sortDir: 'az' });
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  // Data — initialized from props (no API fetch needed)
  const countries = initialCountries;
  const stats = initialStats;

  // FAQ
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Back to top
  const isUserPro = isProUser(user);
  const [showBackToTop, setShowBackToTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 600);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for 'open-pricing' custom event (from Pro-gated components)
  useEffect(() => {
    const handler = () => setActiveModal('pricing');
    window.addEventListener('open-pricing', handler);
    return () => window.removeEventListener('open-pricing', handler);
  }, []);

  // Listen for 'open-auth' custom event
  useEffect(() => {
    const handler = () => setShowAuthModal(true);
    window.addEventListener('open-auth', handler);
    return () => window.removeEventListener('open-auth', handler);
  }, []);

  // Track visitor (moved from layout.tsx)
  useEffect(() => {
    try {
      let sid = localStorage.getItem('_pvsid');
      if (!sid) {
        sid = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('_pvsid', sid);
      }
      function sendHeartbeat() {
        try {
          fetch('/api/track-visitor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: sid,
              page: window.location.pathname,
              referrer: document.referrer,
            }),
            keepalive: true,
          }).catch(function() {});
        } catch(e) { /* empty */ }
      }
      sendHeartbeat();
      const interval = setInterval(sendHeartbeat, 30000);
      const handleUnload = () => sendHeartbeat();
      window.addEventListener('beforeunload', handleUnload);
      return () => {
        clearInterval(interval);
        window.removeEventListener('beforeunload', handleUnload);
      };
    } catch(e) { /* empty */ }
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

  // Log search queries to admin analytics (debounced)
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) return;
    const t = setTimeout(() => {
      try { fetch('/api/log-search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: searchQuery, results: 0 }) }).catch(() => {}); } catch {}
    }, 2000);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Scroll to country list when searching or expanding
  const countryListRef = useRef<HTMLDivElement>(null);
  const filteredCountriesRef = useRef<CountryData[]>([]);

  // Helper: scroll to a specific country card by code, or fall back to section
  const scrollToCountry = useCallback((code: string | null) => {
    if (code) {
      const el = document.getElementById(`country-card-${code}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    // Fallback: scroll to the section
    countryListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handlePopularClick = useCallback((name: string) => {
    setSearchQuery(name);
    setFilters({ access: null, region: null, sortDir: 'az' });
    setCurrentPage(1);
    // After React re-renders with new search, scroll to the country
    requestAnimationFrame(() => {
      setTimeout(() => {
        const match = filteredCountriesRef.current.find((c) => c.name === name);
        if (match) {
          setExpandedCountry(match.code);
          scrollToCountry(match.code);
        } else {
          scrollToCountry(null);
        }
      }, 150);
    });
  }, [scrollToCountry]);

  // Keep filteredCountries ref in sync
  filteredCountriesRef.current = filteredCountries;

  const handleDestClick = useCallback((name: string) => {
    setSearchQuery(name);
    setFilters({ access: null, region: null, sortDir: 'az' });
    setCurrentPage(1);
    // Find and expand
    requestAnimationFrame(() => {
      setTimeout(() => {
        const match = filteredCountriesRef.current.find((c) => c.name === name);
        if (match) {
          setExpandedCountry(match.code);
          scrollToCountry(match.code);
        } else {
          scrollToCountry(null);
        }
      }, 200);
    });
  }, [scrollToCountry]);

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
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  }, []);

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
    if (activeTool === 'quiz') return <VisaQuizPanel countries={countries} onClose={closeTool} onSelectCountry={selectCountryFromTool} />;
    if (activeTool === 'compare') return <ComparePanel countries={countries} onClose={closeTool} onSelectCountry={selectCountryFromTool} isProUser={!!isUserPro} />;
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
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" className="min-w-[44px] min-h-[44px]">
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
            <div className="flex items-center gap-3">
              <p>&copy; {new Date().getFullYear()} PakVisa Advisor. All rights reserved.</p>
              <button onClick={() => setAdminOpen(true)} className="p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="Admin Dashboard" title="Admin Dashboard">
                <Lock className="w-3.5 h-3.5 opacity-40 hover:opacity-70" />
              </button>
            </div>
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
        {activeModal === 'pricing' && <PricingModal onClose={() => setActiveModal(null)} onOpenPaymentProof={() => { setActiveModal(null); setShowPaymentProof(true); }} />}
        {activeModal === 'help' && <HelpModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'about' && <AboutModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'privacy' && <PrivacyModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'terms' && <TermsModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'contact' && <ContactModal onClose={() => setActiveModal(null)} />}
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        {showPaymentProof && <PaymentProofModal onClose={() => setShowPaymentProof(false)} />}
        <AdminDialog open={adminOpen} onClose={() => setAdminOpen(false)} aiEnabled={aiEnabled} setAiEnabled={setAiEnabled} />
      </div>
    );
  }

  // ============================================================
  // Main Page Render
  // ============================================================
  return (
    <>
      {/* ==================== SECTION 1: HEADER ==================== */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <Globe className="w-5 h-5 text-emerald-600" />
            <span>PakVisa</span>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="gap-1.5 text-xs"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline max-w-[80px] truncate">{user.fullName.split(' ')[0]}</span>
                  {isUserPro && <Crown className="w-3 h-3 text-amber-500" />}
                </Button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border bg-card shadow-lg py-1">
                      <div className="px-3 py-2 border-b">
                        <p className="text-sm font-medium truncate">{user.fullName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        {isUserPro && user.proExpiresAt && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Pro until {new Date(user.proExpiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                        {isUserPro && user.proExpiresAt && (() => {
                          const daysLeft = Math.ceil((new Date(user.proExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                          if (daysLeft <= 3 && daysLeft > 0) return (
                            <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> Pro expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}!
                            </p>
                          );
                          return null;
                        })()}
                        {latestProof?.status === 'pending' && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> Payment proof under review
                          </p>
                        )}
                        {latestProof?.status === 'rejected' && (
                          <p className="text-[10px] text-red-500 mt-0.5">Proof rejected{latestProof.adminNote ? ': ' + latestProof.adminNote : ''}</p>
                        )}
                      </div>
                      <button
                        onClick={() => { setUserMenuOpen(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                      >
                        <UserIcon className="w-3.5 h-3.5" /> My Account
                      </button>
                      {isUserPro && user.proExpiresAt && (() => {
                        const daysLeft = Math.ceil((new Date(user.proExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        if (daysLeft <= 7 && daysLeft > 0) return (
                          <button onClick={() => {
                            setUserMenuOpen(false);
                            setShowPaymentProof(true);
                          }} className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors text-amber-600 dark:text-amber-400">
                            <Crown className="w-3.5 h-3.5" /> Renew Pro ({daysLeft}d left)
                          </button>
                        );
                        return null;
                      })()}
                      {!isUserPro && (
                        <button
                          onClick={() => { setUserMenuOpen(false); setActiveModal('pricing'); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors text-amber-600 dark:text-amber-400"
                        >
                          <Crown className="w-3.5 h-3.5" /> Upgrade to Pro
                        </button>
                      )}
                      {(!isUserPro || latestProof?.status === 'rejected') && (
                        <button
                          onClick={() => { setUserMenuOpen(false); setShowPaymentProof(true); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5" /> Submit Payment Proof
                        </button>
                      )}
                      <div className="border-t" />
                      <button
                        onClick={() => { authLogout(); setUserMenuOpen(false); setShowAuthModal(false); }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 transition-colors text-red-600 dark:text-red-400"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Login</span>
                <span className="text-white/50">|</span>
                <span className="hidden sm:inline">Sign Up</span>
                <span className="sm:hidden">Account</span>
              </button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" className="min-w-[44px] min-h-[44px]">
              {mounted ? (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <Skeleton className="h-4 w-4 rounded" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setActiveModal('pricing')} className="gap-1.5 text-xs">
              <Crown className="w-3 h-3 text-amber-500" /> Premium
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setActiveModal('help')} aria-label="Help" className="min-w-[44px] min-h-[44px]">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="min-h-screen flex flex-col bg-background">
        {/* ==================== MAIN CONTENT ==================== */}
        <main className="flex-1">
          {/* ==================== SECTION 1: HERO ==================== */}
          <section className="relative px-4 pt-10 pb-8 overflow-hidden">
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-br from-emerald-200/40 via-emerald-100/20 to-transparent dark:from-emerald-900/20 dark:via-emerald-800/10 rounded-full blur-3xl" />
              <div className="absolute top-20 left-10 w-40 h-40 bg-amber-200/20 dark:bg-amber-900/10 rounded-full blur-3xl" />
              <div className="absolute top-10 right-10 w-32 h-32 bg-sky-200/20 dark:bg-sky-900/10 rounded-full blur-3xl" />
            </div>
            <div className="max-w-6xl mx-auto text-center relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-medium mb-4">
                <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                Trusted by 10,000+ Pakistani Travelers
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-2">
                Pakistan&apos;s #1 Free{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300 bg-clip-text text-transparent">Visa Checker</span>
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
                Instant visa requirements, fees, and processing times for {stats.totalCountries}+ countries. Trusted by thousands of Pakistani travelers.
              </p>
            </div>
          </section>

          {/* ==================== SECTION 2: SEARCH BAR ==================== */}
          <section className="px-4 pt-8 pb-6">
            <div className="max-w-6xl mx-auto">
              {/* Search bar */}
              <form
                className="max-w-lg mx-auto relative"
                onSubmit={(e) => {
                  e.preventDefault();
                  const query = searchQuery.trim();
                  if (!query) return;
                  // Wait for React to re-render, then scroll
                  requestAnimationFrame(() => {
                    setTimeout(() => {
                      const results = filteredCountriesRef.current;
                      if (results.length === 1) {
                        setExpandedCountry(results[0].code);
                        scrollToCountry(results[0].code);
                      } else if (results.length > 0) {
                        // Scroll to the first matching card
                        scrollToCountry(results[0].code);
                      } else {
                        scrollToCountry(null);
                      }
                    }, 150);
                  });
                }}
              >
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
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </form>
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
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Countries', value: stats.totalCountries, suffix: '+', icon: <Globe className="w-5 h-5 text-emerald-600 shrink-0" />, color: 'text-emerald-600' },
                  { label: 'Visa Free', value: stats.visaFreeCount, suffix: '', icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />, color: 'text-emerald-600' },
                  { label: 'Visa on Arrival', value: stats.visaOnArrivalCount, suffix: '', icon: <Plane className="w-5 h-5 text-amber-600 shrink-0" />, color: 'text-amber-600' },
                  { label: 'e-Visa', value: stats.eVisaCount, suffix: '', icon: <FileText className="w-5 h-5 text-sky-600 shrink-0" />, color: 'text-sky-600' },
                  { label: 'Embassy', value: stats.embassyRequiredCount, suffix: '', icon: <Building className="w-5 h-5 text-gray-500 shrink-0" />, color: 'text-gray-500' },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
                    <div className="p-2 rounded-lg bg-muted">
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums min-w-[2ch]">{stat.value}{stat.suffix}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ==================== SECTION 4: POPULAR DESTINATIONS ==================== */}
          <section className="px-4 pb-10">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-bold mb-4">Popular Destinations</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {POPULAR_COUNTRIES.map((name) => {
                  const c = countries.find((x) => x.name === name);
                  if (!c) return null;
                  const vt = getVisaTypeLabelStatic(c);
                  const slug = CODE_TO_SLUG[c.code];
                  const flagSrc = getFlagUrl(c.code);
                  return (
                    <a
                      key={c.code}
                      href={slug ? `/${slug}` : '#'}
                      className="rounded-xl border bg-card p-4 text-left hover:shadow-md transition-all group hover:-translate-y-0.5 duration-200 block"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-7 rounded overflow-hidden bg-muted shrink-0">
                          {flagSrc ? (
                            <img src={flagSrc} alt={`${c.name} flag`} className="w-full h-full object-cover" width={80} height={53} />
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
                    </a>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ==================== SECTION 5: TRAVEL ESSENTIALS ==================== */}
          <section className="px-4 pb-10">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-bold mb-4">Travel Essentials</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <a href="/api/go?p=ivisa" target="_blank" rel="noopener noreferrer sponsored" className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors shrink-0">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Visa Help</p>
                    <p className="text-xs text-muted-foreground">iVisa</p>
                  </div>
                </a>
                <a href="https://safetywing.com/nomad-insurance?referenceID=26323190&utm_source=26323190&utm_medium=Ambassador" target="_blank" rel="noopener noreferrer sponsored" className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors shrink-0">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Travel Insurance</p>
                    <p className="text-xs text-muted-foreground">SafetyWing</p>
                  </div>
                </a>
                <a href="https://www.booking.com/searchresults.html?aid=304142&label=pakvisa" target="_blank" rel="noopener noreferrer sponsored" className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50 transition-colors shrink-0">
                    <Building className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">Best Hotels</p>
                    <p className="text-xs text-muted-foreground">Booking.com</p>
                  </div>
                </a>
                <a href="https://www.skyscanner.net/" target="_blank" rel="noopener noreferrer sponsored" className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-md hover:border-orange-300 dark:hover:border-orange-700 transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors shrink-0">
                    <Plane className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">Cheap Flights</p>
                    <p className="text-xs text-muted-foreground">Skyscanner</p>
                  </div>
                </a>
              </div>
              <p className="text-[10px] text-muted-foreground/80 text-center mt-2">Trusted travel partners — we may earn a commission at no extra cost to you</p>
            </div>
          </section>

          {/* ==================== VISA POLICY ALERTS CAROUSEL ==================== */}
          <section className="px-4 pb-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wide">Visa Policy Alerts</h3>
              </div>
              <style>{`
                @keyframes scroll-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
                .alert-carousel-track { animation: scroll-left 30s linear infinite; }
                .alert-carousel-track:hover { animation-play-state: paused; }
              `}</style>
              <div className="overflow-hidden">
                <div className="alert-carousel-track flex gap-3">
                  {[...VISA_ALERTS, ...VISA_ALERTS].map((alert, idx) => (
                    <a
                      key={`${alert.id}-${idx}`}
                      href={alert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 w-72 shrink-0 rounded-xl border bg-card px-4 py-3 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer"
                    >
                      <div className={`p-1.5 rounded-full bg-muted shrink-0 ${alert.color}`}>
                        <AlertIcon type={alert.icon} className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{alert.title}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{alert.source}</p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ==================== SECTION 6: FILTER BAR + COUNTRY LIST ==================== */}
          <section className="px-4 pb-10 scroll-mt-16" ref={countryListRef}>
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold">All Destinations</h2>
                {filteredCountries.length > 0 && (
                  <Badge variant="secondary" className="text-xs font-normal">{filteredCountries.length} result{filteredCountries.length !== 1 ? 's' : ''}</Badge>
                )}
              </div>

              {/* Filter bar + list (data always available from props) */}
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
                    aria-label="Sort destinations"
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
                      <div key={c.code} id={`country-card-${c.code}`} className="scroll-mt-16">
                        <CountryResultCard
                          country={c}
                          expanded={expandedCountry === c.code}
                          onToggle={() => setExpandedCountry((prev) => prev === c.code ? null : c.code)}
                          isFav={favorites.includes(c.code)}
                          onToggleFav={() => {
                            if (!isUserPro) { setActiveModal('pricing'); return; }
                            toggleFavorite(c.code);
                          }}
                        />
                      </div>
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
            </div>
          </section>


          {/* ==================== SECTION 7: QUICK TOOLS STRIP ==================== */}
          <section className="px-4 pb-10">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-bold mb-4">Quick Tools</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  onClick={() => { if (!isUserPro) { setActiveModal('pricing'); return; } setActiveTool('compare'); }}
                  badge="Pro"
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
                  <Card key={i} className="p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-0.5 mb-3">
                      {Array.from({ length: t.rating }).map((_, si) => (
                        <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {t.author.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold">{t.author}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* ==================== SECTION 9: PASSPORT POWER RANKING ==================== */}
          <section className="px-4 pb-10">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-bold mb-3">Pakistan Passport Power Ranking</h2>
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-around gap-2 mb-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-600">#106</p>
                    <p className="text-[10px] text-muted-foreground">Global Rank</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <p className="text-2xl font-bold">36</p>
                    <p className="text-[10px] text-muted-foreground">Visa Score</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">33</p>
                    <p className="text-[10px] text-muted-foreground">Visa-Free</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {PASSPORT_RANKINGS.map((p) => (
                    <div key={p.country} className={`flex items-center gap-2 rounded-md px-3 py-1.5 ${p.country === 'Pakistan' ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800' : ''}`}>
                      <span className="text-sm">{p.flag}</span>
                      <span className={`text-xs font-medium flex-1 ${p.country === 'Pakistan' ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>{p.country}</span>
                      <span className="text-[10px] text-muted-foreground">#{p.rank}</span>
                      <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.country === 'Pakistan' ? 'bg-emerald-500' : 'bg-gray-400'}`}
                          style={{ width: `${(p.score / 70) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-medium w-5 text-right">{p.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ==================== SECTION 10: COMMUNITY EXPERIENCES ==================== */}
          <section className="px-4 pb-10">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-bold mb-4">Community Experiences</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUCCESS_STORIES.map((story) => (
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
                  'Data Updated August 2026',
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
                  <Button onClick={() => setActiveModal('pricing')} className="gap-1.5" disabled={!!isUserPro}>
                    {isUserPro ? "You're a Pro Member ✓" : 'View Premium Plans'}
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

          {/* ==================== SECTION 15: CONTACT US ==================== */}
          <section className="px-4 pb-10">
            <div className="max-w-xl mx-auto">
              <div
                className="flex items-center justify-between rounded-xl border bg-card p-4 cursor-pointer hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700 transition-all"
                onClick={() => setActiveModal('contact')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveModal('contact'); }}
                aria-label="Open contact form"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    <Mail className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Contact Us</p>
                    <p className="text-xs text-muted-foreground">Have a question? Click to send us a message.</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </section>
        </main>

        {/* ==================== SECTION 16: FOOTER ==================== */}
        <footer className="border-t bg-muted/30 mt-auto">
          {/* Affiliate Partners Bar */}
          <div className="border-b border-border">
            <div className="max-w-6xl mx-auto px-4 py-5">
              <p className="text-center text-xs text-muted-foreground/80 font-medium uppercase tracking-widest mb-3">Trusted Travel Partners</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={affiliateGo('ivisa', undefined, mounted)}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 hover:shadow-sm transition-all group"
                >
                  <FileText className="w-4 h-4 text-emerald-600" /> <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400 group-hover:underline">iVisa — Visa Help</span>
                </a>
                <a
                  href="https://safetywing.com/nomad-insurance?referenceID=26323190&utm_source=26323190&utm_medium=Ambassador"
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-950/40 hover:shadow-sm transition-all group"
                >
                  <Shield className="w-4 h-4 text-blue-600" /> <span className="text-sm font-medium text-blue-700 dark:text-blue-400 group-hover:underline">SafetyWing — Travel Insurance</span>
                </a>
                <a
                  href="https://www.booking.com/searchresults.html?aid=304142&label=pakvisa"
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/50 hover:bg-violet-100 dark:hover:bg-violet-950/40 hover:shadow-sm transition-all group"
                >
                  <Building className="w-4 h-4 text-violet-600" /> <span className="text-sm font-medium text-violet-700 dark:text-violet-400 group-hover:underline">Booking.com — Hotels</span>
                </a>
                <a
                  href="https://www.skyscanner.net/"
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 hover:bg-orange-100 dark:hover:bg-orange-950/40 hover:shadow-sm transition-all group"
                >
                  <Plane className="w-4 h-4 text-orange-600" /> <span className="text-sm font-medium text-orange-700 dark:text-orange-400 group-hover:underline">Skyscanner — Flights</span>
                </a>
              </div>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <p>&copy; {new Date().getFullYear()} PakVisa Advisor. All rights reserved.</p>
              <button onClick={() => setAdminOpen(true)} className="p-1.5 rounded-full hover:bg-muted transition-colors" aria-label="Admin Dashboard" title="Admin Dashboard">
                <Lock className="w-3.5 h-3.5 opacity-40 hover:opacity-70" />
              </button>
            </div>
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
        {activeModal === 'pricing' && <PricingModal onClose={() => setActiveModal(null)} onOpenPaymentProof={() => { setActiveModal(null); setShowPaymentProof(true); }} />}
        {activeModal === 'help' && <HelpModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'about' && <AboutModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'privacy' && <PrivacyModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'terms' && <TermsModal onClose={() => setActiveModal(null)} />}
        {activeModal === 'contact' && <ContactModal onClose={() => setActiveModal(null)} />}
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        {showPaymentProof && <PaymentProofModal onClose={() => setShowPaymentProof(false)} />}

        {/* Admin Dashboard */}
        <AdminDialog open={adminOpen} onClose={() => setAdminOpen(false)} aiEnabled={aiEnabled} setAiEnabled={setAiEnabled} />

        {/* Floating Buttons */}
        <SaraWidget />
        <WhatsAppButton />
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-20 left-6 z-50 w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
            aria-label="Back to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>
    </>
  );
}
