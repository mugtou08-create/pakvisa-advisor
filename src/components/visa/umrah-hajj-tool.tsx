'use client';

import React, { useState, useMemo } from 'react';
import {
  Plane, Calendar, FileText, CreditCard, Heart, Shield, Phone,
  MapPin, ChevronDown, ChevronUp, Check, ExternalLink, Syringe,
  Building, Mail, Clock, Luggage, Shirt, Pill, BookOpen, Smartphone,
  Sun, Umbrella, Info, AlertTriangle, DollarSign, CheckCircle2, UserCheck,
  Package, Hotel, Utensils, Car, Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

// ============================================================
// Timeline Data
// ============================================================

type TimelineStep = {
  id: string;
  title: string;
  icon: React.ReactNode;
  details: string[];
};

const UMRAH_TIMELINE: TimelineStep[] = [
  {
    id: 'prep',
    title: 'Preparation (4-8 weeks before)',
    icon: <Calendar className="w-5 h-5" />,
    details: [
      'Apply for Saudi e-Visa online via visitsaudi.com',
      'Ensure passport has 6+ months validity',
      'Book round-trip flights (PIA, Saudi Airlines, AirSial)',
      'Book accommodation near Haram (walkable distance recommended)',
      'Get mandatory travel insurance with COVID/medical coverage',
      'Get meningitis vaccination certificate (required)',
      'Learn Ihram rules and dua guidelines',
      'Download the Nusuk app for itinerary and guidance',
    ],
  },
  {
    id: 'docs',
    title: 'Documents (2-4 weeks before)',
    icon: <FileText className="w-5 h-5" />,
    details: [
      'Valid Pakistani passport (original + 2 photocopies)',
      'Passport-sized photos (white background, 4x6cm)',
      'Meningitis vaccination certificate (yellow card)',
      'Flight booking confirmation (print + digital)',
      'Hotel reservation confirmation',
      'Travel insurance policy document',
      'Bank statement showing sufficient funds (PKR 300K+ recommended)',
      'CNIC copy for identity verification',
    ],
  },
  {
    id: 'apply',
    title: 'Application (1-2 weeks before)',
    icon: <CreditCard className="w-5 h-5" />,
    details: [
      'Apply for Saudi e-Visa at visa.visitsaudi.com',
      'Upload documents and passport photo',
      'Pay visa fee online (approximately SAR 300 / PKR 22,000)',
      'Receive e-Visa approval via email (typically 1-5 business days)',
      'Print e-Visa and carry with passport during travel',
      'Complete registration on the Muqeem portal after arrival',
    ],
  },
  {
    id: 'travel',
    title: 'Travel Day',
    icon: <Plane className="w-5 h-5" />,
    details: [
      'Arrive at airport 4 hours before departure',
      'Carry all printed documents and vaccination card',
      'Wear comfortable clothing (Ihram can be worn at airport or in plane)',
      'Keep important items in carry-on (medicines, phone charger, documents)',
      'Upon arrival in Jeddah/Madinah: immigration, baggage, currency exchange',
      'Pre-booked transport to hotel (taxi/Uber/Careem)',
    ],
  },
  {
    id: 'visit',
    title: 'During Your Visit',
    icon: <Heart className="w-5 h-5" />,
    details: [
      'Perform Umrah following the Nusuk app guidance',
      'Maintain Ihram rules during the pilgrimage',
      'Stay hydrated — Makkah and Madinah can be very hot',
      'Keep emergency numbers saved (Pakistan Embassy, local police)',
      'Respect local customs and Saudi laws',
      'Use the Saudi Ministry of Hajj & Umrah helpline if needed: 920020811',
    ],
  },
];

const HAJJ_TIMELINE: TimelineStep[] = [
  {
    id: 'prep',
    title: 'Preparation (3-6 months before)',
    icon: <Calendar className="w-5 h-5" />,
    details: [
      'Apply through the Pakistan Ministry of Religious Affairs Hajj scheme OR a licensed private Hajj operator',
      'Government Hajj scheme: Apply at hajj.gov.pk or designated bank branches (HBL, UBL, MCB)',
      'Private Hajj operators must be MoRA-approved — verify license at hajj.gov.pk',
      'Ensure passport has 12+ months validity (longer than Umrah)',
      'Start physical fitness preparation — Hajj involves extensive walking',
      'Get mandatory vaccinations: meningitis, COVID booster, seasonal flu',
      'Begin learning Hajj rituals (Rami, Tawaf, Saee, Wuquf)',
    ],
  },
  {
    id: 'docs',
    title: 'Documents (2-3 months before)',
    icon: <FileText className="w-5 h-5" />,
    details: [
      'Valid Pakistani passport (original + photocopies)',
      'Hajj application form (government scheme) or contract with private operator',
      'Meningitis vaccination certificate (ACWY)',
      'COVID-19 vaccination certificate',
      'Passport-sized photos (5-6 copies)',
      'Medical fitness certificate',
      'CNIC and family registration certificate (for family packages)',
      'Payment receipt / draft for Hajj package',
    ],
  },
  {
    id: 'apply',
    title: 'Application & Payment',
    icon: <CreditCard className="w-5 h-5" />,
    details: [
      'Government scheme: Submit application + full payment (PKR 1,070,000 - 1,175,000 approx for 2025)',
      'Private operators: Packages range from PKR 800,000 to 2,500,000+',
      'Ballot/lottery for government scheme — results announced by MoRA',
      'Attend mandatory Hajj training sessions organized by MoRA',
      'Receive Hajj visa and travel documents from your operator',
      'Download Nusuk app and register your Hajj itinerary',
    ],
  },
  {
    id: 'travel',
    icon: <Plane className="w-5 h-5" />,
    title: 'Travel & Orientation',
    details: [
      'Travel in designated Hajj flight groups',
      'Upon arrival: immigration processing, meet your Hajj group guide (Muttawif)',
      'Transport to Makkah — check into your accommodation',
      'Attend orientation session by your group leader',
      'Perform initial Umrah if time permits',
      'Familiarize yourself with your camp location in Mina',
    ],
  },
  {
    id: 'visit',
    title: 'Hajj Days',
    icon: <Heart className="w-5 h-5" />,
    details: [
      '8th Dhul Hijjah: Travel to Mina, prepare for Wuquf',
      '9th Dhul Hijjah: Day of Arafat (Wuquf) — most important day of Hajj',
      '9th-10th night: Travel to Muzdalifah, collect pebbles',
      '10th Dhul Hijjah: Rami al-Jamarat (stoning), Qurbani (sacrifice), Tawaf al-Ifadah',
      '11th-12th Dhul Hijjah: Continue Rami, Tawaf al-Wada (farewell)',
      'Keep emergency contacts: Pakistan Embassy +966-12-665-1600',
    ],
  },
];

// ============================================================
// Packing Checklist
// ============================================================

const UMRAH_PACKING = [
  { id: 'passport', label: 'Passport with e-Visa printout', category: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'photos', label: 'Extra passport photos', category: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'vaccine-card', label: 'Vaccination certificate (meningitis)', category: 'Documents', icon: <Syringe className="w-3.5 h-3.5" /> },
  { id: 'insurance', label: 'Travel insurance documents', category: 'Documents', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'hotel-booking', label: 'Hotel booking confirmation', category: 'Documents', icon: <Hotel className="w-3.5 h-3.5" /> },
  { id: 'flight-booking', label: 'Flight booking printout', category: 'Documents', icon: <Plane className="w-3.5 h-3.5" /> },
  { id: 'cnic-copy', label: 'CNIC copy', category: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'ihram-men', label: 'Ihram (2 sets recommended for men)', category: 'Clothing', icon: <Shirt className="w-3.5 h-3.5" /> },
  { id: 'ihram-women', label: 'Modest clothing / Abaya for women', category: 'Clothing', icon: <Shirt className="w-3.5 h-3.5" /> },
  { id: 'sandals', label: 'Open sandals (required for men in Ihram)', category: 'Clothing', icon: <Shirt className="w-3.5 h-3.5" /> },
  { id: 'belt-bag', label: 'Money belt / waist pouch', category: 'Clothing', icon: <Package className="w-3.5 h-3.5" /> },
  { id: 'comfortable-shoes', label: 'Comfortable walking shoes (for non-Ihram times)', category: 'Clothing', icon: <Shirt className="w-3.5 h-3.5" /> },
  { id: 'medicines', label: 'Personal medicines & first-aid kit', category: 'Health', icon: <Pill className="w-3.5 h-3.5" /> },
  { id: 'oral-rehydration', label: 'Oral rehydration salts', category: 'Health', icon: <Pill className="w-3.5 h-3.5" /> },
  { id: 'sunscreen', label: 'Sunscreen (SPF 50+)', category: 'Health', icon: <Sun className="w-3.5 h-3.5" /> },
  { id: 'umbrella', label: 'Small umbrella (for sun/rain)', category: 'Health', icon: <Umbrella className="w-3.5 h-3.5" /> },
  { id: 'masks', label: 'Face masks (N95 recommended)', category: 'Health', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'quran', label: 'Pocket Quran / Dua book', category: 'Prayer', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'tasbeeh', label: 'Tasbeeh / Prayer beads', category: 'Prayer', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'prayer-mat', label: 'Travel prayer mat', category: 'Prayer', icon: <BookOpen className="w-3.5 h-3.5" /> },
  { id: 'phone-charger', label: 'Phone charger & power bank', category: 'Electronics', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { id: 'phone', label: 'Mobile phone (Nusuk app installed)', category: 'Electronics', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { id: 'adapter', label: 'Universal power adapter (Type A/B/G)', category: 'Electronics', icon: <Smartphone className="w-3.5 h-3.5" /> },
];

const HAJJ_PACKING = [
  ...UMRAH_PACKING.filter((i) => i.id !== 'ihram-men' && i.id !== 'ihram-women'),
  { id: 'ihram-men-hajj', label: 'Ihram (3 sets recommended — you will need multiple)', category: 'Clothing', icon: <Shirt className="w-3.5 h-3.5" /> },
  { id: 'ihram-women-hajj', label: 'Modest clothing / Abaya + extra sets', category: 'Clothing', icon: <Shirt className="w-3.5 h-3.5" /> },
  { id: 'sleeping-bag', label: 'Light sleeping bag / bed sheet (for Mina)', category: 'Clothing', icon: <Shirt className="w-3.5 h-3.5" /> },
  { id: 'small-backpack', label: 'Small backpack for Day of Arafat', category: 'Clothing', icon: <Package className="w-3.5 h-3.5" /> },
  { id: 'pebbles-bag', label: 'Small bag for collecting pebbles (or buy in Muzdalifah)', category: 'Prayer', icon: <Package className="w-3.5 h-3.5" /> },
  { id: 'hajj-guide', label: 'Hajj step-by-step guide book', category: 'Prayer', icon: <BookOpen className="w-3.5 h-3.5" /> },
];

// ============================================================
// Cost Calculator
// ============================================================

type CostItem = { id: string; label: string; icon: React.ReactNode; min: number; max: number; defaultVal: number; step: number };

const UMRAH_COSTS: CostItem[] = [
  { id: 'visa', label: 'e-Visa Fee', icon: <CreditCard className="w-4 h-4" />, min: 0, max: 30000, defaultVal: 22000, step: 1000 },
  { id: 'flights', label: 'Round-trip Flights', icon: <Plane className="w-4 h-4" />, min: 50000, max: 500000, defaultVal: 200000, step: 10000 },
  { id: 'accommodation', label: 'Accommodation (per night x stay)', icon: <Hotel className="w-4 h-4" />, min: 5000, max: 150000, defaultVal: 40000, step: 5000 },
  { id: 'transport', label: 'Local Transport (taxis, intercity)', icon: <Car className="w-4 h-4" />, min: 2000, max: 50000, defaultVal: 10000, step: 2000 },
  { id: 'food', label: 'Food & Meals', icon: <Utensils className="w-4 h-4" />, min: 5000, max: 100000, defaultVal: 25000, step: 5000 },
  { id: 'misc', label: 'Shopping, Zamzam, Gifts, Misc', icon: <Package className="w-4 h-4" />, min: 5000, max: 200000, defaultVal: 30000, step: 5000 },
];

const HAJJ_COSTS: CostItem[] = [
  { id: 'visa', label: 'Hajj Visa + Processing', icon: <CreditCard className="w-4 h-4" />, min: 0, max: 50000, defaultVal: 15000, step: 5000 },
  { id: 'package', label: 'Hajj Package (flights + accommodation)', icon: <Plane className="w-4 h-4" />, min: 800000, max: 3000000, defaultVal: 1100000, step: 50000 },
  { id: 'transport', label: 'Local Transport (Mina, Arafat, etc.)', icon: <Car className="w-4 h-4" />, min: 5000, max: 50000, defaultVal: 15000, step: 5000 },
  { id: 'food', label: 'Food & Meals', icon: <Utensils className="w-4 h-4" />, min: 10000, max: 150000, defaultVal: 50000, step: 5000 },
  { id: 'qurbani', label: 'Qurbani / Sacrifice', icon: <Heart className="w-4 h-4" />, min: 20000, max: 100000, defaultVal: 45000, step: 5000 },
  { id: 'misc', label: 'Shopping, Zamzam, Gifts, Misc', icon: <Package className="w-4 h-4" />, min: 10000, max: 200000, defaultVal: 40000, step: 5000 },
];

// ============================================================
// Tips
// ============================================================

const UMRAH_TIPS = [
  'Apply for the Saudi e-Visa at least 2 weeks before travel. Processing typically takes 1-5 business days.',
  'Book hotels within walking distance of Al-Haram to save on transport costs.',
  'The best time for Umrah from Pakistan is during winter months (Nov-Feb) for cooler weather.',
  'Install the Nusuk app before traveling — it provides step-by-step guidance for rituals.',
  'Carry PKR in cash for initial expenses, then exchange to SAR at authorized counters in Saudi Arabia.',
  'Download Careem or Uber app for reliable transport in Makkah and Madinah.',
  'Pakistan International Airlines (PIA) and Saudi Airlines offer direct flights from major Pakistani cities.',
  'Keep a photocopy of your passport and visa separately from the originals.',
];

const HAJJ_TIPS = [
  'Apply for the government Hajj scheme early — the ballot is competitive and registration opens months in advance.',
  'If using a private operator, verify their MoRA license at hajj.gov.pk before paying.',
  'Start physical walking exercise 2-3 months before Hajj to build stamina for the long walks.',
  'Pack light — you will be moving between Makkah, Mina, Arafat, and Muzdalifah.',
  'The government scheme includes meals and accommodation in Mina/Arafat — private packages vary.',
  'Keep your group leader\'s number saved and always carry your camp location details.',
  'Mobile SIM: Buy a Zain or STC SIM at the airport for local calls and data.',
  'Saudi Riyals are essential — carry small denominations for day-to-day expenses.',
];

// ============================================================
// Component
// ============================================================

export function UmrahHajjTool() {
  const [activeTab, setActiveTab] = useState<'umrah' | 'hajj'>('umrah');
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [costValues, setCostValues] = useState<Record<string, number>>({
    visa: UMRAH_COSTS[0].defaultVal,
    flights: UMRAH_COSTS[1].defaultVal,
    accommodation: UMRAH_COSTS[2].defaultVal,
    transport: UMRAH_COSTS[3].defaultVal,
    food: UMRAH_COSTS[4].defaultVal,
    misc: UMRAH_COSTS[5].defaultVal,
  });

  const isUmrah = activeTab === 'umrah';
  const timeline = isUmrah ? UMRAH_TIMELINE : HAJJ_TIMELINE;
  const packingList = isUmrah ? UMRAH_PACKING : HAJJ_PACKING;
  const costItems = isUmrah ? UMRAH_COSTS : HAJJ_COSTS;
  const tips = isUmrah ? UMRAH_TIPS : HAJJ_TIPS;

  const toggleItem = (id: string) => setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  const totalCost = useMemo(
    () => costItems.reduce((sum, item) => sum + (costValues[item.id] ?? item.defaultVal), 0),
    [costItems, costValues],
  );

  const updateCost = (id: string, value: number) => {
    setCostValues((prev) => ({ ...prev, [id]: value }));
  };

  const groupPackingByCategory = (items: typeof UMRAH_PACKING) => {
    const groups: Record<string, typeof UMRAH_PACKING> = {};
    items.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  };

  const packedGroups = useMemo(() => groupPackingByCategory(packingList), [packingList]);

  const formatPKR = (n: number) => `PKR ${n.toLocaleString()}`;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'umrah' | 'hajj')}>
        <TabsList className="grid w-full grid-cols-2 h-auto p-1">
          <TabsTrigger
            value="umrah"
            className="py-2.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <Heart className="w-4 h-4 mr-2" />
            Umrah
          </TabsTrigger>
          <TabsTrigger
            value="hajj"
            className="py-2.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Hajj
          </TabsTrigger>
        </TabsList>

        {/* ========== UMRAH TAB ========== */}
        <TabsContent value="umrah" className="mt-4 space-y-4">
          {/* Visa Requirement Card */}
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base">Visa Requirement</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 text-white">Saudi e-Visa</Badge>
                <span className="text-sm text-muted-foreground">Available for Pakistani citizens</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Pakistanis can apply for a Saudi e-Visa online for tourism and Umrah purposes. The visa is typically
                valid for 1 year with a stay of up to 90 days. Apply at{' '}
                <a href="https://visa.visitsaudi.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline inline-flex items-center gap-1">
                  visa.visitsaudi.com <ExternalLink className="w-3 h-3" />
                </a>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg bg-muted p-2.5">
                  <div className="text-muted-foreground text-xs">Processing Time</div>
                  <div className="font-medium">1-5 business days</div>
                </div>
                <div className="rounded-lg bg-muted p-2.5">
                  <div className="text-muted-foreground text-xs">Visa Fee</div>
                  <div className="font-medium">~PKR 22,000</div>
                </div>
                <div className="rounded-lg bg-muted p-2.5">
                  <div className="text-muted-foreground text-xs">Stay Duration</div>
                  <div className="font-medium">Up to 90 days</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base">Step-by-Step Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeline.map((step, idx) => (
                  <div key={step.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                      className="flex items-center gap-3 w-full p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium flex items-center gap-2">
                          {step.icon}
                          {step.title}
                        </div>
                      </div>
                      {expandedStep === step.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    {expandedStep === step.id && (
                      <div className="px-3 pb-3 pl-13">
                        <ul className="space-y-1.5 ml-10">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Packing Checklist */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Luggage className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-base">Packing Checklist</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {checkedCount}/{packingList.length} packed
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {Object.entries(packedGroups).map(([category, items]) => (
                  <div key={category}>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{category}</div>
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                            checkedItems[item.id]
                              ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                              : 'border-border hover:bg-muted/30'
                          }`}
                        >
                          <Checkbox checked={checkedItems[item.id] || false} onCheckedChange={() => toggleItem(item.id)} />
                          <span className="text-muted-foreground shrink-0">{item.icon}</span>
                          <span className="text-sm">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Calculator */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base">Estimated Cost Calculator (PKR)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {costItems.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      {formatPKR(costValues[item.id] ?? item.defaultVal)}
                    </span>
                  </div>
                  <Slider
                    min={item.min}
                    max={item.max}
                    step={item.step}
                    value={[costValues[item.id] ?? item.defaultVal]}
                    onValueChange={(v) => updateCost(item.id, v[0])}
                    className="[&_[role=slider]]:bg-emerald-600 [&_[role=slider]]:border-emerald-600"
                  />
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-bold text-base">Estimated Total</span>
                <span className="font-bold text-lg text-emerald-700 dark:text-emerald-400">{formatPKR(totalCost)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                * Adjust the sliders above to estimate your total cost. Prices are approximate and may vary.
              </p>
            </CardContent>
          </Card>

          {/* Vaccination Reminder */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4">
            <Syringe className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">Vaccination Requirements</div>
              <ul className="mt-1 space-y-1 text-sm text-amber-700 dark:text-amber-400">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span><strong>Meningococcal Meningitis (ACWY)</strong> — Mandatory for all travelers</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span><strong>COVID-19</strong> — Recommended (check latest requirements before travel)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span><strong>Seasonal Flu</strong> — Recommended, especially during Hajj season</span>
                </li>
              </ul>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                Get vaccinated at any government hospital or authorized vaccination center in Pakistan. Carry your vaccination card during travel.
              </p>
            </div>
          </div>

          {/* Tips */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base">Quick Tips for Pakistani Travelers</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Important Contacts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base">Important Contacts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Saudi Embassy in Islamabad */}
              <div className="rounded-lg border p-3 space-y-1.5">
                <div className="text-sm font-semibold">Embassy of Saudi Arabia, Islamabad</div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Diplomatic Enclave, G-5, Islamabad</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>+92-51-287-6261 / +92-51-282-8091</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>isbemb@mofa.gov.sa</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Sun-Thu 08:00-15:00</span>
                </div>
              </div>
              {/* Pakistan Embassy in Saudi */}
              <div className="rounded-lg border p-3 space-y-1.5">
                <div className="text-sm font-semibold">Embassy of Pakistan, Riyadh</div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Diplomatic Quarter, Riyadh, Saudi Arabia</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>+966-11-488-1452 / +966-11-488-1453</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>parembassyriyadh@mofa.gov.pk</span>
                </div>
              </div>
              {/* Consulate in Jeddah */}
              <div className="rounded-lg border p-3 space-y-1.5">
                <div className="text-sm font-semibold">Consulate General of Pakistan, Jeddah</div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Al-Andalus District, Jeddah, Saudi Arabia</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>+966-12-665-1600</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-2">
            <a href="https://visa.visitsaudi.com" target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                Apply for Saudi e-Visa <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
            <a href="https://www.nusuk.sa" target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                Visit Nusuk Platform <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </TabsContent>

        {/* ========== HAJJ TAB ========== */}
        <TabsContent value="hajj" className="mt-4 space-y-4">
          {/* Visa Requirement Card */}
          <Card className="border-emerald-200 dark:border-emerald-900">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base">Visa Requirement</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 text-white">Special Hajj Visa</Badge>
                <span className="text-sm text-muted-foreground">Through MoRA Pakistan</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Hajj visas are issued exclusively through the Saudi government in coordination with Pakistan's
                Ministry of Religious Affairs (MoRA). Pakistani citizens must apply through either the{' '}
                <strong>Government Hajj Scheme</strong> or a <strong>licensed private Hajj operator</strong>.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                <div className="rounded-lg bg-muted p-2.5">
                  <div className="text-muted-foreground text-xs">Application</div>
                  <div className="font-medium">hajj.gov.pk</div>
                </div>
                <div className="rounded-lg bg-muted p-2.5">
                  <div className="text-muted-foreground text-xs">Govt. Package (2025)</div>
                  <div className="font-medium">~PKR 10.7L-11.7L</div>
                </div>
                <div className="rounded-lg bg-muted p-2.5">
                  <div className="text-muted-foreground text-xs">Private Packages</div>
                  <div className="font-medium">PKR 8L - 25L+</div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <span className="text-amber-800 dark:text-amber-300">
                  Only use MoRA-licensed private operators. Verify licenses at{' '}
                  <a href="https://hajj.gov.pk" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                    hajj.gov.pk
                  </a>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base">Step-by-Step Timeline</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {HAJJ_TIMELINE.map((step, idx) => (
                  <div key={step.id} className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                      className="flex items-center gap-3 w-full p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium flex items-center gap-2">
                          {step.icon}
                          {step.title}
                        </div>
                      </div>
                      {expandedStep === step.id ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                    {expandedStep === step.id && (
                      <div className="px-3 pb-3 pl-13">
                        <ul className="space-y-1.5 ml-10">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Packing Checklist */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Luggage className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-base">Packing Checklist</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {checkedCount}/{packingList.length} packed
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                {Object.entries(groupPackingByCategory(HAJJ_PACKING)).map(([category, items]) => (
                  <div key={category}>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{category}</div>
                    <div className="space-y-1.5">
                      {items.map((item) => (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                            checkedItems[item.id]
                              ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                              : 'border-border hover:bg-muted/30'
                          }`}
                        >
                          <Checkbox checked={checkedItems[item.id] || false} onCheckedChange={() => toggleItem(item.id)} />
                          <span className="text-muted-foreground shrink-0">{item.icon}</span>
                          <span className="text-sm">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Calculator */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base">Estimated Cost Calculator (PKR)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {HAJJ_COSTS.map((item) => (
                <div key={item.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      {formatPKR(costValues[item.id] ?? item.defaultVal)}
                    </span>
                  </div>
                  <Slider
                    min={item.min}
                    max={item.max}
                    step={item.step}
                    value={[costValues[item.id] ?? item.defaultVal]}
                    onValueChange={(v) => updateCost(item.id, v[0])}
                    className="[&_[role=slider]]:bg-emerald-600 [&_[role=slider]]:border-emerald-600"
                  />
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-3">
                <span className="font-bold text-base">Estimated Total</span>
                <span className="font-bold text-lg text-emerald-700 dark:text-emerald-400">{formatPKR(totalCost)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                * Adjust the sliders above to estimate your total cost. Prices are approximate and may vary.
              </p>
            </CardContent>
          </Card>

          {/* Vaccination Reminder */}
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-4">
            <Syringe className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-amber-800 dark:text-amber-300">Vaccination Requirements</div>
              <ul className="mt-1 space-y-1 text-sm text-amber-700 dark:text-amber-400">
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span><strong>Meningococcal Meningitis (ACWY)</strong> — Mandatory, must be taken at least 10 days before travel</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span><strong>COVID-19</strong> — Recommended (check latest Saudi requirements)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span><strong>Seasonal Flu & Pneumococcal</strong> — Strongly recommended for Hajj</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span><strong>Polio</strong> — Required if traveling from polio-endemic areas</span>
                </li>
              </ul>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                Government Hajj scheme includes vaccination arrangements. Private operators should also facilitate vaccinations.
              </p>
            </div>
          </div>

          {/* Tips */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base">Quick Tips for Pakistani Travelers</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {HAJJ_TIPS.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Important Contacts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-base">Important Contacts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border p-3 space-y-1.5">
                <div className="text-sm font-semibold">Ministry of Religious Affairs (MoRA) Pakistan</div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>UAN: 111-HAJJ (111-42554) / 051-9214975</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Block No. 39, Pak Secretariat, G-5/2, Islamabad</span>
                </div>
              </div>
              <div className="rounded-lg border p-3 space-y-1.5">
                <div className="text-sm font-semibold">Embassy of Saudi Arabia, Islamabad</div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>+92-51-287-6261 / +92-51-282-8091</span>
                </div>
              </div>
              <div className="rounded-lg border p-3 space-y-1.5">
                <div className="text-sm font-semibold">Consulate General of Pakistan, Jeddah</div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>+966-12-665-1600</span>
                </div>
              </div>
              <div className="rounded-lg border p-3 space-y-1.5">
                <div className="text-sm font-semibold">Saudi MoH Hajj Helpline</div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>920020811 (within Saudi Arabia)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-2">
            <a href="https://hajj.gov.pk" target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                MoRA Hajj Portal <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
            <a href="https://www.nusuk.sa" target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                Visit Nusuk Platform <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
