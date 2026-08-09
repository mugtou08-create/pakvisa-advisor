'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, BarChart3, Search, Star, Clock,
  DollarSign, Shield, Calendar, Heart, Plane, Building, MapPin,
  Users, Lightbulb, TrendingUp, TrendingDown,
  ArrowRight, Printer, ExternalLink, Zap, Target, Sparkles,
  Eye, ClipboardList, Send, ChevronDown, Compass, Gavel, CheckCircle2, X, XCircle,
  AlertTriangle, Info, Lock, FileWarning, PackageOpen, PlaneTakeoff, UtensilsCrossed, Bookmark, SearchX, Timer, Wallet, Languages, BadgePercent,
  Download, Play, History, RefreshCw, FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { CountryData, UserProfileData, ScoreBreakdown, ChatMessage, ChecklistItem } from '@/lib/types';
import { FlagImage, PrintReportDialog, ColorProgress } from '../shared-components-1';
import { ApplicationTimelineTracker, AnimatedScoreNumber, RadialGauge, MicroSparkline, ScoringHistoryPanel } from '../shared-components-2';
import { ScoreHistoryChart } from '../shared-components-3';
import { WhatIfSimulator, SmartChecklist } from './compare-tab';
import { PremiumBadge } from '../dialogs';

export function ReportsTab() {
  const { scoreResults, userProfile, addScoreResult, setActiveTab } = useAppStore();
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [reportsView, setReportsView] = useState<'reports' | 'timeline' | 'history'>('reports');

  const selected = selectedIdx !== null ? scoreResults[selectedIdx] : null;

  const reloadHistory = (scores: ScoreBreakdown[]) => {
    scores.forEach(s => addScoreResult(s));
    setReportsView('reports');
    if (scores.length > 0) setSelectedIdx(0);
  };

  const printReport = () => { window.print(); };
  const [exportOpen, setExportOpen] = useState(false);

  if (scoreResults.length === 0) {
    return (
      <Card className="text-center p-10 card-glow-border">
        <div className="empty-state-illustration mx-auto mb-4">
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
            {/* Clipboard body */}
            <rect x="30" y="20" width="60" height="80" rx="8" fill="var(--muted)" stroke="var(--muted-foreground)" strokeWidth="2" />
            {/* Clipboard clip */}
            <rect x="45" y="14" width="30" height="16" rx="4" fill="var(--background)" stroke="var(--muted-foreground)" strokeWidth="2" />
            <circle cx="60" cy="22" r="3" fill="var(--muted-foreground)" />
            {/* Lines on clipboard */}
            <line x1="42" y1="45" x2="78" y2="45" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" />
            <line x1="42" y1="55" x2="72" y2="55" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <line x1="42" y1="65" x2="68" y2="65" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
            <line x1="42" y1="75" x2="74" y2="75" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
            {/* Check mark badge */}
            <circle cx="90" cy="30" r="14" fill="#f59e0b" />
            <polyline points="83,30 88,35 97,25" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">No Reports Yet</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Complete the questionnaire to generate your first visa eligibility report.</p>
        <Button className="empty-state-cta bg-amber-600 hover:bg-amber-700" onClick={() => setActiveTab('questionnaire')}>
          <Play className="w-4 h-4 mr-1.5" /> Start Assessment
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Visa Reports</h2>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${reportsView === 'reports' ? 'bg-amber-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setReportsView('reports')}
            >
              <FileCheck className="w-3 h-3 inline mr-1" />Reports
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${reportsView === 'timeline' ? 'bg-amber-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setReportsView('timeline')}
            >
              <ClipboardList className="w-3 h-3 inline mr-1" />Timeline Tracker
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${reportsView === 'history' ? 'bg-amber-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setReportsView('history')}
            >
              <History className="w-3 h-3 inline mr-1" />History
            </button>
          </div>
          {reportsView === 'reports' && (
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)} className="print:hidden gap-1">
              <Download className="w-4 h-4 mr-1" /> Export Report <PremiumBadge />
            </Button>
          )}
        </div>
      </div>

      {/* Timeline Tracker View */}
      {reportsView === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-500" />
              Application Timeline Tracker
            </CardTitle>
            <CardDescription>Track your visa application progress step by step</CardDescription>
          </CardHeader>
          <CardContent>
            <ApplicationTimelineTracker />
          </CardContent>
        </Card>
      )}

      {/* Scoring History View */}
      {reportsView === 'history' && (
        <>
          <ScoreHistoryChart />
          <ScoringHistoryPanel onReload={reloadHistory} />
        </>
      )}


      {/* Reports View */}
      {reportsView === 'reports' && scoreResults.length === 0 && (
        <Card className="text-center p-10 card-glow-border">
          <div className="empty-state-illustration mx-auto mb-4">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
              <rect x="25" y="15" width="50" height="70" rx="6" fill="var(--muted)" stroke="var(--muted-foreground)" strokeWidth="2" />
              <rect x="37" y="9" width="26" height="14" rx="3" fill="var(--background)" stroke="var(--muted-foreground)" strokeWidth="2" />
              <line x1="35" y1="35" x2="65" y2="35" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" />
              <line x1="35" y1="45" x2="60" y2="45" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
              <line x1="35" y1="55" x2="55" y2="55" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
              <line x1="35" y1="65" x2="62" y2="65" stroke="var(--muted-foreground)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">No Reports Yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Complete the questionnaire to generate your first visa eligibility report.</p>
        </Card>
      )}

      {reportsView === 'reports' && scoreResults.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Report List */}
          <Card className="lg:col-span-1 card-glow-border">
          <CardHeader>
            <CardTitle className="text-sm">Score Results ({scoreResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[500px]">
              <div className="space-y-1">
                {[...scoreResults].sort((a, b) => b.finalScore - a.finalScore).map((r, idx) => (
                  <button
                    key={idx}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg text-left text-sm hover:bg-muted/50 transition-all duration-200 hover-lift-smooth list-item-hover ${selectedIdx === idx ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-500' : ''}`}
                    onClick={() => setSelectedIdx(idx)}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${r.finalScore >= 70 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : r.finalScore >= 40 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>
                      {Math.round(r.finalScore)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.country}</div>
                      <div className="text-xs text-muted-foreground">{r.visaType}</div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Report Detail */}
        {selected && (
          <Card className="lg:col-span-2 print:shadow-none print:border-none card-glow-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CardTitle>Eligibility Report: {selected.country}</CardTitle>
                <Badge variant="outline">{selected.visaType}</Badge>
              </div>
              <CardDescription>Data confidence: {Math.round(selected.confidence * 100)}%</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Eligibility', value: selected.eligibility, color: 'text-amber-600' },
                  { label: 'Visa Likelihood', value: selected.visaLikelihood, color: 'text-orange-600' },
                  { label: 'Cost Suitability', value: selected.costSuitability, color: 'text-amber-600' },
                  { label: 'Final Score', value: selected.finalScore, color: 'text-amber-600' },
                ].map((item, i) => (
                  <div key={item.label} className={`stat-card-highlight text-center p-3 rounded-lg ${i === 3 ? 'ring-2 ring-amber-500' : ''}`}>
                    <div className={`text-3xl font-bold ${item.color}`}><AnimatedScoreNumber value={Math.round(item.value)} delay={i * 150} /></div>
                    <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-center"><RadialGauge score={selected.finalScore} /></div>

              {/* Component Breakdown */}
              <div>
                <h4 className="card-section-title text-sm font-semibold mb-3">Score Breakdown</h4>
                <div className="space-y-2">
                  {selected.components.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-32 text-sm text-muted-foreground truncate">{c.name}</span>
                      <div className="flex-1">
                        <ColorProgress value={c.score} className="progress-amber" />
                      </div>
                      <MicroSparkline data={[40, 55, 48, 62, 70, c.score, 65 + (c.score * 0.15 + c.name.charCodeAt(0) % 15)]} width={45} height={16} />
                      <span className="w-10 text-sm text-right font-medium">{Math.round(c.score)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hard Filters */}
              {selected.hardFilters.length > 0 && (
                <div>
                  <h4 className="card-section-title text-sm font-semibold mb-3">Hard Filters</h4>
                  <div className="space-y-2">
                    {selected.hardFilters.map((f, i) => (
                      <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${f.passed ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                        {f.passed ? <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" /> : <XCircle className="w-4 h-4 text-red-600 shrink-0" />}
                        <div>
                          <span className="font-medium">{f.filter}</span>
                          <span className="text-muted-foreground ml-2">{f.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Items */}
              {selected.missingItems.length > 0 && (
                <div>
                  <h4 className="card-section-title text-sm font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Missing Items
                  </h4>
                  <div className="space-y-1">
                    {selected.missingItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm p-1.5 rounded bg-amber-50 dark:bg-amber-900/20">
                        <span className="w-5 h-5 rounded-full bg-amber-200 dark:bg-amber-800 flex items-center justify-center text-[10px] font-bold text-amber-700">{i + 1}</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tips */}
              <div>
                <h4 className="card-section-title text-sm font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Improvement Tips
                </h4>
                <div className="space-y-2">
                  {selected.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Citations */}
              <div>
                <h4 className="card-section-title text-sm font-semibold mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-amber-500" /> Source Citations
                </h4>
                <div className="space-y-1">
                  {selected.sourceCitations.map((cite, i) => (
                    <a key={i} href={cite.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-amber-500 hover:underline p-1 rounded">
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate">{cite.title}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{Math.round(cite.confidence * 100)}%</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Modifiers */}
              <div>
                <h4 className="card-section-title text-sm font-semibold mb-3">Score Modifiers</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'Policy Strictness', value: selected.modifiers.policyStrictness },
                    { label: 'Historical Approval', value: selected.modifiers.historicalApproval },
                    { label: 'Data Confidence', value: selected.modifiers.dataConfidence },
                    { label: 'Discretionary', value: selected.modifiers.discretionaryElements },
                  ].map(m => (
                    <div key={m.label} className="p-2 rounded-lg border text-center text-sm">
                      <div className="font-medium">{m.value.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">{m.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* What-If Simulator & Smart Checklist - Accordion */}
              {userProfile && (
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="whatif" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        What-If Simulator
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <WhatIfSimulator scoreResult={selected} userProfile={userProfile} />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="checklist" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">
                      <span className="flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-amber-500" />
                        Smart Checklist
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <SmartChecklist scoreResult={selected} />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </CardContent>
          </Card>
        )}
        </div>
      )}
      {/* Print Report Dialog - Task 10 C2 */}
      <PrintReportDialog open={exportOpen} onClose={() => setExportOpen(false)} scoreResults={scoreResults} userProfile={userProfile} />
    </div>
  );
}
