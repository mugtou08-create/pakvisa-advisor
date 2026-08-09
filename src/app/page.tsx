'use client';

import React, { useState, useEffect, useCallback, useRef, useSyncExternalStore, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, FileText, BarChart3, MessageSquare, FileCheck,
  Search, ChevronRight, Star, Clock,
  DollarSign, Shield, Calendar, Heart,
  Sun, Moon, Menu, X, ExternalLink, Download,
  MapPin, Plane, Building, Users, Lock, Lightbulb, Compass,
  Keyboard, HelpCircle, Sparkles, Settings,
  Gavel, Info, AlertTriangle, Mail, Zap,
  TrendingUp, BarChart3 as BarChart3Icon, Play, History, ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/lib/store';

import { ExploreTab } from '@/components/app/tabs/explore-tab';
import { QuestionnaireTab } from '@/components/app/tabs/questionnaire-tab';
import { CompareTab } from '@/components/app/tabs/compare-tab';
import { AIChatTab } from '@/components/app/tabs/ai-chat-tab';
import { ReportsTab } from '@/components/app/tabs/reports-tab';
import { ToolsTab } from '@/components/app/tabs/tools-tab';
import { PassportExpiryWarning } from '@/components/app/shared-components-1';
import { NotificationBell, VisaAlertBanner } from '@/components/app/shared-components-3';
import { AdminDialog } from '@/components/app/admin-dialog';
import {
  KeyboardShortcutsDialog, HelpCenterDialog, FloatingChatWidget,
  KeyboardShortcutsTooltip, BackToTopButton, NewsletterInput,
  AboutDialog, DisclaimerDialog, TermsDialog, PrivacyDialog,
  QuickActionsToolbar, FeedbackWidget,
} from '@/components/app/dialogs';

// ============ MAIN PAGE (IMPROVED) ============
export default function HomePage() {
  const { activeTab, setActiveTab, selectedCountry, setSelectedCountry, setViewMode } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [footerCountryCount, setFooterCountryCount] = useState(0);
  const [legalDialog, setLegalDialog] = useState<'about' | 'disclaimer' | 'terms' | 'privacy' | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);

  const TABS = [
    { id: 'explore', label: 'Explore', icon: Globe },
    { id: 'questionnaire', label: 'Assess', icon: FileText },
    { id: 'compare', label: 'Compare', icon: BarChart3 },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'tools', label: 'Tools', icon: Compass },
    { id: 'reports', label: 'Reports', icon: FileCheck },
  ];
  const TAB_IDS = TABS.map(t => t.id);

  // Fetch AI enabled setting on app load
  useEffect(() => {
    fetch('/api/admin/ai-status')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data !== undefined) {
          setAiEnabled(data.data.enabled);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch country count for footer
  useEffect(() => {
    fetch('/api/countries/stats').then(r => r.json()).then(data => {
      if (data.data?.totalCountries) setFooterCountryCount(data.data.totalCountries);
    }).catch(() => {});
  }, []);

  const handleDownloadBackup = useCallback(() => {
    setDownloading(true);
    toast.info('Generating backup… please wait');
    fetch('/api/download-backup')
      .then(res => {
        if (!res.ok) throw new Error('Backup failed');
        return res.blob();
      })
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pakvisa-advisor-backup-${new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19)}.tar.gz`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        const sizeMB = (blob.size / 1024 / 1024).toFixed(1);
        toast.success(`Backup downloaded! (${sizeMB} MB)`);
      })
      .catch(() => {
        toast.error('Failed to generate backup. Please try again.');
      })
      .finally(() => setDownloading(false));
  }, []);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Pill indicator state
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const updatePill = () => {
      const el = tabRefs.current[activeTab];
      const nav = navRef.current;
      if (el && nav) {
        const navRect = nav.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        setPillStyle({
          left: elRect.left - navRect.left,
          width: elRect.width,
        });
      }
    };
    updatePill();
    window.addEventListener('resize', updatePill);
    return () => window.removeEventListener('resize', updatePill);
  }, [activeTab]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1': e.preventDefault(); setActiveTab('explore'); break;
          case '2': e.preventDefault(); setActiveTab('questionnaire'); break;
          case '3': e.preventDefault(); setActiveTab('compare'); break;
          case '4': e.preventDefault(); setActiveTab('chat'); break;
          case '5': e.preventDefault(); setActiveTab('reports'); break;
          case '6': e.preventDefault(); setActiveTab('tools'); break;
          case 'k': case 'K':
            e.preventDefault();
            const searchEl = document.querySelector('.search-input-expand input') as HTMLInputElement;
            searchEl?.focus();
            break;
          case 'b': case 'B':
            e.preventDefault();
            setViewMode(useAppStore.getState().viewMode === 'grid' ? 'list' : 'grid');
            break;
          case 'f': case 'F':
            e.preventDefault();
            toast.info('Toggle favorites in the Explore tab filter pills');
            break;
          case 'd': case 'D':
            e.preventDefault();
            if (activeTab === 'questionnaire') {
              toast.info('Quick scoring all countries — fill out your profile first, then use this shortcut!');
            } else {
              toast.info('Switch to Questionnaire tab first, then press Ctrl+D to score all countries.');
            }
            break;
          case '/':
            e.preventDefault(); setShowShortcuts(s => !s);
            break;
        }
      }
      if (e.key === 'Escape') {
        setSelectedCountry(null);
        setMobileMenuOpen(false);
        setShowShortcuts(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab, setSelectedCountry, setViewMode, activeTab]);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-background scroll-smooth">
        {/* Subtle background pattern */}
        <div className="fixed inset-0 -z-10 pointer-events-none grain-overlay" />
        <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.02] dark:opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }} />

        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 print:hidden">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center shadow-sm logo-glow" style={{ animation: 'pulse-glow 3s ease-in-out infinite' }}>
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight gradient-text-mango">PakVisa Advisor</h1>
                  <p className="text-[10px] text-muted-foreground hidden sm:block">Pakistani Passport Visa Intelligence</p>
                </div>
              </div>

              {/* Desktop Nav with Pill Indicator */}
              <nav className="hidden md:flex items-center gap-1 pill-nav rounded-xl p-1 bg-muted/50 transition-all duration-200 hover-glow-amber" ref={navRef}>
                <span
                  className="pill-indicator"
                  style={{
                    left: pillStyle.left,
                    width: pillStyle.width,
                    transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                />
                {[
                  { id: 'explore', label: 'Explore', icon: Globe },
                  { id: 'questionnaire', label: 'Questionnaire', icon: FileText },
                  { id: 'compare', label: 'Compare', icon: BarChart3 },
                  { id: 'chat', label: 'AI Consultant', icon: MessageSquare },
                  { id: 'tools', label: 'Tools', icon: Compass },
                  { id: 'reports', label: 'Reports', icon: FileCheck },
                ].map(tab => (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    size="sm"
                    className={`rounded-lg transition-all duration-200 ${activeTab === tab.id ? 'tab-gradient-text font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-amber-50 dark:hover:bg-amber-900/20 active:scale-95'}`}
                    onClick={() => setActiveTab(tab.id)}
                    ref={(el) => { tabRefs.current[tab.id] = el; }}
                  >
                    <tab.icon className="w-4 h-4 mr-1.5" />
                    {tab.label}
                  </Button>
                ))}
              </nav>

              <div className="flex items-center gap-2">
                {/* Notification Bell */}
                <NotificationBell />
                {/* Passport Expiry Warning */}
                <PassportExpiryWarning />
                {/* Keyboard Shortcuts Help */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setShowShortcuts(!showShortcuts)} aria-label="Keyboard shortcuts">
                        <Keyboard className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <KeyboardShortcutsTooltip />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {/* Help Center button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setShowHelpCenter(true)} aria-label="Help Center" className="bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30">
                        <HelpCircle className="w-4 h-4 text-amber-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Help Center — Guides, Terms & Use Cases</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {/* Admin Dashboard button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setShowAdmin(true)} aria-label="Admin Dashboard" className="hover:bg-amber-50 dark:hover:bg-amber-900/20">
                        <Settings className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Admin Dashboard</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme" className="transition-transform duration-200 hover:scale-110 focus-ring-amber">
                  {mounted ? (theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <div className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Mobile Nav */}
            {mobileMenuOpen && (
              <motion.nav
                className="md:hidden pt-3 border-t mt-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: 'explore', label: 'Explore', icon: Globe },
                    { id: 'questionnaire', label: 'Questionnaire', icon: FileText },
                    { id: 'compare', label: 'Compare', icon: BarChart3 },
                    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
                    { id: 'tools', label: 'Tools', icon: Compass },
                    { id: 'reports', label: 'Reports', icon: FileCheck },
                  ].map(tab => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? 'default' : 'outline'}
                      className={activeTab === tab.id ? 'bg-amber-600 hover:bg-amber-700 font-semibold' : ''}
                      onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                    >
                      <tab.icon className="w-4 h-4 mr-1.5" />
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </motion.nav>
            )}
          </div>
        </header>

        {/* Visa Alert Banner */}
        <div className="border-b bg-background/50">
          <VisaAlertBanner />
        </div>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="page-load-animation">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }}>
              {activeTab === 'explore' && <ExploreTab />}
              {activeTab === 'questionnaire' && <QuestionnaireTab />}
              {activeTab === 'compare' && <CompareTab />}
              {activeTab === 'chat' && aiEnabled && <AIChatTab />}
              {activeTab === 'chat' && !aiEnabled && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">AI Features Unavailable</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    AI features are currently disabled by the administrator. Please check back later or contact support for more information.
                  </p>
                </div>
              )}
              {activeTab === 'reports' && <ReportsTab />}
              {activeTab === 'tools' && <ToolsTab />}
            </motion.div>
          </AnimatePresence>
          </div>
        </main>

        {/* Footer - Enhanced with Gradient Background & Animated Separator */}
        <footer className="footer-gradient-bg footer-gradient-enhanced glass-card print:hidden mt-auto sm:block" style={{ borderTop: '2px solid rgba(249, 115, 22, 0.3)' }}>
          <div className="footer-separator-dots mx-4 mt-6 mb-2" />
          <div className="container mx-auto px-4 py-10">
            {/* Bento Grid Footer - 5 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-8">
              {/* Brand - Large */}
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center shadow-sm">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold text-lg footer-gradient-text">PakVisa Advisor</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI-powered visa intelligence for Pakistani passport holders. Explore requirements, compare destinations, and plan your travels with confidence.
                </p>
                {/* Social Media Icons */}
                <div className="flex items-center gap-3 mt-4">
                  {[
                    { label: 'Twitter', path: 'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z' },
                    { label: 'Facebook', path: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
                    { label: 'Instagram', path: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5M12 7a5 5 0 110 10 5 5 0 010-10m0 2a3 3 0 100 6 3 3 0 000-6z' },
                    { label: 'YouTube', path: 'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43zM9.75 15.02V8.48l5.75 3.27-5.75 3.27z' },
                  ].map(social => (
                    <button key={social.label} className="w-8 h-8 rounded-lg bg-muted/60 dark:bg-muted/30 flex items-center justify-center text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all duration-200 hover-scale-breathe" title={social.label}>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={social.path} />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <div className="section-divider-dots mb-3" />
                <h4 className="font-semibold text-sm mb-3">Quick Links</h4>
                <div className="space-y-2">
                  {[{ label: 'Explore Countries', tab: 'explore' }, { label: 'Visa Assessment', tab: 'questionnaire' }, { label: 'Compare Destinations', tab: 'compare' }, { label: 'AI Consultant', tab: 'chat' }, { label: 'Your Reports', tab: 'reports' }, { label: 'Help Center', tab: 'help' }].map(link => (
                    <button key={link.tab} className="block text-sm text-muted-foreground hover:text-amber-600 transition-colors min-h-[44px] flex items-center" onClick={() => link.tab === 'help' ? setShowHelpCenter(true) : setActiveTab(link.tab)}>
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trust & Stats with mini stat cards */}
              <div>
                <div className="section-divider-dots mb-3" />
                <h4 className="font-semibold text-sm mb-3">Trust & Security</h4>
                <div className="space-y-3">
                  {/* Mini stat cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
                      <div className="text-sm font-bold text-amber-700 dark:text-amber-400">10K+</div>
                      <div className="text-[9px] text-muted-foreground">Travelers</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-800/50">
                      <div className="text-sm font-bold text-orange-700 dark:text-orange-400">{footerCountryCount || '...'}</div>
                      <div className="text-[9px] text-muted-foreground">Countries</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-800/50">
                      <div className="text-sm font-bold text-amber-700 dark:text-amber-400">98%</div>
                      <div className="text-[9px] text-muted-foreground">Accuracy</div>
                    </div>
                  </div>
                  {/* Animated trust badges */}
                  <div className="flex gap-3 pt-1">
                    <div className="trust-badge-float" style={{ animationDelay: '0s' }}>
                      <div className="w-9 h-9 rounded-lg bg-muted/80 dark:bg-muted/30 flex items-center justify-center" title="AES-256 Encrypted">
                        <Lock className="w-4 h-4 text-amber-500" />
                      </div>
                    </div>
                    <div className="trust-badge-float" style={{ animationDelay: '0.5s' }}>
                      <div className="w-9 h-9 rounded-lg bg-muted/80 dark:bg-muted/30 flex items-center justify-center" title="Data Security">
                        <Shield className="w-4 h-4 text-amber-500" />
                      </div>
                    </div>
                    <div className="trust-badge-float" style={{ animationDelay: '1s' }}>
                      <div className="w-9 h-9 rounded-lg bg-muted/80 dark:bg-muted/30 flex items-center justify-center" title="Global Coverage">
                        <Globe className="w-4 h-4 text-amber-500" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal & Policies */}
              <div>
                <div className="section-divider-dots mb-3" />
                <h4 className="font-semibold text-sm mb-3">Legal</h4>
                <div className="space-y-2">
                  <button className="block text-sm text-muted-foreground hover:text-amber-600 transition-colors min-h-[44px] flex items-center" onClick={() => setLegalDialog('about')}>
                    <Info className="w-3.5 h-3.5 mr-1.5" />About
                  </button>
                  <button className="block text-sm text-muted-foreground hover:text-amber-600 transition-colors min-h-[44px] flex items-center" onClick={() => setLegalDialog('disclaimer')}>
                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />Disclaimer
                  </button>
                  <button className="block text-sm text-muted-foreground hover:text-amber-600 transition-colors min-h-[44px] flex items-center" onClick={() => setLegalDialog('terms')}>
                    <Gavel className="w-3.5 h-3.5 mr-1.5" />Terms & Conditions
                  </button>
                  <button className="block text-sm text-muted-foreground hover:text-amber-600 transition-colors min-h-[44px] flex items-center" onClick={() => setLegalDialog('privacy')}>
                    <Lock className="w-3.5 h-3.5 mr-1.5" />Privacy Policy
                  </button>
                </div>
              </div>

              {/* Newsletter / Updates + Download */}
              <div className="col-span-2 sm:col-span-3 lg:col-span-1">
                <h4 className="font-semibold text-sm mb-3">Stay Updated</h4>
                <p className="text-xs text-muted-foreground mb-3">Get visa policy updates and travel tips delivered to your inbox.</p>
                <div className="flex gap-2">
                  <NewsletterInput />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">No spam. Unsubscribe anytime.</p>

                {/* Download Backup */}
                <div className="mt-5 pt-4 border-t border-border/40">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    Export Project
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">Download the complete source code of this application.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-800 dark:hover:text-amber-300"
                    onClick={handleDownloadBackup}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Complete Webapp
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    ≈ 30 MB · Includes source code, database & configs
                  </p>
                </div>
              </div>
            </div>

            <div className="footer-glow-accent h-px bg-amber-500/30 rounded-full mb-4" />

            {/* Ad Placement Zone - Premium Sponsor */}
            <div className="border border-dashed border-orange-200 dark:border-orange-800 rounded-lg p-4 text-center mb-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sponsored</p>
              <div className="h-[90px] flex items-center justify-center text-xs text-muted-foreground">
                Ad Space Available
              </div>
            </div>

            {/* Social Proof Bar */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 social-proof-badge">
                <Users className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Join 10,000+ Pakistani travelers making informed visa decisions</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </div>
            </div>

            {/* Legal Links Bar */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mb-3">
              {[
                { label: 'About', key: 'about' as const },
                { label: 'Disclaimer', key: 'disclaimer' as const },
                { label: 'Terms & Conditions', key: 'terms' as const },
                { label: 'Privacy Policy', key: 'privacy' as const },
              ].map((item, i) => (
                <Fragment key={item.key}>
                  {i > 0 && <span className="text-[11px] text-muted-foreground/40">·</span>}
                  <button className="text-[11px] text-muted-foreground hover:text-amber-600 transition-colors" onClick={() => setLegalDialog(item.key)}>
                    {item.label}
                  </button>
                </Fragment>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-[11px] text-muted-foreground">
                Disclaimer: Visa rules change frequently. Always verify with official embassy/consulate sources before application.
              </p>
              <p className="text-[11px] text-muted-foreground">
                Data sourced from official government websites · Last updated: {mounted ? new Date().toLocaleDateString() : ''}
              </p>
            </div>
          </div>
        </footer>

        {/* Back to Top Button */}
        <BackToTopButton />

        {/* Quick Actions Toolbar */}
        <QuickActionsToolbar />

        {/* Feedback Widget */}
        <FeedbackWidget />

        {/* Floating Chat Widget - only shown when AI is enabled */}
        {aiEnabled && <FloatingChatWidget />}

        {/* Keyboard Shortcuts Dialog */}
        <KeyboardShortcutsDialog open={showShortcuts} onClose={() => setShowShortcuts(false)} />

        {/* Help Center Dialog */}
        <HelpCenterDialog open={showHelpCenter} onClose={() => setShowHelpCenter(false)} />

        {/* Admin Dashboard Dialog */}
        <AdminDialog open={showAdmin} onClose={() => setShowAdmin(false)} aiEnabled={aiEnabled} setAiEnabled={setAiEnabled} />

        {/* Legal / Information Dialogs */}
        <AboutDialog open={legalDialog === 'about'} onClose={() => setLegalDialog(null)} />
        <DisclaimerDialog open={legalDialog === 'disclaimer'} onClose={() => setLegalDialog(null)} />
        <TermsDialog open={legalDialog === 'terms'} onClose={() => setLegalDialog(null)} />
        <PrivacyDialog open={legalDialog === 'privacy'} onClose={() => setLegalDialog(null)} />

        {/* C1: Mobile Bottom Navigation - Frosted Glass */}
        <nav className="mobile-bottom-nav sm:hidden">
          <div className="flex items-center justify-around relative">
            <div
              className="mobile-nav-indicator"
              style={{
                left: `${(TAB_IDS.indexOf(activeTab) / TAB_IDS.length) * 100}%`,
                width: `${100 / TAB_IDS.length}%`,
              }}
            />
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`mobile-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                }}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
}
