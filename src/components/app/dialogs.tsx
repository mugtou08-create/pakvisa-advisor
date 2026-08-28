'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, FileText, BarChart3, MessageSquare, FileCheck,
  Search, ChevronRight, Star, Clock,
  DollarSign, Shield, Calendar, Heart,
  Send, Bot, User, Plane, Building, GraduationCap, Briefcase, Landmark, Map as MapIcon,
  Sun, Moon, Menu, X, ExternalLink, Download,
  MapPin, Home, Users, Lock, Lightbulb, Compass,
  Keyboard, HelpCircle, Sparkles, ChevronDown, ChevronUp, Target, BookOpen,
  LayoutGrid, Gavel, Mail, CheckCircle2, AlertTriangle, Info, Zap, Eye, Printer, Bell,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { CountryData, UserProfileData, ScoreBreakdown, ChatMessage, ChecklistItem } from '@/lib/types';
import { KEYBOARD_SHORTCUTS, QUICK_FILTERS, TIMELINE_STAGES } from './constants';
import { FlagImage, PrintReportDialog } from './shared-components-1';

export function KeyboardShortcutsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const categories = ['Navigation', 'Search', 'Actions'] as const;
  const grouped = categories.map(cat => ({
    name: cat,
    shortcuts: KEYBOARD_SHORTCUTS.filter(s => s.category === cat),
  }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-amber-500" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>Use these shortcuts to navigate faster</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {grouped.map(group => (
            <div key={group.name}>
              <h4 className="card-section-title text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{group.name}</h4>
              <div className="space-y-1.5">
                {group.shortcuts.map(s => (
                  <div key={s.action} className="flex items-center justify-between">
                    <span className="text-sm">{s.action}</span>
                    <div className="flex gap-0.5">
                      {s.keys.map((key, i) => (
                        <span key={i} className="kbd-key">{key}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ HELP CENTER DIALOG ============
export function HelpCenterDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', label: 'Getting Started', icon: Compass },
    { id: 'features', label: 'Features Guide', icon: LayoutGrid },
    { id: 'terms', label: 'Terms & Concepts', icon: BookOpen },
    { id: 'use-cases', label: 'Use Cases', icon: Target },
    { id: 'tips', label: 'Pro Tips', icon: Lightbulb },
  ] as const;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b bg-gradient-to-r from-amber-50 to-amber-50 dark:from-amber-950/30 dark:to-orange-950/30 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-white" />
            </div>
            Help Center
          </DialogTitle>
          <DialogDescription>Everything you need to know about using PakVisa Advisor — explained in simple English.</DialogDescription>
        </DialogHeader>

        {/* Section Navigation */}
        <div className="flex gap-1 px-5 pt-3 pb-1 overflow-x-auto shrink-0">
          {sections.map(s => (
            <button
              key={s.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                activeSection === s.id
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              onClick={() => setActiveSection(s.id)}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3">
          <div className="space-y-4 pb-6">

            {/* ===== GETTING STARTED ===== */}
            {activeSection === 'getting-started' && (
              <>
                <div className="space-y-4">
                  {/* Welcome */}
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
                    <h4 className="card-section-title font-semibold text-sm mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Welcome to PakVisa Advisor!
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      This app helps you — a Pakistani passport holder — find visa requirements, plan trips, and estimate costs for traveling abroad. Everything is free and works right in your browser.
                    </p>
                  </div>

                  {/* 5-step quickstart */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" /> Quick Start — 5 Easy Steps
                    </h4>
                    <div className="space-y-2.5">
                      {[
                        { step: 1, title: 'Search a Country', desc: 'Type any country name (e.g. "Turkey", "Malaysia", "UK") in the big search bar at the top. It instantly shows you the visa status, fees, processing time, and safety rating.', color: 'bg-amber-500' },
                        { step: 2, title: 'Browse & Compare', desc: 'Go to the Explore tab to filter countries by visa type (Visa-Free, e-Visa, VOA), region, cost, safety, and best travel month. Bookmark favorites with the ♡ button and compare up to 4 countries side-by-side.', color: 'bg-blue-500' },
                        { step: 3, title: 'Check Your Eligibility', desc: 'Go to the Questionnaire tab and fill in your profile (age, income, education, travel history). The app gives you a personalized eligibility score for every country with improvement tips.', color: 'bg-purple-500' },
                        { step: 4, title: 'Plan Your Budget', desc: 'Go to the Tools tab to convert currencies (PKR → any currency) and calculate your total trip cost including visa fees, flights, accommodation, food, transport, and insurance.', color: 'bg-amber-500' },
                        { step: 5, title: 'Ask AI for Help', desc: 'Go to the AI Consultant tab (or click the floating chat button) and ask any question. For example: "What documents do I need for a Germany visa?" or "Is my profile strong enough for a UK visitor visa?"', color: 'bg-amber-500' },
                      ].map(item => (
                        <div key={item.step} className="flex gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                          <div className={`w-7 h-7 rounded-full ${item.color} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                            {item.step}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{item.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* What each tab does */}
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                      <LayoutGrid className="w-4 h-4 text-blue-500" /> What Each Tab Does
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        { icon: Globe, name: 'Explore', desc: 'Main dashboard. Search countries, browse visa info, see world map, filter and sort destinations.' },
                        { icon: FileText, name: 'Questionnaire', desc: 'Fill in your travel profile and get personalized eligibility scores for every country.' },
                        { icon: BarChart3, name: 'Compare', desc: 'Select up to 4 countries to compare visa requirements, costs, safety, and processing times.' },
                        { icon: MessageSquare, name: 'AI Consultant', desc: 'Chat with an AI assistant about visa questions, documents, interviews, and travel planning.' },
                        { icon: Compass, name: 'Tools', desc: 'Currency converter (PKR ↔ 26 currencies) and travel budget calculator.' },
                        { icon: FileCheck, name: 'Reports', desc: 'Generate downloadable visa assessment reports with your scores and recommendations.' },
                      ].map(tab => (
                        <div key={tab.name} className="flex gap-2.5 p-2.5 rounded-lg border bg-muted/20">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                            <tab.icon className="w-4 h-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{tab.name}</p>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{tab.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ===== FEATURES GUIDE ===== */}
            {activeSection === 'features' && (
              <div className="space-y-4">
                {/* Search */}
                <div className="p-3 rounded-lg border bg-muted/20">
                  <h4 className="font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-amber-500" /> Instant Country Search
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    The search bar at the top of the Explore tab finds any country instantly. Just start typing — results appear as you type. Click any result to see full visa details.
                  </p>
                  <div className="p-2 rounded bg-background/80 border text-xs space-y-1">
                    <p className="font-medium">How to use:</p>
                    <p>• Type "Tur" → shows Turkey, Turkmenistan, etc.</p>
                    <p>• Click any country name → opens detailed visa card</p>
                    <p>• Shows visa type, fees, processing time, safety, and embassy info</p>
                  </div>
                </div>

                {/* Favorites */}
                <div className="p-3 rounded-lg border bg-muted/20">
                  <h4 className="font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-red-500" /> Favorites (Bookmarks)
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    Save countries you&apos;re interested in by clicking the <strong>♡</strong> (heart) button on any country card. Your favorites are saved in your browser and stay even after you close the tab.
                  </p>
                  <div className="p-2 rounded bg-background/80 border text-xs space-y-1">
                    <p className="font-medium">How to use:</p>
                    <p>• Click ♡ on a country card → turns red (saved)</p>
                    <p>• Click the "Favorites" filter pill → shows only saved countries</p>
                    <p>• Go to Compare tab → your favorites appear automatically</p>
                  </div>
                </div>

                {/* World Map */}
                <div className="p-3 rounded-lg border bg-muted/20">
                  <h4 className="font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                    <MapIcon className="w-4 h-4 text-amber-500" /> Interactive World Map
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    A visual map showing visa requirements for every country. Countries are color-coded by visa type: green (visa-free), yellow (VOA), orange (e-Visa), red (regular visa required).
                  </p>
                  <div className="p-2 rounded bg-background/80 border text-xs space-y-1">
                    <p className="font-medium">Map colors:</p>
                    <p>• <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />Green = Visa-Free (no visa needed)</p>
                    <p>• <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />Yellow = Visa on Arrival (get visa at airport)</p>
                    <p>• <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1" />Orange = e-Visa (apply online before travel)</p>
                    <p>• <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />Red = Regular Visa (apply at embassy)</p>
                  </div>
                </div>

                {/* Questionnaire */}
                <div className="p-3 rounded-lg border bg-muted/20">
                  <h4 className="font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-purple-500" /> Visa Questionnaire
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    A 6-step form that builds your travel profile. After completing it, you get a personalized eligibility score (0-100) for every country. The score tells you how likely you are to get approved.
                  </p>
                  <div className="p-2 rounded bg-background/80 border text-xs space-y-1">
                    <p className="font-medium">Score meaning:</p>
                    <p>• <span className="text-amber-600 font-bold">70-100 (High)</span> — Strong profile, good chance of approval</p>
                    <p>• <span className="text-amber-600 font-bold">40-69 (Medium)</span> — Decent but some areas need improvement</p>
                    <p>• <span className="text-red-600 font-bold">0-39 (Low)</span> — Significant weaknesses, work on profile first</p>
                    <p className="mt-1 font-medium">How to improve:</p>
                    <p>• Increase bank balance (show 6+ months of stable income)</p>
                    <p>• Get travel history (even regional trips help)</p>
                    <p>• Show strong ties to Pakistan (job, property, family)</p>
                  </div>
                </div>

                {/* Compare */}
                <div className="p-3 rounded-lg border bg-muted/20">
                  <h4 className="font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-blue-500" /> Country Comparison
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    Compare up to 4 countries side-by-side on a single table. See visa type, fees, processing time, cost of living, safety, and more — all in one view.
                  </p>
                  <div className="p-2 rounded bg-background/80 border text-xs space-y-1">
                    <p className="font-medium">How to use:</p>
                    <p>• Bookmark countries first (click ♡) or select from dropdown</p>
                    <p>• The table updates automatically with all data</p>
                    <p>• The "best" value in each column is highlighted in green</p>
                  </div>
                </div>

                {/* Tools */}
                <div className="p-3 rounded-lg border bg-muted/20">
                  <h4 className="font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-500" /> Travel Tools
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    Two essential tools for Pakistani travelers:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="p-2 rounded bg-background/80 border text-xs space-y-1">
                      <p className="font-bold text-amber-600">Currency Converter</p>
                      <p>• Convert between PKR and 26+ world currencies</p>
                      <p>• Live exchange rates updated every 30 minutes</p>
                      <p>• Quick pairs (PKR→USD, AED, SAR, etc.) and amount presets</p>
                      <p>• "Compare" button shows amount in 12 currencies at once</p>
                      <p>• Conversion history saves your last 10 conversions</p>
                      <p>• Copy result with one click</p>
                    </div>
                    <div className="p-2 rounded bg-background/80 border text-xs space-y-1">
                      <p className="font-bold text-orange-600">Travel Budget Calculator</p>
                      <p>• Estimate total trip cost from Pakistan to any country</p>
                      <p>• Choose travel style: Backpacker, Standard, or Luxury</p>
                      <p>• Choose season: Off-Peak (cheapest), Shoulder, or Peak (most expensive)</p>
                      <p>• Customize individual costs with adjustment sliders</p>
                      <p>• Shows visual cost breakdown with percentage bars</p>
                      <p>• Includes smart tips to reduce your expenses</p>
                      <p>• Export budget summary to clipboard</p>
                    </div>
                  </div>
                </div>

                {/* AI Consultant */}
                <div className="p-3 rounded-lg border bg-muted/20">
                  <h4 className="font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-violet-500" /> AI Consultant
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    A chat-based AI assistant that knows visa rules, document requirements, and travel advice for Pakistani passport holders. Available 24/7.
                  </p>
                  <div className="p-2 rounded bg-background/80 border text-xs space-y-1">
                    <p className="font-medium">Example questions you can ask:</p>
                    <p>• &quot;What documents do I need for a UK visitor visa?&quot;</p>
                    <p>• &quot;How can I improve my chances for a Schengen visa?&quot;</p>
                    <p>• &quot;What&apos;s the cheapest country to visit from Pakistan?&quot;</p>
                    <p>• &quot;Can I get a visa on arrival in Qatar?&quot;</p>
                    <p>• &quot;How long does a Malaysia e-Visa take to process?&quot;</p>
                    <p className="mt-1">💡 You can also access AI chat from the floating button at the bottom-right of any page.</p>
                  </div>
                </div>

                {/* Reports */}
                <div className="p-3 rounded-lg border bg-muted/20">
                  <h4 className="font-semibold text-sm mb-1.5 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-amber-500" /> Visa Reports
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                    Generate a comprehensive, downloadable report based on your questionnaire profile. Includes eligibility scores, document checklists, and personalized recommendations for each country.
                  </p>
                  <div className="p-2 rounded bg-background/80 border text-xs space-y-1">
                    <p className="font-medium">What&apos;s in a report:</p>
                    <p>• Your travel profile summary</p>
                    <p>• Eligibility score for each selected country</p>
                    <p>• Document checklist with completion status</p>
                    <p>• Cost estimates and embassy information</p>
                    <p>• Personalized tips and recommendations</p>
                    <p>• Print or download as text file</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== TERMS & CONCEPTS ===== */}
            {activeSection === 'terms' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground mb-2">Common visa and travel terms explained in simple, easy-to-understand English.</p>

                {[
                  { term: 'Visa-Free', meaning: 'You do NOT need to apply for a visa. Just buy a ticket, pack your bags, and go! Your Pakistani passport is enough to enter the country.', example: 'Malaysia allows Pakistani citizens visa-free entry for 30 days.' },
                  { term: 'Visa on Arrival (VOA)', meaning: 'You get your visa AT the airport when you arrive. No need to apply beforehand. Just fill out a form, pay a fee, and get your visa stamp. Usually takes 10-30 minutes.', example: 'You can get a Visa on Arrival in Qatar, Maldives, and Saudi Arabia.' },
                  { term: 'e-Visa (Electronic Visa)', meaning: 'You apply for this visa ONLINE before you travel. Fill out a form on the country\'s website, pay the fee with a credit card, and receive the visa by email (usually in 1-5 business days). Print it and show it at immigration.', example: 'Turkey, Kenya, and Azerbaijan offer e-Visa for Pakistani citizens.' },
                  { term: 'Regular Visa / Sticker Visa', meaning: 'You must visit the country\'s embassy or consulate IN PERSON to apply. This requires filling paper forms, submitting documents, attending an interview, and waiting 15-45 business days for processing.', example: 'UK, USA, Canada, and Schengen countries require regular visa applications.' },
                  { term: 'Schengen Visa', meaning: 'A single visa that lets you travel to 26 European countries (France, Germany, Italy, Spain, etc.). You apply at the embassy of the country you plan to visit first or stay longest.', example: 'A Schengen visa lets you visit Paris, Rome, and Berlin on one trip.' },
                  { term: 'Embassy / Consulate', meaning: 'The office of a foreign government in Pakistan. For example, the British High Commission in Islamabad handles UK visa applications. You go here for regular (sticker) visas.', example: 'The UAE Embassy in Islamabad processes UAE visa applications.' },
                  { term: 'Processing Time', meaning: 'How many business days (Monday-Friday, excluding holidays) it takes for your visa to be approved after you submit your application. This is an estimate — actual time may vary.', example: 'UK visitor visa typically takes 15-25 business days to process.' },
                  { term: 'Visa Fee', meaning: 'The amount of money you pay to apply for a visa. This is usually non-refundable — even if your visa is rejected, you don\'t get the fee back. Some countries also charge a separate service fee.', example: 'A Turkey e-Visa costs about $50 USD for Pakistani citizens.' },
                  { term: 'Ease Score', meaning: 'A score from 0-100 that shows how EASY it is to get a visa for a country. 100 means visa-free (easiest), 0 means very difficult with strict requirements.', example: 'Malaysia has an Ease Score of 100 (visa-free). UK has a lower score due to strict requirements.' },
                  { term: 'Safety Rating', meaning: 'A score from 1-10 showing how safe a country is for travelers. 10 is very safe, 1 is dangerous. Based on crime rates, political stability, and health risks.', example: 'Japan and Singapore have safety ratings of 9-10. Some conflict zones may have ratings of 2-3.' },
                  { term: 'Cost of Living', meaning: 'The estimated monthly amount a person spends on basic needs (rent, food, transport) in that country. Measured in USD. Helps you plan your travel budget.', example: 'Monthly living cost in Thailand is around $600-800 USD. In London, it\'s around $2,000-3,000 USD.' },
                  { term: 'Best Travel Months', meaning: 'The months with the best weather (comfortable temperature, low rainfall, fewer crowds) for visiting a country. Helps you plan when to travel.', example: 'Best months to visit Turkey are April-May and September-October.' },
                  { term: 'Eligibility Score', meaning: 'A personal score (0-100) based on your profile (income, education, travel history, etc.) showing how likely you are to get approved for a specific country\'s visa.', example: 'A score of 75 means you have a strong profile with good chances of approval.' },
                  { term: 'Travel Insurance', meaning: 'Insurance that covers medical emergencies, trip cancellations, lost luggage, and other travel-related problems during your trip. Some countries (especially Schengen) REQUIRE you to have travel insurance.', example: 'Schengen visa requires travel insurance with at least €30,000 coverage.' },
                  { term: 'Passport Validity', meaning: 'Most countries require your passport to be valid for at least 6 months BEYOND your planned return date. If your passport expires soon, renew it BEFORE applying for a visa.', example: 'If you plan to return on July 1, your passport should be valid until at least January 1 of the next year.' },
                  { term: 'Bank Statements', meaning: 'A document from your bank showing your account transactions over a period of time (usually 6 months). Embassies use this to verify you have enough money to fund your trip and that you have stable income.', example: 'UK visa requires 6 months of bank statements showing regular income and sufficient balance.' },
                  { term: 'Sponsor', meaning: 'A person (usually a relative or friend) living in the destination country who invites you and may provide financial support for your trip. They provide a sponsorship letter and sometimes proof of their financial status.', example: 'If your brother lives in Canada and invites you, he acts as your sponsor.' },
                ].map(item => (
                  <div key={item.term} className="p-3 rounded-lg border bg-muted/20">
                    <h4 className="font-bold text-sm mb-1">{item.term}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-1.5">{item.meaning}</p>
                    <div className="px-2 py-1.5 rounded bg-amber-50 dark:bg-amber-900/15 border border-amber-200/40 dark:border-amber-800/30">
                      <p className="text-[11px] text-amber-700 dark:text-amber-400"><span className="font-bold">Example:</span> {item.example}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ===== USE CASES ===== */}
            {activeSection === 'use-cases' && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">Real-world scenarios showing how PakVisa Advisor helps you plan your travel.</p>

                {[
                  { title: 'First-Time Traveler Planning Umrah', emoji: '🕋', scenario: 'You\'re a Pakistani citizen planning to perform Umrah for the first time. You don\'t know the visa process or how much it costs.', steps: [
                    'Go to Explore tab → Search "Saudi Arabia" → See it offers Visa on Arrival for Pakistanis',
                    'Check the visa fees, processing time, and safety rating',
                    'Go to Tools tab → Use Currency Converter to check PKR → SAR rates',
                    'Use Budget Calculator → Select Saudi Arabia → Choose "Standard" style and "Off-Peak" season → See total estimated cost',
                    'Go to AI Consultant → Ask "What documents do I need for Saudi Arabia Umrah visa?"',
                    'Generate a report in the Reports tab for offline reference',
                  ]},
                  { title: 'Student Applying for a UK Study Visa', emoji: '🎓', scenario: 'You got admission to a UK university and need to understand the visa requirements and prepare your application.', steps: [
                    'Go to Explore tab → Search "United Kingdom" → Review visa type (Regular Visa), fees, and processing time',
                    'Go to Questionnaire tab → Fill in your profile → Check your UK eligibility score',
                    'Review the score breakdown to see your strengths and weaknesses',
                    'Work on improving weak areas (bank balance, travel history, documents)',
                    'Go to AI Consultant → Ask "What are the UK student visa requirements for Pakistani students?"',
                    'Use the Reports tab to generate a complete application checklist',
                  ]},
                  { title: 'Family Planning a Malaysia Vacation', emoji: '👨‍👩‍👧‍👦', scenario: 'You want to take your family (wife + 2 kids) on a 10-day vacation to Malaysia. You need to budget and plan.', steps: [
                    'Search "Malaysia" → See visa-free entry for Pakistanis (30 days) — no visa needed!',
                    'Go to Tools tab → Currency Converter: Check PKR → MYR (Ringgit) rates',
                    'Budget Calculator: Select Malaysia, 10 days, 4 travelers, "Standard" style',
                    'Toggle "Customize" to adjust accommodation (maybe upgrade for family comfort)',
                    'Review budget tips and total estimate (≈ ₨400,000-600,000 for a family)',
                    'Go to AI Consultant → Ask "Best family-friendly areas to stay in Kuala Lumpur?"',
                  ]},
                  { title: 'Business Traveler Visiting Multiple Countries', emoji: '💼', scenario: 'You need to visit 3 countries for business meetings: UAE, Turkey, and Germany. You want to compare visa requirements and plan efficiently.', steps: [
                    'Bookmark UAE, Turkey, and Germany using the ♡ button on each country card',
                    'Go to Compare tab → See all 3 countries side-by-side (VOA, e-Visa, Regular Visa)',
                    'Compare fees, processing times, and document requirements in one view',
                    'Go to Questionnaire → Fill in your business travel profile',
                    'AI Consultant → Ask "What documents do I need for a German business visa?"',
                    'Generate a report covering all 3 countries',
                  ]},
                  { title: 'Budget Backpacker Exploring Southeast Asia', emoji: '🎒', scenario: 'You have a tight budget (₨300,000) and want to travel as many countries in Southeast Asia as possible.', steps: [
                    'Go to Explore → Filter by "Visa-Free" and "Asia" region → See visa-free Asian countries',
                    'Bookmark visa-free or e-Visa countries (Malaysia, Thailand, etc.)',
                    'Go to Compare → Compare costs of Thailand, Malaysia, Indonesia',
                    'Go to Tools → Budget Calculator → Set "Backpacker" style, "Off-Peak" season, 14 days',
                    'Compare costs across multiple countries to fit your budget',
                    'AI Consultant → Ask "Cheapest way to travel between Malaysia and Thailand from Pakistan?"',
                  ]},
                  { title: 'Immigration Consultant Helping a Client', emoji: '👨‍💼', scenario: 'You\'re a travel agent or immigration consultant helping a client choose the right destination based on their profile.', steps: [
                    'Have your client fill out the Questionnaire tab completely',
                    'Review the eligibility scores — identify countries where the client scores above 70',
                    'Use Compare tab to show the client side-by-side comparisons of top 4 choices',
                    'Use AI Consultant to get specific document checklists for selected countries',
                    'Generate Reports for the client to take home',
                    'Use the embassy information (address, phone, website) to help them prepare applications',
                  ]},
                ].map(uc => (
                  <div key={uc.title} className="p-4 rounded-xl border bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{uc.emoji}</span>
                      <h4 className="font-semibold text-sm">{uc.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{uc.scenario}</p>
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Step-by-step:</p>
                      {uc.steps.map((step, i) => (
                        <div key={i} className="flex gap-2 text-xs">
                          <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                          <p className="text-muted-foreground leading-relaxed">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ===== PRO TIPS ===== */}
            {activeSection === 'tips' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Expert tips to get the most out of PakVisa Advisor and improve your visa success rate.</p>

                {[
                  { icon: '💡', title: 'Start with the Questionnaire', tip: 'Before browsing countries, fill out the Questionnaire tab. This gives you personalized scores for every country, so you immediately see which destinations you have the best chance with.' },
                  { icon: '💰', title: 'Book Flights Early', tip: 'International flights from Pakistan are cheapest when booked 2-3 months in advance. Use the Budget Calculator with "Off-Peak" season to see the lowest estimated costs.' },
                  { icon: '📄', title: 'Keep Documents Ready', tip: 'Common documents needed for most visas: valid passport (6+ months), bank statements (6 months), employment letter, tax returns, travel insurance, and photographs. Start gathering these early.' },
                  { icon: '🏦', title: 'Build Strong Financials', tip: 'Most embassies want to see 6+ months of stable income with a healthy balance. Avoid large, sudden deposits — they look suspicious. A steady salary with regular deposits is ideal.' },
                  { icon: '✈️', title: 'Build Travel History', tip: 'Countries with relaxed visa rules (Malaysia visa-free, UAE VOA, Turkey e-Visa) are great first trips. Each trip adds to your passport stamps and makes future applications stronger.' },
                  { icon: '🎯', title: 'Use Compare Wisely', tip: 'When choosing between destinations, use the Compare tab to see all data side-by-side. The orange-highlighted "best" values help you quickly spot the cheapest, safest, or easiest option.' },
                  { icon: '🤖', title: 'Ask AI Specific Questions', tip: 'The AI Consultant works best with specific questions. Instead of "How do I get a visa?", try "What documents do I need for a 30-day tourist visa to Japan?" for much more helpful answers.' },
                  { icon: '🌍', title: 'Check Season Before Booking', tip: 'Use the "Best Travel Months" filter to find countries with good weather during your planned travel dates. Visiting during the right season saves money AND makes your trip more enjoyable.' },
                  { icon: '📋', title: 'Generate Reports for Visits', tip: 'Before visiting an embassy, generate a Report in the Reports tab. It gives you a complete document checklist and eligibility summary you can print and carry with you.' },
                  { icon: '⌨️', title: 'Use Keyboard Shortcuts', tip: 'Press Ctrl+/ (or Cmd+/ on Mac) to see all keyboard shortcuts. You can switch tabs with Ctrl+1 through Ctrl+6, search with Ctrl+K, and more.' },
                  { icon: '🔍', title: 'Always Verify with Embassy', tip: 'While PakVisa Advisor provides accurate information, visa rules change frequently. Always double-check the latest requirements on the official embassy website before submitting your application.' },
                  { icon: '📱', title: 'Use on Mobile Too', tip: 'PakVisa Advisor works great on mobile! Use the bottom navigation bar on phones. The AI chat is accessible from the floating button on any page.' },
                ].map((tip, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors">
                    <span className="text-lg shrink-0">{tip.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{tip.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{tip.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function KeyboardShortcutsTooltip() {
  return (
    <div className="max-w-xs space-y-2">
      <p className="text-xs font-semibold">Keyboard Shortcuts</p>
      <div className="space-y-1">
        {KEYBOARD_SHORTCUTS.map((s) => (
          <div key={s.action} className="flex items-center justify-between gap-4 text-xs">
            <span className="text-muted-foreground">{s.action}</span>
            <div className="flex gap-0.5">
              {s.keys.map((key, i) => (
                <span key={i} className="kbd-key">{key}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <Button
            onClick={scrollToTop}
            size="icon"
            className="rounded-full w-10 h-10 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/30 press-glow"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export function NewsletterInput() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = () => {
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      const existing = JSON.parse(localStorage.getItem('pakvisa-newsletter') || '[]');
      if (existing.includes(email)) {
        toast.info('This email is already subscribed');
        return;
      }
      existing.push(email);
      localStorage.setItem('pakvisa-newsletter', JSON.stringify(existing));
      setSubscribed(true);
      toast.success('Subscribed! You will receive visa updates.');
    } catch {
      toast.error('Failed to subscribe');
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Subscribed successfully!</span>
        <button onClick={() => { setSubscribed(false); setEmail(''); }} className="text-muted-foreground hover:text-foreground underline ml-1">Change</button>
      </div>
    );
  }

  return (
    <>
      <Input
        placeholder="your@email.com"
        className="h-9 text-xs input-glow-focus flex-1"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <Button
        size="sm"
        className="bg-amber-600 hover:bg-amber-700 h-9 px-3 shrink-0"
        onClick={handleSubmit}
      >
        <Mail className="w-3 h-3 mr-1" />
        Subscribe
      </Button>
    </>
  );
}
export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            About PakVisa Advisor
          </DialogTitle>
          <DialogDescription>Your AI-powered visa intelligence companion for Pakistani passport holders.</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
          {/* Mission */}
          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">Our Mission</h3>
            <p>
              PakVisa Advisor was built with a single mission: <strong className="text-foreground">make visa information accessible, understandable, and actionable</strong> for every Pakistani passport holder. Navigating visa requirements can be overwhelming — different countries have different rules, changing policies, confusing processes, and hidden requirements. We simplify all of that into one intelligent platform.
            </p>
          </section>

          {/* What We Offer */}
          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">What We Offer</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Search, title: 'Instant Visa Check', desc: 'Search any country and instantly see visa requirements, fees, processing time, and safety ratings.' },
                { icon: MapIcon, title: 'Interactive World Map', desc: 'Visually explore visa requirements across 70+ countries by clicking on the map.' },
                { icon: ClipboardList, title: 'Personalized Questionnaire', desc: 'Get a tailored eligibility score for each country based on your personal profile.' },
                { icon: BarChart3, title: 'Country Comparison', desc: 'Compare up to 4 destinations side-by-side for costs, safety, and visa ease.' },
                { icon: MessageSquare, title: 'Sara AI Assistant', desc: 'Ask any visa question and get detailed, context-aware answers powered by AI.' },
                { icon: FileCheck, title: 'Downloadable Reports', desc: 'Generate comprehensive visa assessment reports for offline reference.' },
              ].map(item => (
                <div key={item.title} className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-xs">{item.title}</p>
                    <p className="text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* How to Use */}
          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">How to Use</h3>
            <ol className="space-y-2 list-decimal list-inside">
              <li><strong className="text-foreground">Search</strong> — Type any country name in the hero search bar for an instant visa overview.</li>
              <li><strong className="text-foreground">Explore</strong> — Browse all countries, filter by visa type, region, cost, safety, or best travel month.</li>
              <li><strong className="text-foreground">Assess</strong> — Complete the Questionnaire to get personalized eligibility scores and improvement tips.</li>
              <li><strong className="text-foreground">Compare</strong> — Select multiple countries to compare side-by-side before deciding.</li>
              <li><strong className="text-foreground">Ask AI</strong> — Use the AI Consultant for specific questions about documents, interviews, or processes.</li>
            </ol>
          </section>

          {/* Data Sources */}
          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">Data Sources</h3>
            <p>
              Our visa data is sourced from official government embassy websites, IATA Travel Centre, Henley Passport Index, and verified travel advisories. We update our database regularly to reflect the latest changes in visa policies. However, visa rules can change with little notice — <strong className="text-foreground">always verify with the official embassy or consulate</strong> before making travel plans or submitting applications.
            </p>
          </section>

          {/* Technology */}
          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">Technology</h3>
            <p>
              PakVisa Advisor is built with modern web technologies including Next.js, TypeScript, and AI-powered analysis. The platform runs entirely in your browser for the best experience — your personal data never leaves your device. Our AI consultant uses advanced language models to provide context-aware visa guidance based on the latest available data.
            </p>
          </section>

          <div className="pt-2 border-t">
            <p className="text-xs">
              <strong className="text-foreground">Version:</strong> 1.0 · <strong className="text-foreground">Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DisclaimerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            Disclaimer
          </DialogTitle>
          <DialogDescription>Important information about the accuracy and limitations of the data provided.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <p className="font-medium text-amber-800 dark:text-amber-300 text-xs">
              ⚠️ Visa rules, fees, and requirements change frequently. The information on this platform may not reflect the most current policies. Always verify with official sources before making any travel or visa decisions.
            </p>
          </div>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">Not Professional Legal or Immigration Advice</h3>
            <p>
              PakVisa Advisor provides general visa information and eligibility assessments for reference purposes only. This platform <strong className="text-foreground">does not constitute legal advice, immigration consultation, or professional visa services</strong>. The AI-generated scores, recommendations, and assessments are estimates based on available data and should not be treated as guarantees of visa approval or rejection.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">Data Accuracy</h3>
            <p>
              While we strive to maintain accurate and up-to-date visa information by regularly sourcing data from official government websites, embassies, and consulates, <strong className="text-foreground">we cannot guarantee the absolute accuracy, completeness, or timeliness</strong> of all information displayed. Visa policies, processing times, fees, and document requirements may change without prior notice. Specific visa outcomes depend on individual circumstances, embassy discretion, and current geopolitical factors.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">No Guarantee of Visa Approval</h3>
            <p>
              The eligibility scores, passport power rankings, ease scores, and AI-generated recommendations provided by this platform are <strong className="text-foreground">estimates and indicators only</strong>. They do not guarantee visa approval. The final decision on any visa application rests solely with the respective embassy, consulate, or immigration authority of the destination country. Many factors beyond the scope of this platform (such as in-person interview performance, additional document requests, background checks, and country-specific quotas) can affect the outcome.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">Third-Party Information</h3>
            <p>
              This platform may contain links to external websites, including official embassy pages and government portals. We are not responsible for the content, accuracy, or availability of these external sites. The inclusion of any link does not imply endorsement by PakVisa Advisor. Embassy contact details (addresses, phone numbers, websites) are provided for convenience and should be independently verified.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">Financial Estimates</h3>
            <p>
              Cost estimates including visa fees, processing charges, monthly living expenses, and travel costs are approximate and based on publicly available data. <strong className="text-foreground">Actual costs may vary significantly</strong> based on exchange rates, individual circumstances, seasonal pricing, and country-specific fee structures. Always check the official embassy website for the most current fee schedule.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">Safety Ratings</h3>
            <p>
              Country safety ratings are based on general travel advisory indices and should not be the sole factor in travel decisions. <strong className="text-foreground">Always check your government&apos;s official travel advisories</strong> (e.g., the Pakistan Ministry of Foreign Affairs travel advisories) before traveling to any destination. Safety conditions can change rapidly due to political, social, or environmental factors.
            </p>
          </section>

          <div className="pt-2 border-t">
            <p className="text-xs">
              By using PakVisa Advisor, you acknowledge and agree to these disclaimers. If you require professional visa assistance, please consult a licensed immigration consultant or directly contact the relevant embassy or consulate.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TermsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Gavel className="w-4 h-4 text-white" />
            </div>
            Terms &amp; Conditions
          </DialogTitle>
          <DialogDescription>Please read these terms carefully before using PakVisa Advisor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">1. Acceptance of Terms</h3>
            <p>
              By accessing and using PakVisa Advisor (the &quot;Platform&quot;), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you should not use the Platform. These terms apply to all visitors, users, and others who access or use the Platform.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">2. Description of Service</h3>
            <p>
              PakVisa Advisor provides visa information, eligibility assessments, country comparisons, and AI-powered visa guidance specifically for Pakistani passport holders. The Platform is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">3. User Responsibilities</h3>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>You are responsible for verifying all visa information with official embassy or consulate sources before making travel decisions.</li>
              <li>You must not use the Platform for any unlawful purpose or in any way that could damage, disable, or impair the Platform.</li>
              <li>You acknowledge that visa decisions are made solely by the respective country&apos;s immigration authorities and that this Platform has no influence over such decisions.</li>
              <li>You agree not to reproduce, distribute, or commercially exploit any content from this Platform without prior written permission.</li>
              <li>You are responsible for the accuracy of any personal information you choose to input into the Questionnaire feature.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">4. Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by applicable law, PakVisa Advisor and its developers shall not be liable for any direct, indirect, incidental, consequential, special, or exemplary damages arising from your use of or inability to use the Platform. This includes, but is not limited to, damages for loss of profits, goodwill, data, or other intangible losses resulting from: (a) visa application outcomes, (b) reliance on information provided by the Platform, (c) unauthorized access to or alteration of your transmissions or data, or (d) any other matter relating to the Platform.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">5. Intellectual Property</h3>
            <p>
              All content on this Platform, including but not limited to text, graphics, logos, icons, images, data compilations, and software, is the property of PakVisa Advisor or its content suppliers and is protected by intellectual property laws. The PakVisa Advisor name, logo, and all related names, logos, product and service names, designs, and slogans are trademarks of PakVisa Advisor.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">6. AI-Generated Content</h3>
            <p>
              The Platform uses artificial intelligence to generate visa assessments, eligibility scores, recommendations, and chat responses. AI-generated content is provided for informational purposes only and may contain inaccuracies or outdated information. You should not make visa decisions solely based on AI-generated content. The AI does not have access to real-time embassy systems and cannot guarantee the current status of any visa policy.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">7. Modifications to Terms</h3>
            <p>
              We reserve the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting on the Platform. Your continued use of the Platform after any modifications constitutes your acceptance of the updated terms. We encourage you to review these terms periodically.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">8. Governing Law</h3>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of Pakistan. Any disputes arising from the use of this Platform shall be subject to the exclusive jurisdiction of the courts of Pakistan.
            </p>
          </section>

          <div className="pt-2 border-t">
            <p className="text-xs">
              <strong className="text-foreground">Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PrivacyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            Privacy Policy
          </DialogTitle>
          <DialogDescription>How we handle (and don&apos;t handle) your personal data.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm text-muted-foreground leading-relaxed">
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50">
            <p className="font-medium text-amber-800 dark:text-amber-300 text-xs">
              🔒 Your privacy matters. PakVisa Advisor processes all personal data locally in your browser. Nothing is sent to external servers.
            </p>
          </div>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">1. Data We Collect</h3>
            <p className="mb-2">PakVisa Advisor is designed with privacy-first principles. Here is exactly what we collect:</p>
            <ul className="space-y-1.5">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Browser Local Storage Only</strong> — Your questionnaire responses, favorites, search history, and preferences are stored exclusively in your browser&apos;s local storage. This data stays on your device and is never transmitted to our servers.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span><strong className="text-foreground">No Personal Documents</strong> — We never collect, request, or store passport copies, photographs, national ID numbers, bank statements, or any official identification documents.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span><strong className="text-foreground">No Server-Side Accounts</strong> — There is no user registration, login system, or user accounts. We do not collect email addresses, passwords, or any authentication data.</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span><strong className="text-foreground">AI Chat Sessions</strong> — Conversations with the AI Consultant are processed in real-time and are not permanently stored on any server. They exist only during your active session.</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">2. Anonymous Analytics</h3>
            <p>
              We may collect basic anonymous usage analytics such as page views, feature usage patterns, and general geographic region (country-level only) to improve the Platform. This data <strong className="text-foreground">cannot be used to identify you personally</strong> and is aggregated for analytical purposes only.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">3. Cookies</h3>
            <p>
              The Platform uses minimal cookies for essential functionality only:
            </p>
            <ul className="space-y-1.5 list-disc list-inside mt-2">
              <li><strong className="text-foreground">Theme Preference</strong> — Stores your light/dark mode preference.</li>
              <li><strong className="text-foreground">Session State</strong> — Maintains your current tab, filters, and view preferences during a session.</li>
            </ul>
            <p className="mt-2">We do not use tracking cookies, advertising cookies, or third-party analytics cookies.</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">4. Third-Party Services</h3>
            <p>
              The Platform may embed or link to external services including:
            </p>
            <ul className="space-y-1.5 list-disc list-inside mt-2">
              <li><strong className="text-foreground">Country Flag Images</strong> — Loaded from flagcdn.com, a free, open-source flag CDN.</li>
              <li><strong className="text-foreground">AI Processing</strong> — AI features may use third-party AI services with no personal data retention.</li>
            </ul>
            <p className="mt-2">Each third-party service has its own privacy policy, and we encourage you to review them.</p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">5. Data Security</h3>
            <p>
              Since all personal data is stored locally in your browser, you have full control. You can clear all stored data at any time by clearing your browser&apos;s local storage and cookies. The Platform does not transmit, store, or process your personal data on any remote server.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">6. Data Retention</h3>
            <p>
              Your locally stored data persists until you manually clear it or clear your browser data. There is no automatic data retention policy on our end because we do not collect or store data on our servers.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">7. Children&apos;s Privacy</h3>
            <p>
              The Platform is not directed at children under 13. We do not knowingly collect personal information from children. If you believe a child has provided personal data through the Platform, please contact us so we can take appropriate action.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">8. Changes to This Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-foreground text-base mb-2">9. Contact Us</h3>
            <p>
              If you have questions about this Privacy Policy or your data, please reach out to us through the AI Consultant feature or via email.
            </p>
          </section>

          <div className="pt-2 border-t">
            <p className="text-xs">
              <strong className="text-foreground">Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · <strong className="text-foreground">Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============ PREMIUM BADGE ============
export function PremiumBadge() {
  return (
    <Badge variant="secondary" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] px-1.5 py-0">
      ✨ PRO
    </Badge>
  );
}

// ============ QUICK ACTIONS TOOLBAR (Task 11) ============
export function QuickActionsToolbar() {
  const [expanded, setExpanded] = useState(false);
  const { setActiveTab } = useAppStore();

  const actions = [
    {
      label: 'Quick Check',
      icon: Search,
      onClick: () => {
        document.getElementById('visa-guide')?.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
          const input = document.querySelector('.search-input-expand input') as HTMLInputElement;
          if (input) input.focus();
        }, 300);
      },
    },
    {
      label: 'AI Chat',
      icon: MessageSquare,
      onClick: () => setActiveTab('chat'),
    },
    {
      label: 'Compare',
      icon: BarChart3,
      onClick: () => setActiveTab('compare'),
    },
  ];

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-30 flex flex-col items-end gap-2">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2 p-2 rounded-xl bg-background/80 dark:bg-popover/80 backdrop-blur-xl border shadow-lg"
          >
            {actions.map((action) => (
              <TooltipProvider key={action.label}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        action.onClick();
                        setExpanded(false);
                      }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors text-sm min-w-[140px] group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
                        <action.icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="font-medium text-foreground text-xs">{action.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="tooltip-premium">
                    <p className="text-xs">{action.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setExpanded(!expanded)}
        className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center transition-colors"
        aria-label="Quick actions"
      >
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Zap className="w-5 h-5" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

// ============ FEEDBACK RATING WIDGET ============
export function FeedbackWidget() {
  const { userFeedback, submitFeedback } = useAppStore();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interacted = useRef(false);

  // Show widget after 60 seconds, auto-dismiss after 10 more if no interaction
  useEffect(() => {
    if (userFeedback || dismissed) return;

    const showTimer = setTimeout(() => {
      setVisible(true);

      autoDismissTimer.current = setTimeout(() => {
        if (!interacted.current) {
          setDismissed(true);
          setVisible(false);
        }
      }, 10000);
    }, 60000);

    return () => {
      clearTimeout(showTimer);
      if (autoDismissTimer.current) clearTimeout(autoDismissTimer.current);
    };
  }, [userFeedback, dismissed]);

  // Clear auto-dismiss on any user interaction
  function handleInteract() {
    if (!interacted.current) {
      interacted.current = true;
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
        autoDismissTimer.current = null;
      }
    }
  }

  function handleSubmit() {
    if (rating === 0) return;
    handleInteract();
    submitFeedback(rating, comment);
    setSubmitted(true);
    toast.success('Thank you for your feedback!');
    setTimeout(() => {
      setVisible(false);
      setDismissed(true);
    }, 3000);
  }

  function handleDismiss() {
    handleInteract();
    setDismissed(true);
    setVisible(false);
  }

  if (!visible && !submitted) return null;

  const displayRating = hoveredRating || rating;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed bottom-20 left-4 z-40 w-72 rounded-xl border glass-card-strong shadow-lg overflow-hidden"
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">How's your experience?</h3>
              <button
                onClick={handleDismiss}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Dismiss feedback"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-4"
              >
                <Sparkles className="w-8 h-8 text-amber-500 mb-2" />
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Thank you!</p>
                <p className="text-xs text-muted-foreground mt-1">Your feedback helps us improve.</p>
              </motion.div>
            ) : (
              <>
                {/* Star Rating */}
                <div
                  className="flex gap-1 mb-3"
                  onMouseEnter={handleInteract}
                  onClick={handleInteract}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-0.5 transition-transform hover:scale-110"
                      aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= displayRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-none text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Optional Text Feedback */}
                <Textarea
                  rows={2}
                  placeholder="Tell us more (optional)..."
                  value={comment}
                  onChange={(e) => { setComment(e.target.value); handleInteract(); }}
                  onFocus={handleInteract}
                  className="text-xs resize-none mb-3"
                />

                {/* Submit Button */}
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={rating === 0}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs"
                >
                  Submit Feedback
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
