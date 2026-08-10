'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Star, Clock, DollarSign,
  Sparkles, Settings, RotateCcw, Check,
  Plus, Minus, ZoomIn, ZoomOut, MapPin, Shield, Plane,
  Gavel, Bell, AlertTriangle, Trash2, Eye, EyeOff, Info, User, Briefcase, Wallet, Globe, Luggage, X,
  Calculator, CalendarClock, Users, BadgeCheck, Zap, Save, TrendingUp, ChevronDown, ArrowRight,
  Search, SearchX, ShieldCheck, Trophy, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { toast } from 'sonner';
import type { CountryData, UserProfileData } from '@/lib/types';
import { useAppStore } from '@/lib/store';

// ============================================================
// Feature 1: CountryComparisonSwiper
// ============================================================

function getVisaStatus(c: CountryData) {
  if (c.visaFree) return { label: 'Visa Free', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' };
  if (c.visaOnArrival) return { label: 'Visa on Arrival', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' };
  if (c.etaAvailable) return { label: 'e-Visa', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' };
  return { label: 'Embassy Required', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' };
}

function SafetyStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= Math.round(rating / 2) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

export function CountryComparisonSwiper({ countries, onSelectCountry }: {
  countries: CountryData[];
  onSelectCountry: (code: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const dragRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  // Take top 8 countries for the swiper
  const swiperCountries = countries.slice(0, 8);
  const total = swiperCountries.length;

  const goTo = useCallback((newIndex: number, dir: number) => {
    setDirection(dir);
    setCurrentIndex((newIndex + total) % total);
  }, [total]);

  const goNext = useCallback(() => goTo(currentIndex + 1, 1), [currentIndex, goTo]);
  const goPrev = useCallback(() => goTo(currentIndex - 1, -1), [currentIndex, goTo]);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (isPaused || total === 0) return;
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  }, [isPaused, goNext, total]);

  // Touch/drag handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    startXRef.current = clientX;
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const diff = startXRef.current - clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  if (swiperCountries.length === 0) return null;

  // Get visible indices for 3-card desktop, 1-card mobile
  const getVisibleIndices = () => {
    const indices: number[] = [];
    for (let offset = -1; offset <= 1; offset++) {
      indices.push((currentIndex + offset + total) % total);
    }
    return indices;
  };

  const visibleIndices = getVisibleIndices();
  const centerIdx = visibleIndices[1]; // center card
  const centerCountry = swiperCountries[centerIdx];

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Desktop: 3-card 3D stack */}
      <div className="hidden md:flex items-center justify-center gap-4 py-4">
        {/* Left card */}
        <motion.div
          key={visibleIndices[0]}
          initial={{ opacity: 0, x: direction > 0 ? -80 : -40, scale: 0.85 }}
          animate={{ opacity: 0.5, x: 0, scale: 0.85 }}
          exit={{ opacity: 0, x: direction > 0 ? 40 : -80, scale: 0.85 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="w-64 shrink-0 cursor-pointer"
          style={{ perspective: '1000px', transform: 'rotateY(8deg)' }}
          onClick={() => goTo(visibleIndices[0], -1)}
        >
          <SwipeCard country={swiperCountries[visibleIndices[0]]} onSelect={onSelectCountry} isSide />
        </motion.div>

        {/* Center card */}
        <motion.div
          key={centerIdx}
          initial={{ opacity: 0, x: direction * 120, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -direction * 120, scale: 0.9 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="w-72 shrink-0 z-10"
        >
          <SwipeCard country={centerCountry} onSelect={onSelectCountry} isCenter />
        </motion.div>

        {/* Right card */}
        <motion.div
          key={visibleIndices[2]}
          initial={{ opacity: 0, x: direction > 0 ? 80 : 40, scale: 0.85 }}
          animate={{ opacity: 0.5, x: 0, scale: 0.85 }}
          exit={{ opacity: 0, x: direction > 0 ? -40 : 80, scale: 0.85 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="w-64 shrink-0 cursor-pointer"
          style={{ perspective: '1000px', transform: 'rotateY(-8deg)' }}
          onClick={() => goTo(visibleIndices[2], 1)}
        >
          <SwipeCard country={swiperCountries[visibleIndices[2]]} onSelect={onSelectCountry} isSide />
        </motion.div>
      </div>

      {/* Mobile: single card with swipe */}
      <div
        className="md:hidden overflow-hidden px-4"
        ref={dragRef}
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 200 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 200 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x > 60) goPrev();
              else if (info.offset.x < -60) goNext();
            }}
          >
            <SwipeCard country={swiperCountries[currentIndex]} onSelect={onSelectCountry} isCenter />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-center gap-3 mt-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-900/30"
          onClick={goPrev}
          aria-label="Previous country"
        >
          <ChevronLeft className="w-4 h-4 text-amber-700 dark:text-amber-400" />
        </Button>

        {/* Dot indicators */}
        <div className="flex items-center gap-1.5">
          {swiperCountries.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > currentIndex ? 1 : -1)}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? 'w-6 h-2 bg-amber-500'
                  : 'w-2 h-2 bg-amber-300 dark:bg-amber-700 hover:bg-amber-400'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:hover:bg-amber-900/30"
          onClick={goNext}
          aria-label="Next country"
        >
          <ChevronRight className="w-4 h-4 text-amber-700 dark:text-amber-400" />
        </Button>
      </div>
    </div>
  );
}

function SwipeCard({ country, onSelect, isCenter, isSide }: {
  country: CountryData;
  onSelect: (code: string) => void;
  isCenter?: boolean;
  isSide?: boolean;
}) {
  const status = getVisaStatus(country);

  return (
    <div
      className={`rounded-xl p-5 transition-shadow duration-300 ${
        isCenter
          ? 'card-elevated-2 glass-card shadow-lg shadow-amber-500/10'
          : 'card-elevated-1 glass-card opacity-70'
      } ${isSide ? 'hover:opacity-90' : ''}`}
    >
      {/* Flag + Name */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl leading-none">{country.flagEmoji}</span>
        <div className="min-w-0 flex-1">
          <h3 className={`font-bold truncate ${isCenter ? 'text-base' : 'text-sm'}`}>{country.name}</h3>
          <p className="text-[11px] text-muted-foreground">{country.continent}</p>
        </div>
      </div>

      {/* Visa type badge */}
      <Badge className={`${status.color} text-[10px] mb-3 badge-3d`} variant="secondary">
        {status.label}
      </Badge>

      {/* Safety rating */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] text-muted-foreground">Safety</span>
        <SafetyStars rating={country.safetyRating} />
        <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">{country.safetyRating}/10</span>
      </div>

      {/* Processing time */}
      <div className="flex items-center gap-2 mb-2 text-[11px] text-muted-foreground">
        <Clock className="w-3 h-3 text-amber-500" />
        <span>{country.processingDaysMin === country.processingDaysMax
          ? `${country.processingDaysMin} days`
          : `${country.processingDaysMin}–${country.processingDaysMax} days`
        }</span>
      </div>

      {/* Monthly cost */}
      <div className="flex items-center gap-2 mb-4 text-[11px] text-muted-foreground">
        <DollarSign className="w-3 h-3 text-amber-500" />
        <span>~${country.costProfile?.totalMonthlyUSD?.toLocaleString() || 'N/A'}/mo</span>
      </div>

      {/* View Details button */}
      <Button
        size="sm"
        className={`w-full press-effect ${
          isCenter
            ? 'bg-amber-600 hover:bg-amber-700 text-white'
            : 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50'
        }`}
        onClick={() => onSelect(country.code)}
      >
        View Details
      </Button>
    </div>
  );
}

// ============================================================
// Feature 2: ThemeAccentCustomizer
// ============================================================

const ACCENT_PRESETS = [
  { name: 'Amber', color: '#F59E0B', primary: '245, 158, 11' },
  { name: 'Orange', color: '#F97316', primary: '249, 115, 22' },
  { name: 'Mango', color: '#FB923C', primary: '251, 146, 60' },
  { name: 'Gold', color: '#EAB308', primary: '234, 179, 8' },
  { name: 'Warm Brown', color: '#A16207', primary: '161, 98, 7' },
  { name: 'Rose Gold', color: '#E11D48', primary: '225, 29, 72' },
] as const;

const STORAGE_KEY = 'pakvisa-accent-color';

function applyAccent(preset: typeof ACCENT_PRESETS[number]) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const [r, g, b] = preset.primary.split(', ');
  root.style.setProperty('--accent-primary', preset.color);
  root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
  root.style.setProperty('--accent-foreground', '#FFFFFF');
  root.style.setProperty('--accent-light', `rgba(${r}, ${g}, ${b}, 0.15)`);
  root.style.setProperty('--accent-medium', `rgba(${r}, ${g}, ${b}, 0.3)`);
  localStorage.setItem(STORAGE_KEY, preset.name);
}

export function ThemeAccentCustomizer({ defaultAccent }: { defaultAccent?: string }) {
  const [selected, setSelected] = useState(defaultAccent || 'Amber');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const preset = ACCENT_PRESETS.find(p => p.name === saved);
      if (preset) {
        applyAccent(preset);
      }
    }
  }, []);

  const handleSelect = (preset: typeof ACCENT_PRESETS[number]) => {
    setSelected(preset.name);
    applyAccent(preset);
  };

  const handleReset = () => {
    const defaultPreset = ACCENT_PRESETS[0];
    setSelected(defaultPreset.name);
    applyAccent(defaultPreset);
  };

  const activePreset = ACCENT_PRESETS.find(p => p.name === selected) || ACCENT_PRESETS[0];

  return (
    <Card className="card-elevated-1 glass-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-500" />
          Accent Color
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Color preset buttons */}
        <div className="flex items-center justify-center gap-3">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleSelect(preset)}
              className={`press-effect relative w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                selected === preset.name
                  ? 'border-amber-900 dark:border-amber-100 ring-2 ring-offset-2 ring-amber-400 dark:ring-offset-background'
                  : 'border-transparent hover:border-amber-400/50'
              }`}
              style={{ backgroundColor: preset.color }}
              aria-label={`Select ${preset.name} accent color`}
              title={preset.name}
            >
              {selected === preset.name && (
                <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-sm" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>

        {/* Current accent name */}
        <p className="text-center text-xs text-muted-foreground">
          Current: <span className="font-medium text-amber-700 dark:text-amber-400">{activePreset.name}</span>
        </p>

        {/* Reset button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400"
          onClick={handleReset}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset to Default
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Feature 3: VisaEligibilityMap
// ============================================================

const MAP_COUNTRIES = [
  { code: 'PK', name: 'Pakistan', flagEmoji: '🇵🇰', x: 62, y: 38 },
  { code: 'IN', name: 'India', flagEmoji: '🇮🇳', x: 68, y: 42 },
  { code: 'AE', name: 'UAE', flagEmoji: '🇦🇪', x: 58, y: 40 },
  { code: 'MY', name: 'Malaysia', flagEmoji: '🇲🇾', x: 75, y: 55 },
  { code: 'TR', name: 'Turkey', flagEmoji: '🇹🇷', x: 53, y: 30 },
  { code: 'SA', name: 'Saudi Arabia', flagEmoji: '🇸🇦', x: 55, y: 38 },
  { code: 'GB', name: 'United Kingdom', flagEmoji: '🇬🇧', x: 45, y: 22 },
  { code: 'US', name: 'United States', flagEmoji: '🇺🇸', x: 18, y: 32 },
  { code: 'CN', name: 'China', flagEmoji: '🇨🇳', x: 76, y: 33 },
  { code: 'TH', name: 'Thailand', flagEmoji: '🇹🇭', x: 74, y: 48 },
  { code: 'QA', name: 'Qatar', flagEmoji: '🇶🇦', x: 57, y: 38 },
  { code: 'ID', name: 'Indonesia', flagEmoji: '🇮🇩', x: 77, y: 58 },
  { code: 'EG', name: 'Egypt', flagEmoji: '🇪🇬', x: 52, y: 38 },
  { code: 'DE', name: 'Germany', flagEmoji: '🇩🇪', x: 49, y: 22 },
  { code: 'AU', name: 'Australia', flagEmoji: '🇦🇺', x: 84, y: 70 },
];

type VisaFilterType = 'all' | 'visa-free' | 'voa' | 'e-visa' | 'embassy';

function getMapVisaType(c: CountryData) {
  if (c.visaFree) return 'visa-free' as const;
  if (c.visaOnArrival) return 'voa' as const;
  if (c.etaAvailable) return 'e-visa' as const;
  return 'embassy' as const;
}

function getMapVisaColor(type: string, dimmed: boolean) {
  if (dimmed) return '#a8a29e';
  switch (type) {
    case 'visa-free': return '#22c55e';
    case 'voa': return '#f59e0b';
    case 'e-visa': return '#f97316';
    default: return '#78716c';
  }
}

function getMapVisaLabel(type: string) {
  switch (type) {
    case 'visa-free': return 'Visa-Free';
    case 'voa': return 'Visa on Arrival';
    case 'e-visa': return 'e-Visa';
    default: return 'Embassy Required';
  }
}

export function VisaEligibilityMap({ countries, onSelectCountry }: { countries: CountryData[]; onSelectCountry?: (code: string) => void }) {
  const [zoom, setZoom] = useState(1);
  const [filter, setFilter] = useState<VisaFilterType>('all');
  const [hovered, setHovered] = useState<string | null>(null);

  const enrichedRegions = MAP_COUNTRIES.map(mc => {
    const match = countries.find(c => c.code === mc.code);
    const visaType = match ? getMapVisaType(match) : 'embassy';
    const dimmed = filter !== 'all' && visaType !== filter;
    return { ...mc, visaType, dimmed, countryData: match };
  });

  const filters: { key: VisaFilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'visa-free', label: 'Visa-Free' },
    { key: 'voa', label: 'VOA' },
    { key: 'e-visa', label: 'e-Visa' },
    { key: 'embassy', label: 'Embassy' },
  ];

  return (
    <Card className="card-elevated-1 glass-card">
      <CardContent className="p-4 space-y-3">
        {/* Controls row */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-2.5 py-1 text-[11px] rounded-full font-medium transition-all press-effect ${
                  filter === f.key
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>
              <ZoomIn className="w-3.5 h-3.5" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(z - 0.2, 0.6))}>
              <ZoomOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* SVG Map */}
        <div className="relative w-full overflow-hidden rounded-lg bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-stone-900/50 dark:to-stone-800/50">
          <svg viewBox="0 0 100 80" className="w-full h-auto" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
            {/* Background grid */}
            {[...Array(9)].map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="currentColor" strokeWidth="0.15" className="text-amber-200/40 dark:text-amber-700/20" />
            ))}
            {[...Array(11)].map((_, i) => (
              <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="80" stroke="currentColor" strokeWidth="0.15" className="text-amber-200/40 dark:text-amber-700/20" />
            ))}

            {/* Simplified continent outlines */}
            <path d="M5,18 Q8,12 15,14 Q20,10 28,15 Q35,12 42,18 Q44,22 40,28 Q35,32 30,28 Q25,35 20,32 Q12,30 8,25 Z" fill="currentColor" className="text-amber-100/30 dark:text-amber-800/15" stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.2" />
            <path d="M42,15 Q48,10 55,14 Q60,12 62,18 Q60,25 55,28 Q48,30 44,25 Z" fill="currentColor" className="text-amber-100/30 dark:text-amber-800/15" stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.2" />
            <path d="M44,30 Q50,28 58,32 Q65,30 72,35 Q78,38 80,45 Q76,52 70,55 Q60,58 52,52 Q46,48 42,40 Z" fill="currentColor" className="text-amber-100/30 dark:text-amber-800/15" stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.2" />
            <path d="M70,10 Q78,8 88,12 Q94,18 92,28 Q88,35 80,32 Q74,28 70,22 Z" fill="currentColor" className="text-amber-100/30 dark:text-amber-800/15" stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.2" />
            <path d="M72,58 Q78,54 86,58 Q90,65 86,72 Q80,76 74,72 Z" fill="currentColor" className="text-amber-100/30 dark:text-amber-800/15" stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.2" />

            {/* Country regions */}
            {enrichedRegions.map(region => (
              <g key={region.code}>
                <motion.circle
                  cx={region.x}
                  cy={region.y}
                  r={hovered === region.code ? 2.5 : 1.8}
                  fill={getMapVisaColor(region.visaType, region.dimmed)}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.4 }}
                  onHoverStart={() => setHovered(region.code)}
                  onHoverEnd={() => setHovered(null)}
                  onClick={() => onSelectCountry?.(region.code)}
                  style={{ transformOrigin: `${region.x}px ${region.y}px` }}
                />
                {/* Country label on hover */}
                {hovered === region.code && (
                  <>
                    <rect x={region.x - 12} y={region.y - 8} width="24" height="14" rx="3" fill="black" fillOpacity="0.8" />
                    <text x={region.x} y={region.y - 2} textAnchor="middle" fontSize="3.5" fill="white" fontWeight="600">
                      {region.flagEmoji} {region.name}
                    </text>
                    <text x={region.x} y={region.y + 3.5} textAnchor="middle" fontSize="2.8" fill={getMapVisaColor(region.visaType, false)} fontWeight="500">
                      {getMapVisaLabel(region.visaType)}
                      {region.countryData && ` • ${region.countryData.processingDaysMin}–${region.countryData.processingDaysMax}d`}
                    </text>
                  </>
                )}
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {[
            { color: '#22c55e', label: 'Visa-Free' },
            { color: '#f59e0b', label: 'VOA' },
            { color: '#f97316', label: 'e-Visa' },
            { color: '#78716c', label: 'Embassy' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Feature 4: UserProfileProgressWidget
// ============================================================

const PROFILE_CATEGORIES = [
  { key: 'personal', label: 'Personal Info', fields: ['fullName', 'age', 'gender', 'nationality', 'passportNumber', 'passportExpiry', 'maritalStatus', 'dependents'] },
  { key: 'professional', label: 'Professional', fields: ['occupation', 'education', 'languages'] },
  { key: 'financial', label: 'Financial', fields: ['monthlyIncomeUSD', 'savingsUSD', 'budgetUSD'] },
  { key: 'travel', label: 'Travel Details', fields: ['travelPurpose', 'intendedStayDays', 'hasReturnTicket', 'hasHotelBooking'] },
  { key: 'additional', label: 'Additional', fields: ['hasHealthInsurance', 'hasSponsor', 'hasCriminalRecord', 'hasPriorTravel', 'hasSpecialNeeds'] },
];

function isFieldFilled(profile: UserProfileData, field: string): boolean {
  const val = (profile as Record<string, unknown>)[field];
  if (val === undefined || val === null || val === '') return false;
  if (typeof val === 'number') return val > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === 'boolean') return true;
  return true;
}

export function UserProfileProgressWidget({ profile }: { profile: UserProfileData | null }) {
  const allFields = PROFILE_CATEGORIES.flatMap(c => c.fields);
  const filledCount = profile ? allFields.filter(f => isFieldFilled(profile, f)).length : 0;
  const totalFields = allFields.length;
  const pct = totalFields > 0 ? Math.round((filledCount / totalFields) * 100) : 0;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  const categoryStatuses = PROFILE_CATEGORIES.map(cat => {
    const filled = cat.fields.filter(f => profile && isFieldFilled(profile, f)).length;
    return { ...cat, filled, total: cat.fields.length, complete: filled === cat.fields.length };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="card-elevated-1 stat-card-compact rounded-xl p-4"
    >
      <div className="flex items-center gap-4">
        {/* Circular progress ring */}
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/20" />
            <circle
              cx="40" cy="40" r={radius} fill="none"
              stroke="#f59e0b" strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700 progress-amber"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{pct}%</span>
          </div>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold mb-1">
            {pct === 100 ? 'Profile Complete! ✓' : 'Complete your profile'}
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            {filledCount} of {totalFields} fields completed
          </p>

          {/* Category dots */}
          <div className="flex items-center gap-2 flex-wrap">
            {categoryStatuses.map(cat => (
              <TooltipProvider key={cat.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`w-3 h-3 rounded-full transition-colors ${
                        cat.complete ? 'bg-amber-500' : 'bg-stone-300 dark:bg-stone-600'
                      }`}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p className="text-xs font-medium">{cat.label}</p>
                    <p className="text-[10px] text-muted-foreground">{cat.filled}/{cat.total} fields</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        {/* CTA */}
        {pct < 100 && (
          <Button size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white press-effect" onClick={() => {}}>
            Fill Now
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================
// Feature 5: NotificationHistoryPanel
// ============================================================

interface NotificationItem {
  id: string;
  type: 'policy' | 'expiry' | 'new-country' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const NOTIF_STORAGE_KEY = 'pakvisa-notifications';

type NotifFilterType = 'all' | 'unread' | 'policy' | 'travel-alert';

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', type: 'policy', title: 'UAE Visa Policy Update', message: 'UAE has introduced a new multiple-entry visa for Pakistani passport holders valid for 5 years.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), read: false },
  { id: '2', type: 'expiry', title: 'Passport Expiry Reminder', message: 'Your passport may be expiring soon. Many countries require at least 6 months validity.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), read: false },
  { id: '3', type: 'new-country', title: 'New Destination: Qatar', message: 'Qatar now offers visa on arrival for Pakistani citizens. Check the latest requirements.', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), read: true },
  { id: '4', type: 'general', title: 'App Update Available', message: 'New features added: Visa Eligibility Map, Profile Progress Widget, and enhanced notifications.', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), read: true },
  { id: '5', type: 'policy', title: 'Malaysia e-Visa Changes', message: 'Malaysia has simplified the e-Visa application process with reduced documentation.', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), read: false },
  { id: '6', type: 'travel-alert', title: 'Travel Advisory: Turkey', message: 'Updated travel advisory for Turkey. Check safety guidelines before planning your trip.', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), read: true },
];

function getRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getNotifIcon(type: NotificationItem['type']) {
  switch (type) {
    case 'policy': return <Gavel className="w-4 h-4" />;
    case 'expiry': return <AlertTriangle className="w-4 h-4" />;
    case 'new-country': return <Plane className="w-4 h-4" />;
    default: return <Bell className="w-4 h-4" />;
  }
}

function getNotifColor(type: NotificationItem['type']) {
  switch (type) {
    case 'policy': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400';
    case 'expiry': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    case 'new-country': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
    default: return 'text-stone-600 bg-stone-100 dark:bg-stone-800/30 dark:text-stone-400';
  }
}

export function NotificationHistoryPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_NOTIFICATIONS;
    try {
      const stored = localStorage.getItem(NOTIF_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
    return DEFAULT_NOTIFICATIONS;
  });
  const [filter, setFilter] = useState<NotifFilterType>('all');

  const saveNotifications = useCallback((items: NotificationItem[]) => {
    setNotifications(items);
    try { localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, []);

  const toggleRead = (id: string) => {
    saveNotifications(notifications.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const clearAll = () => {
    saveNotifications([]);
  };

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'policy') return n.type === 'policy';
    if (filter === 'travel-alert') return n.type === 'expiry' || n.type === 'new-country';
    return true;
  });

  const notifFilters: { key: NotifFilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'policy', label: 'Policy Changes' },
    { key: 'travel-alert', label: 'Travel Alerts' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden border-b border-amber-200/50 dark:border-amber-800/30 bg-background/50"
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Notification History</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground hover:text-red-600" onClick={clearAll}>
                  <Trash2 className="w-3 h-3 mr-1" /> Clear All
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} aria-label="Close">
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              {notifFilters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-2.5 py-1 text-[10px] rounded-full font-medium transition-all ${
                    filter === f.key
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Notification list */}
            {filtered.length === 0 ? (
              <div className="text-center py-6">
                <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filtered.map(n => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`card-elevated-1 list-item-hover rounded-lg p-3 flex items-start gap-3 ${!n.read ? 'border-l-2 border-amber-500' : 'opacity-70'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getNotifColor(n.type)}`}>
                      {getNotifIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate">{n.title}</span>
                        {!n.read && <span className="badge-3d bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-muted-foreground/60 mt-1 block">{getRelativeTime(n.timestamp)}</span>
                    </div>
                    <button
                      onClick={() => toggleRead(n.id)}
                      className="shrink-0 p-1 rounded hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                      aria-label={n.read ? 'Mark unread' : 'Mark read'}
                    >
                      {n.read ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-amber-500" />}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Feature 6: SearchAutoComplete
// ============================================================

function getAutoCompleteVisaStatus(c: CountryData) {
  if (c.visaFree) return { label: 'Visa Free', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' };
  if (c.visaOnArrival) return { label: 'VOA', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' };
  if (c.etaAvailable) return { label: 'e-Visa', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' };
  return { label: 'Embassy', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' };
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-amber-600 dark:text-amber-400 underline decoration-amber-400/40">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

export function SearchAutoComplete({ countries, onSelectCountry }: {
  countries: CountryData[];
  onSelectCountry: (code: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useAppStore();

  // Debounce 300ms
  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allMatches = useMemo(() => {
    if (!debounced.trim()) return [];
    const q = debounced.toLowerCase();
    return countries
      .filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
      .slice(0, 8);
  }, [debounced, countries]);

  const quickResults = useMemo(() => {
    if (debounced.trim().length < 3) return [];
    return allMatches.filter(c => c.visaFree).slice(0, 3);
  }, [allMatches, debounced]);

  const flatList = useMemo(() => {
    if (debounced.trim().length >= 3 && quickResults.length > 0) {
      return [...quickResults, ...allMatches.filter(c => !quickResults.some(q => q.code === c.code))];
    }
    return allMatches;
  }, [allMatches, quickResults, debounced]);

  const handleSelect = (c: CountryData) => {
    addRecentSearch(c.name);
    onSelectCountry(c.code);
    setQuery('');
    setIsOpen(false);
    setActiveIdx(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) { setIsOpen(true); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flatList.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && activeIdx >= 0 && flatList[activeIdx]) {
      e.preventDefault();
      handleSelect(flatList[activeIdx]);
    }
    else if (e.key === 'Escape') { setIsOpen(false); }
  };

  const showDropdown = isOpen && (recentSearches.length > 0 && !query.trim()) || flatList.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-700/60 dark:text-amber-200/60 z-10" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a country name..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setActiveIdx(-1); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="input-search-enhanced w-full pl-12 pr-10 h-12 sm:h-14 rounded-xl text-base bg-white/90 dark:bg-black/20 border-amber-500/30 placeholder:text-amber-700/40 dark:placeholder:text-amber-200/40 text-amber-950 dark:text-amber-100 focus-visible:ring-2 focus-visible:ring-amber-400/60 shadow-lg shadow-amber-900/10"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setDebounced(''); setActiveIdx(-1); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-amber-700/60 dark:text-amber-200/60" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-1.5 z-50 glass-card card-elevated-1 rounded-xl border border-amber-200/50 dark:border-amber-800/30 shadow-xl shadow-amber-900/10 max-h-80 overflow-hidden"
          >
            <div className="max-h-72 overflow-y-auto">
              {/* Recent Searches (when empty) */}
              {!query.trim() && recentSearches.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Recent Searches</span>
                    <button onClick={() => clearRecentSearches()} className="text-[10px] text-muted-foreground hover:text-amber-600 transition-colors">Clear</button>
                  </div>
                  {recentSearches.slice(0, 5).map((s, idx) => {
                    const match = countries.find(c => c.name.toLowerCase() === s.query.toLowerCase());
                    if (!match) return null;
                    return (
                      <motion.button
                        key={s.query}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => handleSelect(match)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm list-item-hover transition-colors ${activeIdx === idx ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                      >
                        <span className="text-lg">{match.flagEmoji}</span>
                        <span className="flex-1 font-medium text-foreground">{match.name}</span>
                        <Badge className={`${getAutoCompleteVisaStatus(match).color} text-[10px]`} variant="secondary">{getAutoCompleteVisaStatus(match).label}</Badge>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Search Results */}
              {query.trim() && flatList.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <SearchX className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No countries found</p>
                  <p className="text-xs mt-0.5 opacity-70">Try a different search term</p>
                </div>
              )}

              {query.trim() && flatList.length > 0 && (
                <div className="p-2">
                  {/* Quick Results (3+ chars) */}
                  {debounced.trim().length >= 3 && quickResults.length > 0 && (
                    <div className="mb-1">
                      <span className="px-2 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">⚡ Quick Results</span>
                      {quickResults.map((c, idx) => (
                        <motion.button
                          key={c.code}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                          onClick={() => handleSelect(c)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm list-item-hover transition-colors ${activeIdx === idx ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                        >
                          <span className="text-lg">{c.flagEmoji}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium"><HighlightMatch text={c.name} query={debounced} /></span>
                            <span className="text-xs text-muted-foreground ml-2">{c.continent}</span>
                          </div>
                          <Badge className={`badge-3d ${getAutoCompleteVisaStatus(c).color} text-[10px]`} variant="secondary">{getAutoCompleteVisaStatus(c).label}</Badge>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* All Matches section (3+ chars) */}
                  {debounced.trim().length >= 3 && quickResults.length > 0 && (
                    <span className="px-2 py-1 mt-1 block text-[10px] font-bold text-muted-foreground uppercase tracking-wider">All Matches</span>
                  )}

                  {(debounced.trim().length >= 3 ? allMatches.filter(c => !quickResults.some(q => q.code === c.code)) : allMatches).map((c, idx) => {
                    const realIdx = debounced.trim().length >= 3 && quickResults.length > 0 ? idx + quickResults.length : idx;
                    return (
                      <motion.button
                        key={c.code}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.04 + 0.1 }}
                        onClick={() => handleSelect(c)}
                        onMouseEnter={() => setActiveIdx(realIdx)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm list-item-hover transition-colors ${activeIdx === realIdx ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                      >
                        <span className="text-lg">{c.flagEmoji}</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium"><HighlightMatch text={c.name} query={debounced} /></span>
                          <span className="text-xs text-muted-foreground ml-2">{c.continent}</span>
                        </div>
                        <Badge className={`${getAutoCompleteVisaStatus(c).color} text-[10px]`} variant="secondary">{getAutoCompleteVisaStatus(c).label}</Badge>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Feature 7: StatsOverviewDashboard
// ============================================================

export function StatsOverviewDashboard({ countries }: { countries: CountryData[] }) {
  const totalCountries = countries.length;
  const visaFreeCount = countries.filter(c => c.visaFree).length;
  const voaCount = countries.filter(c => c.visaOnArrival).length;
  const eVisaCount = countries.filter(c => c.etaAvailable).length;
  const embassyCount = totalCountries - visaFreeCount - voaCount - eVisaCount;
  const countriesWithFee = countries.filter(c => c.costProfile?.visaFeeUSD && c.costProfile.visaFeeUSD > 0);
  const avgFee = countriesWithFee.length > 0
    ? countriesWithFee.reduce((sum, c) => sum + (c.costProfile?.visaFeeUSD || 0), 0) / countriesWithFee.length
    : 0;

  // Continent breakdown
  const continentData = useMemo(() => {
    const map: Record<string, number> = {};
    countries.forEach(c => { map[c.continent] = (map[c.continent] || 0) + 1; });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [countries]);
  const maxContinentCount = Math.max(...continentData.map(d => d.count), 1);

  // Visa type donut data
  const donutData = [
    { label: 'Visa-Free', count: visaFreeCount, color: '#f59e0b' },
    { label: 'VOA', count: voaCount, color: '#fb923c' },
    { label: 'e-Visa', count: eVisaCount, color: '#fbbf24' },
    { label: 'Embassy', count: embassyCount, color: '#d97706' },
  ];
  const donutTotal = donutData.reduce((s, d) => s + d.count, 0);
  let cumulativeAngle = 0;
  const donutSegments = donutData
    .filter(d => d.count > 0)
    .map(d => {
      const pct = d.count / donutTotal;
      const startAngle = cumulativeAngle;
      cumulativeAngle += pct * 360;
      const endAngle = cumulativeAngle;
      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);
      const r = 40;
      const x1 = 50 + r * Math.cos(startRad);
      const y1 = 50 + r * Math.sin(startRad);
      const x2 = 50 + r * Math.cos(endRad);
      const y2 = 50 + r * Math.sin(endRad);
      const largeArc = pct > 0.5 ? 1 : 0;
      const path = `M 50 50 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      return { ...d, path, pct };
    });

  // Quick insights
  const mostAccessible = useMemo(() => {
    const map: Record<string, number> = {};
    countries.forEach(c => { if (c.visaFree) map[c.continent] = (map[c.continent] || 0) + 1; });
    const entries = Object.entries(map);
    if (entries.length === 0) return { continent: 'N/A', count: 0 };
    entries.sort((a, b) => b[1] - a[1]);
    return { continent: entries[0][0], count: entries[0][1] };
  }, [countries]);

  const cheapest = useMemo(() => {
    const withFees = countries.filter(c => c.costProfile?.visaFeeUSD && c.costProfile.visaFeeUSD > 0);
    if (withFees.length === 0) return { name: 'N/A', fee: 0 };
    withFees.sort((a, b) => (a.costProfile?.visaFeeUSD || 0) - (b.costProfile?.visaFeeUSD || 0));
    return { name: withFees[0].name, fee: withFees[0].costProfile?.visaFeeUSD || 0 };
  }, [countries]);

  const safest = useMemo(() => {
    const sorted = [...countries].sort((a, b) => b.safetyRating - a.safetyRating);
    if (sorted.length === 0) return { name: 'N/A', rating: 0 };
    return { name: sorted[0].name, rating: sorted[0].safetyRating };
  }, [countries]);

  const statCards = [
    { label: 'Total Countries', value: totalCountries, icon: <Globe className="w-5 h-5 text-amber-500" />, accent: 'text-amber-700 dark:text-amber-400' },
    { label: 'Visa-Free Destinations', value: visaFreeCount, icon: <Trophy className="w-5 h-5 text-amber-500" />, accent: 'text-green-600 dark:text-green-400' },
    { label: 'VOA Destinations', value: voaCount, icon: <Plane className="w-5 h-5 text-orange-500" />, accent: 'text-orange-600 dark:text-orange-400' },
    { label: 'Average Visa Fee', value: `$${avgFee.toFixed(0)}`, icon: <DollarSign className="w-5 h-5 text-amber-500" />, accent: 'text-amber-700 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            className="card-elevated-1 glass-card rounded-xl p-4 text-center"
          >
            <div className="flex justify-center mb-2">{card.icon}</div>
            <div className={`text-2xl font-bold stat-number-amber ${card.accent}`}>{card.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Continent Breakdown + Donut */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Continent Bars */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card-elevated-1 glass-card rounded-xl p-5"
        >
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-500" /> Continent Breakdown
          </h4>
          <div className="space-y-3">
            {continentData.map((d, idx) => {
              const pct = ((d.count / totalCountries) * 100).toFixed(0);
              return (
                <div key={d.name} className="group relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{d.name}</span>
                    <span className="text-xs text-muted-foreground">{d.count} ({pct}%)</span>
                  </div>
                  <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.count / maxContinentCount) * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.4 + idx * 0.1, ease: 'easeOut' }}
                      className="data-bar-amber data-bar-animated h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, #f59e0b, #fb923c, #f97316)`,
                      }}
                    />
                  </div>
                  {/* Tooltip on hover */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="absolute inset-0 cursor-default" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs font-medium">{d.name}: {d.count} countries ({pct}%)</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Visa Type Donut */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card-elevated-1 glass-card rounded-xl p-5"
        >
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" /> Visa Type Distribution
          </h4>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {donutSegments.map((seg, i) => (
                  <motion.path
                    key={seg.label}
                    d={seg.path}
                    fill={seg.color}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                    style={{ transformOrigin: '50% 50%' }}
                  />
                ))}
                <circle cx="50" cy="50" r="26" fill="var(--background)" className="rotate-90" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{donutTotal}</span>
                <span className="text-[9px] text-muted-foreground">Total</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {donutData.map(d => (
                <div key={d.label} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="flex-1 text-muted-foreground">{d.label}</span>
                  <span className="font-semibold">{d.count}</span>
                  <span className="text-muted-foreground">({((d.count / donutTotal) * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="card-elevated-1 glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold">Most Accessible Continent</span>
          </div>
          <p className="text-base font-bold text-amber-700 dark:text-amber-400">{mostAccessible.continent}</p>
          <p className="text-xs text-muted-foreground">{mostAccessible.count} visa-free destinations</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="card-elevated-1 glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold">Cheapest Destination</span>
          </div>
          <p className="text-base font-bold text-amber-700 dark:text-amber-400">{cheapest.name}</p>
          <p className="text-xs text-muted-foreground">${cheapest.fee} visa fee</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="card-elevated-1 glass-card rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold">Safest Destination</span>
          </div>
          <p className="text-base font-bold text-amber-700 dark:text-amber-400">{safest.name}</p>
          <p className="text-xs text-muted-foreground">{safest.rating}/5 safety rating</p>
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================
// Feature 7: VisaCostCalculatorPro
// ============================================================

export function VisaCostCalculatorPro({ countries }: { countries: CountryData[] }) {
  const [selectedCode, setSelectedCode] = useState('');
  const [duration, setDuration] = useState(7);
  const [travelers, setTravelers] = useState(1);
  const [budgetLevel, setBudgetLevel] = useState<'budget' | 'mid' | 'luxury'>('mid');

  const selectedCountry = countries.find(c => c.code === selectedCode);

  const costBreakdown = useMemo(() => {
    if (!selectedCountry) return null;
    const visaFee = selectedCountry.costProfile?.visaFeeUSD ?? 50;
    const serviceFee = selectedCountry.costProfile?.serviceFeeUSD ?? 30;
    let flightEstimate = 400;
    if (selectedCountry.visaFree) flightEstimate = 200;
    else if (selectedCountry.visaOnArrival) flightEstimate = 250;
    else if (selectedCountry.etaAvailable) flightEstimate = 300;
    const budgetMultiplier = budgetLevel === 'budget' ? 0.6 : budgetLevel === 'luxury' ? 1.8 : 1;
    const dailyAccommodation = (selectedCountry.costProfile?.totalMonthlyUSD ?? 800) / 30;
    const accommodation = dailyAccommodation * duration * travelers * budgetMultiplier;
    const foodTransport = accommodation * 0.3;
    const insurance = 3 * duration * travelers;
    const subtotal = visaFee + serviceFee + flightEstimate * travelers + accommodation + foodTransport + insurance;
    const misc = subtotal * 0.1;
    const total = subtotal + misc;
    return { visaFee, serviceFee, flightEstimate: flightEstimate * travelers, accommodation, foodTransport, insurance, misc, total };
  }, [selectedCountry, duration, travelers, budgetLevel]);

  const chartData = costBreakdown ? [
    { name: 'Visa', cost: costBreakdown.visaFee },
    { name: 'Service', cost: costBreakdown.serviceFee },
    { name: 'Flight', cost: costBreakdown.flightEstimate },
    { name: 'Hotel', cost: Math.round(costBreakdown.accommodation) },
    { name: 'Food', cost: Math.round(costBreakdown.foodTransport) },
    { name: 'Insurance', cost: costBreakdown.insurance },
    { name: 'Misc', cost: Math.round(costBreakdown.misc) },
  ] : [];

  const affordability = costBreakdown
    ? costBreakdown.total < 500 ? 'Very Affordable' : costBreakdown.total < 1500 ? 'Affordable' : costBreakdown.total < 3000 ? 'Moderate' : 'Premium'
    : '';
  const affordPct = costBreakdown ? Math.min(100, (costBreakdown.total / 3000) * 100) : 0;

  const handleSave = () => {
    if (!costBreakdown || !selectedCountry) return;
    const saved = JSON.parse(localStorage.getItem('pakvisa-cost-estimates') || '[]');
    saved.push({ country: selectedCountry.name, code: selectedCountry.code, total: costBreakdown.total, duration, travelers, budgetLevel, date: new Date().toISOString() });
    localStorage.setItem('pakvisa-cost-estimates', JSON.stringify(saved.slice(-10)));
    toast.success('Estimate saved!');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <Select value={selectedCode} onValueChange={setSelectedCode}>
            <SelectTrigger className="glass-card border-amber-200 dark:border-amber-800">
              <SelectValue placeholder="Select destination country" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {countries.filter(c => c.costProfile).map(c => (
                <SelectItem key={c.code} value={c.code}>{c.flagEmoji} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="stat-card-compact">
            <span className="stat-card-label">Duration: {duration} days</span>
            <Slider value={[duration]} onValueChange={v => setDuration(v[0])} min={1} max={365} step={1} className="mt-1" />
          </div>

          <div className="stat-card-compact flex items-center justify-between">
            <span className="stat-card-label">Travelers</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setTravelers(Math.max(1, travelers - 1))} className="w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
              <span className="font-bold text-amber-700 dark:text-amber-400 w-6 text-center">{travelers}</span>
              <button onClick={() => setTravelers(Math.min(10, travelers + 1))} className="w-7 h-7 rounded-md bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          <div className="stat-card-compact">
            <span className="stat-card-label">Budget Level</span>
            <div className="flex gap-1 mt-1.5">
              {(['budget', 'mid', 'luxury'] as const).map(lvl => (
                <button key={lvl} onClick={() => setBudgetLevel(lvl)} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all press-effect ${budgetLevel === lvl ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'}`}>{lvl === 'budget' ? '💰 Budget' : lvl === 'mid' ? '💼 Mid' : '👑 Luxury'}</button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {costBreakdown ? (
            <>
              <div className="chart-container-amber rounded-xl p-3">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <RechartsTooltip formatter={(v: number) => `$${v}`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Estimated Total Cost</p>
                <p className="text-3xl font-black text-glow-amber text-amber-600 dark:text-amber-400">${Math.round(costBreakdown.total).toLocaleString()}</p>
                <div className="flex justify-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>${Math.round(costBreakdown.total / travelers).toLocaleString()}/person</span>
                  <span>·</span>
                  <span>${Math.round(costBreakdown.total / duration).toLocaleString()}/day</span>
                </div>
              </div>

              <div className="stat-card-compact">
                <div className="flex justify-between items-center mb-1">
                  <span className="stat-card-label">Affordability</span>
                  <span className={`text-xs font-bold ${affordPct < 50 ? 'text-green-600 dark:text-green-400' : affordPct < 75 ? 'text-amber-600 dark:text-amber-400' : 'text-orange-600 dark:text-orange-400'}`}>{affordability}</span>
                </div>
                <div className="w-full h-2 bg-amber-100 dark:bg-amber-900/30 rounded-full overflow-hidden">
                  <div className="progress-amber h-full rounded-full transition-all" style={{ width: `${affordPct}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Typical Pakistani traveler budget: $500 - $3,000</p>
              </div>

              {selectedCountry.bestTravelMonths && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-amber-50/50 dark:bg-amber-900/10">
                  <CalendarClock className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>Best months to visit: <strong className="text-amber-700 dark:text-amber-400">{selectedCountry.bestTravelMonths}</strong></span>
                </div>
              )}

              <Button onClick={handleSave} variant="outline" size="sm" className="w-full gap-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20">
                <Save className="w-3.5 h-3.5" /> Save Estimate
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <Calculator className="w-12 h-12 text-amber-200 dark:text-amber-900/40 mb-3" />
              <p className="text-sm text-muted-foreground">Select a country to calculate costs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Feature 8: SocialProofSection
// ============================================================

const TESTIMONIALS = [
  { name: 'Ahmed R.', initials: 'AR', color: 'bg-amber-500', destination: 'UAE', quote: 'PakVisa made my Dubai trip planning effortless. The cost calculator was spot-on!', rating: 5, date: 'Dec 2025' },
  { name: 'Fatima K.', initials: 'FK', color: 'bg-orange-500', destination: 'Malaysia', quote: 'I had no idea Pakistanis could get visa on arrival in Malaysia. This platform is a lifesaver!', rating: 5, date: 'Jan 2026' },
  { name: 'Usman M.', initials: 'UM', color: 'bg-amber-600', destination: 'Turkey', quote: 'The eligibility checker gave me confidence to apply for a Turkish e-Visa. Approved in 24 hours!', rating: 4, date: 'Feb 2026' },
];

const TRUST_BADGES = [
  { icon: <BadgeCheck className="w-4 h-4" />, label: 'Verified Data' },
  { icon: <Zap className="w-4 h-4" />, label: 'Free to Use' },
  { icon: <User className="w-4 h-4" />, label: 'No Registration' },
  { icon: <TrendingUp className="w-4 h-4" />, label: 'Instant Results' },
];

export function SocialProofSection() {
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollIdx, setScrollIdx] = useState(0);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    const el = scrollRef.current;
    if (el) obs.observe(el);
    return () => { if (el) obs.unobserve(el); };
  }, []);

  useEffect(() => {
    const iv = setInterval(() => { setScrollIdx(i => (i + 1) % Math.ceil(TESTIMONIALS.length / 2)); }, 5000);
    return () => clearInterval(iv);
  }, []);

  const stats = [
    { value: 70, suffix: '+', label: 'Countries Covered' },
    { value: 10000, suffix: '+', label: 'Users Helped' },
    { value: 99, suffix: '%', label: 'Data Accuracy' },
    { value: 24, suffix: '/7', label: 'AI Assistance' },
  ];

  return (
    <div ref={scrollRef} className="space-y-8 py-6">
      {/* Stat counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.15, duration: 0.5 }} className="card-elevated-1 rounded-xl p-4 text-center">
            <p className="stat-number-amber text-3xl md:text-4xl font-black">
              {visible ? <AnimatedNumber value={s.value} suffix={s.suffix} /> : '0'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Testimonial carousel */}
      <div className="relative overflow-hidden">
        <motion.div className="flex gap-4" animate={{ x: `-${scrollIdx * (100 / Math.ceil(TESTIMONIALS.length / 2))}%` }} transition={{ type: 'tween', duration: 0.6 }}>
          {[TESTIMONIALS.slice(0, 2), TESTIMONIALS.slice(2)].map((group, gi) => (
            <div key={gi} className="flex gap-4 min-w-full md:min-w-[50%] shrink-0 px-1">
              {group.map((t, ti) => (
                <motion.div key={`${gi}-${ti}`} initial={{ opacity: 0, x: 30 }} animate={visible ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 + ti * 0.2 }} className="glass-card rounded-xl p-4 flex-1 press-effect">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold shadow-sm`}>{t.initials}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground">Traveled to {t.destination} · {t.date}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= t.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </motion.div>
        {/* Dots */}
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.ceil(TESTIMONIALS.length / 2) }).map((_, i) => (
            <button key={i} onClick={() => setScrollIdx(i)} className={`w-2 h-2 rounded-full transition-all ${scrollIdx === i ? 'bg-amber-500 w-6' : 'bg-amber-200 dark:bg-amber-800'}`} aria-label={`Testimonial page ${i + 1}`} />
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap justify-center gap-3">
        {TRUST_BADGES.map(b => (
          <div key={b.label} className="card-elevated-1 rounded-full px-4 py-2 flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-medium">
            {b.icon} {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const dur = 1500;
    const start = Date.now();
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / dur, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{display.toLocaleString()}{suffix}</>;
}

// ============================================================
// Feature 9: PassportRenewalReminder
// ============================================================

export function PassportRenewalReminder({ expiryDate: propDate }: { expiryDate?: string }) {
  const [localDate, setLocalDate] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const storageEventCb = useRef<(() => void) | null>(null);

  // Read localStorage via useSyncExternalStore to avoid effect-based setState
  const storedDate = useSyncExternalStore(
    useCallback((cb) => {
      storageEventCb.current = cb;
      window.addEventListener('storage', cb);
      return () => { window.removeEventListener('storage', cb); };
    }, []),
    () => localStorage.getItem('pakvisa-passport-expiry') || '',
    () => ''
  );

  const expiryDate = propDate || storedDate || localDate;
  const showPicker = !expiryDate ? true : pickerVisible;

  const saveDate = (d: string) => {
    setLocalDate(d);
    setPickerVisible(false);
    localStorage.setItem('pakvisa-passport-expiry', d);
    storageEventCb.current?.();
    toast.success('Passport expiry date saved!');
  };

  if (!expiryDate || showPicker) {
    return (
      <Card className="card-elevated-1">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Set Passport Expiry Date</p>
              <p className="text-xs text-muted-foreground">Get timely renewal reminders</p>
            </div>
            <input type="date" className="px-3 py-1.5 text-sm rounded-lg border border-amber-200 dark:border-amber-800 bg-background focus:outline-none focus:ring-2 focus:ring-amber-500/40" onChange={e => saveDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const totalDays = 3650; // 10 year validity
  const issueDate = new Date(expiry.getTime() - totalDays * 86400000);
  const elapsed = now.getTime() - issueDate.getTime();
  const pct = Math.min(100, Math.max(0, (elapsed / (totalDays * 86400000)) * 100));
  const ringPct = 100 - pct;

  let urgencyColor = 'text-green-600 dark:text-green-400';
  let urgencyBg = 'bg-green-50 dark:bg-green-900/10';
  let urgencyBorder = 'border-green-200 dark:border-green-800';
  let urgencyMsg = 'Your passport is valid';
  let showAlert = false;

  if (daysRemaining < 90) {
    urgencyColor = 'text-red-600 dark:text-red-400'; urgencyBg = 'bg-red-50 dark:bg-red-900/10'; urgencyBorder = 'border-red-200 dark:border-red-800';
    urgencyMsg = 'Urgent: Renew immediately!'; showAlert = true;
  } else if (daysRemaining < 180) {
    urgencyColor = 'text-orange-600 dark:text-orange-400'; urgencyBg = 'bg-orange-50 dark:bg-orange-900/10'; urgencyBorder = 'border-orange-200 dark:border-orange-800';
    urgencyMsg = 'Renew before applying for visas'; showAlert = true;
  } else if (daysRemaining < 365) {
    urgencyColor = 'text-amber-600 dark:text-amber-400'; urgencyBg = 'bg-amber-50 dark:bg-amber-900/10'; urgencyBorder = 'border-amber-200 dark:border-amber-800';
    urgencyMsg = 'Consider renewing soon';
  }

  const circumference = 2 * Math.PI * 24;
  const offset = circumference - (ringPct / 100) * circumference;

  return (
    <Card className={`card-elevated-1 ${showAlert ? urgencyBorder : ''}`}>
      <CardContent className="p-4">
        {showAlert && (
          <div className={`rounded-lg p-2.5 mb-3 flex items-center gap-2 ${urgencyBg}`}>
            <AlertTriangle className={`w-4 h-4 ${urgencyColor} shrink-0`} />
            <p className={`text-xs font-medium ${urgencyColor}`}>{urgencyMsg}</p>
          </div>
        )}
        <div className="flex items-center gap-4">
          {/* Progress ring */}
          <div className="relative w-[60px] h-[60px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-amber-100 dark:text-amber-900/30" />
              <circle cx="30" cy="30" r="24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className={ringPct > 50 ? 'text-amber-500' : ringPct > 20 ? 'text-orange-500' : 'text-red-500'} strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[10px] font-bold ${urgencyColor}`}>{Math.round(ringPct)}%</span>
            </div>
          </div>
          {/* Countdown */}
          <div className="flex-1 min-w-0">
            <p className={`text-2xl font-black ${urgencyColor}`}>{daysRemaining.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">days remaining</p>
            {!showAlert && <p className="text-[10px] text-green-600 dark:text-green-400 font-medium mt-0.5">✓ {urgencyMsg}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Expires</p>
            <p className="text-sm font-semibold">{expiry.toLocaleDateString('en-PK', { year: 'numeric', month: 'short' })}</p>
            <button onClick={() => setPickerVisible(true)} className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline mt-1">Change date</button>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border/40">
          <a href="https://dgip.gov.pk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline">
            <ArrowRight className="w-3 h-3" /> How to renew Pakistani passport
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
