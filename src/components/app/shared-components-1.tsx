'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, FileText, BarChart3, Search, ChevronRight, Star, Clock,
  DollarSign, Shield, Calendar, Heart, Plane, Building, MapPin,
  CreditCard, Home, Users, Lightbulb, TrendingUp, TrendingDown,
  ArrowRight, Printer, Share2, Eye, ClipboardList, Play, Save, Upload, ChevronUp, ChevronDown,
  AlertTriangle, XCircle, Info, CheckCircle2, X, Download, ExternalLink, Zap, Target, Sparkles,
  PackageOpen, PlaneTakeoff, Luggage, Calculator, SearchX, Bookmark, AlertCircle,
  CalendarClock, FileCheck2, Flame, Languages, Sun, Moon, RotateCcw, CalendarDays, Gavel, Trophy, Thermometer,
  MessageCircle, Wallet, Timer,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { CountryData, UserProfileData, ScoreBreakdown, ChecklistItem } from '@/lib/types';
import { getFlagUrl, VISA_CATEGORY_COLORS, COUNTRY_NAME_ALIASES, SUCCESS_STORIES, EMBASSY_DATA, GENERIC_EMBASSY, MONTH_NAMES } from './constants';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { formatCountryCode } from './shared-components-2';

const BUDGET_PIE_COLORS = ['#F59E0B', '#D97706', '#B45309', '#EA580C', '#DC2626', '#FB923C', '#FBBF24'];

interface BudgetPieTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; color: string } }> };

function BudgetPieCustomTooltip({ active, payload }: BudgetPieTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0].payload;
  const total = payload.reduce((sum, p) => sum + p.payload.value, 0);
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-md text-xs">
      <div className="flex items-center gap-2 mb-0.5">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
        <span className="font-medium">{item.name}</span>
      </div>
      <div className="text-muted-foreground">
        ${item.value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        <span className="ml-1 text-[10px]">({Math.round((item.value / total) * 100)}%)</span>
      </div>
    </div>
  );
}

/** Mini radar chart for country cards (3-axis) */
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

