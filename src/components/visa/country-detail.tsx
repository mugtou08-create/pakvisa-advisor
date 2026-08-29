'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock, Globe, DollarSign, Languages, Plug, Phone, Droplets, UtensilsCrossed,
  Car, ShieldCheck, Syringe, Heart, Wifi, Thermometer, Building2, ExternalLink,
  Calculator, ChevronDown, ChevronUp, AlertTriangle, Banknote, ArrowRightLeft,
  FileText, Plane, Lock, Crown, CheckCircle2, ClipboardList, Download,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CountryData } from '@/lib/types';
import {
  EXCHANGE_RATES, EMBASSY_DATA, GENERIC_EMBASSY, MONTH_NAMES,
} from '@/components/app/constants';
import { getTravelInfo, type TravelInfo } from '@/components/app/travel-info';
import { isTouristVisa, getVisaCategoryLabel, getVisaCategoryColor } from '@/lib/visa-classifier';

/** Map visa category to a CSS color for the left border accent */
const CATEGORY_BORDER_COLORS: Record<string, string> = {
  'Tourist': '#34d399',
  'Work': '#60a5fa',
  'Study': '#a78bfa',
  'Business': '#fbbf24',
  'Family': '#f472b6',
  'Digital Nomad': '#22d3ee',
  'Residence': '#fb923c',
  'Job Seeker': '#2dd4bf',
  'Transit': '#9ca3af',
  'Religious': '#a3e635',
};


// ============================================================
// Live Clock Component
// ============================================================
function LiveClock({ timezone, cityName }: { timezone: string; cityName: string }) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    function updateTime() {
      try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        });
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        setTime(formatter.format(now));
        setDate(dateFormatter.format(now));
      } catch {
        setTime('—');
        setDate('—');
      }
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  // Calculate time difference from PKT (Asia/Karachi)
  const timeDiff = useMemo(() => {
    try {
      const now = new Date();
      // Get UTC offsets in minutes for both timezones
      const targetParts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'shortOffset',
      }).formatToParts(now);
      const pktParts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        timeZoneName: 'shortOffset',
      }).formatToParts(now);

      const parseOffset = (parts: Intl.DateTimeFormatPart[]) => {
        const tzPart = parts.find(p => p.type === 'timeZoneName');
        if (!tzPart) return 0;
        const match = tzPart.value.match(/GMT([+-]?)(\d{1,2})(?::(\d{2}))?/);
        if (!match) return 0;
        const sign = match[1] === '-' ? -1 : 1;
        const hours = parseInt(match[2]);
        const minutes = match[3] ? parseInt(match[3]) : 0;
        return sign * (hours * 60 + minutes);
      };

      const targetOffset = parseOffset(targetParts);
      const pktOffset = parseOffset(pktParts);
      const diffHours = (targetOffset - pktOffset) / 60;

      if (diffHours === 0) return 'Same as PKT';
      if (diffHours > 0) return `+${diffHours}h from PKT`;
      return `${diffHours}h from PKT`;
    } catch {
      return '';
    }
  }, [timezone]);

  return (
    <div className="flex items-center gap-3 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 p-3">
      <Clock className="w-5 h-5 text-sky-600 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-sky-900 dark:text-sky-200">{time}</p>
        <p className="text-xs text-sky-700 dark:text-sky-400">{date} {timeDiff && `· ${timeDiff}`}</p>
      </div>
    </div>
  );
}

