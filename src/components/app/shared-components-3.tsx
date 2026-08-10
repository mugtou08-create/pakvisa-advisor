'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, FileText, BarChart3, Search, Star, Clock,
  DollarSign, Shield, Calendar, Heart, Plane, Building, MapPin,
  Users, TrendingUp, Timer, Wallet, Flame, Target, History, Gavel, Compass, Sparkles,
  AlertTriangle, Info, XCircle, CheckCircle2, X, ChevronDown, ArrowUpDown, User, Lock, Bell, AlarmClock, PlaneTakeoff, CalendarClock,
  Thermometer, ThumbsUp, ThermometerSun, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { CountryData, ScoreBreakdown } from '@/lib/types';
import { EXCHANGE_RATES, TIMELINE_STAGES, VISA_CATEGORY_COLORS, QUICK_FILTERS, MONTH_NAMES } from './constants';
import { FlagImage, AnimatedCounter, ColorProgress, CountryCard } from './shared-components-1';
import { CountryDetailDialog } from './shared-components-2';

export function VisaReadinessGauge({ scoreResults }: { scoreResults: ScoreBreakdown[] }) {
  if (!scoreResults || scoreResults.length === 0) return null;
  const eligible = scoreResults.filter(s => s.finalScore >= 60).length;
  const total = scoreResults.length;
  const pct = Math.round((eligible / total) * 100);
  const color = pct >= 70 ? '#f59e0b' : pct >= 40 ? '#f59e0b' : '#ef4444';
  const cx = 60, cy = 55, r = 45;
  const circumference = Math.PI * r;
  const filled = (pct / 100) * circumference;
  
  return (
    <Card className="p-4 border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-r from-amber-50/50 to-amber-50/50 dark:from-amber-950/20 dark:to-orange-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg width="120" height="70" viewBox="0 0 120 70">
              <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke="var(--muted)" strokeWidth="10" strokeLinecap="round" />
              <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - filled} style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
              <text x={cx} y={cy - 5} textAnchor="middle" className="text-lg font-bold" fill={color} fontSize="18" fontWeight="bold">{pct}%</text>
              <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--muted-foreground)" fontSize="8">Readiness</text>
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-500" />
              Visa Readiness Score
            </h3>
            <p className="text-xs text-muted-foreground">
              You qualify for <span className="font-bold text-amber-600 dark:text-amber-400">{eligible}/{total}</span> countries
            </p>
            <p className="text-[11px] text-muted-foreground">
              {pct >= 70 ? 'Excellent! Strong eligibility profile' : pct >= 40 ? 'Good profile. Consider improving financials.' : 'Consider improving your profile for better chances.'}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-xs">
          <div className="text-center">
            <div className="text-amber-600 dark:text-amber-400 font-bold text-lg">{scoreResults.filter(s => s.finalScore >= 70).length}</div>
            <div className="text-muted-foreground">High</div>
          </div>
          <div className="w-px h-8 bg-border" />\n          <div className="text-center">
            <div className="text-amber-600 dark:text-amber-400 font-bold text-lg">{scoreResults.filter(s => s.finalScore >= 40 && s.finalScore < 70).length}</div>
            <div className="text-muted-foreground">Medium</div>
          </div>
          <div className="w-px h-8 bg-border" />\n          <div className="text-center">
            <div className="text-red-600 dark:text-red-400 font-bold text-lg">{scoreResults.filter(s => s.finalScore < 40).length}</div>
            <div className="text-muted-foreground">Low</div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ============ CURRENCY CONVERTER WIDGET ============
export function CurrencyConverter({ currencyCode }: { currencyCode: string }) {
  const [pkrAmount, setPkrAmount] = useState('10000');
  const rate = EXCHANGE_RATES[currencyCode];
  if (!rate) return null;
  const converted = parseFloat(pkrAmount || '0') / rate;
  const reverse = rate;
  
  return (
    <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <ArrowUpDown className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-medium">Currency Converter</span>
        <Badge variant="outline" className="text-[10px]">≈ PKR</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Amount (PKR)</Label>
          <Input type="number" value={pkrAmount} onChange={(e) => setPkrAmount(e.target.value)} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Amount ({currencyCode})</Label>
          <div className="h-8 flex items-center px-2 rounded-md border bg-muted/50 text-sm font-medium">
            {converted.toFixed(2)}
          </div>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground flex justify-between">
        <span>1 {currencyCode} ≈ PKR {reverse.toLocaleString()}</span>
        <span className="text-amber-500">* Approximate rates</span>
      </div>
    </div>
  );
}

