'use client';
import React, { useState } from 'react';
import { X, Crown, Check, CheckCircle2, Globe, Shield, Mail, MessageCircle, HelpCircle, BookOpen, Compass, Lightbulb, Keyboard, Plane, DollarSign, Clock, Star, MapPin, Heart, ArrowRight, Search, BarChart3, Zap, Building, FileText, Award, ClipboardList, Send, User, Loader2, Upload, LogIn } from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function PricingModal({ onClose, onOpenPaymentProof }: { onClose: () => void; onOpenPaymentProof?: () => void }) {
  const { isAuthenticated, user } = useAuthStore();
  const isAlreadyPro = isAuthenticated && user?.role === 'pro' && user.proExpiresAt && new Date(user.proExpiresAt) > new Date();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleGetPro = () => {
    if (!isAuthenticated) {
      onClose();
      window.dispatchEvent(new CustomEvent('open-auth'));
      return;
    }
    if (onOpenPaymentProof) {
      onOpenPaymentProof();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative w-full max-w-lg bg-card rounded-2xl border flex flex-col max-h-[85vh]">
        {/* Header with close button */}
        <div className="flex items-center justify-between p-5 pb-3 shrink-0 border-b">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-9 w-9 rounded-full bg-amber-500/10">
              <Crown className="h-5 w-5 text-amber-500" />
            </div>
            <h2 className="text-lg font-bold">PakVisa Pro</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto p-5 pt-4">
          <p className="text-sm text-muted-foreground text-center mb-6">
            Everything you need for stress-free visa applications
          </p>

          {/* Price section */}
          <div className="rounded-xl border p-4 text-center mb-6">
            <span className="text-4xl font-bold">$14.90</span>
            <span className="text-muted-foreground">/month</span>
            <p className="text-sm text-muted-foreground mt-1">
              or $99/year <span className="text-emerald-600 dark:text-emerald-400 font-semibold">(save 45%)</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              ≈ PKR 4,150/month · Cancel anytime
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
                Save unlimited favorites &amp; compare up to 5 countries
              </span>
            </li>
          </ul>

          {/* CTA Button */}
          {isAlreadyPro ? (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">You are already a Pro member!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your Pro access expires on {user?.proExpiresAt ? new Date(user.proExpiresAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </p>
              <Button className="mt-3" variant="outline" onClick={onClose}>Close</Button>
            </div>
          ) : (
            <>
              <Button className="w-full" size="lg" onClick={handleGetPro}>
                {isAuthenticated ? (
                  <><Upload className="h-4 w-4 mr-2" /> Upload Payment Proof</>
                ) : (
                  <><LogIn className="h-4 w-4 mr-2" /> Login to Get Pro</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                {isAuthenticated
                  ? 'Upload your bank transfer screenshot. We\'ll verify and activate Pro within 24 hours.'
                  : 'Create a free account first, then upload your payment proof to get Pro.'}
              </p>
            </>
          )}

          {/* Free plan link */}
          <button
            onClick={onClose}
            className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
          >
            Continue with Free Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Help Modal — Expanded with Glossary + Use Cases
// ============================================================
export function HelpModal({ onClose }: { onClose: () => void }) {
  // ---- Getting Started steps ----
  const quickStart = [
    { num: 1, title: 'Search or Browse Countries', desc: 'Use the search bar at the top to type any country name, or scroll down to browse all 70+ destinations in the country list.', icon: Search },
    { num: 2, title: 'Apply Filters', desc: 'Use the Region filter (Asia, Middle East, Europe, etc.) and the Access Type filter (Visa Free, Visa on Arrival, e-Visa, Embassy) to narrow results. Use Sort to order by name, cost, speed, or safety.', icon: BarChart3 },
    { num: 3, title: 'Expand a Country Card', desc: 'Click any country row to reveal detailed info: visa types available, document requirements, processing time, visa fee, monthly living cost, embassy contact, and best travel months.', icon: Globe },
    { num: 4, title: 'Use Quick Tools', desc: 'Open AI Visa Consultant for personalized Q&A, the Visa Quiz for tailored recommendations, or Compare Countries to see up to 3 destinations side by side.', icon: Zap },
    { num: 5, title: 'Save Favorites', desc: 'Click the heart icon on any country card to save it to your favorites. Use the Favorites filter to see your saved list anytime.', icon: Heart },
  ];

  // ---- Glossary terms ----
  const glossary = [
    { term: 'Visa Free', icon: CheckCircle2, color: 'text-emerald-500', definition: 'You do NOT need any visa to enter the country. Simply present your valid Pakistani passport at immigration. Some Visa Free countries may still require a return ticket, proof of accommodation, or travel insurance.' },
    { term: 'Visa on Arrival (VoA)', icon: Plane, color: 'text-amber-500', definition: 'You receive your visa at the airport or border crossing of the destination country when you arrive. No prior application is needed, but you must have a valid passport (6+ months), return ticket, hotel booking, and sometimes travel insurance.' },
    { term: 'e-Visa / Electronic Visa', icon: FileText, color: 'text-sky-500', definition: 'A visa you apply for online through the official government portal of the destination country before you travel. Typically approved within 1–5 business days. You print the approval and carry it with you to present at immigration.' },
    { term: 'Embassy Required', icon: Building, color: 'text-red-500', definition: 'You must apply in person or by mail at the embassy or consulate of the destination country. This usually involves submitting a paper application, biometrics, and supporting documents. Processing can take 2–8 weeks.' },
    { term: 'Primary Access Type', icon: Star, color: 'text-purple-500', definition: 'Each country is assigned ONE main visa category for Pakistani passport holders. Priority order: Visa Free > Visa on Arrival > e-Visa > Embassy Required. This determines which badge and color you see on each country card.' },
    { term: 'Visa Fee (USD)', icon: DollarSign, color: 'text-emerald-500', definition: 'The official government fee to obtain the visa, shown in US dollars. This does NOT include service fees, courier charges, or agent fees that may apply. Free visas or Visa on Arrival may show $0.' },
    { term: 'Processing Time', icon: Clock, color: 'text-blue-500', definition: 'The typical number of business days it takes for the visa to be approved, shown as a range (e.g., "5–15 days"). For Visa Free and VoA, processing is instant. For e-Visa it is usually 1–5 days. For embassy visas it can be 2–8 weeks.' },
    { term: 'Safety Rating', icon: Shield, color: 'text-orange-500', definition: 'A 1-to-5 score indicating the general safety level for travelers in that country. 5/5 means very safe, 1/5 means high caution advised. Ratings are based on global peace indices and travel advisories.' },
    { term: 'Best Travel Months', icon: Globe, color: 'text-teal-500', definition: 'The recommended months to visit based on weather conditions. Shown as month abbreviations (e.g., "Oct, Nov, Dec"). Consider these when planning your trip for the most comfortable experience.' },
    { term: 'Monthly Living Cost', icon: DollarSign, color: 'text-pink-500', definition: 'An estimated total monthly expense including rent, food, transport, and health insurance in the local currency converted to USD. Useful for budgeting longer stays.' },
    { term: 'Region Filter', icon: MapPin, color: 'text-indigo-500', definition: 'Groups countries by geographic area: Asia, Middle East, Africa, Europe, Americas, and Oceania. Select a region to see only countries in that area.' },
    { term: 'Favorites', icon: Heart, color: 'text-rose-500', definition: 'A personal bookmark system. Click the heart icon on any country to add/remove it from your favorites list. Favorites are saved in your browser and persist across sessions.' },
    { term: 'Compare Tool', icon: BarChart3, color: 'text-cyan-500', definition: 'A feature that lets you select up to 3 countries and view their visa requirements, fees, processing times, safety ratings, and costs side by side in a comparison table.' },
    { term: 'AI Visa Consultant', icon: MessageCircle, color: 'text-violet-500', definition: 'An AI-powered chat assistant that can answer your specific visa questions, explain requirements, suggest countries based on your preferences, and guide you through the application process.' },
    { term: 'Visa Quiz', icon: ClipboardList, color: 'text-lime-500', definition: 'A short questionnaire that asks about your travel purpose, budget, timeline, and preferences, then recommends the best countries and visa options for your specific situation.' },
    { term: 'Schengen Area', icon: Globe, color: 'text-blue-500', definition: 'A zone of 27 European countries with a single visa policy. One Schengen visa allows travel across all member states. Pakistani citizens must apply for a Schengen visa at the embassy of their main destination.' },
    { term: 'Passport Power Ranking', icon: Award, color: 'text-amber-500', definition: 'A global ranking (Henley Passport Index) that scores passports based on the number of destinations their holders can visit without a visa. Pakistan is currently ranked around #106 globally.' },
    { term: 'Pagination', icon: ArrowRight, color: 'text-gray-500', definition: 'Countries are displayed 15 per page. Use the page numbers, Previous/Next buttons, or First/Last buttons at the bottom of the list to navigate through all destinations.' },
  ];

  // ---- 5 Use Case Scenarios ----
  const useCases = [
    {
      title: 'Quick Visa-Free Vacation',
      persona: 'Family holiday planner',
      emoji: '🏖️',
      difficulty: 'Beginner',
      steps: [
        'Click the <b>"Visa Free"</b> filter button under "All Destinations". This instantly shows only countries where you need NO visa.',
        'Optionally click a <b>Region</b> filter (e.g., "Asia") to narrow destinations by geography.',
        'Sort by <b>"Safest"</b> to prioritize family-friendly destinations with high safety ratings.',
        'Click on a country card (e.g., Malaysia) to see best travel months, monthly living costs, and safety details.',
        'Click the heart icon to save your top choices, then use the <b>Compare</b> tool to compare 2–3 options side by side.',
      ],
      tip: 'Visa Free means zero visa paperwork — just pack your bags and go!'
    },
    {
      title: 'Umrah or Hajj Pilgrimage',
      persona: 'Religious traveler',
      emoji: '🕌',
      difficulty: 'Beginner',
      steps: [
        'Type <b>"Saudi Arabia"</b> in the search bar or find it in the country list under the "Middle East" region.',
        'Click the Saudi Arabia card to expand details. You\'ll see it offers an <b>e-Visa</b> for tourism/Umrah.',
        'Review the document requirements listed (passport photos, bank statements, travel itinerary).',
        'Check the <b>visa fee</b> (shown in USD with PKR conversion) and <b>processing time</b> (typically 3–7 days).',
        'For personalized guidance, open the <b>AI Visa Consultant</b> and ask "What documents do I need for Saudi e-Visa as a Pakistani?"',
      ],
      tip: 'Apply for the Saudi e-Visa at least 2 weeks before your planned travel date. The e-Visa portal is official and straightforward.'
    },
    {
      title: 'European Schengen Visa Application',
      persona: 'Tourist or business traveler',
      emoji: '🏰',
      difficulty: 'Advanced',
      steps: [
        'Click the <b>"Embassy"</b> filter to see all countries requiring an embassy visa. This includes most of Europe.',
        'Click any European country card (e.g., Germany, France, Spain) to see <b>embassy contact details</b>, processing times, and requirements.',
        'Note the <b>processing time</b> (usually 15–30 days) and plan to apply at least 6 weeks in advance.',
        'Review the full requirements list including bank statements, employment letter, travel insurance, and hotel bookings.',
        'Use the <b>AI Visa Consultant</b> to ask specific questions like "What is the Schengen visa process for Pakistanis?"',
      ],
      tip: 'A single Schengen visa lets you visit 27 European countries. Apply at the embassy of the country where you\'ll spend the most time.'
    },
    {
      title: 'Budget-Friendly Travel Planning',
      persona: 'Student or budget traveler',
      emoji: '💰',
      difficulty: 'Beginner',
      steps: [
        'In the Sort dropdown (next to filters), select <b>"Cheapest"</b> to rank all countries from lowest to highest visa fee.',
        'Filter by <b>"Visa Free"</b> or <b>"Visa on Arrival"</b> to eliminate visa application costs entirely.',
        'Click country cards to check <b>monthly living costs</b> — shown as a breakdown of rent, food, transport, and insurance.',
        'Use the <b>Compare</b> tool to compare 2–3 affordable destinations side by side, looking at both visa fees AND living costs.',
        'Sort by <b>"Safest"</b> to make sure you\'re choosing a destination that\'s both affordable AND secure.',
      ],
      tip: 'Some of the cheapest destinations (e.g., Azerbaijan Visa Free, Nepal Visa on Arrival) also offer great cultural experiences!'
    },
    {
      title: 'Study or Work Abroad Research',
      persona: 'Student or professional',
      emoji: '🎓',
      difficulty: 'Intermediate',
      steps: [
        'Start with the <b>Visa Quiz</b> — answer questions about your travel purpose, budget, and timeline to get personalized country recommendations.',
        'Search for specific countries (e.g., UK, Australia, Germany) and review their embassy requirements for student/work visas.',
        'Check <b>processing times</b> carefully — student visas for countries like Australia or Canada can take 30–60 days.',
        'Click expanded country cards to find <b>embassy addresses in Islamabad</b>, phone numbers, and official websites for applications.',
        'Ask the <b>AI Visa Consultant</b> specific questions like "What are the requirements for a UK student visa as a Pakistani?" for detailed guidance.',
      ],
      tip: 'For study visas, always verify requirements directly with the embassy website — requirements change frequently and vary by program.',
    },
    {
      title: 'Medical Tourism Research',
      persona: 'Health-conscious traveler',
      emoji: '🏥',
      difficulty: 'Intermediate',
      steps: [
        'Start by searching for countries known for medical tourism (e.g., Turkey, India, Thailand) in the search bar.',
        'Click each country card and check <b>visa type</b>, <b>processing time</b>, and <b>visa fee</b> to estimate how quickly you can get there.',
        'Review <b>monthly living costs</b> to estimate accommodation and food expenses during your recovery period.',
        'Check the <b>best travel months</b> for each destination to plan your trip during comfortable weather.',
        'Use the <b>Compare</b> tool to compare Turkey vs India vs Thailand side by side — look at visa ease, cost, safety, and processing speed.',
      ],
      tip: 'Turkey (e-Visa, ~$50) and India (e-Visa) are popular for Pakistani medical tourists due to fast visa processing and affordable healthcare.'
    },
    {
      title: 'Last-Minute Emergency Travel',
      persona: 'Traveler with urgent plans',
      emoji: '✈️',
      difficulty: 'Beginner',
      steps: [
        'Filter by <b>"Visa Free"</b> — these countries require ZERO visa processing time, so you can travel immediately.',
        'If no visa-free country fits your needs, filter by <b>"Visa on Arrival"</b> — visas are issued at the airport in minutes.',
        'Sort by <b>"Fastest"</b> to see all countries ranked by minimum processing time.',
        'For e-Visa countries, sort by <b>"Cheapest"</b> — e-Visas can be approved in 1–3 days for countries like Armenia, Kenya, or Cambodia.',
        'Verify the <b>requirements</b> by clicking the country card — even Visa on Arrival may need return ticket and hotel booking proof.',
      ],
      tip: 'The fastest options for Pakistani passport holders: Azerbaijan (Visa Free), Malaysia (Visa Free), UAE/Thailand (Visa on Arrival at airport).'
    },
    {
      title: 'Family Visit — Reuniting Abroad',
      persona: 'Traveler visiting family',
      emoji: '👨‍👩‍👧‍👦',
      difficulty: 'Intermediate',
      steps: [
        'Search for the country where your family lives (e.g., UK, USA, Saudi Arabia, Canada).',
        'Click the country card and review the <b>embassy details</b> — address in Islamabad, phone, and official appointment link.',
        'Check <b>processing time</b> carefully — countries like USA/UK can take 4–8 weeks. Plan well in advance.',
        'Review the <b>document requirements</b> — family visits typically need an invitation letter, sponsor documents, and proof of relationship.',
        'Use the <b>AI Visa Consultant</b> and ask: "What documents do I need for a family visit visa to [country] as a Pakistani?"',
      ],
      tip: 'For family visit visas, a formal invitation letter from your host and proof of their legal status in the destination country are usually mandatory.',
    },
  ];

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />

      {/* Card */}
      <div className="relative w-full max-w-2xl bg-card rounded-2xl border flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 pb-3 shrink-0 border-b">
          <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 text-primary shrink-0">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h2 className="text-lg font-bold flex-1">Help Center</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="start" className="flex flex-col flex-1 min-h-0">
          <div className="px-5 pt-3 shrink-0">
            <TabsList className="w-full">
              <TabsTrigger value="start" className="flex-1 text-xs"><BookOpen className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Get Started</TabsTrigger>
              <TabsTrigger value="glossary" className="flex-1 text-xs"><Search className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Glossary</TabsTrigger>
              <TabsTrigger value="usecases" className="flex-1 text-xs"><Compass className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Use Cases</TabsTrigger>
              <TabsTrigger value="tips" className="flex-1 text-xs"><Lightbulb className="h-3.5 w-3.5 mr-1 hidden sm:inline" />Tips</TabsTrigger>
            </TabsList>
          </div>

          {/* Scrollable Content */}
          <div className="px-5 pb-5 overflow-y-auto flex-1 min-h-0">

            {/* ====== TAB 1: Getting Started ====== */}
            <TabsContent value="start" className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Welcome to PakVisa Advisor! Follow these steps to get the most out of the tool:
              </p>
              <div className="space-y-4">
                {quickStart.map((step) => (
                  <div key={step.num} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {step.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{step.title}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3 mt-4">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                  <span className="font-semibold">100% Free</span> — Visa search, requirements viewing, and basic AI queries are completely free.
                  Upgrade to PakVisa Pro for document checklists, step-by-step guides, and unlimited AI access.
                </p>
              </div>
            </TabsContent>

            {/* ====== TAB 2: Glossary ====== */}
            <TabsContent value="glossary" className="mt-4">
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Key terms used throughout PakVisa Advisor. Click any term to expand its definition.
              </p>
              <Accordion type="multiple" className="space-y-1">
                {glossary.map((item) => (
                  <AccordionItem key={item.term} value={item.term} className="border rounded-lg px-3">
                    <AccordionTrigger className="text-sm py-3 hover:no-underline">
                      <div className="flex items-center gap-2.5">
                        <item.icon className={`h-4 w-4 ${item.color} shrink-0`} />
                        <span className="font-medium">{item.term}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-3">
                      {item.definition}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>

            {/* ====== TAB 3: Use Cases ====== */}
            <TabsContent value="usecases" className="mt-4 space-y-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Step-by-step walkthroughs for common travel scenarios. Follow along to get results fast!
              </p>
              {useCases.map((uc, idx) => (
                <div key={idx} className="rounded-xl border p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{uc.emoji}</span>
                      <div>
                        <p className="font-semibold text-sm">{uc.title}</p>
                        <p className="text-xs text-muted-foreground">{uc.persona}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {uc.difficulty}
                    </Badge>
                  </div>

                  {/* Steps */}
                  <ol className="space-y-2">
                    {uc.steps.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2.5">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground mt-0.5">
                          {sIdx + 1}
                        </span>
                        <p className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: step }} />
                      </li>
                    ))}
                  </ol>

                  {/* Tip */}
                  <div className="rounded-lg bg-amber-500/5 border border-amber-500/15 p-2.5">
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      <span className="font-semibold">💡 Pro Tip:</span> {uc.tip}
                    </p>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* ====== TAB 4: Tips & Shortcuts ====== */}
            <TabsContent value="tips" className="mt-4 space-y-5">
              {/* Keyboard Shortcuts */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Keyboard className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Keyboard Shortcuts</h3>
                </div>
                <div className="rounded-lg border overflow-hidden divide-y">
                  {[
                    { keys: 'Ctrl + K', action: 'Focus the search bar instantly' },
                    { keys: 'Esc', action: 'Close any open modal or dialog' },
                  ].map((sc, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">{sc.action}</span>
                      <kbd className="rounded border bg-muted px-2 py-0.5 text-xs font-mono">{sc.keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tips */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-sm">Pro Tips</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { title: 'Combine filters for precise results', desc: 'Use Region + Access Type + Sort together. For example: filter "Middle East" + "Visa on Arrival" + Sort by "Cheapest" to find the cheapest VoA countries in the Middle East.' },
                    { title: 'Start broad, then narrow down', desc: 'Begin with "All Regions" and "All Types" to see everything, then apply filters one at a time. This way you won\'t accidentally miss a destination.' },
                    { title: 'Use the AI Consultant for edge cases', desc: 'Visa rules can be complex. If you have a unique situation (previous rejection, dual nationality, traveling with minors), ask the AI for specific guidance.' },
                    { title: 'Check embassy info before applying', desc: 'Click on any Embassy Required country to find the embassy address in Islamabad, phone numbers, working hours, and a direct link to book appointments.' },
                    { title: 'Trust but verify', desc: 'Our data is sourced from official government websites and updated regularly. However, visa policies can change with little notice. Always double-check with the embassy before making final travel plans.' },
                    { title: 'Save your favorites', desc: 'Planning multiple trips? Use the heart icon to bookmark countries. Your favorites are saved locally in your browser for easy access next time.' },
                  ].map((tip, i) => (
                    <div key={i} className="rounded-lg border p-3">
                      <p className="font-medium text-sm mb-1">{tip.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Understanding the Country Card */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Understanding a Country Card</h3>
                </div>
                <div className="rounded-lg border p-3 space-y-2">
                  {[
                    { label: 'Badge (Visa Free / VoA / e-Visa / Embassy)', desc: 'The colored badge shows the primary access type — this is the easiest/most common way for Pakistanis to get a visa for that country.' },
                    { label: 'Fee ($XX)', desc: 'Official government visa fee in USD. $0 means free or fee not applicable (Visa Free / VoA).' },
                    { label: 'Processing (X–Xd)', desc: 'Business days from submission to approval. Instant for Visa Free/VoA.' },
                    { label: 'Safety (X/5)', desc: 'General safety rating for travelers. Higher is safer.' },
                    { label: 'Expanded details', desc: 'Click the card to see: document requirements, embassy address, monthly cost breakdown, best travel months, and all available visa types.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
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
// Embedded Contact Form (used inside ContactModal)
// ============================================================
function ContactFormEmbedded() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in name, email, and message');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setSent(true);
        setName(''); setEmail(''); setSubject(''); setMessage('');
        setTimeout(() => setSent(false), 5000);
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <h4 className="font-semibold text-lg">Message Sent!</h4>
        <p className="text-sm text-muted-foreground mt-1">Thank you for reaching out. We will respond shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">Have a question? We will get back to you within 24 hours.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="modal-contact-name" className="text-sm font-medium">
            <User className="w-3.5 h-3.5 inline mr-1" /> Name <span className="text-red-500">*</span>
          </Label>
          <Input id="modal-contact-name" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="modal-contact-email" className="text-sm font-medium">
            <Mail className="w-3.5 h-3.5 inline mr-1" /> Email <span className="text-red-500">*</span>
          </Label>
          <Input id="modal-contact-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="modal-contact-subject" className="text-sm font-medium">
          <MessageCircle className="w-3.5 h-3.5 inline mr-1" /> Subject <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input id="modal-contact-subject" placeholder="e.g. Visa question about Turkey" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="modal-contact-message" className="text-sm font-medium">Message <span className="text-red-500">*</span></Label>
        <Textarea id="modal-contact-message" placeholder="Tell us how we can help you..." value={message} onChange={(e) => setMessage(e.target.value)} rows={4} maxLength={2000} className="resize-none" />
        <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
      </div>
      <Button type="submit" disabled={sending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
        {sending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>) : (<><Send className="w-4 h-4 mr-2" /> Send Message</>)}
      </Button>
    </form>
  );
}

// ============================================================
// Contact Modal
// ============================================================
export function ContactModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell title="Contact Us" icon={<Mail className="h-5 w-5" />} onClose={onClose}>
      <ContactFormEmbedded />
    </ModalShell>
  );
}