// ============================================================
// Currency Converter Widget
// ============================================================
function CurrencyConverter({ currencyCode, currencyName }: { currencyCode: string; currencyName: string }) {
  const [amount, setAmount] = useState<string>('100');
  const [direction, setDirection] = useState<'topkr' | 'frompkr'>('topkr');

  const rate = EXCHANGE_RATES[currencyCode];
  const [topkr, frompkr] = useMemo(() => {
    if (!rate) return ['—', '—'];
    return [
      (parseFloat(amount || '0') * rate).toLocaleString('en-PK', { maximumFractionDigits: 2 }),
      (parseFloat(amount || '0') / rate).toLocaleString(undefined, { maximumFractionDigits: 2 }),
    ];
  }, [amount, rate]);

  return (
    <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Banknote className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">Currency Converter</span>
        </div>
        <Badge variant="outline" className="text-[10px] border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400">
          {currencyCode} · {currencyName}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full h-8 px-2 rounded-md border bg-white dark:bg-background text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          min="0"
        />
        <button
          onClick={() => setDirection((d) => d === 'topkr' ? 'frompkr' : 'topkr')}
          className="p-1.5 rounded-md border bg-white dark:bg-background hover:bg-muted transition-colors"
          title="Swap direction"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
        </button>
      </div>
      {rate ? (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {direction === 'topkr' ? `${amount || '0'} ${currencyCode} =` : `PKR ${amount || '0'} =`}
          </span>
          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
            {direction === 'topkr' ? `PKR ${topkr}` : `${frompkr} ${currencyCode}`}
          </span>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Exchange rate not available</p>
      )}
      <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">
        Rate: 1 {currencyCode} ≈ PKR {rate?.toFixed(2) || '—'} · Approximate, verify before transaction
      </p>
    </div>
  );
}