// ============ NOTIFICATION BELL ============
export function NotificationBell() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppStore();
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const bellRef = useRef<HTMLDivElement>(null);

  const notificationIcons: Record<string, React.ReactNode> = {
    policy: <Gavel className="w-4 h-4 text-amber-500" />,
    expiry: <AlarmClock className="w-4 h-4 text-red-500" />,
    'new-country': <PlaneTakeoff className="w-4 h-4 text-amber-500" />,
  };

  function getTimeAgo(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={bellRef}>
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)} aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}>
        <Bell className={`w-4 h-4 transition-transform ${open ? 'animate-bell-ring' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-80 rounded-xl border glass-card-strong shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 border-b border-white/10 dark:border-white/5">
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <button className="text-[11px] text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline font-medium" onClick={() => markAllNotificationsRead()}>
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 || notifications.every(n => n.read) ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <Sparkles className="w-8 h-8 text-amber-400/60 mb-2" />
                  <p className="text-sm text-muted-foreground">You're all caught up! ✨</p>
                </div>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    className={`w-full text-left p-3 border-b last:border-0 transition-all hover:bg-muted/50 ${!n.read ? 'chat-bubble-bot' : ''}`}
                    onClick={() => markNotificationRead(n.id)}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">
                        {notificationIcons[n.type] || <Info className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-medium truncate ${!n.read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</span>
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">{getTimeAgo(n.date)}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ SCORE HISTORY CHART (SVG) ============
export function ScoreHistoryChart() {
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const history = useMemo(() => {
    try {
      const raw = localStorage.getItem(SCORING_HISTORY_KEY);
      if (raw) {
        const entries = JSON.parse(raw);
        return entries.slice(-8).map((e: any) => ({
          date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          topScore: e.topScore || (e.scores && e.scores[0] ? e.scores[0].finalScore : 0),
          countryCount: e.countryCount || (e.scores ? e.scores.length : 0),
        }));
      }
    } catch {}
    return [];
  }, []);
  
  if (history.length < 2) return null;
  
  const chartW = 400, chartH = 120, pad = 30;
  const maxScore = Math.max(...history.map(e => e.topScore), 1);
  const pts = history.map((e, i) => ({
    x: pad + (i / (history.length - 1)) * (chartW - 2 * pad),
    y: chartH - pad - (e.topScore / maxScore) * (chartH - 2 * pad),
  }));
  
  return (
    <Card className="p-4">
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4 text-amber-500" />
        Score Trend
      </h4>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
        {/* Grid lines */}
        {[0, 0.5, 1].map(v => (
          <line key={v} x1={pad} y1={chartH - pad - v * (chartH - 2 * pad)} x2={chartW - pad} y2={chartH - pad - v * (chartH - 2 * pad)} stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4 4" />
        ))}
        {/* Y-axis labels */}
        <text x={pad - 5} y={chartH - pad + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize="9">0</text>
        <text x={pad - 5} y={pad + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize="9">{maxScore}</text>
        {/* Area fill */}
        <path d={`M ${pts[0].x} ${chartH - pad} L ${pts.map(p => `${p.x} ${p.y}`).join(' L')} L ${pts[pts.length - 1].x} ${chartH - pad} Z`} fill="url(#chartGradient)" opacity="0.3" />
        {/* Line */}
        <polyline points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#f59e0b" strokeWidth="2" />
            <text x={p.x} y={chartH - pad + 14} textAnchor="middle" fill="var(--muted-foreground)" fontSize="8">{history[i].date}</text>
          </g>
        ))}
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </Card>
  );
}

// ============ PASSPORT POWER INDEX WIDGET ============
export function PassportPowerIndex({ countries, stats }: { countries: CountryData[]; stats: { totalCountries: number; visaFreeCount: number; visaOnArrivalCount: number; eVisaCount: number; embassyRequiredCount: number; avgCostUSD?: number; cheapestCountry?: { name: string; code: string; flagEmoji: string; visaFeeUSD: number }; fastestProcessing?: { name: string; code: string; flagEmoji: string; processingDaysMin: number } } | null }) {
  // Exclusive classification: visaFree > voa > evisa > embassy (same logic as API stats)
  const visaFreeCount = stats?.visaFreeCount || countries.filter(c => c.visaFree).length;
  const voaCount = stats?.visaOnArrivalCount || countries.filter(c => !c.visaFree && c.visaOnArrival).length;
  const eVisaCount = stats?.eVisaCount || countries.filter(c => !c.visaFree && !c.visaOnArrival && c.etaAvailable).length;
  const embassyCount = stats?.embassyRequiredCount || countries.filter(c => !c.visaFree && !c.visaOnArrival && !c.etaAvailable).length;
  const total = 199;
  const rank = 106;
  const accessible = visaFreeCount + voaCount + eVisaCount;
  const powerScore = Math.round((accessible / total) * 100);
  const segments = [
    { label: 'Visa Free', count: visaFreeCount, color: '#f59e0b' },
    { label: 'Visa on Arrival', count: voaCount, color: '#f59e0b' },
    { label: 'e-Visa', count: eVisaCount, color: '#f97316' },
    { label: 'Embassy Required', count: embassyCount, color: '#ef4444' },
  ];

  // Circular gauge animation state
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedRank, setAnimatedRank] = useState(0);
  const [animatedAccessible, setAnimatedAccessible] = useState(0);
  const [showCalcInfo, setShowCalcInfo] = useState(false);
  const gaugeRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = gaugeRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const start = performance.now();
          const animate = (currentTime: number) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedScore(Math.round(eased * powerScore));
            setAnimatedRank(Math.round(eased * rank));
            setAnimatedAccessible(Math.round(eased * accessible));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [powerScore, rank, accessible]);

  // SVG circular gauge params
  const radius = 54;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const gaugeProgress = (animatedScore / 100) * circumference;

  // Color based on score zones
  const getGaugeColor = (score: number) => {
    if (score < 30) return '#ef4444';
    if (score < 60) return '#f97316';
    if (score < 80) return '#f59e0b';
    return '#22c55e';
  };
  const gaugeColor = getGaugeColor(animatedScore);

  const comparisonDots = [
    { flag: '\u{1F1EE}\u{1F1F3}', name: 'India', rank: 84 },
    { flag: '\u{1F1EE}\u{1F1F7}', name: 'Iran', rank: 94 },
    { flag: '\u{1F1F5}\u{1F1F0}', name: 'Pakistan', rank: 106 },
    { flag: '\u{1F1E7}\u{1F1E9}', name: 'Bangladesh', rank: 101 },
    { flag: '\u{1F1E6}\u{1F1EB}', name: 'Afghanistan', rank: 111 },
  ];

  return (
    <div className="glass-section p-5" ref={gaugeRef}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-500" />
          Passport Power Index
        </h3>
        <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
          {animatedAccessible} accessible
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 mb-4">
        {/* Circular Gauge */}
        <div className="relative shrink-0">
          <svg width={140} height={140} className="-rotate-90">
            {/* Background track */}
            <circle
              cx={70} cy={70} r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/30"
            />
            {/* Color zone markers */}
            {[
              { pct: 30, color: '#ef4444' },
              { pct: 60, color: '#f97316' },
              { pct: 80, color: '#f59e0b' },
            ].map(zone => {
              const angle = (zone.pct / 100) * 360 - 90;
              const rad = (angle * Math.PI) / 180;
              const x1 = 70 + (radius - strokeWidth) * Math.cos(rad);
              const y1 = 70 + (radius - strokeWidth) * Math.sin(rad);
              const x2 = 70 + (radius + 2) * Math.cos(rad);
              const y2 = 70 + (radius + 2) * Math.sin(rad);
              return <line key={zone.pct} x1={x1} y1={y1} x2={x2} y2={y2} stroke={zone.color} strokeWidth={2} strokeLinecap="round" />;
            })}
            {/* Animated progress arc */}
            <circle
              cx={70} cy={70} r={radius}
              fill="none"
              stroke={gaugeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - gaugeProgress}
              style={{ transition: 'stroke 0.3s ease' }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <span className="text-3xl">🇵🇰</span>
            <span className="text-2xl font-extrabold tabular-nums" style={{ color: gaugeColor }}>
              #{animatedRank}
            </span>
            <span className="text-[10px] text-muted-foreground">of {total}</span>
          </div>
        </div>

        {/* Right side info */}
        <div className="flex-1 text-center sm:text-left">
          <p className="text-sm font-semibold">Pakistan Passport</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="text-amber-600 dark:text-amber-400 font-bold">{animatedAccessible}</span> countries accessible out of {total}
          </p>

          {/* Comparison dots */}
          <div className="flex items-center gap-1.5 mt-3 justify-center sm:justify-start flex-wrap">
            {comparisonDots.map(dot => (
              <div
                key={dot.name}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${dot.name === 'Pakistan' ? 'bg-amber-100 dark:bg-amber-900/30 font-bold text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}
              >
                <span>{dot.flag}</span>
                <span>#{dot.rank}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Segmented bar */}
      <div className="flex rounded-lg overflow-hidden h-2.5 mb-4">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="power-bar-segment power-bar-animated"
            style={{
              flex: seg.count || 1,
              backgroundColor: seg.color,
            }}
            title={`${seg.label}: ${seg.count} countries`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-muted-foreground">{seg.label}:</span>
            <span className="font-semibold">{seg.count}</span>
          </div>
        ))}
      </div>

      {/* How it's calculated */}
      <button
        onClick={() => setShowCalcInfo(!showCalcInfo)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        <Info className="w-3.5 h-3.5" />
        How it&apos;s calculated
        <ChevronDown className={`w-3 h-3 transition-transform ${showCalcInfo ? 'rotate-180' : ''}`} />
      </button>
      {showCalcInfo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-xs text-muted-foreground space-y-1.5 mb-4 pl-5"
        >
          <p>The <strong>Passport Power Index</strong> measures how many destinations a passport holder can visit without traditional embassy visa application.</p>
          <p>It counts countries accessible via <strong>visa-free entry</strong>, <strong>visa on arrival</strong>, and <strong>electronic visa (e-Visa)</strong> out of {total} total destinations worldwide.</p>
          <p>Rank #{rank} means {total - rank} passports are stronger. Data is based on the latest ICAO and government sources.</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-red-500" /><span>Weak (0-30)</span>
            <div className="w-2 h-2 rounded-full bg-orange-500" /><span>Fair (30-60)</span>
            <div className="w-2 h-2 rounded-full bg-amber-500" /><span>Moderate (60-80)</span>
            <div className="w-2 h-2 rounded-full bg-green-500" /><span>Strong (80+)</span>
          </div>
        </motion.div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => toast.info('Passport comparison feature coming soon!')}
      >
        <Globe className="w-3 h-3 mr-1" />
        Compare with other passports
      </Button>
    </div>
  );
}

// ============ VISA STATISTICS DASHBOARD WIDGET ============
export function VisaStatsDashboard({ countries, stats }: { countries: CountryData[]; stats: { totalCountries: number; visaFreeCount: number; visaOnArrivalCount: number; eVisaCount: number; embassyRequiredCount: number; avgCostUSD?: number; cheapestCountry?: { name: string; code: string; flagEmoji: string; visaFeeUSD: number }; fastestProcessing?: { name: string; code: string; flagEmoji: string; processingDaysMin: number } } | null }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    // Trigger initial check in observer callback
    observer.takeRecords().forEach(entry => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    });
    return () => observer.disconnect();
  }, [countries.length]);

  const cheapest = stats?.cheapestCountry;
  const fastest = stats?.fastestProcessing;
  const avgFee = stats?.avgCostUSD ? Math.round(stats.avgCostUSD) : Math.round(countries.reduce((sum, c) => sum + (c.costProfile?.visaFeeUSD || 0), 0) / (countries.length || 1));
  const highestSafety = useMemo(() => {
    return countries.reduce((best, c) => c.safetyRating > (best?.safetyRating || 0) ? c : best, countries[0]);
  }, [countries]);

  const statCards = [
    { label: 'Total Countries', value: visible ? String(countries.length) : '0', icon: Globe, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Average Visa Fee', value: visible ? `$${avgFee}` : '$0', icon: DollarSign, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Fastest Processing', value: visible ? (fastest ? `${fastest.processingDaysMin}d` : 'Instant') : '—', sub: fastest?.name, icon: Timer, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Cheapest Destination', value: visible ? (cheapest ? `$${cheapest.visaFeeUSD}` : '—') : '$0', sub: cheapest?.name, icon: Wallet, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Most Popular', value: 'Turkey', sub: 'Based on searches', icon: Flame, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: 'Highest Safety', value: visible ? `${highestSafety?.safetyRating || 0}/10` : '—', sub: highestSafety?.name, icon: Shield, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-amber-50 dark:bg-orange-900/20' },
  ];

  return (
    <div ref={ref}>
      <div className="scroll-section-title">
        <h3 className="text-sm font-semibold flex items-center gap-2 whitespace-nowrap">
          <BarChart3 className="w-4 h-4 text-amber-500" />
          Visa Statistics Overview
        </h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 filter-scroll">
        {statCards.map((card) => (
          <div key={card.label} className={`mini-stat-hover shrink-0 w-44 p-4 rounded-xl border bg-background ${card.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{card.label}</p>
            {card.sub && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{card.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ TRAVEL COUNTDOWN WIDGET (Round 13) ============
export function TravelCountdownWidget() {
  const { targetTravelDate, setTargetTravelDate } = useAppStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const target = targetTravelDate ? new Date(targetTravelDate) : null;
  const diff = target ? Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86400000)) : null;

  return (
    <div className="glass-section p-4 rounded-xl">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <CalendarClock className="w-4 h-4 text-amber-500" />
        Travel Countdown
      </h3>
      {diff !== null && target ? (
        <div className="text-center">
          <div className={`text-4xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums ${diff < 30 && diff > 0 ? 'countdown-urgent' : ''}`}>
            {diff}
          </div>
          <p className="text-sm text-muted-foreground mt-1">days until departure</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: 'Weeks', value: Math.floor(diff / 7) },
              { label: 'Months', value: Math.round(diff / 30) },
              { label: 'Target', value: target.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }) },
            ].map(item => (
              <div key={item.label} className="rounded-lg bg-muted/50 p-2 text-center">
                <div className="text-sm font-bold">{item.value}</div>
                <div className="text-[10px] text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
          {diff < 30 && diff > 0 && (
            <Badge className="mt-2 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" variant="secondary">
              <AlarmClock className="w-3 h-3 mr-1" /> Visa application recommended soon
            </Badge>
          )}
          {diff === 0 && (
            <Badge className="mt-2 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" variant="secondary">
              <PlaneTakeoff className="w-3 h-3 mr-1" /> Travel day! Have a safe trip!
            </Badge>
          )}
          <button
            onClick={() => setTargetTravelDate('')}
            className="text-[10px] text-muted-foreground hover:text-foreground mt-2 underline"
          >
            Change date
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">Set your target travel date to see countdown</p>
          <Input
            type="date"
            className="input-glow-focus mx-auto w-auto"
            onChange={(e) => setTargetTravelDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      )}
    </div>
  );
}

// ============ RECENT ACTIVITY FEED (Round 13) ============
export function RecentActivityFeed() {
  const { scoreResults, comparisonCountries, favorites, userProfile } = useAppStore();

  const activities = useMemo(() => {
    const acts: { icon: React.ReactNode; text: string; time: string; color: string }[] = [];
    if (scoreResults.length > 0) {
      acts.push({ icon: <Star className="w-3.5 h-3.5" />, text: `Scored ${scoreResults.length} countries`, time: 'Recent', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' });
    }
    if (comparisonCountries.length > 0) {
      acts.push({ icon: <BarChart3 className="w-3.5 h-3.5" />, text: `Comparing ${comparisonCountries.length} countries`, time: 'Recent', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' });
    }
    if (favorites.length > 0) {
      acts.push({ icon: <Heart className="w-3.5 h-3.5" />, text: `${favorites.length} favorites saved`, time: 'Recent', color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30' });
    }
    if (userProfile) {
      acts.push({ icon: <User className="w-3.5 h-3.5" />, text: `Profile: ${userProfile.fullName}`, time: 'Completed', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' });
    }
    if (acts.length === 0) {
      acts.push({ icon: <Info className="w-3.5 h-3.5" />, text: 'No recent activity', time: '', color: 'text-muted-foreground bg-muted/50' });
    }
    return acts;
  }, [scoreResults, comparisonCountries, favorites, userProfile]);

  return (
    <div className="glass-section p-4 rounded-xl">
      <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-amber-500" />
        Recent Activity
      </h3>
      <div className="space-y-2">
        {activities.map((act, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${act.color}`}>
              {act.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{act.text}</p>
              {act.time && <p className="text-[10px] text-muted-foreground">{act.time}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ VISA TYPE QUICK GUIDE (Round 13) ============
export function VisaTypeQuickGuide() {
  const [expanded, setExpanded] = useState(false);

  const types = [
    { id: 'vf', label: 'Visa Free', color: 'bg-amber-500', icon: CheckCircle2, desc: 'No visa required. Just present your valid Pakistani passport at immigration. Typically allows 14-90 days stay for tourism or business.', countries: 'Malaysia, Dominica, Micronesia, Vanuatu, Trinidad & Tobago, Saint Vincent' },
    { id: 'voa', label: 'Visa on Arrival', color: 'bg-amber-500', icon: Plane, desc: 'Visa issued at the airport/border upon arrival. May require fees, return ticket, hotel booking, or sponsor letter. Processing takes 5-30 minutes.', countries: 'UAE, Saudi Arabia, Qatar, Oman, Turkey, Thailand, Maldives, Sri Lanka' },
    { id: 'ev', label: 'e-Visa', color: 'bg-amber-500', icon: FileText, desc: 'Apply online before travel. Receive electronic visa via email. Print and present at immigration. Processing: 1-5 business days. May require document upload.', countries: 'Kenya, Azerbaijan, Bahrain, Jordan, Singapore, South Korea' },
    { id: 'emb', label: 'Embassy Required', color: 'bg-slate-500', icon: Building, desc: 'Must apply in person at embassy/consulate. Requires extensive documentation, biometrics, interview. Processing: 2-6 weeks. Highest scrutiny level.', countries: 'USA, UK, Canada, Australia, Germany, France, Italy, Japan, China' },
  ];

  return (
    <div className="glass-section p-4 rounded-xl">
      <button className="w-full flex items-center justify-between" onClick={() => setExpanded(!expanded)}>
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Gavel className="w-4 h-4 text-amber-500" />
          Visa Type Quick Guide
        </h3>
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4 space-y-3">
          {types.map(t => (
            <div key={t.id} className="flex gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className={`w-8 h-8 rounded-lg ${t.color} flex items-center justify-center shrink-0`}>
                <t.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">Examples: {t.countries}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ============ VISA ALERT BANNER SYSTEM (Task 11) ============
const ALERT_DATA = [
  { id: 'a1', country: 'UAE', code: 'AE', flagEmoji: '\u{1F1E6}\u{1F1EA}', type: 'CHANGED' as const, text: 'Visa on arrival policy updated — insurance requirement added', color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200' },
  { id: 'a2', country: 'Azerbaijan', code: 'AZ', flagEmoji: '\u{1F1E6}\u{1F1FF}', type: 'NEW' as const, text: 'e-Visa now available for Pakistani passport holders', color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200' },
  { id: 'a3', country: 'Saudi Arabia', code: 'SA', flagEmoji: '\u{1F1F8}\u{1F1E6}', type: 'ALERT' as const, text: 'Visa fee revised — check updated costs before applying', color: 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' },
  { id: 'a4', country: 'Bahrain', code: 'BH', flagEmoji: '\u{1F1E7}\u{1F1ED}', type: 'NEW' as const, text: 'New e-Visa option launched with 30-day validity', color: 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200' },
  { id: 'a5', country: 'Jordan', code: 'JO', flagEmoji: '\u{1F1EF}\u{1F1F4}', type: 'CHANGED' as const, text: 'Processing time reduced from 5 to 3 business days', color: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200' },
];

export function VisaAlertBanner() {
  const { setSelectedCountry } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-scroll every 5 seconds, pause on hover
  useEffect(() => {
    if (hovered) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ALERT_DATA.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [hovered]);

  // Scroll to current index — keep card fully visible within container
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const cards = container.children;
    if (!cards[currentIndex]) return;
    const card = cards[currentIndex] as HTMLElement;
    const containerWidth = container.clientWidth;
    const cardLeft = card.offsetLeft;
    const cardWidth = card.offsetWidth;
    const scrollLeft = Math.max(0, cardLeft - 16); // 16px padding from left edge
    const maxScroll = Math.max(0, container.scrollWidth - containerWidth);
    container.scrollTo({ left: Math.min(scrollLeft, maxScroll), behavior: 'smooth' });
  }, [currentIndex]);

  const handleAlertClick = (code: string) => {
    // Try to find the country in our data and open the detail dialog
    fetch(`/api/countries/${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.data) setSelectedCountry(data.data);
      })
      .catch(() => {});
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'NEW': return <Sparkles className="w-3 h-3" />;
      case 'CHANGED': return <ArrowUpDown className="w-3 h-3" />;
      case 'ALERT': return <AlertTriangle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="overflow-hidden"
    >
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto py-2 px-4 filter-scroll scroll-smooth snap-x snap-mandatory"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {ALERT_DATA.map((alert) => (
          <button
            key={alert.id}
            onClick={() => handleAlertClick(alert.code)}
            className={`shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-lg border cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] min-w-[280px] max-w-[340px] snap-start ${alert.color}`}
          >
            <span className="text-xl">{alert.flagEmoji}</span>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">{alert.country}</span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-bold bg-white/60 dark:bg-black/20 border-0">
                  {typeIcon(alert.type)} {alert.type}
                </Badge>
              </div>
              <p className="text-[11px] opacity-80 truncate mt-0.5">{alert.text}</p>
            </div>
          </button>
        ))}
      </div>
      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 pb-1">
        {ALERT_DATA.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-4 bg-amber-500' : 'w-1.5 bg-muted-foreground/30'}`}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────
   TravelWeatherWidget
   Compact weather display for a destination country
   ────────────────────────────────────────────── */
export function TravelWeatherWidget({ country }: { country: CountryData }) {
  const [useFahrenheit, setUseFahrenheit] = useState(false);
  const currentMonthIndex = new Date().getMonth();

  let temps: Record<string, number> = {};
  try {
    temps = typeof country.monthlyTemps === 'string'
      ? JSON.parse(country.monthlyTemps)
      : (country.monthlyTemps || {});
  } catch { temps = {}; }

  const bestMonthsLower = country.bestTravelMonths?.toLowerCase() || '';

  const convertTemp = (c: number) => useFahrenheit ? Math.round(c * 9 / 5 + 32) : c;
  const unit = useFahrenheit ? '°F' : '°C';

  // Find global min/max across all months for color scaling
  const allTemps = MONTH_NAMES.map(m => temps[m] || 0).filter(t => t > 0);
  const globalMin = allTemps.length > 0 ? Math.min(...allTemps) : 0;
  const globalMax = allTemps.length > 0 ? Math.max(...allTemps) : 40;
  const tempRange = globalMax - globalMin || 1;

  // Color: green for cold, amber for warm, orange-red for hot
  const getTempColor = (c: number) => {
    const ratio = Math.min(1, Math.max(0, (c - globalMin) / tempRange));
    if (ratio < 0.33) {
      // Green range
      const t = ratio / 0.33;
      return `hsl(${120 - t * 30}, 70%, ${40 + t * 10}%)`;
    } else if (ratio < 0.66) {
      // Amber range
      const t = (ratio - 0.33) / 0.33;
      return `hsl(${45 - t * 15}, 85%, ${50 + t * 5}%)`;
    } else {
      // Orange-red range
      const t = (ratio - 0.66) / 0.34;
      return `hsl(${30 - t * 20}, 90%, ${50 + t * 5}%)`;
    }
  };

  const avgTemp = parseFloat(country.avgTempC) || 0;

  return (
    <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-orange-500" />
          Travel Weather
        </h3>
        <button
          onClick={() => setUseFahrenheit(!useFahrenheit)}
          className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors"
        >
          {unit}
        </button>
      </div>

      {/* Average temp display */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
          {convertTemp(avgTemp)}{unit}
        </span>
        <span className="text-xs text-muted-foreground">avg temperature</span>
      </div>

      {/* Temperature bars */}
      <div className="space-y-1">
        {MONTH_NAMES.map((month, i) => {
          const temp = temps[month] || 0;
          const isCurrentMonth = i === currentMonthIndex;
          const isBest = bestMonthsLower.includes(month.toLowerCase());
          const barWidth = tempRange > 0 ? ((temp - globalMin) / tempRange) * 100 : 50;

          return (
            <div key={month} className="flex items-center gap-2 group">
              <span
                className={`w-7 text-[10px] font-medium text-right tabular-nums transition-colors ${
                  isCurrentMonth ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-muted-foreground'
                } ${isBest ? 'text-amber-600 dark:text-amber-400' : ''}`}
              >
                {month}
              </span>
              <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden relative">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(4, barWidth)}%`,
                    backgroundColor: getTempColor(temp),
                  }}
                />
              </div>
              <span
                className={`w-8 text-[10px] tabular-nums text-right font-medium ${
                  isCurrentMonth ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-muted-foreground'
                }`}
              >
                {convertTemp(temp)}{unit}
              </span>
              {/* Current month indicator */}
              {isCurrentMonth && (
                <ThermometerSun className="w-3 h-3 text-amber-500 shrink-0" />
              )}
              {isBest && !isCurrentMonth && (
                <Star className="w-3 h-3 text-amber-400 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-amber-400" /> Best months
          </span>
          <span className="flex items-center gap-1">
            <ThermometerSun className="w-3 h-3 text-amber-500" /> Current month
          </span>
        </div>
      </div>

      {/* Best travel months highlight */}
      {country.bestTravelMonths && (
        <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-md px-2 py-1.5 flex items-center gap-1.5">
          <ThumbsUp className="w-3.5 h-3.5 shrink-0" />
          <span>Best time to visit: <strong>{country.bestTravelMonths}</strong></span>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   QuickCompareCards
   Horizontal scrollable comparison cards
   ────────────────────────────────────────────── */
export function QuickCompareCards({ countries, onRemove }: { countries: CountryData[]; onRemove?: (code: string) => void }) {
  if (!countries || countries.length === 0) return null;

  // Find best values for highlighting
  const fees = countries.map(c => c.costProfile?.visaFeeUSD ?? Infinity);
  const minFee = Math.min(...fees.filter(f => f !== Infinity));

  const processTimes = countries.map(c => c.processingDaysMin);
  const fastestTime = Math.min(...processTimes);

  const safeties = countries.map(c => c.safetyRating);
  const maxSafety = Math.max(...safeties);

  return (
    <div className="w-full">
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin">
        {countries.map((country) => {
          const fee = country.costProfile?.visaFeeUSD ?? 0;
          const processDays = country.processingDaysMin;
          const safety = country.safetyRating;
          const visaType = country.visaFree ? 'Visa Free' : country.visaOnArrival ? 'On Arrival' : country.etaAvailable ? 'e-Visa' : 'Embassy';

          const isBestFee = fee > 0 && fee === minFee;
          const isFastest = processDays === fastestTime;
          const isSafest = safety === maxSafety;

          const visaBadgeColor = country.visaFree
            ? 'bg-amber-500 text-white'
            : country.visaOnArrival
              ? 'bg-orange-500 text-white'
              : country.etaAvailable
                ? 'bg-yellow-500 text-white'
                : 'bg-red-500 text-white';

          return (
            <motion.div
              key={country.code}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="snap-start shrink-0 w-56 relative group"
            >
              <Card className={`p-3 h-full transition-all duration-200 ${
                isBestFee || isFastest || isSafest
                  ? 'border-amber-300 dark:border-amber-600 shadow-amber-100 dark:shadow-amber-900/20 shadow-sm'
                  : 'hover:border-amber-200 dark:hover:border-amber-800'
              }`}>
                {/* Remove button */}
                {onRemove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(country.code);
                    }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/30"
                    aria-label={`Remove ${country.name} from comparison`}
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}

                {/* Country header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{country.flagEmoji}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{country.name}</div>
                    <Badge className={`text-[9px] px-1.5 py-0 ${visaBadgeColor}`}>
                      {visaType}
                    </Badge>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-2">
                  {/* Fee */}
                  <div className={`flex items-center justify-between text-xs px-2 py-1 rounded-md transition-colors ${
                    isBestFee ? 'bg-amber-50 dark:bg-amber-900/30' : ''
                  }`}>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      Fee
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`font-semibold tabular-nums ${isBestFee ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                        ${fee || 'N/A'}
                      </span>
                      {isBestFee && <Zap className="w-3 h-3 text-amber-500" />}
                    </div>
                  </div>

                  {/* Processing time */}
                  <div className={`flex items-center justify-between text-xs px-2 py-1 rounded-md transition-colors ${
                    isFastest ? 'bg-amber-50 dark:bg-amber-900/30' : ''
                  }`}>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      Processing
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`font-semibold tabular-nums ${isFastest ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                        {processDays}-{country.processingDaysMax}d
                      </span>
                      {isFastest && <Zap className="w-3 h-3 text-amber-500" />}
                    </div>
                  </div>

                  {/* Safety */}
                  <div className={`flex items-center justify-between text-xs px-2 py-1 rounded-md transition-colors ${
                    isSafest ? 'bg-amber-50 dark:bg-amber-900/30' : ''
                  }`}>
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Safety
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`font-semibold tabular-nums ${isSafest ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                        {safety}/10
                      </span>
                      {isSafest && <Zap className="w-3 h-3 text-amber-500" />}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
