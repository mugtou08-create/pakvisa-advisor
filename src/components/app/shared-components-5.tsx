'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Star, Clock, DollarSign,
  Sparkles, Settings, RotateCcw, Check,
  Plus, Minus, ZoomIn, ZoomOut, MapPin, Shield, Plane,
  Gavel, Bell, AlertTriangle, Trash2, Eye, EyeOff, Info, User, Briefcase, Wallet, Globe, Luggage, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CountryData, UserProfileData } from '@/lib/types';

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
      className="relative"
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
