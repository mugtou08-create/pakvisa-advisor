'use client';
import React from 'react';
import { X, Crown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PricingModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative w-full max-w-lg bg-card rounded-2xl border p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="rounded-full bg-amber-500/10 p-3 mb-3">
            <Crown className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold">PakVisa Pro</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Everything you need for stress-free visa applications
          </p>
        </div>

        {/* Price section */}
        <div className="rounded-xl border p-4 text-center mb-6">
          <span className="text-4xl font-bold">$4.99</span>
          <span className="text-muted-foreground">/month</span>
          <p className="text-sm text-muted-foreground mt-1">
            or $29/year (save 50%)
          </p>
        </div>

        {/* Feature list */}
        <ul className="space-y-3 mb-6">
          <li className="flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <span className="text-sm">Document checklist for every country</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <span className="text-sm">Step-by-step application guides</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <span className="text-sm">Total cost calculator with hidden fees</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <span className="text-sm">Visa policy change alerts via email</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <span className="text-sm">Unlimited AI consultant queries</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <span className="text-sm">PDF export of visa reports</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <span className="text-sm">Application deadline tracker</span>
          </li>
          <li className="flex items-start gap-3">
            <Check className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
            <span className="text-sm">
              Save unlimited favorites & compare up to 5 countries
            </span>
          </li>
        </ul>

        {/* CTA Button */}
        <Button className="w-full" size="lg">
          <Crown className="h-4 w-4 mr-2" />
          Start Free Trial (7 days)
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-3">
          Cancel anytime. No questions asked.
        </p>

        {/* Free plan link */}
        <button
          onClick={onClose}
          className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
        >
          Continue with Free Plan
        </button>
      </div>
    </div>
  );
}

export function HelpModal({ onClose }: { onClose: () => void }) {
  const steps = [
    {
      title: 'Search a Country',
      description:
        'Type any country name in the search bar to see visa requirements for Pakistani passport holders.',
    },
    {
      title: 'View Details',
      description:
        'Click on any country card to see visa type, fees, processing time, requirements, and best travel months.',
    },
    {
      title: 'Use AI Assistant',
      description:
        'Ask our AI any visa-related question. Get personalized advice based on your situation.',
    },
    {
      title: 'Compare Countries',
      description:
        'Use the compare tool to see visa requirements side by side for multiple countries.',
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative w-full max-w-lg bg-card rounded-2xl border p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-center mb-6">
          How to Use PakVisa Advisor
        </h2>

        {/* Steps */}
        <div className="space-y-5 mb-6">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-sm">{step.title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            <span className="font-medium text-foreground">100% Free</span> — Visa search, requirements, and basic AI queries are completely free.
            Upgrade to PakVisa Pro for document checklists, step-by-step guides, and more.
          </p>
        </div>
      </div>
    </div>
  );
}
