'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, BarChart3, Search, ChevronRight, Star, Clock,
  DollarSign, Shield, Calendar, Heart,
  Send, Bot, User, Plus, Minus, ArrowUpDown,
  CheckCircle2, AlertTriangle, XCircle, Info,
  Globe, Plane, Building, GraduationCap, Briefcase, Landmark, Map,
  CreditCard, Home, Users, Lock, Lightbulb,
  RotateCcw, ToggleLeft, ToggleRight, Zap,
  TrendingUp, TrendingDown, ArrowRight, Printer, Share2,
  Eye, ClipboardList, Play, Save, Upload, ChevronUp, Compass,
  Gavel, BadgePercent, Timer, Wallet, Trophy, Phone, Mail,
  Keyboard, HelpCircle, Sparkles, ChevronDown, History, Target, SearchX,
  LayoutGrid, List, RefreshCw, Passports, Flame, Languages, CircleDollarSign, CircleCheckBig, FileWarning,
  Bell, Bookmark, AlertCircle, CalendarClock, Luggage, FileCheck2,
  Check, CalendarDays, AlarmClock, PackageOpen, PlaneTakeoff, UtensilsCrossed, MoreHorizontal, Calculator,
  Copy, SlidersHorizontal, BookOpen, PieChart as PieChartIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { CountryData, UserProfileData, ScoreBreakdown, ChatMessage, ChecklistItem } from '@/lib/types';
import { EXCHANGE_RATES, FLAG_ISO_MAP, getFlagUrl, getRegion } from '../constants';
import { FlagImage, BudgetPieChart } from '../shared-components-1';
import { ScoringHistoryPanel, TravelCostCalculator } from '../shared-components-2';
import { TravelChecklistGenerator } from '../shared-components-4';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const CHART_COLORS = ['#f59e0b', '#f97316', '#fbbf24', '#d97706', '#ea580c', '#c2410c', '#78716c'];

