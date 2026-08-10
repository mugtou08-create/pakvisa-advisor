'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, FileText, BarChart3, Search, ChevronRight, Star, Clock,
  DollarSign, Shield, Calendar, Heart, Plane, Building, MapPin,
  CreditCard, Home, Users, Lightbulb, TrendingUp, TrendingDown,
  ArrowRight, Eye, Sparkles, Target, Compass, Flame, Map as MapIcon, Download, Sun, Landmark,
  SearchX, LayoutGrid, List, RefreshCw, Bookmark, ChevronDown, ChevronUp, X, Filter, SlidersHorizontal, ArrowUpDown,
  History, Clock4,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { CountryData, ScoreBreakdown } from '@/lib/types';
import { QUICK_FILTERS, REGIONS, MONTH_NAMES, RECENT_SEARCHES_KEY, TYPING_PHRASES, getRegion, VISA_CATEGORY_COLORS } from '../constants';
import {
  FlagImage, InteractiveWorldMap, SuccessStoriesCarousel, BestMatchRecommendations,
  CountryCard, CountryListRow, QuickDashboard, VisaCountdownTimer,
} from '../shared-components-1';
import { CountryDetailDialog, SimilarCountriesPanel, EmbassyInfoSection, DestinationDiscoveryPanel, ApplicationTimelineTracker, VisaFeeComparisonChart, SkeletonCountryCards, TypingText, FloatingParticles, SmartQuickSearch, DestinationSpotlight } from '../shared-components-2';
import { VisaStatsDashboard, PassportPowerIndex } from '../shared-components-3';
import { VisaPolicyChangeTracker, ContinentQuickStats, VisaReadinessDashboard, SmartRecommendations, EnhancedFAQ } from '../shared-components-4';
import { CountryComparisonSwiper, VisaEligibilityMap, SocialProofSection, SearchAutoComplete, StatsOverviewDashboard } from '../shared-components-5';

