'use client';

import { useState } from 'react';
import {
  Clock,
  Plane,
  DollarSign,
  Lock,
  Crown,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore, isProUser } from '@/lib/auth-store';
import type { VisaTypeCostData, VisaRequirementData } from '@/lib/types';

const PKR_RATE = 278.5;

function usdToPkr(usd: number): string {
  return Math.round(usd * PKR_RATE).toLocaleString();
}

export interface VisaTypeCardProps {
  id: string;
  type: string;
  description: string;
  maxDuration: string;
  extensions: boolean;
  multipleEntry: boolean;
  processingDaysMin: number;
  processingDaysMax: number;
  sourceUrl: string;
  verifiedTill: string;
  isTourist: boolean;
  category: string;
  categoryColor: string;
  costProfile: VisaTypeCostData | null | undefined;
  requirements: VisaRequirementData[] | undefined;
}

function groupByCategory(reqs: VisaRequirementData[]): Record<string, VisaRequirementData[]> {
  return reqs.reduce((acc, r) => {
    const cat = r.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {} as Record<string, VisaRequirementData[]>);
}

export function VisaTypeCard({
  type,
  description,
  maxDuration,
  extensions,
  multipleEntry,
  processingDaysMin,
  processingDaysMax,
  sourceUrl,
  verifiedTill,
  isTourist,
  category,
  categoryColor,
  costProfile,
  requirements,
}: VisaTypeCardProps) {
  const [reqsExpanded, setReqsExpanded] = useState(false);
  const { user } = useAuthStore();
  const isPro = isProUser(user);
  const showProOverlay = !isTourist && !isPro;

  const hasProcessing = processingDaysMin > 0 || processingDaysMax > 0;
  const processingText = processingDaysMin === processingDaysMax
    ? `${processingDaysMin} days`
    : `${processingDaysMin}-${processingDaysMax} days`;

  const groupedReqs = requirements && requirements.length > 0 ? groupByCategory(requirements) : null;
  const reqCategories = groupedReqs ? Object.keys(groupedReqs) : [];
  const INITIAL_SHOW_CATEGORIES = 2;

  const handleUpgrade = () => {
    window.dispatchEvent(new CustomEvent('open-pricing'));
  };

  return (
    <div className="relative rounded-xl border p-5 bg-card shadow-sm">
      {/* Colored left border based on category */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
        style={{
          backgroundColor: categoryColor.includes('emerald')
            ? 'var(--color-emerald-500, #10b981)'
            : categoryColor.includes('amber')
              ? 'var(--color-amber-500, #f59e0b)'
              : categoryColor.includes('violet')
                ? 'var(--color-violet-500, #8b5cf6)'
                : categoryColor.includes('pink')
                  ? 'var(--color-pink-500, #ec4899)'
                  : categoryColor.includes('cyan')
                    ? 'var(--color-cyan-500, #06b6d4)'
                    : categoryColor.includes('orange')
                      ? 'var(--color-orange-500, #f97316)'
                      : categoryColor.includes('teal')
                        ? 'var(--color-teal-500, #14b8a6)'
                        : categoryColor.includes('lime')
                          ? 'var(--color-lime-500, #84cc16)'
                          : categoryColor.includes('gray')
                            ? 'var(--color-gray-400, #9ca3af)'
                            : 'var(--color-emerald-500, #10b981)',
        }}
      />

      {/* Card Header — always visible */}
      <div className="flex items-start gap-2.5 mb-3">
        <Plane className="w-5 h-5 mt-0.5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm leading-tight">{type}</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${categoryColor}`}>
              {category}
            </span>
          </div>
          {maxDuration && (
            <p className="text-xs text-muted-foreground mt-0.5">{maxDuration}</p>
          )}
        </div>
      </div>

      {/* Content area — may be blurred for Pro types */}
      <div className={`relative ${showProOverlay ? 'select-none' : ''}`}>
        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{description}</p>
        )}

        {/* Info badges row */}
        <div className="flex flex-wrap gap-2 mb-3">
          {maxDuration && (
            <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md text-xs">
              <Clock className="w-3 h-3" /> {maxDuration}
            </span>
          )}
          {hasProcessing && (
            <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md text-xs">
              <Clock className="w-3 h-3" /> {processingText}
            </span>
          )}
          <span className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md text-xs">
            {multipleEntry ? 'Multiple Entry' : 'Single Entry'}
          </span>
          {extensions && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 px-2.5 py-1 rounded-md text-xs">
              Extensions Available
            </span>
          )}
        </div>

        {/* Fee section */}
        {costProfile && (costProfile.visaFeeUSD > 0 || costProfile.serviceFeeUSD > 0) && (
          <div className="rounded-lg bg-muted/50 border p-3 mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold">Fees</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {costProfile.visaFeeUSD > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Visa Fee</p>
                  <p className="text-sm font-semibold">${costProfile.visaFeeUSD}</p>
                  <p className="text-[10px] text-muted-foreground">≈ PKR {usdToPkr(costProfile.visaFeeUSD)}</p>
                </div>
              )}
              {costProfile.serviceFeeUSD > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Service Fee</p>
                  <p className="text-sm font-semibold">${costProfile.serviceFeeUSD}</p>
                  <p className="text-[10px] text-muted-foreground">≈ PKR {usdToPkr(costProfile.serviceFeeUSD)}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Requirements (collapsible) */}
        {groupedReqs && reqCategories.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold">Document Checklist</span>
              <span className="text-[10px] text-muted-foreground">({requirements!.length} items)</span>
            </div>
            <div className="space-y-3">
              {reqCategories
                .slice(0, reqsExpanded ? reqCategories.length : INITIAL_SHOW_CATEGORIES)
                .map((cat) => (
                  <div key={cat} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/40 px-3 py-2 border-b">
                      <p className="text-xs font-semibold">{cat}</p>
                    </div>
                    <div className="divide-y">
                      {groupedReqs![cat].map((item, i) => (
                        <div key={item.id || i} className="px-3 py-2 flex items-start gap-2">
                          {item.mandatory ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          ) : (
                            <span className="mt-1.5 w-2.5 h-2.5 rounded-full border-2 border-amber-400 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium leading-tight">{item.requirement}</span>
                              <span className={`text-[9px] px-1 py-0.5 rounded shrink-0 ${item.mandatory ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                {item.mandatory ? 'Required' : 'Recommended'}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{item.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
            {reqCategories.length > INITIAL_SHOW_CATEGORIES && (
              <button
                type="button"
                onClick={() => setReqsExpanded(!reqsExpanded)}
                className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {reqsExpanded ? (
                  <><ChevronUp className="w-3 h-3" /> Show less</>
                ) : (
                  <><ChevronDown className="w-3 h-3" /> Show {reqCategories.length - INITIAL_SHOW_CATEGORIES} more categories</>
                )}
              </button>
            )}
          </div>
        )}

        {/* Verified till + source URL footer */}
        <div className="flex items-center gap-3 flex-wrap mt-2">
          {verifiedTill && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3 h-3" /> Verified till {new Date(verifiedTill).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Source <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        {/* Pro overlay for non-tourist, non-pro users */}
        {showProOverlay && (
          <div className="absolute inset-0 rounded-xl bg-background/80 backdrop-blur-[6px] flex flex-col items-center justify-center gap-3 z-10">
            <div className="flex items-center gap-1.5">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Pro
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Lock className="w-3.5 h-3.5" />
              <span className="text-xs">Unlock detailed {category} visa info</span>
            </div>
            <Button
              size="sm"
              onClick={handleUpgrade}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            >
              <Crown className="w-3.5 h-3.5" />
              Upgrade to Pro
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function VisaProBanner() {
  const { user } = useAuthStore();
  const isPro = isProUser(user);

  if (isPro) return null;

  const handleUpgrade = () => {
    window.dispatchEvent(new CustomEvent('open-pricing'));
  };

  return (
    <section className="max-w-5xl mx-auto px-4 pb-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-xl p-5 bg-amber-50/50 dark:bg-amber-950/10">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <Crown className="w-6 h-6 text-amber-500 shrink-0" />
          <p className="text-sm text-muted-foreground">
            Want to see detailed requirements, fees, and processing times for{' '}
            <span className="font-semibold text-foreground">Work, Study, and Business</span> visas?{' '}
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Upgrade to Pro</span>
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleUpgrade}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shrink-0"
        >
          <Crown className="w-3.5 h-3.5" />
          Upgrade to Pro
        </Button>
      </div>
    </section>
  );
}
