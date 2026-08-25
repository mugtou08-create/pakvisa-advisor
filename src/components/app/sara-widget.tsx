'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, X, Send, Sparkles, ChevronDown, ExternalLink,
  Plane, Hotel, Shield, CreditCard, Smartphone, FileText, Gift, Crown, Users,
  Zap, Share2, XIcon,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { AFFILIATE_CONFIG } from '@/lib/affiliate-config';
import { cn } from '@/lib/utils';

interface SaraMessage {
  role: 'user' | 'sara';
  content: string;
}

// Quick action buttons (zero-cost affiliate links)
const QUICK_ACTIONS = [
  { icon: FileText, label: 'Apply for e-Visa', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400', partner: 'ivisa' },
  { icon: Plane, label: 'Find Cheap Flights', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/30 dark:text-sky-400', partner: 'skyscanner' },
  { icon: Hotel, label: 'Book a Hotel', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/30 dark:text-violet-400', partner: 'booking' },
  { icon: Shield, label: 'Travel Insurance', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400', partner: 'safetywing' },
  { icon: CreditCard, label: 'Send Money Abroad', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400', partner: 'wise' },
  { icon: Smartphone, label: 'Travel eSIM', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400', partner: 'holafly' },
];

function renderSaraText(text: string): React.ReactNode {
  if (!text) return text;
  // Match affiliate service names and make them clickable
  const pattern = /(iVisa|SafetyWing|Skyscanner|Booking\.com|Wise|Holafly)/gi;
  const parts = text.split(pattern);
  if (parts.length <= 1) return <>{text}</>;

  const getUrl = (match: string): string | null => {
    const lower = match.toLowerCase();
    if (lower.includes('ivisa')) return '/api/go?p=ivisa';
    if (lower.includes('safetywing')) return AFFILIATE_CONFIG.safetyWing.getUrl();
    if (lower.includes('skyscanner')) return 'https://www.skyscanner.net/';
    if (lower.includes('booking.com')) return AFFILIATE_CONFIG.booking.getCountryUrl('');
    if (lower.includes('wise')) return AFFILIATE_CONFIG.wise.getUrl();
    if (lower.includes('holafly')) return AFFILIATE_CONFIG.holafly.getUrl();
    return null;
  };

  return (
    <>
      {parts.map((part, i) => {
        const url = getUrl(part);
        if (url) {
          return (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer sponsored"
               className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
              {part}
              <ExternalLink className="w-3 h-3 inline" />
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export function SaraWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [messages, setMessages] = useState<SaraMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [referralStatus, setReferralStatus] = useState<any>(null);
  const [siteEntryTime] = useState(Date.now());
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isProUser = useAppStore((s) => s.isProUser);
  const remainingFree = 5; // Will be fetched from signals

  // Auto-open after 18 seconds (smart trigger)
  useEffect(() => {
    if (hasAutoOpened) return;
    const timer = setTimeout(() => {
      setHasAutoOpened(true);
      setIsOpen(true);
      setUnreadCount(1);
      // Add Sara's greeting
      setMessages([{
        role: 'sara',
        content: 'Assalam o Alaikum! / Hello! I\'m Sara, your travel assistant at PakVisa. Main aapki kisi bhi trip ki planning mein madad kar sakti hoon. You can chat with me in English ya Urdu (Roman script) — jo aapko acha lage. Which language would you prefer?'
      }]);
    }, 18000);
    return () => clearTimeout(timer);
  }, [hasAutoOpened]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Fetch/create referral code on mount
  useEffect(() => {
    let sid = '';
    try { sid = localStorage.getItem('_pvsid') || ''; } catch {}
    fetch('/api/referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid }),
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setRefCode(res.data.refCode);
          setReferralStatus(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Poll referral status every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/referral').then(r => r.json()).then(res => {
        if (res.success && res.data.hasReferral) {
          setReferralStatus(res.data);
        }
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Track referral visit on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      fetch('/api/referral', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refCode: ref }),
      }).then(r => r.json()).then(res => {
        if (res.success && res.data.newReward) {
          // The referrer earned a reward, but we can't notify them directly.
          // The referrer will see it on their next status poll.
        }
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      }).catch(() => {});
    }
  }, []);

  const getTimeOnSite = useCallback(() => Math.floor((Date.now() - siteEntryTime) / 1000), [siteEntryTime]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    const userMsg: SaraMessage = { role: 'user', content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setShowQuickActions(false);
    setShowSharePanel(false);
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          message: msg,
          history: updated.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
          signals: {
            consultantQueriesUsed: 0,
            consultantQueriesMax: 5,
            currentPage: typeof window !== 'undefined' ? window.location.pathname : '',
            timeOnSite: getTimeOnSite(),
            referralData: referralStatus,
            isProUser,
          },
        }),
      });
      clearTimeout(timeoutId);

      let json: { success?: boolean; data?: string; error?: string };
      try {
        json = await res.json();
      } catch {
        console.error('Sara API: invalid JSON response, status:', res.status);
        setMessages(prev => [...prev, { role: 'sara', content: 'Something went wrong on my end. Give me a moment and try again?' }]);
        return;
      }

      if (json.success && json.data) {
        setMessages(prev => [...prev, { role: 'sara', content: json.data }]);
      } else {
        console.error('Sara API error:', json.error);
        setMessages(prev => [...prev, { role: 'sara', content: json.error || 'Something went wrong. Try again?' }]);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setMessages(prev => [...prev, { role: 'sara', content: 'That took too long. Try again — I\'ll be faster this time!' }]);
      } else {
        console.error('Sara fetch error:', err);
        setMessages(prev => [...prev, { role: 'sara', content: 'Having a little trouble connecting. Check your internet and try again?' }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (partner: string) => {
    // Direct affiliate link (zero AI cost)
    window.open(`/api/go?p=${partner}`, '_blank');
  };

  const handleWhatsAppShare = () => {
    if (!refCode) return;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pakvisa-advisor.vercel.app';
    const shareUrl = `${baseUrl}/?ref=${refCode}`;
    const shareText = encodeURIComponent(
      `Hey! Found this really helpful site for Pakistani visa info. It has an AI consultant that answers visa questions, shows costs in PKR, and covers 70+ countries. Saved me a lot of time!\n\nCheck it out: ${shareUrl}\n\nIf you're planning to travel abroad, this will help a lot.`
    );
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleChat = () => {
    setIsOpen(prev => !prev);
    if (!isOpen && messages.length === 0) {
      setMessages([{
        role: 'sara',
        content: 'Assalam o Alaikum! / Hello! I\'m Sara, your travel assistant at PakVisa. Main aapki kisi bhi trip ki planning mein madad kar sakti hoon. You can chat with me in English ya Urdu (Roman script) — jo aapko acha lage. Which language would you prefer?'
      }]);
    }
  };

  const getNextTier = () => {
    if (!referralStatus || referralStatus.rewardTier >= 5) return null;
    const count = referralStatus.visitorCount;
    if (count < 1) return { needed: 1, reward: '1 extra AI query', icon: '🎯' };
    if (count < 3) return { needed: 3 - count, reward: '5 extra AI queries', icon: '⭐' };
    if (count < 5) return { needed: 5 - count, reward: '1 day FREE Pro', icon: '👑' };
    return null;
  };

  const nextTier = getNextTier();
  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <>
      {/* Floating Bubble Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Open Sara travel assistant"
        >
          <div className="relative">
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
            {/* Main bubble */}
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25 flex items-center justify-center group-hover:shadow-xl group-hover:shadow-rose-500/30 group-hover:scale-105 transition-all duration-300">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            {/* Unread badge */}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Chat with Sara
              <div className="absolute top-full right-5 w-2 h-2 bg-popover border-r border-b border-border rotate-45 -mt-1" />
            </div>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-6rem)] rounded-2xl shadow-2xl border border-border bg-background flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Sara</p>
                <p className="text-[11px] text-white/80">Your travel assistant</p>
              </div>
            </div>
            <button onClick={toggleChat} className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Close">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {isEmpty ? (
              <div className="flex flex-col items-center text-center py-6 gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Hi! I can help with visas, flights, hotels, and more. / Salam! Main visa, flights hotels ki madad kar sakti hoon. What do you need?
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-rose-500 text-white rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    {msg.role === 'sara' ? renderSaraText(msg.content) : msg.content}
                  </div>
                </div>
              ))
            )}

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {/* Quick Actions Panel */}
            {showQuickActions && messages.length <= 1 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center gap-1.5 px-0.5">
                  <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Travel Services</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.partner}
                      onClick={() => handleQuickAction(action.partner)}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] border border-transparent hover:border-border/60 ${action.color}`}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-white/60 dark:bg-black/20'
                      )}>
                        <action.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="leading-tight">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Share & Earn Panel */}
            {showSharePanel && refCode && (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-3.5 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Share & Earn Rewards</p>
                </div>
                <div className="space-y-1.5 mb-3 text-xs text-emerald-700 dark:text-emerald-400">
                  <div className="flex items-center gap-2">
                    <span>1 friend visits</span>
                    <span className="ml-auto font-medium">+1 AI query</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>3 friends visit</span>
                    <span className="ml-auto font-medium">+5 AI queries</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>5 friends visit</span>
                    <span className="ml-auto font-medium">1 day FREE Pro</span>
                  </div>
                </div>
                {nextTier && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
                    {nextTier.icon} You need {nextTier.needed} more friend{nextTier.needed > 1 ? 's' : ''} to visit for: {nextTier.reward}
                  </p>
                )}
                {referralStatus && referralStatus.visitorCount > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
                    {referralStatus.visitorCount} friend{referralStatus.visitorCount > 1 ? 's' : ''} visited so far! Keep sharing.
                  </p>
                )}
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Share on WhatsApp
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Bar */}
          <div className="shrink-0 border-t border-border/60 bg-background">
            {/* Toggle buttons — cleaner pill design with icons */}
            <div className="flex items-center gap-2 px-3 pt-2 pb-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => { setShowQuickActions(!showQuickActions); setShowSharePanel(false); }}
                className={cn(
                  'flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all shrink-0',
                  showQuickActions
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Zap className={cn('w-3 h-3', showQuickActions && 'text-rose-500')} />
                Tools
              </button>
              <button
                onClick={() => { setShowSharePanel(!showSharePanel); setShowQuickActions(false); }}
                className={cn(
                  'flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all shrink-0',
                  showSharePanel
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Gift className={cn('w-3 h-3', showSharePanel && 'text-emerald-500')} />
                Refer & Earn
              </button>
              {referralStatus && referralStatus.bonusQueries > 0 && (
                <span className="text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-semibold shrink-0 ring-1 ring-amber-200/50 dark:ring-amber-800/30">
                  +{referralStatus.bonusQueries} queries
                </span>
              )}
              {referralStatus && referralStatus.proDaysEarned > 0 && (
                <span className="text-[11px] px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 font-semibold shrink-0 flex items-center gap-1 ring-1 ring-purple-200/50 dark:ring-purple-800/30">
                  <Crown className="w-3 h-3" /> {referralStatus.proDaysEarned}d Pro
                </span>
              )}
            </div>
            {/* Input */}
            <div className="flex items-center gap-2 px-3 pb-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Sara anything..."
                disabled={isLoading}
                className="flex-1 h-9 px-3.5 rounded-full border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/40 transition-colors disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shrink-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