/** Small flag component with emoji fallback — uses CSS background-image to avoid <img> hydration mismatch */
export function FlagImage({ code, flagUrl, size = 24, className = '', emoji }: { code: string; flagUrl?: string; size?: number; className?: string; emoji?: string }) {
  const src = flagUrl || getFlagUrl(code);
  if (!src) return <span className={className} style={{ fontSize: size * 0.8 }}>{emoji || '\u{1F3F3}\uFE0F'}</span>;
  return (
    <span
      className={`inline-block rounded-sm ${className}`}
      style={{ width: size, height: Math.round(size * 0.67), backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    />
  );
}
export function InteractiveWorldMap({ countries, onSelectCountry }: { countries: CountryData[]; onSelectCountry: (c: CountryData) => void }) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; name: string; status: { fill: string; label: string } } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build lookup: SVG country name -> CountryData
  const countryLookup = useMemo(() => {
    const map = new globalThis.Map<string, CountryData>();
    countries.forEach(c => {
      const normalized = c.name.replace(/\s+/g, '').toUpperCase();
      map.set(normalized, c);
      map.set(c.name.toUpperCase(), c);
    });
    Object.entries(COUNTRY_NAME_ALIASES).forEach(([svgName, aliases]) => {
      aliases.forEach(alias => {
        const found = countries.find(co => {
          const coNorm = co.name.replace(/\s+/g, '').toUpperCase();
          const aliasNorm = alias.replace(/\s+/g, '').toUpperCase();
          return coNorm === aliasNorm;
        });
        if (found) map.set(svgName.toUpperCase(), found);
      });
    });
    return map;
  }, [countries]);

  const getStatus = (countryName: string): { fill: string; label: string } => {
    const c = countryLookup.get(countryName.toUpperCase())
      || countryLookup.get(countryName.replace(/\s+/g, '').toUpperCase());
    if (!c) return VISA_CATEGORY_COLORS.unknown;
    if (c.visaFree) return VISA_CATEGORY_COLORS.visaFree;
    if (c.visaOnArrival) return VISA_CATEGORY_COLORS.visaOnArrival;
    if (c.etaAvailable) return VISA_CATEGORY_COLORS.eVisa;
    return VISA_CATEGORY_COLORS.embassy;
  };

  // Load SVG and pre-process colors into the string itself
  useEffect(() => {
    fetch('/world-map.svg')
      .then(res => res.text())
      .then(text => {
        let processed = text
          .replace(/<defs>[\s\S]*?<\/defs>/, '')
          .replace(/<rect[^>]*fill="[^"]*"[^>]*\/>/, '');

        // Inject inline style into path elements with data-map-country
        processed = processed.replace(
          /<path\s+([^>]*?)data-map-country="([^"]+)"([^>]*)\s*\/>/g,
          (_full, before, name, after) => {
            const status = getStatus(name);
            // Inject style with !important fill to override any CSS
            return `<path ${before}data-map-country="${name}"${after} style="fill:${status.fill};stroke:#fff;stroke-width:0.8;cursor:pointer;transition:all 0.2s ease;opacity:0.85" />`;
          }
        );

        // Style non-country paths (generic landmasses)
        processed = processed.replace(
          /<path\s+(?!([^>]*?)data-map-country)([^>]*?)\s*\/>/g,
          (_full, _before, after) => {
            // Only style paths that don't already have a style from above
            if (_full.includes('style=')) return _full;
            return `<path style="fill:#d4d4d8;stroke:#fff;stroke-width:0.5" ${after.replace(/<\/?path[^>]*>/g, '')} />`;
          }
        );

        // Add ocean background rect as first child after <svg>
        processed = processed.replace(
          /<svg[^>]*>/,
          (match) => `${match}<rect width="1000" height="500" fill="#e8f4f8" />`
        );

        setSvgContent(processed);
      })
      .catch(() => setSvgContent(''));
  }, [countries]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!e.target || !(e.target instanceof SVGElement)) {
      setTooltipPos(null);
      return;
    }
    const path = (e.target as SVGElement).closest('path[data-map-country]') as SVGPathElement | null;
    if (path) {
      const name = path.getAttribute('data-map-country') || '';
      const status = getStatus(name);
      if (hoveredCountry !== name) {
        setHoveredCountry(name);
        const allPaths = containerRef.current?.querySelectorAll('path[data-map-country]');
        allPaths?.forEach(p => {
          if (p === path) {
            p.style.opacity = '1';
            p.style.strokeWidth = '1.5';
          } else {
            p.style.opacity = '0.5';
            p.style.strokeWidth = '0.8';
          }
        });
      }
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          name,
          status,
        });
      }
    } else {
      if (hoveredCountry) {
        setHoveredCountry(null);
        const allPaths = containerRef.current?.querySelectorAll('path[data-map-country]');
        allPaths?.forEach(p => {
          p.style.opacity = '0.85';
          p.style.strokeWidth = '0.8';
        });
        setTooltipPos(null);
      }
    }
  }, [hoveredCountry, getStatus]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!e.target || !(e.target instanceof SVGElement)) return;
    const path = (e.target as SVGElement).closest('path[data-map-country]') as SVGPathElement | null;
    if (!path) return;
    const name = path.getAttribute('data-map-country') || '';
    const c = countryLookup.get(name.toUpperCase())
      || countryLookup.get(name.replace(/\s+/g, '').toUpperCase());
    if (c) onSelectCountry(c);
  }, [countryLookup, onSelectCountry]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCountry(null);
    setTooltipPos(null);
    const allPaths = containerRef.current?.querySelectorAll('path[data-map-country]');
    allPaths?.forEach(p => {
      p.style.opacity = '0.85';
      p.style.strokeWidth = '0.8';
    });
  }, []);

  // Count stats for the legend
  const legendStats = useMemo(() => {
    let visaFree = 0, voa = 0, eVisa = 0, embassy = 0, noData = 0;
    const svgCountries = svgContent?.match(/data-map-country="([^"]+)"/g) || [];
    svgCountries.forEach(match => {
      const name = match.match(/"([^"]+)"/)?.[1] || '';
      const status = getStatus(name);
      if (status.fill === VISA_CATEGORY_COLORS.visaFree.fill) visaFree++;
      else if (status.fill === VISA_CATEGORY_COLORS.visaOnArrival.fill) voa++;
      else if (status.fill === VISA_CATEGORY_COLORS.eVisa.fill) eVisa++;
      else if (status.fill === VISA_CATEGORY_COLORS.embassy.fill) embassy++;
      else noData++;
    });
    return { visaFree, voa, eVisa, embassy, noData };
  }, [svgContent, getStatus]);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-2xl p-4 md:p-6 border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-500" />
          Visa Requirements World Map
        </h3>
        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Hover &amp; click countries</span>
      </div>

      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden bg-[#e8f4f8] dark:bg-slate-800"
        style={{ paddingBottom: '50%' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
      >
        {svgContent ? (
          <svg
            viewBox="0 0 1000 500"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">Loading world map...</span>
            </div>
          </div>
        )}

        {/* Floating tooltip */}
        {tooltipPos && (
          <div
            className="absolute z-50 pointer-events-none px-3 py-2 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-border/50 text-xs whitespace-nowrap"
            style={{
              left: `${Math.min(tooltipPos.x + 12, 90)}%`,
              top: `${Math.max(tooltipPos.y - 10, 2)}%`,
            }}
          >
            <div className="font-semibold">{tooltipPos.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: tooltipPos.status.fill }} />
              <span style={{ color: tooltipPos.status.fill }}>{tooltipPos.status.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend with counts */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 justify-center">
        {Object.entries(VISA_CATEGORY_COLORS).map(([key, item]) => {
          const count = key === 'visaFree' ? legendStats.visaFree
            : key === 'visaOnArrival' ? legendStats.voa
            : key === 'eVisa' ? legendStats.eVisa
            : key === 'embassy' ? legendStats.embassy
            : legendStats.noData;
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
              <span className="whitespace-nowrap">{item.label}</span>
              <span className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded-full font-medium">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============ SUCCESS STORIES CAROUSEL (B2) ============
export function SuccessStoriesCarousel() {
  const doubled = [...SUCCESS_STORIES, ...SUCCESS_STORIES];
  return (
    <div className="overflow-hidden">
      <div className="scroll-section-title">
        <h3 className="text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Community Travel Stories
        </h3>
      </div>
      <div className="relative overflow-hidden">
        <div className="flex gap-4 auto-scroll-stories story-scroll" style={{ width: 'max-content' }}>
          {doubled.map((story, idx) => (
            <div key={`${story.id}-${idx}`} className="glass-section p-4 w-[280px] shrink-0 hover:border-amber-500/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{story.avatar}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{story.name}</p>
                  <p className="text-[11px] text-muted-foreground">{story.date}</p>
                </div>
                <span className="text-xl">{story.flag}</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`text-[10px] ${story.difficulty === 'Easy' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : story.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`} variant="secondary">{story.visaType}</Badge>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < story.rating ? 'text-amber-400 fill-amber-400' : 'text-muted'}`} />
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{story.story}</p>
              <div className="mt-2 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500" />
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">{story.destination}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ BEST MATCH RECOMMENDATIONS (B3) ============
export function BestMatchRecommendations({ countries, scoreResults, onSelectCountry }: { countries: CountryData[]; scoreResults: ScoreBreakdown[]; onSelectCountry: (c: CountryData) => void }) {
  const [loaded, setLoaded] = useState(false);
  const { userProfile } = useAppStore();

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const recommendations = useMemo(() => {
    if (scoreResults.length > 0) {
      return scoreResults
        .sort((a, b) => b.finalScore - a.finalScore)
        .slice(0, 3)
        .map((s) => {
          const c = countries.find((co) => co.code === s.countryCode);
          if (!c) return null;
          const reason = s.finalScore >= 70 ? 'Excellent match based on your profile' : s.finalScore >= 40 ? 'Good match with minor improvements needed' : 'Consider improving your profile first';
          return { country: c, matchPct: Math.round(s.finalScore), reason };
        })
        .filter(Boolean) as { country: CountryData; matchPct: number; reason: string }[];
    }
    // Default recommendations
    const defaults = [
      { code: 'MY', reason: 'Visa-free entry for 30 days with beautiful destinations' },
      { code: 'AE', reason: 'Visa on arrival with world-class tourism infrastructure' },
      { code: 'TR', reason: 'Easy e-Visa process with rich cultural experiences' },
    ];
    return defaults.map((d) => {
      const c = countries.find((co) => co.code === d.code);
      return c ? { country: c, matchPct: c.visaFree ? 95 : c.visaOnArrival ? 88 : 75, reason: d.reason } : null;
    }).filter(Boolean) as { country: CountryData; matchPct: number; reason: string }[];
  }, [scoreResults, countries]);

  if (!loaded) {
    return (
      <div>
        <div className="scroll-section-title">
          <h3 className="text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
            <Target className="w-4 h-4 text-amber-500" />
            Recommended For You
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="scroll-section-title">
        <h3 className="text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
          <Target className="w-4 h-4 text-amber-500" />
          Recommended For You
          {!userProfile && <Badge variant="secondary" className="text-[10px]">Based on popularity</Badge>}
          {userProfile && <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">Personalized</Badge>}
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {recommendations.map((rec, idx) => (
          <motion.div
            key={rec.country.code}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="glass-section p-4 hover:border-amber-500/30 transition-all cursor-pointer group"
            onClick={() => onSelectCountry(rec.country)}
          >
            <div className="flex items-center gap-2 mb-2">
              <FlagImage code={rec.country.code} flagUrl={rec.country.flagUrl} size={28} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{rec.country.name}</p>
                <p className="text-[11px] text-muted-foreground">{rec.country.continent}</p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${rec.matchPct >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'}`}>{rec.matchPct}%</p>
                <p className="text-[10px] text-muted-foreground">Match</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{rec.reason}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600 transition-all"
            >
              View Details <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============ KEYBOARD SHORTCUTS ============
const KEYBOARD_SHORTCUTS = [
  { keys: ['Ctrl', '1'], action: 'Explore Tab', category: 'Navigation' },
  { keys: ['Ctrl', '2'], action: 'Questionnaire Tab', category: 'Navigation' },
  { keys: ['Ctrl', '3'], action: 'Compare Tab', category: 'Navigation' },
  { keys: ['Ctrl', '4'], action: 'AI Consultant Tab', category: 'Navigation' },
  { keys: ['Ctrl', '5'], action: 'Reports Tab', category: 'Navigation' },
  { keys: ['Ctrl', 'K'], action: 'Focus Search', category: 'Search' },
  { keys: ['Ctrl', 'B'], action: 'Toggle Grid/List', category: 'Actions' },
  { keys: ['Ctrl', 'F'], action: 'Toggle Favorites', category: 'Actions' },
  { keys: ['Ctrl', 'D'], action: 'Quick Score All', category: 'Actions' },
  { keys: ['Ctrl', '/'], action: 'Toggle Shortcuts', category: 'Actions' },
  { keys: ['Esc'], action: 'Close Dialog', category: 'Navigation' },
];

// ============ ANIMATED COUNTER ============
export function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 2000;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target]);

  return <span>{prefix}{count}{suffix}</span>;
}

// ============ SCORE CIRCLE (WITH PULSE) ============
export function ScoreCircle({ score, size = 80, label }: { score: number; size?: number; label?: string }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#f59e0b' : score >= 40 ? '#f59e0b' : '#ef4444';
  const isHighScore = score > 80;

  return (
    <div className="flex flex-col items-center gap-1 relative">
      <div className={isHighScore ? 'score-pulse rounded-full' : ''}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ marginTop: -4 }}>
          <span className="text-lg font-bold" style={{ color }}>{Math.round(score)}</span>
        </div>
      </div>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

// ============ SAFETY DOTS ============
export function SafetyDots({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            rating >= i * 2 ? 'bg-amber-500' : 'bg-muted'
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating}/10</span>
    </div>
  );
}

// ============ CONFETTI DOT (for progress bar) ============
export function ConfettiDot({ show }: { show: boolean }) {
  if (!show) return null;
  const particles = [
    { px: '6px', py: '-14px', color: '#f59e0b' },
    { px: '-6px', py: '-12px', color: '#fb923c' },
    { px: '0px', py: '-16px', color: '#d97706' },
    { px: '10px', py: '-8px', color: '#fbbf24' },
    { px: '-10px', py: '-10px', color: '#ea580c' },
  ];
  return (
    <>
      <div className="confetti-dot absolute -top-0.5 w-3 h-3 rounded-full bg-amber-400 z-10" style={{ left: 'var(--progress-end, 16.6%)', transform: 'translateX(-50%)' }} />
      {particles.map((p, i) => (
        <div
          key={i}
          className="confetti-particle absolute w-1.5 h-1.5 rounded-full z-10"
          style={{
            left: 'var(--progress-end, 16.6%)',
            top: '-2px',
            transform: 'translateX(-50%)',
            '--px': p.px,
            '--py': p.py,
            backgroundColor: p.color,
            animationDelay: `${i * 0.05}s`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

export function getTimeOfDay(timezone: string): { label: string; icon: React.ReactNode; color: string } {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', hour12: false });
    const hour = parseInt(formatter.format(now));
    if (hour >= 6 && hour < 18) return { label: 'Day', icon: <Sun className="w-3 h-3" />, color: 'text-amber-500' };
    if (hour >= 18 && hour < 22) return { label: 'Evening', icon: <Sunset className="w-3 h-3" />, color: 'text-orange-500' };
    return { label: 'Night', icon: <Moon className="w-3 h-3" />, color: 'text-slate-400' };
  } catch {
    return { label: 'Unknown', icon: <Clock className="w-3 h-3" />, color: 'text-muted-foreground' };
  }
}

/** Hook: returns the current time string (e.g. "3:45 PM") in the given timezone, updates every 60s */
export function useCountryTime(timezone: string) {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      try {
        const now = new Date();
        setTime(now.toLocaleTimeString('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: true }));
      } catch { setTime(''); }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [timezone]);
  return time;
}

export function Sunset(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 10V2M4.93 10.93l1.41 1.41M17.66 10.93l-1.41 1.41M2 18h20M12 6a6 6 0 0 0-6 6" />
    </svg>
  );
}

// ============ COLOR-CODED PROGRESS BAR (GRADIENT) ============
export function getScoreGradient(value: number) {
  if (value >= 70) return 'linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)';
  if (value >= 40) return 'linear-gradient(90deg, #d97706, #f59e0b, #fbbf24)';
  return 'linear-gradient(90deg, #dc2626, #ef4444, #f87171)';
}

export function getScoreColor(value: number) {
  if (value >= 70) return '#f59e0b';
  if (value >= 40) return '#f59e0b';
  return '#ef4444';
}

export function ColorProgress({ value, className = '', useGradient = false, shimmer = false, flash = false }: { value: number; className?: string; useGradient?: boolean; shimmer?: boolean; flash?: boolean }) {
  const color = getScoreColor(value);
  const gradient = getScoreGradient(value);
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={`h-2 w-full rounded-full bg-muted overflow-hidden ${className} ${shimmer ? 'score-bar-shimmer' : ''} ${flash ? 'score-bar-flash' : ''}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${clamped}%`,
          background: useGradient ? gradient : color,
        }}
      />
    </div>
  );
}

// ============ TRAVEL CHECKLIST (TASK 10 - B1) ============
const TRAVEL_CHECKLIST_TEMPLATES = (country: CountryData) => {
  const monthlyTemps = typeof country.monthlyTemps === 'string' ? JSON.parse(country.monthlyTemps) : country.monthlyTemps;
  const currentMonth = new Date().getMonth();
  const currentTemp = monthlyTemps?.[MONTH_NAMES[currentMonth]] ?? 25;
  const isHot = currentTemp > 28;
  const isCold = currentTemp < 10;
  const key = (cat: string, idx: number) => `checklist-${country.code}-${cat}-${idx}`;
  return [
    { category: 'Documents', icon: FileCheck2, items: [
      { id: key('doc', 0), text: 'Valid passport (6+ months validity)', priority: 'high' as const },
      { id: key('doc', 1), text: 'Passport-sized photographs (2x2 inch, white background)', priority: 'high' as const },
      { id: key('doc', 2), text: 'Bank statements (last 6 months)', priority: 'high' as const },
      { id: key('doc', 3), text: 'Employment letter / NOC from employer', priority: 'medium' as const },
      { id: key('doc', 4), text: 'Hotel reservation confirmation', priority: 'high' as const },
      { id: key('doc', 5), text: 'Return flight itinerary', priority: 'high' as const },
      { id: key('doc', 6), text: 'Travel insurance certificate', priority: 'medium' as const },
      { id: key('doc', 7), text: 'Income tax returns (last 2 years)', priority: 'medium' as const },
      ...country.visaFree ? [] : [
        { id: key('doc', 8), text: 'Completed visa application form', priority: 'high' as const },
        { id: key('doc', 9), text: 'Visa application fee receipt', priority: 'high' as const },
      ],
    ]},
    { category: 'Packing Essentials', icon: PackageOpen, items: [
      { id: key('pack', 0), text: 'Travel adapter / universal power adapter', priority: 'medium' as const },
      { id: key('pack', 1), text: isHot ? 'Lightweight breathable clothing & sunscreen' : isCold ? 'Warm clothing, jacket & thermal wear' : 'Comfortable layered clothing', priority: 'medium' as const },
      { id: key('pack', 2), text: 'Basic first-aid kit & personal medications', priority: 'medium' as const },
      { id: key('pack', 3), text: 'Portable charger & electronics', priority: 'low' as const },
      { id: key('pack', 4), text: 'Travel pillow & eye mask for flight', priority: 'low' as const },
      { id: key('pack', 5), text: 'Umbrella or rain jacket', priority: 'low' as const },
    ]},
    { category: 'Pre-Departure', icon: PlaneTakeoff, items: [
      { id: key('pre', 0), text: 'Confirm flight bookings 72hrs before', priority: 'high' as const },
      { id: key('pre', 1), text: 'Check travel advisories for ' + country.name, priority: 'high' as const },
      { id: key('pre', 2), text: 'Purchase travel insurance', priority: 'high' as const },
      { id: key('pre', 3), text: 'Inform bank about international travel', priority: 'medium' as const },
      { id: key('pre', 4), text: 'Download offline maps for ' + country.name, priority: 'medium' as const },
      { id: key('pre', 5), text: 'Copy important documents to cloud storage', priority: 'medium' as const },
      { id: key('pre', 6), text: 'Exchange currency (PKR to ' + (country.currencyCode || 'local currency') + ')', priority: 'medium' as const },
      { id: key('pre', 7), text: 'Install local transportation apps', priority: 'low' as const },
    ]},
  ];
};

export function TravelChecklist({ country }: { country: CountryData }) {
  const { travelChecklist, setTravelChecklistItem, clearTravelChecklist } = useAppStore();
  const [expanded, setExpanded] = useState(false);
  const sections = useMemo(() => TRAVEL_CHECKLIST_TEMPLATES(country), [country]);
  const allItems = useMemo(() => sections.flatMap(s => s.items), [sections]);
  const completedCount = allItems.filter(item => travelChecklist[item.id]).length;
  const totalCount = allItems.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Luggage className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold">Travel Checklist</span>
          <Badge variant="outline" className="text-xs">{completedCount}/{totalCount}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {sections.map((section) => (
                <div key={section.category}>
                  <div className="flex items-center gap-2 mb-2">
                    <section.icon className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{section.category}</span>
                  </div>
                  <div className="space-y-1.5">
                    {section.items.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-muted/50 ${travelChecklist[item.id] ? 'opacity-60' : ''}`}
                      >
                        <Checkbox
                          checked={!!travelChecklist[item.id]}
                          onCheckedChange={(checked) => setTravelChecklistItem(item.id, !!checked)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${travelChecklist[item.id] ? 'line-through text-muted-foreground' : ''}`}>{item.text}</span>
                        </div>
                        <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'secondary' : 'outline'} className="text-[9px] px-1.5 py-0 shrink-0">
                          {item.priority}
                        </Badge>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t">
                <Button variant="outline" size="sm" onClick={clearTravelChecklist}>
                  <RotateCcw className="w-3 h-3 mr-1" /> Reset All
                </Button>
                <span className="text-xs text-muted-foreground">{progressPct}% complete</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ PASSPORT EXPIRY WARNING (TASK 10 - B2) ============
export function PassportExpiryWarning() {
  const { userProfile } = useAppStore();
  if (!userProfile?.passportExpiry) return null;

  const expiry = new Date(userProfile.passportExpiry);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 365) return null; // Don't show if more than 1 year

  const isExpired = diffDays <= 0;
  const isRed = diffDays <= 90;
  const isAmber = diffDays <= 180;

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 expiry-badge-red">
        <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
        <span className="text-xs font-semibold text-red-700 dark:text-red-400">Passport EXPIRED</span>
      </div>
    );
  }

  const colorClass = isRed
    ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 expiry-badge-red'
    : isAmber
      ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 expiry-badge-amber'
      : 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 expiry-badge-green';

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${colorClass}`}>
      <CalendarClock className="w-3.5 h-3.5" />
      <span className="text-xs font-medium">
        {diffDays} day{diffDays !== 1 ? 's' : ''} left
      </span>
    </div>
  );
}

// ============ APPLICATION DEADLINE TRACKER (TASK 10 - B3) ============
export function DeadlineTracker({ scoreResults }: { scoreResults: ScoreBreakdown[] }) {
  const { targetTravelDate, setTargetTravelDate, userProfile } = useAppStore();
  const today = new Date();
  const target = targetTravelDate ? new Date(targetTravelDate) : null;

  const topCountries = useMemo(() => {
    return [...scoreResults].sort((a, b) => b.finalScore - a.finalScore).slice(0, 5);
  }, [scoreResults]);

  const getDeadlineInfo = (score: ScoreBreakdown) => {
    if (!target) return null;
    const processingDays = Math.max(
      score.components.find(c => c.name.toLowerCase().includes('document'))?.score ? 14 : 10,
      7
    );
    const applyBy = new Date(target);
    applyBy.setDate(applyBy.getDate() - processingDays - 14); // processing + buffer
    const optimalStart = new Date(applyBy);
    optimalStart.setDate(optimalStart.getDate() - 30); // start 30 days before apply-by
    const daysUntilApply = Math.ceil((applyBy.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isUrgent = daysUntilApply <= 14;
    const isOverdue = daysUntilApply <= 0;
    return { applyBy, optimalStart, daysUntilApply, isUrgent, isOverdue, processingDays };
  };

  return (
    <Card className="premium-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-amber-500" />
              Application Deadline Tracker
            </CardTitle>
            <CardDescription>Plan your visa application timeline</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="targetDate" className="text-xs text-muted-foreground shrink-0">Target Travel Date:</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetTravelDate}
              onChange={(e) => setTargetTravelDate(e.target.value)}
              className="w-40 text-sm"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!target ? (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Set a target travel date to see application deadlines</p>
          </div>
        ) : topCountries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Complete the questionnaire to see deadline recommendations</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {topCountries.map((score, idx) => {
                const info = getDeadlineInfo(score);
                if (!info) return null;
                return (
                  <motion.div
                    key={score.countryCode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`p-4 rounded-lg border ${info.isOverdue ? 'border-red-300 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800' : info.isUrgent ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800' : 'border-border'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{score.countryCode === 'TR' ? '🇹🇷' : score.countryCode === 'AE' ? '🇦🇪' : score.countryCode === 'MY' ? '🇲🇾' : '🌍'}</span>
                        <div>
                          <p className="text-sm font-semibold">{score.country}</p>
                          <p className="text-xs text-muted-foreground">{score.visaType}</p>
                        </div>
                      </div>
                      <Badge variant={info.isOverdue ? 'destructive' : info.isUrgent ? 'secondary' : 'outline'} className={info.isUrgent && !info.isOverdue ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-300 dark:border-amber-700' : ''}>
                        {info.isOverdue ? 'Overdue' : info.isUrgent ? `Urgent: ${info.daysUntilApply}d` : `${info.daysUntilApply} days`}
                      </Badge>
                    </div>
                    {/* Timeline visualization */}
                    <div className="flex items-center gap-1 text-[10px]">
                      <div className={`flex-1 h-6 rounded flex items-center justify-center ${today >= info.optimalStart ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                        Start Prep
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <div className={`flex-1 h-6 rounded flex items-center justify-center ${today >= info.applyBy ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                        Apply By
                      </div>
                      <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      <div className={`flex-1 h-6 rounded flex items-center justify-center ${today >= target ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                        Travel
                      </div>
                    </div>
                    <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground">
                      <span>{info.optimalStart.toLocaleDateString()}</span>
                      <span>{info.applyBy.toLocaleDateString()}</span>
                      <span>{target.toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ============ VISA REQUIREMENT COMPARISON TABLE (TASK 10 - B4) ============
export function ComparisonTable({ results }: { results: ScoreBreakdown[] }) {
  const [countryDetails, setCountryDetails] = useState<Record<string, CountryData>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (results.length === 0) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const details = await Promise.all(results.map(r =>
          fetch(`/api/countries/${r.countryCode}`).then(res => res.json()).then(data => data.data).catch(() => null)
        ));
        if (cancelled) return;
        const map: Record<string, CountryData> = {};
        details.forEach((d: CountryData | null, i: number) => {
          if (d) map[results[i].countryCode] = d;
        });
        setCountryDetails(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [results]);

  if (results.length < 2 || loading) return null;

  const rows = [
    { label: 'Visa Type', key: 'visaType' },
    { label: 'Eligibility', key: 'eligibility', isScore: true },
    { label: 'Visa Likelihood', key: 'visaLikelihood', isScore: true },
    { label: 'Cost Suitability', key: 'costSuitability', isScore: true },
    { label: 'Final Score', key: 'finalScore', isScore: true, bold: true },
    { label: 'Confidence', key: 'confidence', isPercent: true },
    { label: 'Processing Time', key: 'processing', isText: true },
    { label: 'Visa Fee', key: 'fee', isText: true },
    { label: 'Monthly Cost', key: 'monthly', isText: true },
    { label: 'Safety Rating', key: 'safety', isText: true },
  ];

  const getCellValue = (row: typeof rows[0], result: ScoreBreakdown) => {
    if (row.isScore) {
      const val = result[row.key as keyof ScoreBreakdown] as number;
      return { text: `${Math.round(val)}%`, value: val };
    }
    if (row.isPercent) {
      return { text: `${Math.round(result.confidence * 100)}%`, value: result.confidence };
    }
    if (row.isText) {
      const detail = countryDetails[result.countryCode];
      switch (row.key) {
        case 'processing': return { text: `${detail?.processingDaysMin || '?'}-${detail?.processingDaysMax || '?'} days`, value: 0 };
        case 'fee': return { text: `$${detail?.costProfile?.visaFeeUSD || 0}`, value: -(detail?.costProfile?.visaFeeUSD || 0) };
        case 'monthly': return { text: `$${detail?.costProfile?.totalMonthlyUSD || 0}/mo`, value: -(detail?.costProfile?.totalMonthlyUSD || 0) };
        case 'safety': return { text: `${detail?.safetyRating || '?'}/10`, value: detail?.safetyRating || 0 };
        default: return { text: 'N/A', value: 0 };
      }
    }
    return { text: String(result[row.key as keyof ScoreBreakdown] || 'N/A'), value: 0 };
  };

  const getBestIdx = (row: typeof rows[0]) => {
    if (row.key === 'visaType') return -1;
    const values = results.map(r => getCellValue(row, r));
    // For scores and safety: higher is better; for costs/fees: lower absolute value is best
    if (row.isScore || row.key === 'confidence' || row.key === 'safety') {
      return values.reduce((best, v, i) => v.value > values[best].value ? i : best, 0);
    }
    return values.reduce((best, v, i) => Math.abs(v.value) < Math.abs(values[best].value) ? i : best, 0);
  };

  return (
    <Card className="premium-card overflow-x-auto">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Gavel className="w-5 h-5 text-amber-500" />
          Detailed Comparison Table
        </CardTitle>
        <CardDescription>Side-by-side analysis with best values highlighted</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Metric</TableHead>
              {results.map(r => (
                <TableHead key={r.countryCode} className="text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-sm font-semibold">{r.country}</span>
                    <Badge variant="outline" className="text-[10px]">{r.countryCode}</Badge>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => {
              const bestIdx = getBestIdx(row);
              return (
                <TableRow key={row.key}>
                  <TableCell className={`font-medium text-sm ${row.bold ? 'font-bold' : ''}`}>{row.label}</TableCell>
                  {results.map((r, i) => {
                    const cell = getCellValue(row, r);
                    const isBest = i === bestIdx;
                    return (
                      <TableCell key={r.countryCode} className={`text-center text-sm ${isBest ? 'print-best bg-amber-50 dark:bg-amber-900/20 font-semibold text-amber-700 dark:text-amber-400' : ''}`}>
                        {cell.text}
                        {isBest && <span className="ml-1">✓</span>}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============ PRINT REPORT DIALOG (TASK 10 - C2) ============
export function PrintReportDialog({ open, onClose, scoreResults, userProfile }: { open: boolean; onClose: () => void; scoreResults: ScoreBreakdown[]; userProfile: UserProfileData | null }) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null);

  const generateReport = async () => {
    setLoading(true);
    try {
      const countryCodes = scoreResults.map(s => s.countryCode);
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCodes, profile: userProfile || {} }),
      });
      const data = await res.json();
      if (data.data) {
        setReportData(data.data);
        toast.success('Report data loaded! Use Ctrl+P to print.');
      } else {
        toast.error('Failed to generate report');
      }
    } catch {
      toast.error('Network error');
    }
    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.summary as Record<string, unknown> | undefined;
  const countries = reportData?.countries as Array<Record<string, unknown>> | undefined;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-500" />
            Export Visa Report
          </DialogTitle>
          <DialogDescription>Generate a professional visa assessment report for printing</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={loading || scoreResults.length === 0} className="bg-amber-600 hover:bg-amber-700 flex-1">
              {loading ? <><RotateCcw className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Download className="w-4 h-4 mr-2" /> Generate Report</>}
            </Button>
            {reportData && (
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
            )}
          </div>

          {reportData && (
            <div className="print-only border rounded-lg p-6 space-y-6 bg-white text-black">
              {/* Print Header */}
              <div className="print-report-header">
                <h1>PakVisa Advisor - Visa Assessment Report</h1>
                <p>Generated: {new Date().toLocaleDateString()} | Applicant: {(reportData.profile as Record<string, unknown>)?.fullName || 'N/A'}</p>
              </div>

              {/* Summary Cards */}
              {summary && (
                <div className="print-score-grid">
                  <div className="print-score-card"><div className="value">{String(summary.totalCountries)}</div><div className="label">Countries</div></div>
                  <div className="print-score-card"><div className="value">{String(summary.visaFreeCount)}</div><div className="label">Visa Free</div></div>
                  <div className="print-score-card"><div className="value">{String(summary.avgSafety)}/10</div><div className="label">Avg Safety</div></div>
                  <div className="print-score-card"><div className="value">${String(summary.avgCost)}</div><div className="label">Avg Monthly</div></div>
                </div>
              )}

              {/* Country Table */}
              {countries && countries.length > 0 && (
                <table className="print-table">
                  <thead>
                    <tr>
                      <th>Country</th><th>Visa Type</th><th>Fee</th><th>Processing</th><th>Monthly Cost</th><th>Safety</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countries.map(c => (
                      <tr key={String(c.code)}>
                        <td><span className="inline-flex items-center gap-1"><FlagImage code={String(c.code)} size={18} emoji={String(c.flagEmoji)} /> {String(c.name)}</span></td>
                        <td>{c.visaFree ? 'Visa Free' : c.visaOnArrival ? 'On Arrival' : c.etaAvailable ? 'e-Visa' : 'Embassy'}</td>
                        <td>${String((c.costProfile as Record<string, unknown>)?.visaFeeUSD || 0)}</td>
                        <td>{String(c.processingDaysMin)}-{String(c.processingDaysMax)} days</td>
                        <td>${String((c.costProfile as Record<string, unknown>)?.totalMonthlyUSD || 0)}/mo</td>
                        <td>{String(c.safetyRating)}/10</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Score Results */}
              {scoreResults.length > 0 && (
                <div>
                  <h2 className="print-section text-sm font-bold mb-2">Score Breakdown</h2>
                  <table className="print-table">
                    <thead>
                      <tr><th>Country</th><th>Eligibility</th><th>Likelihood</th><th>Cost Fit</th><th>Final</th></tr>
                    </thead>
                    <tbody>
                      {scoreResults.sort((a, b) => b.finalScore - a.finalScore).map(s => (
                        <tr key={s.countryCode} className={s.finalScore >= 70 ? 'print-best' : ''}>
                          <td>{s.country}</td>
                          <td>{Math.round(s.eligibility)}%</td>
                          <td>{Math.round(s.visaLikelihood)}%</td>
                          <td>{Math.round(s.costSuitability)}%</td>
                          <td className="font-bold">{Math.round(s.finalScore)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="print-footer">
                <p>PakVisa Advisor - AI-Powered Visa Intelligence for Pakistani Passport Holders</p>
                <p>Disclaimer: Visa rules change frequently. Always verify with official embassy/consulate sources.</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ COUNTRY CARD (ENHANCED WITH TILT + RANK + SHIMMER) ============
export function CountryCard({ country, onSelect, rank, isNew }: { country: CountryData; onSelect: (c: CountryData) => void; rank?: number; isNew?: boolean }) {
  const countryTime = useCountryTime(country.timezone);
  const visaStatus = country.visaFree ? 'Visa Free' : country.visaOnArrival ? 'On Arrival' : country.etaAvailable ? 'e-Visa' : 'Embassy';
  const statusColor = country.visaFree ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : country.visaOnArrival ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : country.etaAvailable ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
  const easeScore = country.visaFree ? 1 : country.visaOnArrival ? 0.85 : country.etaAvailable ? 0.7 : 0.3;

  // Score badge from batch results
  const { scoreResults, favorites, toggleFavorite } = useAppStore();
  const countryScore = useMemo(() => {
    if (!scoreResults || scoreResults.length === 0) return null;
    const match = scoreResults.find((s: ScoreBreakdown) => s.countryCode === country.code);
    return match ? match.finalScore : null;
  }, [scoreResults, country.code]);
  const isFav = favorites.includes(country.code);

  // Temperature trend
  const monthlyTemps = typeof country.monthlyTemps === 'string' ? JSON.parse(country.monthlyTemps) : country.monthlyTemps;
  const currentMonth = new Date().getMonth();
  const currentTemp = monthlyTemps?.[MONTH_NAMES[currentMonth]] ?? 0;
  const nextTemp = monthlyTemps?.[MONTH_NAMES[(currentMonth + 1) % 12]] ?? 0;
  const tempDiff = nextTemp - currentTemp;
  const tempTrendUp = tempDiff > 0;

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <motion.div whileHover={{ scale: 1.02, y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                  <Card className={`group card-tilt-enhanced card-glow-border card-shimmer-hover card-inner-highlight card-hover-lift overflow-hidden cursor-pointer border-border/50 hover:shadow-amber-500/10 hover:border-amber-300/50 dark:hover:border-amber-600/30 relative card-elevated-1 press-effect card-hover-reveal hover-reveal-content ${isFav ? 'fav-card-glow ring-1 ring-amber-400/30' : ''}`} onClick={() => onSelect(country)}>
                {/* Subtle gradient top border based on visa category */}
                <div className={`h-[3px] ${country.visaFree ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-400' : country.visaOnArrival ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400' : country.etaAvailable ? 'bg-gradient-to-r from-amber-400 via-orange-300 to-amber-400' : 'bg-gradient-to-r from-orange-400 via-red-400 to-orange-400'}`} />
                {/* NEW badge */}
                {isNew && <div className="new-card-badge">NEW</div>}
                {/* Score top accent line for scored cards */}
                {countryScore !== null && (
                  <div className={`score-accent-top ${countryScore >= 70 ? 'bg-amber-500' : countryScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} />
                )}
                {/* Rank Badge */}
                {rank !== undefined && rank < 4 && (
                  <div className={`rank-badge rank-badge-${rank}`}>
                    <Trophy className="w-3 h-3" />{rank}
                  </div>
                )}
                {/* Animated Score Badge from batch results */}
                {countryScore !== null && (
                  <div className={`score-badge-animated absolute -top-2 right-2 z-20 w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-extrabold ${countryScore >= 70 ? 'score-badge-green score-badge-glow-green' : countryScore >= 40 ? 'score-badge-amber score-badge-glow-amber' : 'score-badge-red score-badge-glow-red'}`}>
                    {Math.round(countryScore)}
                  </div>
                )}
                {/* Favorite & WhatsApp Buttons - subtle, appear on hover */}
                <button
                  className={`absolute top-3 right-2 ${countryScore !== null ? 'top-12' : ''} z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${isFav ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-500 opacity-100' : 'bg-white/40 dark:bg-black/20 text-muted-foreground hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 opacity-40 group-hover:opacity-100'}`}
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(country.code); }}
                  aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                </button>
                <button
                  className={`absolute top-3 right-10 ${countryScore !== null ? 'top-12' : ''} z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 bg-white/40 dark:bg-black/20 text-muted-foreground hover:text-orange-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 opacity-40 group-hover:opacity-100`}
                  onClick={(e) => {
                    e.stopPropagation();
                    const text = encodeURIComponent(`Check visa requirements for ${country.name} on Pakistani passport: ${window.location.origin}`);
                    window.open(`https://wa.me/?text=${text}`, '_blank');
                  }}
                  aria-label='Share on WhatsApp'
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </button>
                <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0 flag-glow-ring p-0.5"><FlagImage code={country.code} flagUrl={country.flagUrl} size={28} /></span>
                    <div className="min-w-0">
                      <CardTitle className="text-[15px] font-bold leading-tight truncate">{country.name}</CardTitle>
                      <CardDescription className="text-[11px] text-muted-foreground">{formatCountryCode(country.code)} · {country.continent}</CardDescription>
                    </div>
                  </div>
                  <Badge className={`${statusColor} text-[10px] shrink-0 font-medium`} variant="secondary">{visaStatus}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-3 px-4">
                {/* Key metrics row */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSign className="w-3 h-3 shrink-0 opacity-60" />{country.currencyCode}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-3 h-3 shrink-0 opacity-60" />{country.timezone.split('/')[1]?.replace('_', ' ') || country.timezone}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground hidden sm:flex">
                    <Clock className="w-3 h-3 shrink-0 opacity-60" />
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal">
                      {country.processingDaysMin}-{country.processingDaysMax} days
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Thermometer className="w-3 h-3 shrink-0 opacity-60" />
                    <span>{country.avgTempC}°C</span>
                    <div className="w-8 h-1.5 rounded-full overflow-hidden ml-1">
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: currentTemp > 30 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : currentTemp > 15 ? 'linear-gradient(90deg, #f59e0b, #f59e0b)' : 'linear-gradient(90deg, #f97316, #f59e0b)',
                          width: `${Math.min(100, Math.max(20, (currentTemp / 45) * 100))}%`,
                        }}
                      />
                    </div>
                    {tempDiff !== 0 && (
                      <span className={`flex items-center gap-0.5 text-[10px] ${tempTrendUp ? 'text-orange-500' : 'text-amber-500'}`}>
                        {tempTrendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(tempDiff)}°
                      </span>
                    )}
                  </div>
                </div>
                {/* Safety + Radar + Local Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SafetyDots rating={country.safetyRating} />
                    <MiniRadarChart safety={country.safetyRating} cost={country.costProfile?.totalMonthlyUSD || 0} ease={easeScore} />
                  </div>
                  {countryTime && (
                    <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full border border-orange-200/60 dark:border-orange-800/40">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs font-bold text-orange-600 dark:text-orange-400 tracking-wide">{countryTime}</span>
                    </div>
                  )}
                </div>
                {/* View button with amber glow hover */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="text-xs text-muted-foreground font-medium">${country.costProfile?.totalMonthlyUSD || 0}/mo</span>
                  <span className="view-cta-btn text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5 px-2 py-1 rounded-md transition-all duration-200 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:shadow-[0_0_8px_rgba(249,115,22,0.2)]">
                    View <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
                {/* Hover reveal quick details */}
                <div className="hover-reveal-target px-4 pb-3 pt-1">
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-amber-500" />{country.safetyRating}/10</span>
                    <span className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-amber-500" />${country.costProfile?.visaFeeUSD || 0}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-amber-500" />{country.processingDaysMin === 0 && country.processingDaysMax === 0 ? 'N/A' : `${country.processingDaysMin}-${country.processingDaysMax}d`}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
                </motion.div>
              </PopoverTrigger>
              <PopoverContent side="top" align="center" className="w-64 p-3 rounded-xl border border-amber-200/60 dark:border-amber-800/40 bg-white dark:bg-card shadow-lg" sideOffset={8}>
                <div className="space-y-2.5">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <FlagImage code={country.code} flagUrl={country.flagUrl} size={20} />
                    <span className="text-xs font-bold flex-1 truncate">{country.name}</span>
                    <Badge className={`${statusColor} text-[9px]`} variant="secondary">{visaStatus}</Badge>
                  </div>
                  <div className="h-px bg-border/50" />
                  {/* Quick Stats Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <CreditCard className="w-3 h-3 text-amber-500" />
                        <span>Visa Fee</span>
                      </div>
                      <span className="text-[11px] font-semibold">${country.costProfile?.visaFeeUSD || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>Processing</span>
                      </div>
                      <span className="text-[11px] font-semibold">{country.processingDaysMin === 0 && country.processingDaysMax === 0 ? 'N/A' : `${country.processingDaysMin}-${country.processingDaysMax} days`}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Shield className="w-3 h-3 text-amber-500" />
                        <span>Safety</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-2.5 h-2.5 ${country.safetyRating >= s * 2 ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground/30'}`} />
                          ))}
                        </div>
                        <span className="text-[11px] font-semibold ml-1">{country.safetyRating}/10</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Sun className="w-3 h-3 text-orange-500" />
                        <span>Best Months</span>
                      </div>
                      <span className="text-[11px] font-semibold text-right max-w-[120px] truncate">{country.bestTravelMonths || 'Any'}</span>
                    </div>
                  </div>
                  <div className="h-px bg-border/50" />
                  <p className="text-[10px] text-muted-foreground text-center">Click card for full visa details</p>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px]">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1.5"><FlagImage code={country.code} flagUrl={country.flagUrl} size={16} /> {country.name}</p>
            <div className="grid grid-cols-2 gap-1 text-[11px]">
              <div><span className="text-muted-foreground">Visa:</span> <span className="font-medium">{visaStatus}</span></div>
              <div><span className="text-muted-foreground">Safety:</span> <span className="font-medium">{country.safetyRating}/10</span></div>
              <div><span className="text-muted-foreground">Cost:</span> <span className="font-medium">${country.costProfile?.totalMonthlyUSD || 0}/mo</span></div>
              <div><span className="text-muted-foreground">Process:</span> <span className="font-medium">{country.processingDaysMin === 0 ? '0' : ''}{country.processingDaysMin}-{country.processingDaysMax} days</span></div>
            </div>
            <p className="text-[10px] text-muted-foreground pt-0.5 border-t">Click to view full details</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ============ COUNTRY LIST ROW (FOR LIST VIEW) ============
export function CountryListRow({ country, onSelect, rank, isNew }: { country: CountryData; onSelect: (c: CountryData) => void; rank?: number; isNew?: boolean }) {
  const visaStatus = country.visaFree ? 'Visa Free' : country.visaOnArrival ? 'On Arrival' : country.etaAvailable ? 'e-Visa' : 'Embassy';
  const statusColor = country.visaFree ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : country.visaOnArrival ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : country.etaAvailable ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
  const easeScore = country.visaFree ? 1 : country.visaOnArrival ? 0.85 : country.etaAvailable ? 0.7 : 0.3;

  return (
    <motion.div
      whileHover={{ x: 4 }}
      className={`flex items-center gap-4 p-3 rounded-lg border border-border/50 cursor-pointer list-row-hover group ${rank === 1 ? 'bg-amber-50/50 dark:bg-amber-900/10 ring-1 ring-amber-500/20' : 'bg-background'}`}
      onClick={() => onSelect(country)}
    >
      {/* Rank */}
      {rank !== undefined && rank < 4 && (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${rank === 1 ? 'bg-gradient-to-br from-amber-400 to-amber-600' : rank === 2 ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 'bg-gradient-to-br from-orange-500 to-orange-700'}`}>
          {rank}
        </div>
      )}
      {/* Flag + Name */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span className="shrink-0"><FlagImage code={country.code} flagUrl={country.flagUrl} size={28} /></span>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{country.name}</p>
          <p className="text-[11px] text-muted-foreground">{country.continent}</p>
        </div>
      </div>
      {/* Visa Type Badge */}
      <Badge className={`${statusColor} text-[10px] shrink-0 hidden sm:inline-flex`} variant="secondary">{visaStatus}</Badge>
      {/* Processing */}
      <div className="text-xs text-muted-foreground shrink-0 hidden md:flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {country.processingDaysMin === 0 ? '0' : ''}{country.processingDaysMin}-{country.processingDaysMax} days
      </div>
      {/* Safety */}
      <div className="hidden lg:flex items-center gap-0.5 shrink-0">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${country.safetyRating >= i * 2 ? 'bg-amber-500' : 'bg-muted'}`} />
        ))}
        <span className="text-[10px] text-muted-foreground ml-1">{country.safetyRating}/10</span>
      </div>
      {/* Score Bar */}
      <div className="w-20 shrink-0 hidden sm:block">
        <div className="flex items-center justify-between text-[10px] mb-0.5">
          <span className="text-muted-foreground">Ease</span>
          <span className="font-medium">{Math.round(easeScore * 100)}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${easeScore * 100}%`, background: getScoreGradient(easeScore * 100) }} />
        </div>
      </div>
      {/* Cost */}
      <span className="text-xs font-medium text-muted-foreground shrink-0 hidden md:block">${country.costProfile?.totalMonthlyUSD || 0}/mo</span>
      {/* New Badge */}
      {isNew && <span className="new-badge-pulse text-[7px] font-bold bg-amber-500 text-white px-1 py-0 rounded-full shrink-0">NEW</span>}
      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-500 transition-colors shrink-0" />
    </motion.div>
  );
}

// ============ QUICK DASHBOARD WIDGET ============
export function QuickDashboard({ countries, stats }: { countries: CountryData[]; stats: { totalCountries: number; visaFreeCount: number; visaOnArrivalCount: number; eVisaCount: number; embassyRequiredCount: number; avgCostUSD?: number; cheapestCountry?: { name: string; code: string; flagEmoji: string; visaFeeUSD: number }; fastestProcessing?: { name: string; code: string; flagEmoji: string; processingDaysMin: number } } | null }) {
  const { dashboardExpanded, setDashboardExpanded } = useAppStore();

  const topScore = useMemo(() => {
    return countries.find(c => c.visaFree || c.visaOnArrival) || countries[0];
  }, [countries]);

  const easiest = useMemo(() => {
    return countries.find(c => c.visaFree) || countries[0];
  }, [countries]);

  const cheapest = useMemo(() => {
    if (stats?.cheapestCountry) {
      const fee = stats.cheapestCountry.visaFeeUSD || stats.cheapestCountry.totalMonthlyUSD;
      return { name: stats.cheapestCountry.name, code: stats.cheapestCountry.code, flagEmoji: stats.cheapestCountry.flagEmoji, value: `$${fee}/mo`, color: '#f59e0b' };
    }
    const sorted = [...countries].sort((a, b) => (a.costProfile?.visaFeeUSD || 9999) - (b.costProfile?.visaFeeUSD || 9999));
    const c = sorted[0];
    return c ? { name: c.name, code: c.code, flagEmoji: c.flagEmoji, value: `$${c.costProfile?.visaFeeUSD || 0}`, color: '#f59e0b' } : null;
  }, [countries, stats]);

  const fastest = useMemo(() => {
    const fmtDays = (d: number) => d === 0 ? 'Instant' : `${d} days`;
    if (stats?.fastestProcessing) {
      return { name: stats.fastestProcessing.name, code: stats.fastestProcessing.code, flagEmoji: stats.fastestProcessing.flagEmoji, value: fmtDays(stats.fastestProcessing.processingDaysMin), color: '#f97316' };
    }
    const sorted = [...countries].sort((a, b) => a.processingDaysMin - b.processingDaysMin);
    const c = sorted[0];
    return c ? { name: c.name, code: c.code, flagEmoji: c.flagEmoji, value: fmtDays(c.processingDaysMin), color: '#f97316' } : null;
  }, [countries, stats]);

  const dashboardCards = [
    { label: 'Top Score', flag: topScore?.flagEmoji, code: topScore?.code, name: topScore?.name, value: '--', color: '#f59e0b', icon: Trophy },
    { label: 'Easiest Visa', flag: easiest?.flagEmoji, code: easiest?.code, name: easiest?.name, value: 'Visa Free', color: '#f59e0b', icon: CircleCheckBig },
    { label: 'Cheapest', flag: cheapest?.flagEmoji, code: cheapest?.code, name: cheapest?.name, value: cheapest?.value, color: '#f59e0b', icon: CircleDollarSign },
    { label: 'Fastest', flag: fastest?.flagEmoji, code: fastest?.code, name: fastest?.name, value: fastest?.value, color: '#f97316', icon: Flame },
  ];

  return (
    <div className="rounded-xl border bg-card">
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors rounded-t-xl"
        onClick={() => setDashboardExpanded(!dashboardExpanded)}
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold">Quick Dashboard</span>
          <Badge variant="secondary" className="text-[10px]">{stats?.totalCountries || countries.length || 0} countries</Badge>
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dashboardExpanded ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {dashboardExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {dashboardCards.map((card) => (
                  <div key={card.label} className="p-3 rounded-lg bg-muted/40 border mini-stat-card">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: card.color + '20' }}>
                        <card.icon className="w-3.5 h-3.5" style={{ color: card.color }} />
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{card.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FlagImage code={card.code || ''} size={24} emoji={card.flag} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{card.name}</p>
                        <p className="text-sm font-bold" style={{ color: card.color }}>{card.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ QUICK SCORE INLINE ============
export function QuickScoreInline({ countryCode, onScored }: { countryCode: string; onScored: (s: ScoreBreakdown) => void }) {
  const { userProfile, setActiveTab } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [scoreData, setScoreData] = useState<ScoreBreakdown | null>(null);

  const runScore = async () => {
    if (!userProfile) {
      toast.error('Please complete the questionnaire first');
      setActiveTab('questionnaire');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ countryCode, profile: userProfile }),
      });
      const data = await res.json();
      if (data.data) {
        setScoreData(data.data);
        onScored(data.data);
        toast.success('Score calculated!');
      } else {
        toast.error(data.error || 'Failed to calculate score');
      }
    } catch {
      toast.error('Network error');
    }
    setLoading(false);
  };

  if (scoreData) {
    return (
      <div className="space-y-3 p-4 rounded-lg border bg-amber-50/50 dark:bg-amber-900/10">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-amber-600" />
          Quick Score Result
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Eligibility', value: scoreData.eligibility, color: scoreData.eligibility >= 70 ? '#f59e0b' : scoreData.eligibility >= 40 ? '#f59e0b' : '#ef4444' },
            { label: 'Visa Likelihood', value: scoreData.visaLikelihood, color: scoreData.visaLikelihood >= 70 ? '#f59e0b' : scoreData.visaLikelihood >= 40 ? '#f59e0b' : '#ef4444' },
            { label: 'Cost Suitability', value: scoreData.costSuitability, color: scoreData.costSuitability >= 70 ? '#f59e0b' : scoreData.costSuitability >= 40 ? '#f59e0b' : '#ef4444' },
            { label: 'Final Score', value: scoreData.finalScore, color: scoreData.finalScore >= 70 ? '#f59e0b' : scoreData.finalScore >= 40 ? '#f59e0b' : '#ef4444' },
          ].map((item) => (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-bold" style={{ color: item.color }}>{Math.round(item.value)}%</span>
              </div>
              <ColorProgress value={item.value} />
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => setScoreData(null)}>
          <RotateCcw className="w-3 h-3 mr-1" /> Recalculate
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={runScore}
      disabled={loading}
      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
      size="lg"
    >
      {loading ? (
        <><RotateCcw className="w-4 h-4 mr-2 animate-spin" /> Calculating...</>
      ) : (
        <><Zap className="w-4 h-4 mr-2" /> Quick Score This Country</>
      )}
    </Button>
  );
}

// ============ VISA COUNTDOWN TIMER (Task 11) ============
export function VisaCountdownTimer() {
  const { targetTravelDate, setTargetTravelDate } = useAppStore();
  const [now, setNow] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const target = targetTravelDate ? new Date(targetTravelDate + 'T00:00:00') : null;
  const diffMs = target ? target.getTime() - now.getTime() : 0;
  const totalDays = target ? Math.max(0, Math.ceil(diffMs / 86400000)) : 0;
  const hours = target ? Math.max(0, Math.floor((diffMs % 86400000) / 3600000)) : 0;
  const mins = target ? Math.max(0, Math.floor((diffMs % 3600000) / 60000)) : 0;

  // Determine color based on urgency
  const getColorClass = () => {
    if (!target) return 'text-amber-600 dark:text-amber-400';
    if (totalDays === 0) return 'text-red-500 dark:text-red-400';
    if (totalDays < 7) return 'text-red-500 dark:text-red-400';
    if (totalDays < 30) return 'text-amber-500 dark:text-amber-400';
    return 'text-emerald-500 dark:text-emerald-400';
  };

  const isUrgent = target && totalDays < 7 && totalDays > 0;

  if (!target) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-2"
      >
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/25 dark:bg-black/15 hover:bg-white/40 dark:hover:bg-black/25 transition-all duration-200 border border-white/30 dark:border-white/10 text-amber-950 dark:text-amber-100 text-xs font-medium"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Set your travel date!</span>
        </button>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <Input
              type="date"
              className="h-8 text-xs bg-white/90 dark:bg-black/30 border-amber-400/40 text-amber-950 dark:text-amber-100 rounded-lg w-auto"
              onChange={(e) => {
                setTargetTravelDate(e.target.value);
                setShowPicker(false);
              }}
              min={new Date().toISOString().split('T')[0]}
              autoFocus
            />
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 mb-2"
    >
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/25 dark:bg-black/15 hover:bg-white/40 dark:hover:bg-black/25 transition-all duration-200 border border-white/30 dark:border-white/10 text-xs font-medium ${isUrgent ? 'countdown-pulse-ring' : ''}`}
      >
        <Calendar className="w-3.5 h-3.5" />
        <span className={`${getColorClass()} font-bold tabular-nums`}>{totalDays}d</span>
        <span className="text-amber-950/60 dark:text-amber-100/60">:</span>
        <span className={`${getColorClass()} font-bold tabular-nums`}>{String(hours).padStart(2, '0')}h</span>
        <span className="text-amber-950/60 dark:text-amber-100/60">:</span>
        <span className={`${getColorClass()} font-bold tabular-nums`}>{String(mins).padStart(2, '0')}m</span>
        <span className="text-amber-950/60 dark:text-amber-100/60 ml-0.5">until trip</span>
      </button>
      {showPicker && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <Input
            type="date"
            className="h-8 text-xs bg-white/90 dark:bg-black/30 border-amber-400/40 text-amber-950 dark:text-amber-100 rounded-lg w-auto"
            onChange={(e) => {
              setTargetTravelDate(e.target.value);
              setShowPicker(false);
            }}
            min={new Date().toISOString().split('T')[0]}
            autoFocus
          />
        </motion.div>
      )}
    </motion.div>
  );
}

// ============ COUNTRY DETAIL DIALOG (IMPROVED) ============

/** Budget Pie Chart - Reusable donut chart with center total and legend */
export function BudgetPieChart({ data }: { data: Array<{ name: string; value: number; color: string }> }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const formattedTotal = total >= 1000
    ? `$${(total / 1000).toFixed(1)}k`
    : `$${Math.round(total)}`;

  return (
    <div className="w-full">
      {/* Chart area */}
      <div className="relative w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
              stroke="hsl(var(--background))"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip content={<BudgetPieCustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
          <span className="text-xl font-bold text-foreground tabular-nums">{formattedTotal}</span>
        </div>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   VisaFeeEstimator
   Compact cost breakdown for a selected country
   ────────────────────────────────────────────── */
export function VisaFeeEstimator({ country, avgFee }: { country: CountryData; avgFee?: number }) {
  const cp = country.costProfile;

  if (!cp) {
    return (
      <div className="p-3 rounded-lg border bg-muted/30">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <Wallet className="w-4 h-4 text-amber-500" />
          Visa Fee Estimator
        </h3>
        <p className="text-xs text-muted-foreground">No cost data available for this country.</p>
      </div>
    );
  }

  const totalEstimate = cp.visaFeeUSD + cp.serviceFeeUSD;
  const comparisonFee = avgFee || 120; // fallback average

  // Determine affordability
  const affordability = totalEstimate <= 50 ? 'Affordable' : totalEstimate <= 150 ? 'Moderate' : 'Expensive';
  const affordabilityColor = affordability === 'Affordable'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : affordability === 'Moderate'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  // Comparison bar percentage
  const maxComparison = Math.max(totalEstimate, comparisonFee) || 1;
  const thisPct = (totalEstimate / maxComparison) * 100;
  const avgPct = (comparisonFee / maxComparison) * 100;

  return (
    <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Wallet className="w-4 h-4 text-amber-500" />
          Visa Fee Estimator
        </h3>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${affordabilityColor}`}>
          {affordability}
        </span>
      </div>

      {/* Fee breakdown */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Visa Fee</span>
          <span className="font-semibold tabular-nums">${cp.visaFeeUSD}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Service Fee</span>
          <span className="font-semibold tabular-nums">${cp.serviceFeeUSD}</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Total Estimate</span>
          <span className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">${totalEstimate}</span>
        </div>
      </div>

      {/* Processing time */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Timer className="w-3.5 h-3.5 text-orange-500" />
        <span>Processing: <strong className="text-foreground">{country.processingDaysMin}–{country.processingDaysMax} business days</strong></span>
      </div>

      {/* Comparison bar */}
      {avgFee !== undefined && avgFee > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-muted-foreground font-medium">Cost Comparison</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-14 text-[10px] text-muted-foreground shrink-0 truncate">{country.name.slice(0, 8)}</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${Math.max(3, thisPct)}%` }}
                />
              </div>
              <span className="w-10 text-[10px] tabular-nums text-right font-medium">${totalEstimate}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-14 text-[10px] text-muted-foreground shrink-0">Average</span>
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-400/60 transition-all duration-500"
                  style={{ width: `${Math.max(3, avgPct)}%` }}
                />
              </div>
              <span className="w-10 text-[10px] tabular-nums text-right font-medium">${avgFee}</span>
            </div>
          </div>
        </div>
      )}

      {/* Currency hint */}
      {country.currencyCode && (
        <div className="text-[10px] text-muted-foreground bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">
          💱 Local currency: <strong>{country.currencyCode}</strong> — Check exchange rate for exact amount in PKR
        </div>
      )}
    </div>
  );
}

// ============ VISA SUCCESS RATE INDICATOR ============
export function VisaSuccessIndicator({ country, profile }: { country: CountryData; profile: UserProfileData | null }) {
  const { setActiveTab } = useAppStore();

  // Base rate from visa difficulty
  const baseRate = country.visaFree ? 99 : country.visaOnArrival ? 95 : country.etaAvailable ? 80 : 50;

  // Profile-based adjustment
  const profileBonus = useMemo(() => {
    if (!profile) return 0;
    let bonus = 0;
    if (profile.hasPriorTravel) bonus += 8;
    if (profile.priorCountries.length > 2) bonus += 5;
    if (profile.monthlyIncomeUSD > 2000) bonus += 5;
    if (profile.savingsUSD > 10000) bonus += 4;
    if (profile.education === 'masters' || profile.education === 'phd') bonus += 3;
    if (profile.hasHealthInsurance) bonus += 3;
    if (profile.hasReturnTicket) bonus += 2;
    if (profile.hasHotelBooking) bonus += 2;
    if (profile.age >= 25 && profile.age <= 55) bonus += 3;
    if (profile.languages.length > 1) bonus += 2;
    if (profile.hasCriminalRecord) bonus -= 20;
    return bonus;
  }, [profile]);

  const estimatedRate = Math.min(99, Math.max(5, baseRate + profileBonus));

  const tier = estimatedRate >= 80 ? 'high' : estimatedRate >= 50 ? 'moderate' : 'low';
  const tierLabel = tier === 'high' ? 'High Approval' : tier === 'moderate' ? 'Moderate' : 'Low Approval';
  const tierColor = tier === 'high'
    ? 'text-green-600 dark:text-green-400'
    : tier === 'moderate'
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-red-600 dark:text-red-400';
  const barGradient = tier === 'high'
    ? 'from-green-400 to-green-500'
    : tier === 'moderate'
      ? 'from-amber-400 to-orange-500'
      : 'from-red-400 to-red-500';
  const badgeClass = tier === 'high'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : tier === 'moderate'
      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  // Generate tips based on profile gaps
  const tips = useMemo(() => {
    if (!profile) return [];
    const t: string[] = [];
    if (!profile.hasPriorTravel) t.push('Add travel history — prior visas significantly boost approval odds');
    if (profile.monthlyIncomeUSD < 1000) t.push('Show strong financials — bank statements with healthy balance help');
    if (!profile.hasHealthInsurance) t.push('Get travel health insurance — many countries require or prefer it');
    if (!profile.hasReturnTicket) t.push('Book a return ticket — demonstrates intent to return');
    if (!profile.hasHotelBooking) t.push('Secure accommodation proof — hotel bookings or invitation letters');
    if (profile.languages.length <= 1) t.push('Learn basic phrases in the destination language');
    if (profile.education === 'high-school' || profile.education === 'other') t.push('Higher education credentials improve credibility');
    if (profile.savingsUSD < 5000) t.push('Maintain 6+ months of bank statements with steady deposits');
    return t.slice(0, 4);
  }, [profile]);

  return (
    <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-500" />
          Visa Success Rate
        </h3>
        <Badge className={`text-[10px] font-semibold ${badgeClass}`} variant="secondary">
          {tierLabel}
        </Badge>
      </div>

      {profile ? (
        <>
          {/* Rate display */}
          <div className="flex items-center gap-3">
            <motion.span
              className={`text-2xl font-bold tabular-nums ${tierColor}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              {estimatedRate}%
            </motion.span>
            <div className="flex-1">
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${estimatedRate}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] text-muted-foreground">0%</span>
                <span className="text-[9px] text-muted-foreground">100%</span>
              </div>
            </div>
          </div>

          {/* Visa type note */}
          <p className="text-[11px] text-muted-foreground">
            Based on <strong>{country.name}</strong>&apos;s {country.visaFree ? 'visa-free' : country.visaOnArrival ? 'visa-on-arrival' : country.etaAvailable ? 'e-visa' : 'embassy visa'} policy and your profile strength.
          </p>

          {/* Tips */}
          {tips.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Tips to improve</p>
              {tips.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-2 text-[11px] text-muted-foreground"
                >
                  <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {/* No profile — show generic estimate */}
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold tabular-nums ${tierColor}`}>{baseRate}%</span>
            <div className="flex-1">
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${baseRate}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[9px] text-muted-foreground">0%</span>
                <span className="text-[9px] text-muted-foreground">100%</span>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-amber-700 dark:text-amber-400">Complete questionnaire for personalized rate</p>
              <p className="text-muted-foreground mt-0.5">This is a general estimate. Your profile details can give a more accurate prediction.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs w-full border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
            onClick={() => setActiveTab('questionnaire')}
          >
            <ClipboardList className="w-3.5 h-3.5 mr-1.5" />
            Complete Profile Questionnaire
          </Button>
        </>
      )}
    </div>
  );
}