// ============================================================
// Travel Essentials Grid
// ============================================================
function TravelEssentials({ info, countryName }: { info: TravelInfo; countryName: string }) {
  const essentials = [
    {
      icon: <Languages className="w-3.5 h-3.5" />,
      label: 'Languages',
      value: info.languages.join(', '),
      color: 'text-violet-600',
    },
    {
      icon: <Phone className="w-3.5 h-3.5" />,
      label: 'Dial Code',
      value: info.dialCode,
      color: 'text-blue-600',
    },
    {
      icon: <Plug className="w-3.5 h-3.5" />,
      label: 'Plug / Voltage',
      value: `${info.plugType}, ${info.voltage}`,
      color: 'text-orange-600',
    },
    {
      icon: <Droplets className="w-3.5 h-3.5" />,
      label: 'Tap Water',
      value: info.waterSafe ? '✅ Safe to drink' : '⚠️ Not safe — use bottled',
      color: info.waterSafe ? 'text-emerald-600' : 'text-amber-600',
    },
    {
      icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
      label: 'Halal Food',
      value: info.halalFood,
      color: info.halalFood === 'Widely Available' ? 'text-emerald-600' : info.halalFood === 'Available' ? 'text-amber-600' : 'text-red-500',
    },
    {
      icon: <Calculator className="w-3.5 h-3.5" />,
      label: 'Tipping',
      value: info.tipping,
      color: 'text-gray-600',
    },
    {
      icon: <Car className="w-3.5 h-3.5" />,
      label: 'Transport',
      value: info.transport,
      color: 'text-cyan-600',
    },
    {
      icon: <Heart className="w-3.5 h-3.5" />,
      label: 'Pakistani Community',
      value: info.pakistaniCommunity,
      color: info.pakistaniCommunity === 'Large' ? 'text-emerald-600' : info.pakistaniCommunity === 'Moderate' ? 'text-amber-600' : 'text-gray-500',
    },
    {
      icon: <Wifi className="w-3.5 h-3.5" />,
      label: 'Internet',
      value: info.internet,
      color: 'text-indigo-600',
    },
  ];

  return (
    <div>
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Travel Essentials</h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {essentials.map((item) => {
          const iconCls = item.color + ' shrink-0 mt-0.5';
          return (
          <div key={item.label} className="rounded-lg bg-muted/50 p-2.5 flex items-start gap-2">
            <span className={iconCls}>{item.icon}</span>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
              <p className="text-xs font-medium leading-snug">{item.value}</p>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Emergency & Health Section
// ============================================================
function EmergencyHealth({ info }: { info: TravelInfo }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
          Emergency & Health
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {expanded && (
        <div className="space-y-2">
          {/* Emergency Numbers */}
          <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
            <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-2">Emergency Numbers</p>
            {info.emergencyPolice === info.emergencyAmbulance && info.emergencyAmbulance === info.emergencyFire ? (
              /* All three numbers are the same — show one clean line */
              <div className="flex items-center justify-center gap-2">
                <Phone className="w-4 h-4 text-red-500" />
                <p className="text-lg font-bold text-red-900 dark:text-red-200">{info.emergencyPolice}</p>
                <p className="text-[10px] text-red-600 dark:text-red-400">Police · Ambulance · Fire</p>
              </div>
            ) : (
              /* Numbers differ — show 3-column grid */
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Police', icon: ShieldCheck, number: info.emergencyPolice },
                  { label: 'Ambulance', icon: Syringe, number: info.emergencyAmbulance },
                  { label: 'Fire', icon: AlertTriangle, number: info.emergencyFire },
                ].map((e) => (
                  <div key={e.label} className="text-center">
                    <e.icon className="w-3.5 h-3.5 mx-auto mb-1 text-red-500" />
                    <p className="text-[10px] text-red-700 dark:text-red-400">{e.label}</p>
                    <p className="text-sm font-bold text-red-900 dark:text-red-200">{e.number}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Vaccines */}
          {info.vaccines.length > 0 && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">Recommended Vaccinations</p>
              <div className="flex flex-wrap gap-1.5">
                {info.vaccines.map((v) => (
                  <Badge key={v} variant="outline" className="text-[10px] border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400">
                    <Syringe className="w-2.5 h-2.5 mr-1" /> {v}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Embassy Contact Section
// ============================================================
function EmbassyContact({ countryCode }: { countryCode: string }) {
  const embassy = EMBASSY_DATA[countryCode] || GENERIC_EMBASSY;

  return (
    <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 p-3">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="w-4 h-4 text-purple-600" />
        <p className="text-xs font-semibold text-purple-800 dark:text-purple-300">Embassy in Islamabad</p>
      </div>
      <div className="space-y-1.5 text-xs text-purple-900 dark:text-purple-200">
        <p className="flex items-start gap-1.5">
          <span className="text-purple-500 shrink-0">📍</span>
          <span>{embassy.address}</span>
        </p>
        <p className="flex items-start gap-1.5">
          <span className="text-purple-500 shrink-0">📞</span>
          <span>{embassy.phone}</span>
        </p>
        <p className="flex items-start gap-1.5">
          <span className="text-purple-500 shrink-0">🕐</span>
          <span>{embassy.hours}</span>
        </p>
        {embassy.note && (
          <p className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
            <span className="text-amber-500 shrink-0">⚠️</span>
            <span>{embassy.note}</span>
          </p>
        )}
      </div>
      <a
        href={embassy.appointmentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[11px] font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
      >
        Book Appointment <ExternalLink className="w-2.5 h-2.5" />
      </a>
    </div>
  );
}

// ============================================================
// Safety Info Section
// ============================================================
function SafetyInfo({ rating, summary }: { rating: number; summary: string }) {
  const displayRating = Math.min(Math.max(rating, 0), 5);
  return (
    <div>
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Safety Overview</h5>
      <div className="rounded-lg bg-muted/50 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Safety Rating</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => {
              const dotCls = 'w-4 h-4 rounded-full ' + (i < displayRating ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700');
              return (
              <span
                key={i}
                className={dotCls}
              />
              );
            })}
            <span className="text-xs font-semibold ml-1">{displayRating}/5</span>
          </div>
        </div>
        {summary && <p className="text-xs text-muted-foreground leading-relaxed">{summary}</p>}
      </div>
    </div>
  );
}

// ============================================================
// Weather Info Section
// ============================================================
function WeatherInfo({ avgTemp, monthlyTemps }: { avgTemp: string; monthlyTemps: Record<string, number> }) {
  const temps = Object.entries(monthlyTemps);
  if (temps.length === 0 && !avgTemp) return null;

  const maxTemp = temps.length > 0 ? Math.max(...temps.map(([, v]) => v)) : parseInt(avgTemp) || 0;
  const minTemp = temps.length > 0 ? Math.min(...temps.map(([, v]) => v)) : parseInt(avgTemp) || 0;

  return (
    <div>
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Climate & Weather</h5>
      <div className="rounded-lg bg-muted/50 p-3 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-red-500" />
            <span className="font-medium">Avg Temperature</span>
          </span>
          <span className="font-semibold">{avgTemp}°C</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>🔥 High: {maxTemp}°C</span>
          <span>❄️ Low: {minTemp}°C</span>
        </div>
        {temps.length > 0 && (
          <div className="flex items-end gap-0.5 h-8">
            {temps.map(([month, temp], idx) => {
              const height = maxTemp > minTemp ? ((temp - minTemp) / (maxTemp - minTemp)) * 100 : 50;
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-0.5">
                  <div
                    className="w-full rounded-t-sm min-h-[2px] transition-all"
                    style={{
                      height: 'height: ' + Math.max(height, 5) + '%' === 'height: ' + Math.max(height, 5) + '%' ? Math.max(height, 5) + '%' : Math.max(height, 5) + '%',
                      backgroundColor: temp > 30 ? '#ef4444' : temp > 20 ? '#f59e0b' : temp > 10 ? '#3b82f6' : '#6366f1',
                    }}
                  />
                  <span className="text-[8px] text-muted-foreground">{MONTH_NAMES[idx]?.[0] || ''}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Trip Cost Calculator
// ============================================================
function TripCalculator({ costProfile }: { costProfile: NonNullable<CountryData['costProfile']> }) {
  const [days, setDays] = useState('14');
  const n = parseFloat(days) || 0;
  const months = n / 30;
  const totalUSD = costProfile.visaFeeUSD + (months * costProfile.totalMonthlyUSD);
  const totalPKR = Math.round(totalUSD * 278.5);

  return (
    <div className="mt-3 rounded-lg bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-violet-600" />
          <span className="text-xs font-semibold text-violet-900 dark:text-violet-200">Trip Cost Calculator</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="w-24 h-8 px-2 rounded-md border bg-white dark:bg-background text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
          min="1"
          max="365"
        />
        <span className="text-xs text-muted-foreground">days</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[10px] text-violet-700 dark:text-violet-400">Visa Fee</p>
          <p className="text-xs font-bold text-violet-900 dark:text-violet-200">${costProfile.visaFeeUSD}</p>
        </div>
        <div>
          <p className="text-[10px] text-violet-700 dark:text-violet-400">Living ({months.toFixed(1)}mo)</p>
          <p className="text-xs font-bold text-violet-900 dark:text-violet-200">${Math.round(months * costProfile.totalMonthlyUSD).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] text-violet-700 dark:text-violet-400">Total in PKR</p>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Rs. {totalPKR.toLocaleString()}</p>
        </div>
      </div>
      <p className="text-[10px] text-violet-700/60 dark:text-violet-400/60">
        Total: ${Math.round(totalUSD).toLocaleString()} USD · Approximate estimate for budgeting
      </p>
    </div>
  );
}

// ============================================================
// Affiliate: Travel Resources (iVisa, Insurance, Hotels, Flights)
// ============================================================
function AffiliateResources({ country }: { country: CountryData }) {
  const getSessionId = () => {
    try { return localStorage.getItem('_pvsid') || ''; } catch { return ''; }
  };
  const sid = typeof window !== 'undefined' ? getSessionId() : '';
  const page = typeof window !== 'undefined' ? window.location.pathname : '';
  const ivisaUrl = `/api/go?p=ivisa&c=${encodeURIComponent(country.name)}&sid=${encodeURIComponent(sid)}&page=${encodeURIComponent(page)}`;
  const safetyWingUrl = `https://safetywing.com/nomad-insurance?referenceID=26323190&utm_source=26323190&utm_medium=Ambassador`;
  const bookingUrl = `/api/go?p=booking&c=${encodeURIComponent(country.name)}&sid=${encodeURIComponent(sid)}&page=${encodeURIComponent(page)}`;
  const skyscannerUrl = `/api/go?p=skyscanner&c=${encodeURIComponent(country.name)}&sid=${encodeURIComponent(sid)}&page=${encodeURIComponent(page)}`;

  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-r from-emerald-50/80 to-sky-50/50 dark:from-emerald-950/20 dark:to-sky-950/10 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-foreground">Prepare Your Trip</span>
        <span className="text-[9px] text-muted-foreground/70">(sponsored)</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {!country.visaFree && (
          <a
            href={ivisaUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex flex-col items-center gap-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/30 bg-white/80 dark:bg-background/80 p-3 hover:shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-center">
              <p className="text-xs font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">Apply Visa</p>
              <p className="text-[10px] text-muted-foreground">via iVisa</p>
            </div>
          </a>
        )}
        <a
          href={skyscannerUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex flex-col items-center gap-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/30 bg-white/80 dark:bg-background/80 p-3 hover:shadow-sm hover:border-orange-300 dark:hover:border-orange-700 transition-all group"
        >
          <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Plane className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium group-hover:text-orange-700 dark:group-hover:text-orange-400 transition-colors">Find Flights</p>
            <p className="text-[10px] text-muted-foreground">via Skyscanner</p>
          </div>
        </a>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex flex-col items-center gap-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/30 bg-white/80 dark:bg-background/80 p-3 hover:shadow-sm hover:border-violet-300 dark:hover:border-violet-700 transition-all group"
        >
          <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">Book Hotel</p>
            <p className="text-[10px] text-muted-foreground">via Booking.com</p>
          </div>
        </a>
        <a
          href={safetyWingUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="flex flex-col items-center gap-1.5 rounded-lg border border-amber-200/50 dark:border-amber-800/30 bg-white/80 dark:bg-background/80 p-3 hover:shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all group"
        >
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Get Insurance</p>
            <p className="text-[10px] text-muted-foreground">from $42/mo</p>
          </div>
        </a>
      </div>
      <p className="text-[9px] text-muted-foreground/50 text-center mt-2">
        We may earn a commission at no extra cost to you.
      </p>
    </div>
  );
}

// ============================================================
// Main Country Detail Panel
// ============================================================
export function CountryDetailPanel({ country }: { country: CountryData }) {
  const travel = getTravelInfo(country.code);
  const reqs = country.requirements?.slice(0, 5) || [];
  const travelMonths = country.bestTravelMonths
    ? country.bestTravelMonths.split(',').map((m: string) => m.trim())
    : [];
  const visaTypes = country.visaTypes || [];
  const { user, isAuthenticated } = useAuthStore();
  const isPro = isAuthenticated && user?.role === 'pro' && !!user.proExpiresAt && new Date(user.proExpiresAt) > new Date();

  // Parse monthlyTemps safely (may arrive as JSON string from API)
  const parsedMonthlyTemps: Record<string, number> = useMemo(() => {
    const raw = country.monthlyTemps;
    if (!raw) return {};
    if (typeof raw === 'object') return raw as Record<string, number>;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return {}; }
    }
    return {};
  }, [country.monthlyTemps]);

  // Determine if embassy info should be shown (for embassy-required countries)
  const isEmbassyRequired = !country.visaFree && !country.visaOnArrival && !country.etaAvailable;

  return (
    <div className="border-t px-4 pb-4 pt-3 space-y-4">
      {/* Country Description */}
      {travel.description && (
        <p className="text-xs text-muted-foreground leading-relaxed italic">{travel.description}</p>
      )}

      {/* Row 1: Live Clock + Currency Converter (side by side on larger screens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {country.timezone && (
          <LiveClock timezone={country.timezone} cityName={country.name} />
        )}
        {country.currencyCode && (
          <CurrencyConverter currencyCode={country.currencyCode} currencyName={country.currency} />
        )}
      </div>

      {/* Row 2: Quick Glance Row */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-[10px] gap-1">
          <Globe className="w-2.5 h-2.5" /> {travel.languages.slice(0, 2).join(', ')}
        </Badge>
        <Badge variant="outline" className="text-[10px] gap-1">
          <Plug className="w-2.5 h-2.5" /> {travel.plugType}, {travel.voltage}
        </Badge>
        <Badge variant="outline" className="text-[10px] gap-1">
          <Phone className="w-2.5 h-2.5" /> {travel.dialCode}
        </Badge>
        <Badge variant="outline" className={'text-[10px] gap-1 ' + (travel.halalFood === 'Widely Available' ? 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400' : '')}>
          <UtensilsCrossed className="w-2.5 h-2.5" /> Halal: {travel.halalFood}
        </Badge>
        <Badge variant="outline" className="text-[10px] gap-1">
          <Heart className="w-2.5 h-2.5" /> Community: {travel.pakistaniCommunity}
        </Badge>
      </div>

      {/* Key Requirements (free preview — first 5) */}
      {reqs.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Requirements</h5>
          <ul className="space-y-1.5">
            {reqs.map((r) => (
              <li key={r.id} className="flex items-start gap-2 text-sm">
                <span className={'mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ' + (r.mandatory ? 'bg-emerald-500' : 'bg-amber-400')} />
                <span className="text-muted-foreground">{r.requirement}</span>
              </li>
            ))}
          </ul>
          {/* Pro: Full Document Checklist */}
          {country.requirements && country.requirements.length > 5 && (
            <FullDocumentChecklist requirements={country.requirements} countryName={country.name} />
          )}
        </div>
      )}

      {/* Cost Breakdown */}
      {country.costProfile && (
        <div>
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cost Breakdown</h5>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <p className="text-xs text-muted-foreground">Visa Fee</p>
              <p className="font-semibold text-sm">${country.costProfile.visaFeeUSD}</p>
              <p className="text-[10px] text-muted-foreground">≈ PKR {(country.costProfile.visaFeeUSD * 278.5).toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2 text-center">
              <p className="text-xs text-muted-foreground">Service Fee</p>
              <p className="font-semibold text-sm">${country.costProfile.serviceFeeUSD}</p>
              <p className="text-[10px] text-muted-foreground">≈ PKR {(country.costProfile.serviceFeeUSD * 278.5).toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 p-2 text-center">
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Monthly Total</p>
              <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">${country.costProfile.totalMonthlyUSD}</p>
              <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70">≈ PKR {(country.costProfile.totalMonthlyUSD * 278.5).toLocaleString()}/mo</p>
            </div>
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-2 text-center">
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">One-time Total</p>
              <p className="font-bold text-sm text-amber-700 dark:text-amber-400">${(country.costProfile.visaFeeUSD + country.costProfile.serviceFeeUSD)}</p>
              <p className="text-[10px] text-amber-600/70 dark:text-amber-500/70">≈ PKR {((country.costProfile.visaFeeUSD + country.costProfile.serviceFeeUSD) * 278.5).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg bg-muted/30 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Rent</p>
              <p className="text-xs font-medium">${country.costProfile.monthlyRentUSD}</p>
              <p className="text-[9px] text-muted-foreground/70">≈ PKR {(country.costProfile.monthlyRentUSD * 278.5).toLocaleString()}/mo</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Food</p>
              <p className="text-xs font-medium">${country.costProfile.monthlyFoodUSD}</p>
              <p className="text-[9px] text-muted-foreground/70">≈ PKR {(country.costProfile.monthlyFoodUSD * 278.5).toLocaleString()}/mo</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Transport</p>
              <p className="text-xs font-medium">${country.costProfile.monthlyTransportUSD}</p>
              <p className="text-[9px] text-muted-foreground/70">≈ PKR {(country.costProfile.monthlyTransportUSD * 278.5).toLocaleString()}/mo</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Insurance</p>
              <p className="text-xs font-medium">${country.costProfile.healthInsuranceUSD}</p>
              <p className="text-[9px] text-muted-foreground/70">≈ PKR {(country.costProfile.healthInsuranceUSD * 278.5).toLocaleString()}/mo</p>
            </div>
          </div>
          <TripCalculator costProfile={country.costProfile} />
        </div>
      )}

      {/* Travel Months */}
      {travelMonths.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Best Travel Months</h5>
          <div className="flex flex-wrap gap-1.5">
            {MONTH_NAMES.map((m, i) => {
              const isActive = travelMonths.some((tm: string) => tm.toLowerCase().startsWith(m.toLowerCase()));
              const monthCls = isActive ? 'text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground';
              return (
                <span key={m} className={monthCls}>{m}</span>
              );
            })}
          </div>
        </div>
      )}

      {/* Visa Types */}
      {visaTypes.length > 0 && (
        <div>
          <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Available Visa Types</h5>
          <div className="space-y-2">
            {visaTypes.map((vt2) => {
              const isTourist = isTouristVisa(vt2.type);
              const showFull = isTourist || isPro;
              const catLabel = getVisaCategoryLabel(vt2.type);
              const catColor = getVisaCategoryColor(vt2.type);

              // Processing time
              const pMin = vt2.processingDaysMin || vt2.costProfile?.processingDaysMin;
              const pMax = vt2.processingDaysMax || vt2.costProfile?.processingDaysMax;
              const hasProcessing = (pMin && pMin > 0) || (pMax && pMax > 0);
              const processingText = hasProcessing
                ? (pMin && pMax && pMin !== pMax
                    ? `${pMin}–${pMax} days`
                    : `${pMin || pMax} days`)
                : '';

              // Fee
              const feeUSD = vt2.costProfile?.visaFeeUSD;
              const feeText = feeUSD ? `$${feeUSD} ≈ PKR ${(feeUSD * 278.5).toLocaleString()}` : '';

              // Verified
              const verifiedTill = vt2.verifiedTill || vt2.costProfile?.verifiedTill;

              const borderColor = CATEGORY_BORDER_COLORS[catLabel] || '#94a3b8';

              return (
                <div
                  key={vt2.id}
                  className={
                    'rounded-lg border p-2.5 border-l-2' +
                    (!showFull ? ' cursor-pointer hover:bg-muted/50 transition-colors' : '')
                  }
                  style={{ borderLeftColor: borderColor }}
                  onClick={!showFull ? () => window.dispatchEvent(new CustomEvent('open-pricing')) : undefined}
                >
                  {/* Row 1: Name + Duration + Category */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-xs">{vt2.type}</span>
                    {vt2.maxDuration && (
                      <span className="text-[10px] text-muted-foreground">({vt2.maxDuration})</span>
                    )}
                    <span className={
                      'text-[9px] px-1.5 py-0 rounded-full font-medium ' +
                      catColor
                    }>
                      {catLabel}
                    </span>
                    {!showFull && (
                      <>
                        <Lock className="w-3 h-3 text-muted-foreground ml-auto" />
                        <span className="flex items-center gap-0.5 text-[9px] text-amber-600 dark:text-amber-400 font-medium ml-1">
                          <Crown className="w-3 h-3" /> Pro
                        </span>
                      </>
                    )}
                  </div>

                  {showFull ? (
                    <>
                      {/* Row 2: Description */}
                      {vt2.description && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                          {vt2.description.length > 100
                            ? vt2.description.slice(0, 100) + '…'
                            : vt2.description}
                        </p>
                      )}
                      {/* Row 3: Processing + Fee */}
                      {(hasProcessing || feeText) && (
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                          {hasProcessing && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {processingText}
                            </span>
                          )}
                          {feeText && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-2.5 h-2.5" />
                              {feeText}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Verified till */}
                      {verifiedTill && (
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Verified till {verifiedTill}
                        </p>
                      )}
                    </>
                  ) : (
                    /* Locked teaser */
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Detailed requirements, fees & processing info
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {/* Pro upgrade banner */}
          {visaTypes.some((vt2) => !isTouristVisa(vt2.type)) && !isPro && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-2.5">
              <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-xs text-amber-800 dark:text-amber-300 font-medium flex-1">
                Unlock all visa details
              </span>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-pricing'))}
                className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800/50 px-2 py-1 rounded-md hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
              >
                Upgrade to Pro
              </button>
            </div>
          )}
        </div>
      )}

      {/* Safety Info */}
      {(country.safetyRating > 0 || country.safetySummary) && (
        <SafetyInfo rating={country.safetyRating} summary={country.safetySummary} />
      )}

      {/* Weather/Climate */}
      <WeatherInfo avgTemp={country.avgTempC} monthlyTemps={parsedMonthlyTemps} />

      {/* Travel Essentials Grid */}
      <TravelEssentials info={travel} countryName={country.name} />

      {/* Emergency & Health (collapsible) */}
      <EmergencyHealth info={travel} />

      {/* Embassy Contact (only for embassy-required countries) */}
      {isEmbassyRequired && <EmbassyContact countryCode={country.code} />}

      {/* Affiliate: Prepare Your Trip (always last) */}
      <AffiliateResources country={country} />
    </div>
  );
}

// ============================================================
// Full Document Checklist (Pro Feature)
// ============================================================
function FullDocumentChecklist({
  requirements,
  countryName,
}: {
  requirements: { id: string; category: string; requirement: string; mandatory: boolean; description?: string }[];
  countryName: string;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const isPro = isAuthenticated && user?.role === 'pro' && user.proExpiresAt && new Date(user.proExpiresAt) > new Date();

  // Group requirements by category
  const grouped = useMemo(() => {
    const map = new Map<string, typeof requirements>();
    for (const r of requirements) {
      const cat = r.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(r);
    }
    return Array.from(map.entries());
  }, [requirements]);

  const mandatoryCount = requirements.filter(r => r.mandatory).length;
  const optionalCount = requirements.length - mandatoryCount;

  return (
    <div className="mt-3 border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isPro ? (
            <ClipboardList className="w-4 h-4 text-amber-600" />
          ) : (
            <Lock className="w-4 h-4 text-amber-600" />
          )}
          <div className="text-left">
            <span className="text-sm font-semibold">Full Document Checklist</span>
            <span className="text-[11px] text-muted-foreground ml-2">
              {'(' + mandatoryCount + ' required' + (optionalCount > 0 ? ', ' + optionalCount + ' optional' : '') + ' items)'}
            </span>
          </div>
        </div>
        {isPro ? (
          <ChevronDown className={'w-4 h-4 text-muted-foreground transition-transform ' + (expanded ? 'rotate-180' : '')} />
        ) : (
          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <Crown className="w-3 h-3" /> Pro
          </span>
        )}
      </button>

      {expanded && isPro && (
        <div className="p-3 space-y-4 max-h-80 overflow-y-auto">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <h6 className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> {category}
              </h6>
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    {item.mandatory ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    ) : (
                      <span className="mt-1.5 w-2 h-2 rounded-full border border-amber-400 shrink-0" />
                    )}
                    <div>
                      <span className={item.mandatory ? 'text-foreground' : 'text-muted-foreground'}>{item.requirement}</span>
                      {item.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {expanded && !isPro && (
        <div className="p-4 text-center">
          <Crown className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-medium mb-1">Pro Feature</p>
          <p className="text-xs text-muted-foreground mb-3">
            Get the complete document checklist with {mandatoryCount} required items organized by category, with descriptions.
          </p>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5" onClick={() => window.dispatchEvent(new CustomEvent('open-pricing'))}>
            <Crown className="w-3.5 h-3.5" /> Upgrade to Pro
          </Button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Download Country Guide (Pro Feature)
// ============================================================
function DownloadCountryGuide({ country }: { country: CountryData }) {
  const { user, isAuthenticated } = useAuthStore();
  const isPro = isAuthenticated && user?.role === 'pro' && user.proExpiresAt && new Date(user.proExpiresAt) > new Date();
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
        body: JSON.stringify({ code: country.code }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate PDF');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pakvisa-${country.name.replace(/\s+/g, '-').toLowerCase()}-guide.pdf`;
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
    <div className="rounded-lg border border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPro ? (
            <FileText className="w-4 h-4 text-emerald-600" />
          ) : (
            <Lock className="w-4 h-4 text-emerald-600" />
          )}
          <div className="text-left">
            <span className="text-sm font-semibold">Download Country Guide (PDF)</span>
            <p className="text-[11px] text-muted-foreground">Get a printable visa guide for {country.name}</p>
          </div>
        </div>
        <Button
          size="sm"
          variant={isPro ? 'default' : 'outline'}
          className={isPro ? 'bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5' : 'gap-1.5 border-amber-300 dark:border-amber-700'}
          onClick={handleDownload}
          disabled={generating}
        >
          {generating ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPro ? (
            <><Download className="w-3.5 h-3.5" /> Download</>
          ) : (
            <><Crown className="w-3.5 h-3.5 text-amber-500" /> Pro Only</>
          )}
        </Button>
      </div>
    </div>
  );
}