function BudgetDonutChart({ budgetResult, budgetTripDays, budgetViewMode, budgetChartActiveIndex, setBudgetChartActiveIndex, formatNum }: {
  budgetResult: { visaFee: number; flightEst: number; accommodation: number; food: number; transport: number; insurance: number; misc: number; totalUSD: number; };
  budgetTripDays: number;
  budgetViewMode: 'total' | 'daily';
  budgetChartActiveIndex: number | null;
  setBudgetChartActiveIndex: (i: number | null) => void;
  formatNum: (n: number) => string;
}) {
  const divisor = budgetViewMode === 'daily' ? budgetTripDays : 1;
  const chartItems = [
    { name: 'Visa Fee', value: Math.round(budgetResult.visaFee / divisor), color: CHART_COLORS[0] },
    { name: 'Flights', value: Math.round(budgetResult.flightEst / divisor), color: CHART_COLORS[1] },
    { name: 'Accommodation', value: Math.round(budgetResult.accommodation / divisor), color: CHART_COLORS[2] },
    { name: 'Food', value: Math.round(budgetResult.food / divisor), color: CHART_COLORS[3] },
    { name: 'Transport', value: Math.round(budgetResult.transport / divisor), color: CHART_COLORS[4] },
    { name: 'Insurance', value: Math.round(budgetResult.insurance / divisor), color: CHART_COLORS[5] },
    { name: 'Misc', value: Math.round(budgetResult.misc / divisor), color: CHART_COLORS[6] },
  ].filter(d => d.value > 0);
  const chartIcons = [FileText, PlaneTakeoff, Home, UtensilsCrossed, Map, Shield, MoreHorizontal];
  const chartNames = ['Visa Fee', 'Flights', 'Accommodation', 'Food', 'Transport', 'Insurance', 'Misc'];
  const totalVal = chartItems.reduce((s, d) => s + d.value, 0);

  const StepIcon = ({ icon: StepIconProp, className }: { icon: React.ElementType; className?: string }) => React.createElement(StepIconProp, { className });

  return (
    <div className="p-4 rounded-lg border bg-muted/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PieChartIcon className="w-4 h-4 text-amber-500" />
          <p className="text-xs font-semibold">Budget Breakdown</p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <button
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${budgetViewMode === 'total' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'text-muted-foreground'}`}
            onClick={() => setBudgetViewMode('total')}
          >Total</button>
          <button
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${budgetViewMode === 'daily' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'text-muted-foreground'}`}
            onClick={() => setBudgetViewMode('daily')}
          >Daily</button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartItems}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={58}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, index) => setBudgetChartActiveIndex(index)}
                onMouseLeave={() => setBudgetChartActiveIndex(null)}
                stroke="none"
              >
                {chartItems.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={budgetChartActiveIndex === null || budgetChartActiveIndex === index ? 1 : 0.4}
                    stroke="none"
                  />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', fontSize: '11px', padding: '6px 10px' }}
                formatter={(value: number) => [`$${formatNum(value)}`, undefined]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1.5">
          {chartItems.map((item, idx) => {
            const pct = Math.round((item.value / totalVal) * 100);
            return (
              <div
                key={item.name}
                className={`flex items-center gap-2 text-[11px] px-1.5 py-0.5 rounded transition-all ${budgetChartActiveIndex === idx ? 'bg-muted font-semibold' : ''}`}
                onMouseEnter={() => setBudgetChartActiveIndex(idx)}
                onMouseLeave={() => setBudgetChartActiveIndex(null)}
              >
                <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                <StepIcon icon={chartIcons[idx]} className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate">{chartNames[idx]}</span>
                <span className="font-medium tabular-nums">${formatNum(item.value)}</span>
                <span className="text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ToolsTab() {
  // --- Currency Converter State ---
  const [convertFrom, setConvertFrom] = useState('PKR');
  const [convertTo, setConvertTo] = useState('USD');
  const [convertAmount, setConvertAmount] = useState('10000');
  const [convertResult, setConvertResult] = useState<{ result: number; rate: number } | null>(null);
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState('');
  const [ratesInfo, setRatesInfo] = useState<Record<string, number>>({});
  const [currencySearch, setCurrencySearch] = useState('');
  const [showCurrencySearch, setShowCurrencySearch] = useState<'from' | 'to' | null>(null);
  const [multiCompareResults, setMultiCompareResults] = useState<Record<string, number>>({});
  const [showMultiCompare, setShowMultiCompare] = useState(false);
  const [swapRotation, setSwapRotation] = useState(0);
  const { conversionHistory, addConversion, clearConversionHistory, selectedCountry, userProfile } = useAppStore();

  // --- Budget Calculator State ---
  const [budgetCountry, setBudgetCountry] = useState('');
  const [budgetTripDays, setBudgetTripDays] = useState(7);
  const [budgetTravelers, setBudgetTravelers] = useState(1);
  const [budgetStyle, setBudgetStyle] = useState<'budget' | 'standard' | 'luxury'>('standard');
  const [budgetSeason, setBudgetSeason] = useState<'peak' | 'shoulder' | 'offpeak'>('shoulder');
  const [budgetResult, setBudgetResult] = useState<{
    visaFee: number; flightEst: number; accommodation: number;
    food: number; transport: number; insurance: number; misc: number;
    totalPKR: number; totalUSD: number;
    perDayUSD: number; perPersonUSD: number;
  } | null>(null);
  const [budgetCustomize, setBudgetCustomize] = useState(false);
  const [customMultiplier, setCustomMultiplier] = useState<Record<string, number>>({
    accommodation: 1, food: 1, transport: 1, insurance: 1,
  });
  const [budgetViewMode, setBudgetViewMode] = useState<'total' | 'daily'>('total');
  const [budgetChartActiveIndex, setBudgetChartActiveIndex] = useState<number | null>(null);

  // Currency list for converter
  const currencies = useMemo(() => [
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', flag: '🇶🇦' },
    { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', flag: '🇴🇲' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: 'BD', flag: '🇧🇭' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD', flag: '🇰🇼' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', flag: '🇦🇿' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
    { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', flag: '🇲🇻' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬' },
    { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', flag: '🇧🇳' },
  ], []);

  const filteredCurrencies = useMemo(() => {
    if (!currencySearch) return currencies;
    const q = currencySearch.toLowerCase();
    return currencies.filter(c =>
      c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [currencySearch, currencies]);

  // Fetch countries for budget calculator
  const [allCountries, setAllCountries] = useState<CountryData[]>([]);
  useEffect(() => {
    fetch('/api/countries').then(r => r.json()).then(data => {
      if (data.data) setAllCountries(data.data);
    }).catch(() => {});
  }, []);

  // Perform currency conversion
  const doConvert = useCallback(async () => {
    if (!convertAmount || parseFloat(convertAmount) <= 0) return;
    setConvertLoading(true);
    setConvertError('');
    try {
      const resp = await fetch(`/api/currency?from=${convertFrom}&to=${convertTo}&amount=${convertAmount}`);
      const data = await resp.json();
      if (data.success) {
        setConvertResult(data.data);
        addConversion({ from: convertFrom, to: convertTo, amount: parseFloat(convertAmount), result: data.data.result });
      } else {
        setConvertError('Failed to fetch exchange rate');
      }
    } catch {
      setConvertError('Network error');
    } finally {
      setConvertLoading(false);
    }
  }, [convertFrom, convertTo, convertAmount]);

  // Auto-convert on change
  useEffect(() => {
    const timeout = setTimeout(doConvert, 300);
    return () => clearTimeout(timeout);
  }, [doConvert]);

  // Fetch all PKR rates for the rate table
  useEffect(() => {
    Promise.all(
      currencies.filter(c => c.code !== 'PKR').map(async (c) => {
        try {
          const resp = await fetch(`/api/currency?from=PKR&to=${c.code}&amount=1`);
          const data = await resp.json();
          if (data.success) {
            setRatesInfo(prev => ({ ...prev, [c.code]: data.data.rate }));
          }
        } catch { /* skip */ }
      })
    );
  }, []);

  // Multi-currency comparison
  const doMultiCompare = useCallback(async () => {
    if (!convertAmount || parseFloat(convertAmount) <= 0) return;
    const topCurrencies = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'MYR', 'THB', 'TRY', 'CNY', 'JPY', 'SGD', 'KRW'];
    const results: Record<string, number> = {};
    await Promise.all(
      topCurrencies.map(async (code) => {
        try {
          const resp = await fetch(`/api/currency?from=${convertFrom}&to=${code}&amount=${convertAmount}`);
          const data = await resp.json();
          if (data.success) results[code] = data.data.result;
        } catch { /* skip */ }
      })
    );
    setMultiCompareResults(results);
  }, [convertFrom, convertAmount]);

  // Toggle multi-compare
  useEffect(() => {
    if (showMultiCompare) doMultiCompare();
  }, [showMultiCompare, doMultiCompare]);

  // Copy conversion to clipboard
  const copyConversion = () => {
    if (!convertResult) return;
    const text = `${formatNum(parseFloat(convertAmount))} ${convertFrom} = ${formatNum(convertResult.result)} ${convertTo} (Rate: 1 ${convertFrom} = ${formatNum(convertResult.rate)} ${convertTo})`;
    navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard!')).catch(() => {});
  };

  // Calculate budget
  const calculateBudget = useCallback(() => {
    const country = allCountries.find(c => c.name === budgetCountry);
    if (!country) return;

    const pkrRate = EXCHANGE_RATES.USD || 278.5; // use same rate as currency converter

    // Travel style multipliers
    const styleMultipliers = { budget: 0.6, standard: 1, luxury: 2 };
    const style = styleMultipliers[budgetStyle];

    // Season multipliers
    const seasonMultipliers = { peak: 1.3, shoulder: 1, offpeak: 0.75 };
    const season = seasonMultipliers[budgetSeason];

    // Visa fee from DB (not affected by travel style)
    const visaFeeUSD = country.costProfile?.visaFeeUSD || 50;
    const serviceFeeUSD = country.costProfile?.serviceFeeUSD || 0;

    // Estimated flight cost from Pakistan (based on region)
    const flightEstimates: Record<string, number> = {
      'Asia': 400, 'Middle East': 300, 'Europe': 800, 'Africa': 600,
      'Americas': 900, 'Oceania': 1000, 'Europe/Asia': 600,
    };
    const region = getRegion(country);
    const flightUSD = (flightEstimates[region] || 500) * season;

    // Accommodation (from DB monthlyRentUSD, convert to daily)
    const dailyRentUSD = (country.costProfile?.monthlyRentUSD || 500) / 30 * style * season;

    // Food (from DB monthlyFoodUSD, convert to daily)
    const dailyFoodUSD = (country.costProfile?.monthlyFoodUSD || 200) / 30 * style * season;

    // Transport (from DB monthlyTransportUSD, convert to daily)
    const dailyTransportUSD = (country.costProfile?.monthlyTransportUSD || 100) / 30 * style * season;

    // Insurance (slightly varies by style)
    const dailyInsuranceUSD = 3 * (budgetStyle === 'luxury' ? 1.5 : budgetStyle === 'budget' ? 0.7 : 1);

    // Apply custom multipliers
    const adjRentUSD = dailyRentUSD * (customMultiplier.accommodation || 1);
    const adjFoodUSD = dailyFoodUSD * (customMultiplier.food || 1);
    const adjTransportUSD = dailyTransportUSD * (customMultiplier.transport || 1);
    const adjInsuranceUSD = dailyInsuranceUSD * (customMultiplier.insurance || 1);

    // Misc (10% buffer)
    const dailyTotal = adjRentUSD + adjFoodUSD + adjTransportUSD + adjInsuranceUSD;
    const miscUSD = dailyTotal * budgetTripDays * 0.1;

    const totalUSD = (visaFeeUSD + serviceFeeUSD) * budgetTravelers + (flightUSD * budgetTravelers) + (dailyTotal * budgetTripDays * budgetTravelers) + miscUSD;

    setBudgetResult({
      visaFee: (visaFeeUSD + serviceFeeUSD) * budgetTravelers,
      flightEst: flightUSD * budgetTravelers,
      accommodation: adjRentUSD * budgetTripDays * budgetTravelers,
      food: adjFoodUSD * budgetTripDays * budgetTravelers,
      transport: adjTransportUSD * budgetTripDays * budgetTravelers,
      insurance: adjInsuranceUSD * budgetTripDays * budgetTravelers,
      misc: miscUSD,
      totalUSD: Math.round(totalUSD),
      totalPKR: Math.round(totalUSD * pkrRate),
      perDayUSD: Math.round(totalUSD / budgetTripDays),
      perPersonUSD: Math.round(totalUSD / budgetTravelers),
    });
  }, [budgetCountry, budgetTripDays, budgetTravelers, allCountries, budgetStyle, budgetSeason, customMultiplier]);

  // Get budget tips
  const getBudgetTips = useCallback((countryName: string, result: typeof budgetResult) => {
    if (!result || !countryName) return [];
    const tips: string[] = [];
    const largestExpense = [
      { name: 'flights', val: result.flightEst },
      { name: 'accommodation', val: result.accommodation },
      { name: 'food', val: result.food },
      { name: 'visa', val: result.visaFee },
    ].sort((a, b) => b.val - a.val)[0];
    if (largestExpense.name === 'flights') tips.push(`✈️ Flights are your biggest expense (${Math.round(result.flightEst / result.totalUSD * 100)}%). Book 2-3 months early for best fares from PIA, Emirates, or Turkish Airlines.`);
    if (largestExpense.name === 'accommodation') tips.push(`🏨 Accommodation is your biggest expense (${Math.round(result.accommodation / result.totalUSD * 100)}%). Consider hostels, Airbnb, or booking 30+ days in advance for discounts.`);
    if (largestExpense.name === 'food') tips.push(`🍽️ Food costs are significant (${Math.round(result.food / result.totalUSD * 100)}%). Try local street food and markets — they're often 50-70% cheaper than restaurants.`);
    if (result.perPersonUSD > 3000) tips.push('💡 Consider a shorter trip or fewer travelers to reduce costs.');
    if (budgetTripDays > 14) tips.push(`📅 For a ${budgetTripDays}-day trip, consider weekly/monthly accommodation discounts (Airbnb, local guesthouses).`);
    if (budgetTravelers > 2) tips.push(`👥 With ${budgetTravelers} travelers, group discounts on flights and tours may be available — ask your travel agent.`);
    if (budgetSeason === 'peak') tips.push('🔴 Peak season prices are ~30% higher. Consider traveling in shoulder season for better deals.');
    if (budgetStyle === 'budget') tips.push('🎒 Budget mode selected. You can further save by using public transport and eating at local restaurants.');
    if (budgetStyle === 'luxury') tips.push('💎 Luxury mode selected. Don\'t forget to budget for shopping, spa, and premium experiences.');
    return tips;
  }, [budgetTripDays, budgetTravelers, budgetSeason, budgetStyle]);

  // Copy budget summary
  const copyBudgetSummary = () => {
    if (!budgetResult) return;
    const country = allCountries.find(c => c.name === budgetCountry);
    const text = `Travel Budget Estimate — ${budgetCountry}\n` +
      `Duration: ${budgetTripDays} days | Travelers: ${budgetTravelers} | Style: ${budgetStyle}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Visa & Processing: $${formatNum(budgetResult.visaFee)}\n` +
      `Flights: $${formatNum(budgetResult.flightEst)}\n` +
      `Accommodation: $${formatNum(budgetResult.accommodation)}\n` +
      `Food & Dining: $${formatNum(budgetResult.food)}\n` +
      `Transport: $${formatNum(budgetResult.transport)}\n` +
      `Insurance: $${formatNum(budgetResult.insurance)}\n` +
      `Misc (10%): $${formatNum(budgetResult.misc)}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `TOTAL: $${formatNum(budgetResult.totalUSD)} (₨ ${formatNum(budgetResult.totalPKR)})\n` +
      `Per day: $${formatNum(budgetResult.perDayUSD)} | Per person: $${formatNum(budgetResult.perPersonUSD)}`;
    navigator.clipboard.writeText(text).then(() => toast.success('Budget summary copied!')).catch(() => {});
  };

  // Popular currency pairs
  const popularPairs = [
    { from: 'PKR', to: 'USD', label: 'PKR → USD' },
    { from: 'PKR', to: 'AED', label: 'PKR → AED' },
    { from: 'PKR', to: 'SAR', label: 'PKR → SAR' },
    { from: 'PKR', to: 'GBP', label: 'PKR → GBP' },
    { from: 'PKR', to: 'EUR', label: 'PKR → EUR' },
    { from: 'PKR', to: 'MYR', label: 'PKR → MYR' },
    { from: 'PKR', to: 'THB', label: 'PKR → THB' },
    { from: 'PKR', to: 'TRY', label: 'PKR → TRY' },
  ];

  // Amount presets
  const amountPresets = [
    { label: '1,000', value: '1000' },
    { label: '5,000', value: '5000' },
    { label: '10,000', value: '10000' },
    { label: '50,000', value: '50000' },
    { label: '100,000', value: '100000' },
    { label: '500,000', value: '500000' },
  ];

  const formatNum = (n: number) => {
    if (n < 0.01) return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    if (n < 1) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };
  const getCurrencySymbol = (code: string) => currencies.find(c => c.code === code)?.symbol || code;
  const getCurrencyFlag = (code: string) => currencies.find(c => c.code === code)?.flag || '🌐';
  const getCurrencyName = (code: string) => currencies.find(c => c.code === code)?.name || code;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
          <Compass className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Travel Tools</h2>
          <p className="text-xs text-muted-foreground">Essential tools for Pakistani travelers — convert currencies, plan budgets</p>
        </div>
      </div>

      {/* Currency Converter */}
      <section className="glass-section p-4 md:p-6 rounded-xl card-interactive">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-amber-500" />
            Currency Converter
            <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Live Rates</Badge>
          </h3>
          <div className="flex gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setShowMultiCompare(!showMultiCompare)}>
                    <BarChart3 className="w-3.5 h-3.5 mr-1" /> Compare
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Compare amount across multiple currencies</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {convertResult && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={copyConversion}>
                      <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy conversion result</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Convert between Pakistani Rupee and 26+ world currencies with live exchange rates.</p>

        {/* Quick Pairs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {popularPairs.map(pair => (
            <button
              key={pair.label}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                convertFrom === pair.from && convertTo === pair.to
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => { setConvertFrom(pair.from); setConvertTo(pair.to); }}
            >
              {pair.label}
            </button>
          ))}
        </div>

        {/* Amount Presets */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Quick amounts:</span>
          <div className="flex gap-1.5">
            {amountPresets.map(p => (
              <button
                key={p.value}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  convertAmount === p.value
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                onClick={() => setConvertAmount(p.value)}
              >
                {getCurrencySymbol(convertFrom)}{p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Converter UI */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          {/* From */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">From</Label>
            <div className="flex gap-2">
              <Select value={convertFrom} onValueChange={setConvertFrom}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {currencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={convertAmount}
                onChange={e => setConvertAmount(e.target.value)}
                placeholder="Amount"
                className="flex-1 text-lg font-semibold input-amber"
                min="0"
              />
            </div>
          </div>

          {/* Swap Button (desktop) */}
          <div className="hidden md:flex justify-center">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full mb-0.5"
              onClick={() => { const tmp = convertFrom; setConvertFrom(convertTo); setConvertTo(tmp); setSwapRotation(prev => prev + 180); }}
            >
              <motion.div
                animate={{ rotate: swapRotation }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <ArrowUpDown className="w-4 h-4" />
              </motion.div>
            </Button>
          </div>

          {/* To */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">To</Label>
            <div className="flex gap-2">
              <Select value={convertTo} onValueChange={setConvertTo}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {currencies.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1 flex items-center rounded-md border bg-muted/50 px-3 h-9 gap-2">
                <span className={`text-lg font-bold ${convertResult ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {convertResult ? formatNum(convertResult.result) : convertLoading ? '...' : '0.00'}
                </span>
                {convertResult && (
                  <span className="text-xs text-muted-foreground">{getCurrencySymbol(convertTo)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Swap Button */}
        <div className="flex md:hidden justify-center my-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => { const tmp = convertFrom; setConvertFrom(convertTo); setConvertTo(tmp); setSwapRotation(prev => prev + 180); }}
          >
            <motion.div
              animate={{ rotate: swapRotation }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="flex items-center"
            >
              <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
            </motion.div>
            Swap
          </Button>
        </div>

        {/* Rate Info */}
        {convertResult && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 stat-card-compact p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                1 {getCurrencyFlag(convertFrom)} {convertFrom} = {formatNum(convertResult.rate)} {getCurrencyFlag(convertTo)} {convertTo}
              </p>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {formatNum(parseFloat(convertAmount))} {convertFrom} = <span className="font-bold text-base">{formatNum(convertResult.result)}</span> {convertTo}
              </p>
            </div>
          </motion.div>
        )}

        {convertError && (
          <p className="text-xs text-red-500 mt-2">{convertError}</p>
        )}

        {/* Multi-Currency Comparison Panel */}
        {showMultiCompare && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-4 rounded-lg border bg-muted/20"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground">
                {formatNum(parseFloat(convertAmount))} {convertFrom} in multiple currencies:
              </p>
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={doMultiCompare}>
                <RefreshCw className="w-3 h-3 mr-1" /> Refresh
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Object.entries(multiCompareResults).map(([code, value]) => (
                <div key={code} className="p-2.5 rounded-lg border bg-background text-center hover:shadow-sm transition-all">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <span className="text-base">{getCurrencyFlag(code)}</span>
                    <span className="text-[11px] font-bold text-muted-foreground">{code}</span>
                  </div>
                  <p className="text-sm font-bold">{formatNum(value)}</p>
                  <p className="text-[10px] text-muted-foreground">{getCurrencyName(code)}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Conversion History */}
        {conversionHistory.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <History className="w-3 h-3" /> Recent Conversions
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[10px] px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                onClick={clearConversionHistory}
              >
                <RotateCcw className="w-3 h-3 mr-1" /> Clear History
              </Button>
            </div>
            <div className="rounded-lg border bg-muted/20 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">From</th>
                    <th className="text-left px-3 py-1.5 font-medium text-muted-foreground">To</th>
                    <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Result</th>
                    <th className="text-right px-3 py-1.5 font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {conversionHistory.map((h, i) => (
                    <motion.tr
                      key={h.timestamp + i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b last:border-b-0 hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => { setConvertFrom(h.from); setConvertTo(h.to); setConvertAmount(String(h.amount)); }}
                    >
                      <td className="px-3 py-2 font-medium">
                        {getCurrencyFlag(h.from)} {formatNum(h.amount)} {h.from}
                      </td>
                      <td className="px-3 py-2">
                        <ArrowRight className="w-3 h-3 inline text-muted-foreground mr-1" />
                        {getCurrencyFlag(h.to)} {h.to}
                      </td>
                      <td className="px-3 py-2 text-right font-bold tabular-nums">
                        {formatNum(h.result)}
                      </td>
                      <td className="px-3 py-2 text-right text-muted-foreground">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Rate Reference Table */}
        {Object.keys(ratesInfo).length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold mb-2 text-muted-foreground">Quick Reference — 1 PKR equals:</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
              {currencies.filter(c => c.code !== 'PKR' && ratesInfo[c.code]).map(c => (
                <button
                  key={c.code}
                  className={`p-2 rounded-lg border text-center transition-all hover:shadow-sm ${
                    convertTo === c.code ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' : 'border-border/50 bg-muted/30'
                  }`}
                  onClick={() => { setConvertTo(c.code); }}
                >
                  <div className="text-lg mb-0.5">{c.flag}</div>
                  <div className="text-[10px] font-bold">{c.code}</div>
                  <div className="text-[10px] text-muted-foreground">{ratesInfo[c.code] < 1 ? ratesInfo[c.code].toFixed(4) : ratesInfo[c.code].toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Travel Budget Calculator */}
      <section className="glass-section p-4 md:p-6 rounded-xl card-interactive">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-500" />
            Travel Budget Calculator
            <Badge variant="secondary" className="text-[10px] bg-amber-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">From Pakistan</Badge>
          </h3>
          {budgetResult && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={copyBudgetSummary}>
                    <Copy className="w-3.5 h-3.5 mr-1" /> Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy budget summary to clipboard</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-4">Estimate the total cost of your trip from Pakistan — visa, flights, accommodation, food, transport, and insurance.</p>

        {/* Travel Style & Season */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {/* Travel Style Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Travel Style</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { id: 'budget' as const, label: 'Backpacker', icon: '🎒', desc: 'Hostels & street food', color: 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' },
                { id: 'standard' as const, label: 'Standard', icon: '🏨', desc: 'Hotels & restaurants', color: 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' },
                { id: 'luxury' as const, label: 'Luxury', icon: '💎', desc: '5-star & fine dining', color: 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' },
              ]).map(style => (
                <button
                  key={style.id}
                  className={`p-2.5 rounded-lg border-2 text-center transition-all ${
                    budgetStyle === style.id
                      ? style.color + ' shadow-sm'
                      : 'border-transparent bg-muted/30 hover:bg-muted/50'
                  }`}
                  onClick={() => setBudgetStyle(style.id)}
                >
                  <div className="text-lg mb-0.5">{style.icon}</div>
                  <div className="text-[11px] font-bold">{style.label}</div>
                  <div className="text-[9px] text-muted-foreground leading-tight">{style.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Season Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Travel Season</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { id: 'offpeak' as const, label: 'Off-Peak', icon: '🌤️', desc: 'Best prices', color: 'border-amber-300 bg-amber-50 dark:bg-amber-900/20' },
                { id: 'shoulder' as const, label: 'Shoulder', icon: '⛅', desc: 'Balanced', color: 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' },
                { id: 'peak' as const, label: 'Peak', icon: '🔥', desc: 'Highest prices', color: 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' },
              ]).map(s => (
                <button
                  key={s.id}
                  className={`p-2.5 rounded-lg border-2 text-center transition-all ${
                    budgetSeason === s.id
                      ? s.color + ' shadow-sm'
                      : 'border-transparent bg-muted/30 hover:bg-muted/50'
                  }`}
                  onClick={() => setBudgetSeason(s.id)}
                >
                  <div className="text-lg mb-0.5">{s.icon}</div>
                  <div className="text-[11px] font-bold">{s.label}</div>
                  <div className="text-[9px] text-muted-foreground leading-tight">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Country Select */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Destination Country</Label>
            <Select value={budgetCountry} onValueChange={setBudgetCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select a country..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {allCountries.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.flagEmoji} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trip Duration */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Trip Duration (days)</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[budgetTripDays]}
                onValueChange={([v]) => setBudgetTripDays(v)}
                min={1}
                max={90}
                step={1}
                className="flex-1 slider-amber"
              />
              <span className="text-sm font-bold w-12 text-right">{budgetTripDays}d</span>
            </div>
            <div className="flex gap-1.5">
              {[3, 7, 14, 30].map(d => (
                <button
                  key={d}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    budgetTripDays === d
                      ? 'bg-amber-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => setBudgetTripDays(d)}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Travelers */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Number of Travelers</Label>
            <div className="flex items-center gap-3">
              <Slider
                value={[budgetTravelers]}
                onValueChange={([v]) => setBudgetTravelers(v)}
                min={1}
                max={10}
                step={1}
                className="flex-1 slider-amber"
              />
              <span className="text-sm font-bold w-8 text-right">{budgetTravelers}</span>
            </div>
          </div>
        </div>

        {/* Customize Toggle */}
        <div className="flex items-center justify-between mb-3 p-2.5 rounded-lg bg-muted/30 border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium">Customize Cost Estimates</p>
              <p className="text-[10px] text-muted-foreground">Adjust individual expense categories</p>
            </div>
          </div>
          <Switch checked={budgetCustomize} onCheckedChange={setBudgetCustomize} />
        </div>

        {/* Custom Sliders */}
        {budgetCustomize && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20"
          >
            {([
              { key: 'accommodation', label: 'Accommodation', icon: Home, color: 'text-amber-500' },
              { key: 'food', label: 'Food & Dining', icon: UtensilsCrossed, color: 'text-orange-500' },
              { key: 'transport', label: 'Transport', icon: MapPin, color: 'text-amber-500' },
              { key: 'insurance', label: 'Insurance', icon: Shield, color: 'text-amber-500' },
            ] as const).map(item => (
              <div key={item.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span className="text-[11px] font-medium">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-bold">{customMultiplier[item.key] ? Math.round(customMultiplier[item.key] * 100) : 100}%</span>
                </div>
                <Slider
                  value={[customMultiplier[item.key] || 1]}
                  onValueChange={([v]) => setCustomMultiplier(prev => ({ ...prev, [item.key]: v }))}
                  min={0.3}
                  max={3}
                  step={0.1}
                  className="w-full slider-amber"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>30%</span>
                  <span className="font-medium text-foreground">100% (Standard)</span>
                  <span>300%</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        <Button
          onClick={calculateBudget}
          disabled={!budgetCountry}
          className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700"
        >
          <Calculator className="w-4 h-4 mr-2" />
          Calculate Trip Budget
        </Button>

        {/* Budget Result */}
        {budgetResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 space-y-4"
          >
            {/* Total Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white p-5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative text-center">
                <p className="text-xs opacity-80 mb-1">Estimated Total Trip Cost</p>
                <p className="text-3xl font-bold">₨ {formatNum(budgetResult.totalPKR)}</p>
                <p className="text-base opacity-90 mt-0.5">≈ ${formatNum(budgetResult.totalUSD)} USD</p>
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div className="text-center">
                    <p className="text-[10px] opacity-60">Per Day</p>
                    <p className="text-sm font-bold">${formatNum(budgetResult.perDayUSD)}</p>
                  </div>
                  <div className="w-px h-6 bg-white/30" />
                  <div className="text-center">
                    <p className="text-[10px] opacity-60">Per Person</p>
                    <p className="text-sm font-bold">${formatNum(budgetResult.perPersonUSD)}</p>
                  </div>
                </div>
                <p className="text-[10px] opacity-60 mt-2">
                  {budgetTravelers} traveler{budgetTravelers > 1 ? 's' : ''} · {budgetTripDays} days · {budgetCountry} · {budgetStyle === 'budget' ? 'Backpacker' : budgetStyle === 'luxury' ? 'Luxury' : 'Standard'} · {budgetSeason === 'peak' ? 'Peak' : budgetSeason === 'offpeak' ? 'Off-Peak' : 'Shoulder'} Season
                </p>
              </div>
            </div>

            {/* Donut Chart - Budget Breakdown Visualization (Task 12-B Feature 4) */}
            <BudgetDonutChart budgetResult={budgetResult} budgetTripDays={budgetTripDays} budgetViewMode={budgetViewMode} budgetChartActiveIndex={budgetChartActiveIndex} setBudgetChartActiveIndex={setBudgetChartActiveIndex} formatNum={formatNum} />

            {/* Visual Cost Breakdown Bar */}
            <div className="p-3 rounded-lg border bg-muted/20">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Cost Distribution</p>
              <div className="flex rounded-full overflow-hidden h-4 mb-2">
                {[
                  { label: 'Visa', value: budgetResult.visaFee, color: 'bg-blue-500' },
                  { label: 'Flights', value: budgetResult.flightEst, color: 'bg-purple-500' },
                  { label: 'Stay', value: budgetResult.accommodation, color: 'bg-amber-500' },
                  { label: 'Food', value: budgetResult.food, color: 'bg-orange-500' },
                  { label: 'Transport', value: budgetResult.transport, color: 'bg-amber-500' },
                  { label: 'Insurance', value: budgetResult.insurance, color: 'bg-amber-500' },
                  { label: 'Misc', value: budgetResult.misc, color: 'bg-gray-400' },
                ].map(item => {
                  const pct = Math.max(Math.round((item.value / budgetResult.totalUSD) * 100), item.value > 0 ? 1 : 0);
                  return pct > 0 ? (
                    <TooltipProvider key={item.label}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`${item.color} transition-all`} style={{ width: `${pct}%` }} />
                        </TooltipTrigger>
                        <TooltipContent>
                          {item.label}: ${formatNum(item.value)} ({pct}%)
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null;
                })}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {[
                  { label: 'Visa', color: 'bg-blue-500' },
                  { label: 'Flights', color: 'bg-purple-500' },
                  { label: 'Accommodation', color: 'bg-amber-500' },
                  { label: 'Food', color: 'bg-orange-500' },
                  { label: 'Transport', color: 'bg-amber-500' },
                  { label: 'Insurance', color: 'bg-amber-500' },
                  { label: 'Misc', color: 'bg-gray-400' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${l.color}`} />
                    <span className="text-[9px] text-muted-foreground">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: 'Visa & Processing', value: budgetResult.visaFee, icon: FileText, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
                { label: 'Estimated Flights', value: budgetResult.flightEst, icon: PlaneTakeoff, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
                { label: 'Accommodation', value: budgetResult.accommodation, icon: Home, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                { label: 'Food & Dining', value: budgetResult.food, icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
                { label: 'Transport', value: budgetResult.transport, icon: MapPin, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
                { label: 'Travel Insurance', value: budgetResult.insurance, icon: Shield, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
              ].map(item => {
                const pct = Math.round((item.value / budgetResult.totalUSD) * 100);
                return (
                  <div key={item.label} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                        {React.createElement(item.icon, { className: 'w-4 h-4' })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <div className="flex items-baseline gap-1">
                          <p className="text-sm font-bold">${formatNum(item.value)}</p>
                          <p className="text-[10px] text-muted-foreground">₨ {formatNum(item.value * (EXCHANGE_RATES.USD || 278.5))}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5">{pct}%</Badge>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className={`h-full rounded-full ${
                          item.label.includes('Visa') ? 'bg-blue-500' :
                          item.label.includes('Flight') ? 'bg-purple-500' :
                          item.label.includes('Accommodation') ? 'bg-amber-500' :
                          item.label.includes('Food') ? 'bg-orange-500' :
                          item.label.includes('Transport') ? 'bg-amber-500' : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Misc */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <div className="w-9 h-9 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 flex items-center justify-center flex-shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Miscellaneous (10% buffer)</p>
                <p className="text-sm font-bold">${formatNum(budgetResult.misc)}</p>
              </div>
              <p className="text-xs text-muted-foreground">₨ {formatNum(budgetResult.misc * (EXCHANGE_RATES.USD || 278.5))}</p>
            </div>

            {/* Budget Pie Chart (Feature 12-C) */}
            <div className="p-4 rounded-lg border bg-muted/20">
              <div className="flex items-center gap-2 mb-3">
                <PieChartIcon className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-semibold">Budget Overview</p>
              </div>
              <BudgetPieChart data={[
                { name: 'Visa Fee', value: Math.round(budgetResult.visaFee), color: '#F59E0B' },
                { name: 'Flights', value: Math.round(budgetResult.flightEst), color: '#D97706' },
                { name: 'Accommodation', value: Math.round(budgetResult.accommodation), color: '#B45309' },
                { name: 'Food', value: Math.round(budgetResult.food), color: '#EA580C' },
                { name: 'Transport', value: Math.round(budgetResult.transport), color: '#DC2626' },
                { name: 'Activities', value: Math.round(budgetResult.misc), color: '#FB923C' },
                { name: 'Insurance', value: Math.round(budgetResult.insurance), color: '#FBBF24' },
              ].filter(d => d.value > 0)} />
            </div>

            {/* Budget Optimization Tips */}
            {getBudgetTips(budgetCountry, budgetResult).length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
                <div className="flex items-center gap-1.5 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Budget Optimization Tips</p>
                </div>
                <div className="space-y-1.5">
                  {getBudgetTips(budgetCountry, budgetResult).map((tip, i) => (
                    <p key={i} className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">{tip}</p>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground text-center">
              ⚠️ Estimates are approximate based on average costs. Actual prices vary by season, booking time, and lifestyle. Flight estimates are from major Pakistani cities (Karachi/Lahore/Islamabad).
            </p>
          </motion.div>
        )}
      </section>

      {/* Travel Checklist Generator */}
      <Card className="card-elevated-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" />
            Travel Checklist Generator
          </CardTitle>
          <CardDescription className="text-xs">Generate a personalized travel checklist for your selected destination</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedCountry ? (
            <TravelChecklistGenerator country={selectedCountry} profile={userProfile} />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Globe className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Select a country first</p>
              <p className="text-xs text-muted-foreground mt-1">Go to the Explore tab and click on a country to select it</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