export function ExploreTab() {
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All');
  const [quickFilter, setQuickFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [stats, setStats] = useState<{ totalCountries: number; visaFreeCount: number; visaOnArrivalCount: number; eVisaCount: number; embassyRequiredCount: number; avgCostUSD?: number; cheapestCountry?: { name: string; code: string; flagEmoji: string; visaFeeUSD: number }; fastestProcessing?: { name: string; code: string; flagEmoji: string; processingDaysMin: number } } | null>(null);
  const { selectedCountry, setSelectedCountry, setActiveTab, viewMode, setViewMode, setLastDataFetch, scoreResults, favorites, toggleFavorite, userProfile } = useAppStore();

  useEffect(() => {
    let cancelled = false;
    const fetchWithRetry = async (url: string, retries = 3, delay = 1000): Promise<any> => {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(url);
          if (res.ok) return await res.json();
          if (i < retries - 1) await new Promise(r => setTimeout(r, delay * (i + 1)));
        } catch {
          if (i < retries - 1) await new Promise(r => setTimeout(r, delay * (i + 1)));
        }
      }
      return null;
    };
    const load = async () => {
      setLoading(true);
      const data = await fetchWithRetry('/api/countries');
      if (!cancelled && data?.data) {
        setCountries(data.data);
        setLastDataFetch(new Date().toISOString());
        setLoading(false);
      } else if (!cancelled) {
        toast.error('Failed to load countries. Retrying...');
        setLoading(false);
      }
      const statsData = await fetchWithRetry('/api/countries/stats');
      if (!cancelled && statsData?.data) setStats(statsData.data);
    };
    load();
    return () => { cancelled = true; };
  }, [setLastDataFetch]);

  const filtered = useMemo(() => {
    let result = countries.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
      if (region !== 'All' && getRegion(c) !== region) return false;
      return true;
    });

    // Apply quick filters (single source of truth for visa type filtering)
    if (quickFilter === 'visa-free') result = result.filter(c => c.visaFree);
    else if (quickFilter === 'visa-on-arrival') result = result.filter(c => c.visaOnArrival);
    else if (quickFilter === 'e-visa') result = result.filter(c => c.etaAvailable);
    else if (quickFilter === 'embassy') result = result.filter(c => !c.visaFree && !c.visaOnArrival && !c.etaAvailable);
    else if (quickFilter === 'cheapest') result = [...result].sort((a, b) => (a.costProfile?.totalMonthlyUSD || 9999) - (b.costProfile?.totalMonthlyUSD || 9999));
    else if (quickFilter === 'fastest') result = [...result].sort((a, b) => a.processingDaysMin - b.processingDaysMin);
    else if (quickFilter === 'favorites') result = result.filter(c => favorites.includes(c.code));
    else if (quickFilter === 'safest') result = result.filter(c => c.safetyRating >= 8);

    // Apply month filter - show countries where selected month is best to visit
    if (monthFilter) {
      result = result.filter(c => {
        if (c.bestTravelMonths) {
          const months = c.bestTravelMonths.split(',').map(m => m.trim());
          return months.includes(monthFilter);
        }
        return true;
      });
    }

    return result;
  }, [countries, search, region, quickFilter, monthFilter, favorites]);

  const totalVisaTypes = useMemo(() => {
    return countries.reduce((sum, c) => sum + c.visaTypes.length, 0);
  }, [countries]);

  // Count for quick filter badges
  const filterCounts = useMemo(() => {
    return {
      'visa-free': countries.filter(c => c.visaFree).length,
      'visa-on-arrival': countries.filter(c => c.visaOnArrival).length,
      'e-visa': countries.filter(c => c.etaAvailable).length,
      'embassy': countries.filter(c => !c.visaFree && !c.visaOnArrival && !c.etaAvailable).length,
      'safest': countries.filter(c => c.safetyRating >= 8).length,
      'favorites': favorites.length,
    };
  }, [countries, favorites]);

  // Scroll reveal observer for cards
  const scrollRevealRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = scrollRevealRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    const cards = container.querySelectorAll('.card-reveal');
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [filtered, loading]);

  // Hero search state
  const [heroSearch, setHeroSearch] = useState('');
  const [heroSearchFocused, setHeroSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [heroQuickResult, setHeroQuickResult] = useState<CountryData | null>(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [sortBy, setSortBy] = useState('name');
  const heroSearchRef = useRef<HTMLDivElement>(null);

  // Recent Searches state (Task 12-B Feature 2)
  interface RecentSearchEntry {
    code: string;
    name: string;
    flagEmoji: string;
    searchedAt: number;
  }
  const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const saveRecentSearch = useCallback((country: CountryData) => {
    setRecentSearches(prev => {
      const filtered = prev.filter(s => s.code !== country.code);
      const entry: RecentSearchEntry = { code: country.code, name: country.name, flagEmoji: country.flagEmoji || '', searchedAt: Date.now() };
      const updated = [entry, ...filtered].slice(0, 10);
      requestAnimationFrame(() => { try { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated)); } catch { /* ignore */ } });
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try { localStorage.removeItem(RECENT_SEARCHES_KEY); } catch { /* ignore */ }
  }, []);

  const selectRecentSearch = useCallback((entry: RecentSearchEntry) => {
    const match = countries.find(c => c.code === entry.code);
    if (match) {
      setSelectedCountry(match);
      setHeroQuickResult(match);
      saveRecentSearch(match);
    }
  }, [countries, setSelectedCountry, saveRecentSearch]);

  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Display countries with sort + pagination
  const displayCountries = useMemo(() => {
    let sorted = [...filtered];
    switch (sortBy) {
      case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'visa-free': sorted.sort((a, b) => (b.visaFree ? 1 : 0) - (a.visaFree ? 1 : 0) || a.name.localeCompare(b.name)); break;
      case 'processing': sorted.sort((a, b) => a.processingDaysMin - b.processingDaysMin); break;
      case 'cost': sorted.sort((a, b) => (a.costProfile?.totalMonthlyUSD || 9999) - (b.costProfile?.totalMonthlyUSD || 9999)); break;
      case 'safety': sorted.sort((a, b) => b.safetyRating - a.safetyRating); break;
      default: break;
    }
    return sorted.slice(0, visibleCount);
  }, [filtered, sortBy, visibleCount]);

  // Trending countries (8 popular destinations)
  const trendingCountries = useMemo(() => {
    const names = ['UAE', 'Turkey', 'Malaysia', 'UK', 'Saudi Arabia', 'Thailand', 'Qatar', 'Singapore'];
    return names.map(name => countries.find(c => c.name === name)).filter(Boolean) as CountryData[];
  }, [countries]);

  // Hero search suggestions
  const heroSuggestions = useMemo(() => {
    if (!heroSearch.trim()) return [];
    const q = heroSearch.toLowerCase();
    return countries
      .filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      .slice(0, 8);
  }, [heroSearch, countries]);

  // Helper for hero visa status
  const getHeroVisaStatus = (c: CountryData) => {
    if (c.visaFree) return { label: 'Visa Free', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' };
    if (c.visaOnArrival) return { label: 'Visa on Arrival', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' };
    if (c.etaAvailable) return { label: 'e-Visa', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' };
    return { label: 'Embassy Required', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' };
  };

  // Hero search handlers
  const handleHeroCheckVisa = () => {
    const q = heroSearch.trim().toLowerCase();
    const match = countries.find(c => c.name.toLowerCase() === q || c.code.toLowerCase() === q);
    if (match) {
      setSelectedCountry(match);
      setHeroQuickResult(match);
      saveRecentSearch(match);
      setHeroSearch('');
      setShowSuggestions(false);
    } else {
      toast.error('Country not found. Please select from the suggestions.');
    }
  };

  const handleHeroSelectCountry = (country: CountryData) => {
    setHeroSearch(country.name);
    setShowSuggestions(false);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (heroSearchRef.current && !heroSearchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ctrl+K → scroll to hero search & focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('visa-guide')?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          const input = heroSearchRef.current?.querySelector('input');
          input?.focus();
        }, 300);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="space-y-10" ref={scrollRevealRef}>
      {/* Hero Section - Yellow Mango Themed Compact */}
      <section id="visa-guide" className="relative overflow-hidden rounded-2xl p-4 sm:p-6 md:p-10 bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-400 dark:from-amber-600 dark:via-orange-600 dark:to-yellow-600 glass-card-strong section-hero" style={{ padding: 'clamp(1rem, 4vw, 2.5rem)', textAlign: 'left' }}>
        {/* Gradient mesh overlay */}
        <div className="hero-mesh-bg" />
        {/* Floating decorative orbs */}
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="hero-orb hero-orb-4" />
        <div className="relative z-10 text-amber-950 dark:text-amber-100">
          <motion.h1
            className="text-[17px] sm:text-2xl md:text-3xl font-bold leading-snug mb-0.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            Does a Pakistani need a visa for...
          </motion.h1>
          <p className="text-xs sm:text-sm mb-1 opacity-90">
            Check visa requirements instantly for {countries.length}+ countries
          </p>
          {/* Typing animation */}
          <div className="h-5 sm:h-6 mb-2">
            <TypingText phrases={TYPING_PHRASES} className="text-[11px] sm:text-sm font-medium opacity-80" />
          </div>

          {/* Visa Countdown Timer */}
          <VisaCountdownTimer />

          {/* Search bar with autocomplete */}
          <div className="max-w-xl">
            <SearchAutoComplete
              countries={countries}
              onSelectCountry={(code) => {
                const match = countries.find(c => c.code === code);
                if (match) {
                  setSelectedCountry(match);
                  setHeroQuickResult(match);
                  saveRecentSearch(match);
                }
              }}
            />
          </div>

          {/* Quick Result Card */}
          {heroQuickResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 max-w-xl"
            >
              <Card className="bg-white/95 dark:bg-black/30 border-amber-500/20 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FlagImage code={heroQuickResult.code} flagUrl={heroQuickResult.flagUrl} size={40} emoji={heroQuickResult.flagEmoji} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-amber-950 dark:text-amber-100 truncate">{heroQuickResult.name}</p>
                      <Badge className={`${getHeroVisaStatus(heroQuickResult).color} text-[10px] mt-0.5`} variant="secondary">{getHeroVisaStatus(heroQuickResult).label}</Badge>
                    </div>
                    <div className="text-right text-xs text-amber-800/70 dark:text-amber-200/70 space-y-0.5">
                      <p>{heroQuickResult.processingDaysMin === heroQuickResult.processingDaysMax ? `${heroQuickResult.processingDaysMin} days` : `${heroQuickResult.processingDaysMin}-${heroQuickResult.processingDaysMax} days`}</p>
                      <p>${heroQuickResult.costProfile?.visaFeeUSD || 0}</p>
                    </div>
                    <Button size="sm" variant="outline" className="ml-2 rounded-lg text-xs border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-900/20" onClick={() => setSelectedCountry(heroQuickResult)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Popular destination chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {['Malaysia', 'UAE', 'Turkey', 'UK', 'Saudi Arabia', 'Thailand'].map((name) => (
              <button
                key={name}
                onClick={() => {
                  const c = countries.find(x => x.name === name);
                  if (c) { setSelectedCountry(c); setHeroQuickResult(c); saveRecentSearch(c); }
                }}
                className="hero-chip hover-lift-smooth px-3 py-1.5 rounded-full text-xs font-semibold bg-white/30 dark:bg-black/15 hover:bg-white/60 dark:hover:bg-black/30 transition-all duration-200 border border-white/30 dark:border-white/10 hover:shadow-md hover:scale-105 active:scale-95"
              >
                {name}
              </button>
            ))}
          </div>

          {/* Recent Searches - only when search bar focused and empty */ }
          <AnimatePresence>
            {recentSearches.length > 0 && heroSearchFocused && heroSearch.trim() === '' && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-amber-950/70 dark:text-amber-100/70">
                    <History className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium">Recent Searches</span>
                  </div>
                  <button
                    onClick={clearRecentSearches}
                    className="text-[10px] text-amber-950/50 dark:text-amber-100/50 hover:text-amber-950/80 dark:hover:text-amber-100/80 transition-colors flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map((entry, idx) => (
                    <motion.button
                      key={entry.code}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      onClick={() => selectRecentSearch(entry)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-white/40 dark:bg-black/20 hover:bg-white/70 dark:hover:bg-black/35 transition-all border border-white/30 dark:border-white/10 hover:shadow-sm hover:scale-105 active:scale-95"
                    >
                      <span className="text-sm">{entry.flagEmoji}</span>
                      <span className="font-medium">{entry.name}</span>
                      <span className="text-[9px] opacity-60 flex items-center gap-0.5">
                        <Clock4 className="w-2.5 h-2.5" />
                        {formatRelativeTime(entry.searchedAt)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Trust text */}
          <p className="text-[11px] mt-2 opacity-75">
            ✓ {countries.length} countries · Updated {(() => { const d = new Date(); return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`; })()} · Free to use
          </p>
        </div>
      </section>

      {/* Quick Explore - Country Comparison Swiper */}
      {!loading && countries.length > 0 && (
        <section className="glass-section p-5 md:p-6 rounded-xl">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Quick Explore
          </h2>
          <CountryComparisonSwiper
            countries={countries.slice(0, 8)}
            onSelectCountry={(code) => {
              const c = countries.find((x) => x.code === code);
              if (c) setSelectedCountry(c);
            }}
          />
        </section>
      )}

      {/* Destination Spotlight Carousel */}
      {!loading && countries.length > 0 && (
        <DestinationSpotlight onSelectCountry={setSelectedCountry} />
      )}

      {/* Recent Updates - Visa Policy Change Tracker */}
      {!loading && countries.length > 0 && (
        <section className="space-y-3 py-1">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            Recent Updates
          </h2>
          <VisaPolicyChangeTracker countries={filtered.length > 0 ? filtered : countries} />
        </section>
      )}

      {/* Decorative section divider */}
      <div className="section-gradient-divider-enhanced" />

      {/* Visa Eligibility Map */}
      {!loading && countries.length > 0 && (
        <section className="glass-section p-5 md:p-6 rounded-xl card-accent-top">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <MapIcon className="w-5 h-5 text-amber-500" />
            Visa Eligibility Map
          </h2>
          <VisaEligibilityMap countries={countries} onSelectCountry={setSelectedCountry} />
        </section>
      )}

      {/* Decorative section divider */}
      <div className="section-gradient-divider-enhanced" />

      {/* Passport Power Index - At a glance overview */}
      {!loading && countries.length > 0 && (
        <section className="glass-section p-5 md:p-6 rounded-xl card-accent-top">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-amber-500" />
            Pakistani Passport Overview
          </h2>
          <PassportPowerIndex countries={countries} stats={stats} />
        </section>
      )}

      {/* Decorative section divider */}
      <div className="section-gradient-divider-enhanced" />

      {/* Continent Quick Stats */}
      {!loading && countries.length > 0 && (
        <section className="glass-section p-5 md:p-6 rounded-xl card-accent-left">
          <ContinentQuickStats countries={countries} />
        </section>
      )}

      {/* Statistics Overview */}
      {!loading && countries.length > 0 && (
        <section className="glass-section p-5 md:p-6 rounded-xl">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-5">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Statistics Overview
          </h2>
          <StatsOverviewDashboard countries={countries} />
        </section>
      )}

      {/* Visa Readiness Dashboard */}
      {!loading && countries.length > 0 && (
        <section className="glass-section p-5 md:p-6 rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold">Visa Readiness Dashboard</h2>
          </div>
          <div className="card-elevated-1 rounded-xl p-5">
            <VisaReadinessDashboard countries={countries} userProfile={userProfile} />
          </div>
        </section>
      )}

      {/* Smart Recommendations */}
      {!loading && countries.length > 0 && (
        <section className="glass-section p-5 md:p-6 rounded-xl">
          <SmartRecommendations countries={countries} userProfile={userProfile} />
        </section>
      )}

      {/* Decorative section divider */}
      <div className="section-gradient-divider-enhanced" />

      {/* Visa Requirement World Map */}
      {!loading && countries.length > 0 && (
        <section className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MapIcon className="w-5 h-5 text-amber-500" /> Visa Requirement World Map
              </h2>
              <p className="text-xs text-muted-foreground">Click any country to see visa details</p>
            </div>
          </div>
          <InteractiveWorldMap countries={countries} onSelectCountry={setSelectedCountry} />
        </section>
      )}

      {/* Decorative section divider */}
      <div className="section-gradient-divider-enhanced" />

      {/* Country Directory - Filter Toolbar + Grid */}
      <section id="country-grid" className="space-y-3">
        {/* Section Heading */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-500" /> Explore All Countries
            </h2>
            <p className="text-xs text-muted-foreground">Browse visa requirements for {countries.length} destinations worldwide</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">{filtered.length} shown</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setLoading(true);
                      Promise.all([
                        fetch('/api/countries').then(r => r.json()).then(data => {
                          setCountries(data.data || []);
                          setLastDataFetch(new Date().toISOString());
                          return data.data || [];
                        }),
                        fetch('/api/countries/stats').then(r => r.json()).then(data => {
                          if (data.data) setStats(data.data);
                        }),
                      ]).then(([newCountries]) => {
                        const count = Array.isArray(newCountries) ? newCountries.length : countries.length;
                        toast.success(`Data refreshed — ${count} countries loaded`);
                      }).catch(() => {
                        toast.error('Failed to refresh data');
                      }).finally(() => {
                        setLoading(false);
                      });
                    }}
                    disabled={loading}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                    title="Refresh country data"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Refresh visa data for all {countries.length} countries</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Search + Sort + View Mode + Month Filter Toolbar - Sticky on desktop */}
        <div className="sticky-filter-bar bg-background/95 backdrop-blur-sm sm:rounded-xl sm:border sm:border-border/50 sm:shadow-sm sm:px-4 sm:py-3 -mx-0 sm:-mx-4">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Filter countries by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-10 text-sm" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32 h-10 text-sm">
                <ArrowUpDown className="w-4 h-4 mr-1" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="visa-free">Visa-Free First</SelectItem>
                <SelectItem value="processing">Fastest</SelectItem>
                <SelectItem value="cost">Lowest Cost</SelectItem>
                <SelectItem value="safety">Safest First</SelectItem>
              </SelectContent>
            </Select>
            {/* Best Month to Visit Filter */}
            <Select value={monthFilter} onValueChange={(v) => setMonthFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-36 h-10 text-sm">
                <Sun className="w-4 h-4 mr-1" />
                <SelectValue placeholder="Best Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Month</SelectItem>
                {MONTH_NAMES.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex rounded-lg border p-0.5">
              <button className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-amber-600 text-white' : 'text-muted-foreground'}`} onClick={() => setViewMode('grid')}><LayoutGrid className="w-4 h-4" /></button>
              <button className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-amber-600 text-white' : 'text-muted-foreground'}`} onClick={() => setViewMode('list')}><List className="w-4 h-4" /></button>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{displayCountries.length} of {filtered.length}</span>
          </div>
        </div>

        {/* Region + Visa Type Filters - Combined clean layout */}
        <div className="space-y-2.5">
          {/* Region Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground shrink-0">Region:</span>
            <div className="flex flex-wrap gap-1.5">
              <motion.button
                onClick={() => setRegion('All')}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                  region === 'All'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-background border-border text-muted-foreground hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-400'
                }`}
              >
                <Globe className="w-3 h-3" />All
                <span className={`text-[10px] rounded-full px-1.5 py-0 leading-4 ${region === 'All' ? 'bg-white/20' : 'bg-muted'}`}>{countries.length}</span>
              </motion.button>
              {REGIONS.map((r) => {
                const regionIcons: Record<string, React.ReactNode> = {
                  'Asia': <Globe className="w-3 h-3" />,
                  'Middle East': <Building className="w-3 h-3" />,
                  'Africa': <Sun className="w-3 h-3" />,
                  'Europe': <Landmark className="w-3 h-3" />,
                  'Americas': <MapIcon className="w-3 h-3" />,
                  'Oceania': <Globe className="w-3 h-3" />,
                };
                const isActive = region === r;
                return (
                  <motion.button
                    key={r}
                    onClick={() => setRegion(isActive ? 'All' : r)}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                      isActive
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-background border-border text-muted-foreground hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-400'
                    }`}
                  >
                    {regionIcons[r]}
                    <span className="shrink-0">{r}</span>
                    <span className={`text-[10px] rounded-full px-1.5 py-0 leading-4 ${isActive ? 'bg-white/20' : 'bg-muted'}`}>
                      {countries.filter(c => getRegion(c) === r).length}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Visa Type & Smart Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground shrink-0">Filters:</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_FILTERS.map((qf) => {
                const count = filterCounts[qf.id as keyof typeof filterCounts] ?? null;
                const isActive = quickFilter === qf.id;
                return (
                  <motion.button
                    key={qf.id}
                    onClick={() => setQuickFilter(isActive ? '' : qf.id)}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                      isActive
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-background border-border text-muted-foreground hover:border-amber-400 hover:text-amber-700 dark:hover:text-amber-400'
                    }`}
                  >
                    <qf.icon className="w-3 h-3" />
                    {qf.label}
                    {count !== null && count > 0 && (
                      <span className={`text-[10px] rounded-full px-1.5 py-0 leading-4 ${isActive ? 'bg-white/20' : 'bg-muted'}`}>{count}</span>
                    )}
                  </motion.button>
                );
              })}
              {monthFilter && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setMonthFilter('')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700"
                >
                  <Sun className="w-3 h-3" />
                  Best in {monthFilter}
                  <X className="w-3 h-3" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
        </div>

        {/* Grid / List */}
        {loading ? (
          <div className="loading-dots"><SkeletonCountryCards /></div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 responsive-grid-2 motion-stagger-parent">
            <AnimatePresence mode="popLayout">
              {displayCountries.map((country, idx) => (
                <motion.div key={country.code} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.15 }} style={{ '--stagger-index': idx } as React.CSSProperties}>
                  <div className="card-accent-top rounded-xl motion-stagger-child">
                  <CountryCard country={country} onSelect={setSelectedCountry} rank={quickFilter === 'best-score' ? idx + 1 : undefined} isNew={!!country.createdAt && (Date.now() - new Date(country.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {displayCountries.map((country, idx) => (
                <motion.div key={country.code} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }}>
                  <CountryListRow country={country} onSelect={setSelectedCountry} rank={quickFilter === 'best-score' ? idx + 1 : undefined} isNew={!!country.createdAt && (Date.now() - new Date(country.createdAt).getTime()) < 30 * 24 * 60 * 60 * 1000} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Show More / Show All */}
        {!loading && displayCountries.length < filtered.length && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={() => setVisibleCount(v => v + 12)} className="gap-2 text-sm">
              Show More Countries ({filtered.length - displayCountries.length} remaining)
              <ChevronDown className="w-4 h-4" />
            </Button>
          </div>
        )}
        {!loading && displayCountries.length >= filtered.length && filtered.length > 0 && (
          <p className="text-center text-xs text-muted-foreground pt-2">Showing all {filtered.length} countries</p>
        )}
      </section>

      {/* Trending Destinations - After country grid */}
      {!loading && trendingCountries.length > 0 && (
        <>
        <div className="section-gradient-divider" />
        <section className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" /> Trending Destinations
              </h2>
              <p className="text-xs text-muted-foreground">Most checked by Pakistani travelers</p>
            </div>
            <button onClick={() => document.getElementById('country-grid')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1">
              Back to top <ChevronUp className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {trendingCountries.map((c) => {
              const status = getHeroVisaStatus(c);
              return (
                <motion.div key={c.code} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow p-4 card-warm-shadow" onClick={() => setSelectedCountry(c)}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl"><FlagImage code={c.code} flagUrl={c.flagUrl} size={28} emoji={c.flagEmoji} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground">{c.continent}</p>
                      </div>
                    </div>
                    <Badge className={`${status.color} text-[10px] mb-2`} variant="secondary">{status.label}</Badge>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{c.processingDaysMin === c.processingDaysMax ? `${c.processingDaysMin} days` : `${c.processingDaysMin}-${c.processingDaysMax}d`}</span>
                      <span>${c.costProfile?.visaFeeUSD || 0}</span>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>
        </>
      )}

      {/* Social Proof Section */}
      <section className="mb-6">
        <SocialProofSection />
      </section>

      {/* FAQ Section - Enhanced with Search & Categories */}
      <section className="faq-section-tint rounded-xl p-5 md:p-6">
        <EnhancedFAQ />
      </section>

      {/* Floating Mobile CTA */}
      <div className="fixed bottom-24 right-3 z-40 lg:hidden">
        <button onClick={() => document.getElementById('visa-guide')?.scrollIntoView({ behavior: 'smooth' })} className="w-10 h-10 rounded-full bg-amber-500/90 backdrop-blur-sm text-white shadow-lg shadow-amber-500/20 flex items-center justify-center hover:bg-amber-600 active:scale-95 transition-all border-2 border-white/80 dark:border-background/80" aria-label="Scroll to search">
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      <CountryDetailDialog country={selectedCountry} open={!!selectedCountry} onClose={() => setSelectedCountry(null)} />
    </div>
  );
}
