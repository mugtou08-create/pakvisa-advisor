'use client';
import React from 'react';
import { X, Crown, Check, Globe, Shield, Mail, MessageCircle } from 'lucide-react';
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

// ============================================================
// Shared Modal Shell (scrollable content for longer modals)
// ============================================================
function ModalShell({ title, icon, onClose, children }: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-card rounded-2xl border flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 pb-4 shrink-0">
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary shrink-0">
            {icon}
          </div>
          <h2 className="text-lg font-bold flex-1">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {/* Scrollable Content */}
        <div className="px-6 pb-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ============================================================
// About Modal
// ============================================================
export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="About PakVisa Advisor" icon={<Globe className="h-5 w-5" />} onClose={onClose}>
      <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          <span className="text-foreground font-semibold">PakVisa Advisor</span> is a free, AI-powered visa checking tool
          designed specifically for Pakistani passport holders. We cover <span className="text-foreground font-medium">70+ countries</span> and
          <span className="text-foreground font-medium"> 440+ visa types</span> to help you quickly find visa requirements,
          fees, processing times, and more.
        </p>

        <div className="space-y-3">
          <h3 className="text-foreground font-semibold text-sm">What We Offer</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>Instant visa search for 70+ countries with detailed requirements</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>Visa type classification: Visa Free, Visa on Arrival, e-Visa, Embassy Required</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>Cost breakdowns including fees, service charges, and monthly living costs</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>AI-powered visa consultant to answer your specific questions</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>Best travel months and safety ratings for every destination</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-foreground font-semibold text-sm">Our Mission</h3>
          <p>
            We believe visa information should be accessible, accurate, and free. Pakistani travelers
            deserve a reliable tool that saves them time and money when planning international trips.
          </p>
        </div>

        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground text-center">
            Data is sourced from official government websites and updated regularly.
            Last updated: <span className="text-foreground font-medium">2025</span>.
          </p>
        </div>
      </div>
    </ModalShell>
  );
}

// ============================================================
// Privacy Policy Modal
// ============================================================
export function PrivacyModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="Privacy Policy" icon={<Shield className="h-5 w-5" />} onClose={onClose}>
      <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p className="text-xs">Last updated: January 2025</p>

        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-sm">Information We Collect</h3>
          <p>
            PakVisa Advisor collects minimal data to provide our service. We do not require
            account registration for basic features.
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><span className="text-foreground font-medium">Usage Data:</span> Search queries and country views are anonymized and used only to improve our service.</li>
            <li><span className="text-foreground font-medium">AI Queries:</span> When using the AI consultant, your questions are processed to generate responses. Questions are not stored permanently.</li>
            <li><span className="text-foreground font-medium">Premium Users:</span> Email address and payment info are handled securely by our payment processor. We never store credit card details.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-sm">How We Use Your Data</h3>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>To provide visa information and AI responses</li>
            <li>To improve our service and user experience</li>
            <li>To send policy change alerts (premium feature, opt-in only)</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-sm">Cookies & Local Storage</h3>
          <p>
            We use browser local storage to save your preferences (theme, favorites).
            No tracking cookies from third parties are used on the free tier.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-sm">Data Sharing</h3>
          <p>
            We do not sell, share, or distribute your personal information to any third parties
            except as required by law or to our payment processor for subscription billing.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-sm">Your Rights</h3>
          <p>
            You may request deletion of your account and all associated data at any time by
            contacting us. Premium subscriptions can be cancelled instantly from your account settings.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-sm">Contact</h3>
          <p>
            For privacy-related inquiries, please reach out to us at
            <span className="text-foreground font-medium"> privacy@pakvisaadvisor.com</span>.
          </p>
        </div>
      </div>
    </ModalShell>
  );
}

// ============================================================
// Terms of Service Modal
// ============================================================
export function TermsModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="Terms of Service" icon={<Shield className="h-5 w-5" />} onClose={onClose}>
      <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p className="text-xs">Last updated: January 2025</p>

        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-sm">1. Acceptance of Terms</h3>
          <p>
            By using PakVisa Advisor, you agree to these Terms of Service. If you do not agree,
            please do not use the service.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-sm">2. Service Description</h3>
          <p>
            PakVisa Advisor provides visa requirement information for educational and planning
            purposes. We are not a government agency, embassy, or visa processing service.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-sm">3. Accuracy Disclaimer</h3>
          <p>
            While we strive to keep our data accurate and up-to-date, visa policies change frequently.
            Always verify requirements with the official embassy or consulate website before making
            travel plans. PakVisa Advisor is not responsible for decisions made based on outdated or
            incorrect information.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-sm">4. Free vs. Premium Features</h3>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><span className="text-foreground font-medium">Free:</span> Visa search, basic requirements, and limited AI queries.</li>
            <li><span className="text-foreground font-medium">Premium:</span> Document checklists, step-by-step guides, PDF reports, and unlimited AI access.</li>
          </ul>
          <p>Premium subscriptions auto-renew unless cancelled. Refunds are handled on a case-by-case basis.</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-sm">5. User Conduct</h3>
          <p>Users agree not to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use the service for illegal purposes</li>
            <li>Attempt to scrape, hack, or disrupt the service</li>
            <li>Redistribute our data without permission</li>
            <li>Misuse the AI consultant feature</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-sm">6. Limitation of Liability</h3>
          <p>
            PakVisa Advisor is provided &ldquo;as is&rdquo; without warranties of any kind. We are not liable
            for any losses, delays, or issues arising from the use of our service.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-foreground font-semibold text-sm">7. Changes to Terms</h3>
          <p>
            We may update these terms periodically. Continued use of the service after changes
            constitutes acceptance of the updated terms.
          </p>
        </div>
      </div>
    </ModalShell>
  );
}

// ============================================================
// Contact Modal
// ============================================================
export function ContactModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="Contact Us" icon={<Mail className="h-5 w-5" />} onClose={onClose}>
      <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          We&apos;d love to hear from you! Whether you have a question, feedback, or found an issue
          with our visa data, please reach out.
        </p>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border">
            <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-foreground font-medium text-sm">Email</p>
              <p className="text-sm">contact@pakvisaadvisor.com</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border">
            <MessageCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-foreground font-medium text-sm">AI Chat Support</p>
              <p className="text-sm">
                Use our built-in AI Visa Consultant for instant answers to common visa questions.
                Available 24/7.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-foreground font-semibold text-sm">Common Topics</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>Report incorrect visa data for a specific country</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>Request a new country or feature to be added</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>Report a bug or technical issue</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>Partnership or advertising inquiries</span>
            </li>
          </ul>
        </div>

        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground text-center">
            We typically respond within 24–48 hours. For urgent visa questions,
            use our AI Consultant for instant help.
          </p>
        </div>
      </div>
    </ModalShell>
  );
}
