'use client';
import React, { useState, useEffect, useRef } from 'react';
import { X, BarChart3, Plus, Trash2, Shield, Clock, DollarSign, MapPin, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { CountryData } from '@/lib/types';

function getVisaType(c: CountryData) {
  if (c.visaFree) return { label: 'Visa Free', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', rank: 1 };
  if (c.visaOnArrival) return { label: 'Visa on Arrival', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', rank: 2 };
  if (c.etaAvailable) return { label: 'e-Visa', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', rank: 3 };
  return { label: 'Embassy Required', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', rank: 4 };
}

interface Props {
  countries: CountryData[];
  onClose: () => void;
  onSelectCountry: (name: string) => void;
  isProUser?: boolean;
}

export function ComparePanel({ countries, onClose, onSelectCountry, isProUser }: Props) {
  const MAX_COMPARE = isProUser ? 5 : 2;
  const [selected, setSelected] = useState<CountryData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  const addCountry = (c: CountryData) => {
    if (selected.length >= MAX_COMPARE) {
      if (!isProUser) {
        toast.info('Free accounts can compare up to 2 countries. Upgrade to Pro to compare up to 5!');
      }
      return;
    }
    if (selected.find(s => s.code === c.code)) return;
    setSelected([...selected, c]);
    setShowPicker(false);
    setSearchTerm('');
  };

  const removeCountry = (code: string) => {
    setSelected(selected.filter(s => s.code !== code));
  };

  const filteredPicker = searchTerm.trim()
    ? countries.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selected.find(s => s.code === c.code)
      ).slice(0, 8)
    : countries
        .filter(c => !selected.find(s => s.code === c.code))
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 10);

  const easyFirst = [...selected].sort((a, b) => getVisaType(a).rank - getVisaType(b).rank);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Compare Countries</h2>
              <p className="text-[11px] text-muted-foreground">
                {selected.length}/{MAX_COMPARE} countries selected
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto">

          {/* Selection bar */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              {selected.map(c => (
                <div
                  key={c.code}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full border bg-card"
                >
                  <span className="text-sm">{c.flagEmoji}</span>
                  <span className="text-sm font-medium">{c.name}</span>
                  <button
                    onClick={() => removeCountry(c.code)}
                    className="p-0.5 rounded-full hover:bg-muted transition-colors"
                    aria-label={`Remove ${c.name}`}
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
              {selected.length < MAX_COMPARE && (
                <div className="relative" ref={pickerRef}>
                  <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-border hover:border-primary/40 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Country
                  </button>
                  {showPicker && (
                    <div className="absolute top-full mt-2 left-0 w-72 bg-card border rounded-xl shadow-lg z-50">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search country..."
                        className="w-full px-3 py-2 border-b text-sm bg-transparent focus:outline-none"
                        autoFocus
                      />
                      <div className="max-h-64 overflow-y-auto p-1">
                        {filteredPicker.length > 0 ? (
                          filteredPicker.map(c => (
                            <button
                              key={c.code}
                              onClick={() => addCountry(c)}
                              className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm flex items-center gap-2 transition-colors"
                            >
                              <span>{c.flagEmoji}</span>
                              <span className="flex-1">{c.name}</span>
                              <Badge variant="outline" className={`text-[10px] ${getVisaType(c).color}`}>
                                {getVisaType(c).label}
                              </Badge>
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-4 text-sm text-muted-foreground text-center">No countries found</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comparison table */}
          {selected.length === 0 ? (
            <div className="text-center py-16">
              <BarChart3 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h3 className="font-semibold mb-1">Add countries to compare</h3>
              <p className="text-sm text-muted-foreground">
                Select up to 4 countries to see a side-by-side visa comparison.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground w-36 sticky left-0 bg-muted/30 z-10">
                      Attribute
                    </th>
                    {easyFirst.map(c => (
                      <th key={c.code} className="text-center px-4 py-3 font-semibold min-w-[140px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xl">{c.flagEmoji}</span>
                          <span>{c.name}</span>
                          <button
                            onClick={() => removeCountry(c.code)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            aria-label={`Remove ${c.name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {/* Visa Type */}
                  <CompareRow
                    label="Visa Type"
                    icon={<Shield className="w-3.5 h-3.5" />}
                    countries={easyFirst}
                    render={c => {
                      const v = getVisaType(c);
                      return (
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${v.color}`}>
                            {v.label}
                          </span>
                        </div>
                      );
                    }}
                  />
                  {/* Visa Fee */}
                  <CompareRow
                    label="Visa Fee"
                    icon={<DollarSign className="w-3.5 h-3.5" />}
                    countries={easyFirst}
                    render={c => {
                      const cost = c.costProfile;
                      if (!cost || cost.visaFeeUSD === 0) return <span className="text-emerald-600 font-medium">Free</span>;
                      return <span>${cost.visaFeeUSD}</span>;
                    }}
                  />
                  {/* Processing Time */}
                  <CompareRow
                    label="Processing Time"
                    icon={<Clock className="w-3.5 h-3.5" />}
                    countries={easyFirst}
                    render={c => {
                      if (c.visaFree || c.visaOnArrival || c.etaAvailable) return <span className="text-emerald-600 font-medium">Instant</span>;
                      const min = c.processingDaysMin || 0;
                      const max = c.processingDaysMax || 0;
                      if (min > 0 || max > 0) return <span>{min === max ? `${min} days` : `${min}–${max} days`}</span>;
                      return <span className="text-muted-foreground">Varies</span>;
                    }}
                  />
                  {/* Continent */}
                  <CompareRow
                    label="Region"
                    icon={<MapPin className="w-3.5 h-3.5" />}
                    countries={easyFirst}
                    render={c => <span>{c.continent}</span>}
                  />
                  {/* Safety Rating */}
                  <CompareRow
                    label="Safety"
                    icon={<Shield className="w-3.5 h-3.5" />}
                    countries={easyFirst}
                    render={c => {
                      const r = c.safetyRating || 0;
                      if (r <= 0) return <span className="text-muted-foreground">—</span>;
                      const color = r >= 7 ? 'text-emerald-600' : r >= 5 ? 'text-amber-600' : 'text-red-500';
                      return <span className={`font-medium ${color}`}>{r}/10 {r >= 7 && 'Safe'}</span>;
                    }}
                  />
                  {/* Currency */}
                  <CompareRow
                    label="Currency"
                    icon={<DollarSign className="w-3.5 h-3.5" />}
                    countries={easyFirst}
                    render={c => <span>{c.currency || c.currencyCode}</span>}
                  />
                  {/* Monthly Living Cost */}
                  <CompareRow
                    label="Monthly Living"
                    icon={<DollarSign className="w-3.5 h-3.5" />}
                    countries={easyFirst}
                    render={c => {
                      const cost = c.costProfile;
                      return cost && cost.totalMonthlyUSD > 0 ? `$${Math.round(cost.totalMonthlyUSD)}` : '—';
                    }}
                  />
                  {/* Best Travel Months */}
                  <CompareRow
                    label="Best Months"
                    icon={<MapPin className="w-3.5 h-3.5" />}
                    countries={easyFirst}
                    render={c =>
                      c.bestTravelMonths ? (
                        <div className="flex flex-wrap justify-center gap-1">
                          {c.bestTravelMonths.split(',').slice(0, 4).map(m => (
                            <Badge key={m.trim()} variant="outline" className="text-[10px] px-1.5 py-0">
                              {m.trim()}
                            </Badge>
                          ))}
                        </div>
                      ) : '—'
                    }
                  />
                  {/* Requirements count */}
                  <CompareRow
                    label="Requirements"
                    icon={<Check className="w-3.5 h-3.5" />}
                    countries={easyFirst}
                    render={c => {
                      const mandatory = c.requirements?.filter(r => r.mandatory).length || 0;
                      const total = c.requirements?.length || 0;
                      return <span>{mandatory} required, {total} total</span>;
                    }}
                  />
                </tbody>
              </table>
            </div>
          )}

          {/* Back button */}
          {selected.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button variant="outline" onClick={onClose} className="gap-1.5">
                <X className="w-3.5 h-3.5" /> Done
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function CompareRow({
  label,
  icon,
  countries,
  render,
}: {
  label: string;
  icon: React.ReactNode;
  countries: CountryData[];
  render: (c: CountryData) => React.ReactNode;
}) {
  return (
    <tr className="hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3 font-medium text-muted-foreground sticky left-0 bg-card z-10 flex items-center gap-2">
        {icon} {label}
      </td>
      {countries.map(c => (
        <td key={c.code} className="px-4 py-3 text-center">
          {render(c)}
        </td>
      ))}
    </tr>
  );
}
