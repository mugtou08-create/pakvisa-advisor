'use client';
import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, ArrowRight, Crown, ShieldCheck, AlertCircle, Info, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  meta?: {
    dataVerified?: boolean;
    detectedCountry?: string;
    sourceUrl?: string;
    lastUpdated?: string;
  };
}

const SUGGESTIONS_FREE = [
  'What documents do I need for Turkey e-visa?',
  'Which countries can I visit visa-free?',
  'How to apply for UAE visa from Pakistan?',
];

const SUGGESTIONS_PRO = [
  'What do I need for a Germany Schengen visa?',
  'Compare living costs in Malaysia vs Thailand',
  'What vaccines do I need for Kenya?',
];

export function AiChatPanel({ onClose }: { onClose: () => void }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [globalFreshness, setGlobalFreshness] = useState('');
  const [remainingFree, setRemainingFree] = useState(5);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isProUser = useAppStore((s) => s.isProUser);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (text?: string) => {
    const messageText = text?.trim() || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: messageText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: updatedMessages.slice(0, -1), // Don't send the current user message in history (it's in message)
          isPro: isProUser,
        }),
      });

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
            meta: { dataVerified: false },
          },
        ]);
        return;
      }

      const json = await res.json();
      if (json.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: json.data,
            meta: json.meta ? {
              dataVerified: json.meta.dataVerified,
              detectedCountry: json.meta.detectedCountry,
              sourceUrl: json.meta.sourceUrl,
              lastUpdated: json.meta.lastUpdated,
            } : undefined,
          },
        ]);
        if (json.meta?.globalFreshness) setGlobalFreshness(json.meta.globalFreshness);
        if (json.meta?.remainingFreeQueries !== undefined && json.meta.remainingFreeQueries >= 0) {
          setRemainingFree(json.meta.remainingFreeQueries);
        }
      } else if (json.code === 'LIMIT_REACHED') {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: '⚠️ You\'ve reached the free daily limit of 5 queries. Upgrade to Pro for unlimited AI access with verified data.',
            meta: { dataVerified: false },
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
            meta: { dataVerified: false },
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Unable to reach the server. Please check your connection and try again.',
          meta: { dataVerified: false },
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            AI Visa Consultant
          </h2>
          {isProUser ? (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-xs gap-1">
              <ShieldCheck className="w-3 h-3" /> Pro (Demo) · Data Verified
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs font-normal">
              Free · {remainingFree}/5 queries left
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-full" aria-label="Close chat">
          <X className="h-4 w-4" />
        </Button>
      </header>

      {/* Free → Pro Upgrade Banner (only for free users) */}
      {!isProUser && messages.length >= 3 && (
        <div className="px-4 sm:px-6 py-2.5 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <Crown className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300 flex-1">
              Upgrade to <strong>Pro</strong> for unlimited queries + AI answers verified with real database data
            </p>
            <button
              onClick={() => useAppStore.getState().setIsProUser(true)}
              className="text-xs font-medium px-3 py-1 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors"
            >
              Try Pro Demo
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {isEmpty ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 gap-4">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Ask me anything about visas
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {isProUser
                  ? 'I provide data-verified answers using our comprehensive database of 70+ countries — requirements, costs, embassy info, and more.'
                  : 'I can help you with visa requirements, application processes, and travel advice for Pakistani passport holders.'}
              </p>
              {isProUser && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    Database-verified answers active — mentions of countries auto-inject real data
                  </span>
                </div>
              )}
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 mt-2">
                {(isProUser ? SUGGESTIONS_PRO : SUGGESTIONS_FREE).map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="text-left text-sm px-4 py-2.5 rounded-full border border-border bg-muted/50 hover:bg-muted hover:border-primary/30 transition-colors cursor-pointer max-w-xs"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%] sm:max-w-[75%]">
                    {/* Assistant message bubble + meta */}
                    <div
                      className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Data Verified Badge + Metadata */}
                    {msg.role === 'assistant' && msg.meta && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 px-1">
                        {msg.meta.dataVerified ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 text-[10px] gap-1 px-2 py-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" /> Data Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] gap-1 px-2 py-0.5 text-muted-foreground">
                            <Info className="w-2.5 h-2.5" /> General Info
                          </Badge>
                        )}
                        {msg.meta.detectedCountry && (
                          <span className="text-[10px] text-muted-foreground">
                            {msg.meta.detectedCountry}
                            {msg.meta.lastUpdated && ` · Updated ${msg.meta.lastUpdated}`}
                          </span>
                        )}
                        {msg.meta.sourceUrl && (
                          <a
                            href={msg.meta.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline"
                          >
                            Source ↗
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:300ms]" />
                    {isProUser && (
                      <span className="ml-2 text-[10px] text-emerald-600 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 animate-pulse" /> Verifying data...
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </main>

      {/* Footer with Data Freshness + Input */}
      <footer className="border-t border-border">
        {/* Data Freshness Notice */}
        <div className="px-4 sm:px-6 pt-2.5 pb-0">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" />
                {globalFreshness
                  ? <>Visa data last updated: <strong>{globalFreshness}</strong>. Always verify with official embassy.</>
                  : 'Visa policies change frequently. Verify with the official embassy before travel.'}
              </p>
              {isProUser && globalFreshness && (
                <span className="text-[10px] text-emerald-600 font-medium">Pro · Database Connected</span>
              )}
            </div>
          </div>
        </div>
        {/* Input Area */}
        <div className="px-4 sm:px-6 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isProUser
                  ? 'Ask about any country — data verified from our database...'
                  : 'Ask about visa requirements, documents, or processes...'
              }
              disabled={isLoading}
              className="flex-1 h-11 px-4 rounded-full border border-border bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {isProUser ? (
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="h-11 w-11 rounded-full shrink-0"
                aria-label="Send message"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading || remainingFree <= 0}
                className="h-11 w-11 rounded-full shrink-0"
                aria-label="Send message"
              >
                {remainingFree <= 0 ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          {!isProUser && remainingFree <= 0 && (
            <div className="max-w-2xl mx-auto mt-2">
              <button
                onClick={() => useAppStore.getState().setIsProUser(true)}
                className="w-full text-center text-xs font-medium px-4 py-2 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 transition-colors flex items-center justify-center gap-2"
              >
                <Crown className="w-3.5 h-3.5" />
                Try Pro Demo — Unlimited AI Queries + Verified Data
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
