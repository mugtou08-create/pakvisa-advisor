'use client';
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, ClipboardList, Globe, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CountryData } from '@/lib/types';

interface QuizQuestion {
  id: string;
  question: string;
  options: { label: string; value: string }[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'purpose',
    question: 'What is your main travel purpose?',
    options: [
      { label: 'Tourism & Sightseeing', value: 'tourism' },
      { label: 'Business & Work', value: 'business' },
      { label: 'Education & Study', value: 'education' },
      { label: 'Family Visit', value: 'family' },
    ],
  },
  {
    id: 'budget',
    question: 'What is your monthly travel budget (in USD)?',
    options: [
      { label: 'Under $500 (Budget)', value: 'low' },
      { label: '$500–$1,000 (Moderate)', value: 'mid' },
      { label: '$1,000–$3,000 (Comfortable)', value: 'high' },
      { label: '$3,000+ (Premium)', value: 'premium' },
    ],
  },
  {
    id: 'duration',
    question: 'How long do you plan to stay?',
    options: [
      { label: 'Weekend / 1–7 days', value: 'short' },
      { label: '1–4 weeks', value: 'medium' },
      { label: '1–3 months', value: 'long' },
      { label: '3+ months', value: 'extended' },
    ],
  },
  {
    id: 'ease',
    question: 'How important is a hassle-free visa process?',
    options: [
      { label: 'Very important — I want the easiest option', value: 'easiest' },
      { label: 'Somewhat — willing to do some paperwork', value: 'moderate' },
      { label: 'Not important — I\'ll handle any process', value: 'any' },
    ],
  },
  {
    id: 'region',
    question: 'Which region interests you most?',
    options: [
      { label: 'Middle East', value: 'middle_east' },
      { label: 'Southeast Asia', value: 'southeast_asia' },
      { label: 'Europe', value: 'europe' },
      { label: 'East Asia', value: 'east_asia' },
      { label: 'Any / No preference', value: 'any' },
    ],
  },
];

function scoreCountry(c: CountryData, answers: Record<string, string>): number {
  let score = 0;

  // Ease of access (up to 40 points)
  if (c.visaFree) score += 40;
  else if (c.visaOnArrival) score += 30;
  else if (c.etaAvailable) score += 20;
  else score += 5;

  // Budget match (up to 25 points)
  const cost = c.costProfile;
  if (cost && answers.budget) {
    const living = cost.totalMonthlyUSD || cost.monthlyLivingUSD || 0;
    if (answers.budget === 'low' && living < 400) score += 25;
    else if (answers.budget === 'low' && living < 700) score += 18;
    else if (answers.budget === 'mid' && living >= 400 && living < 1200) score += 25;
    else if (answers.budget === 'mid' && living < 1500) score += 18;
    else if (answers.budget === 'high' && living >= 800 && living < 2500) score += 25;
    else if (answers.budget === 'high' && living < 3500) score += 18;
    else if (answers.budget === 'premium' && living >= 1500) score += 25;
    else if (cost) score += 10;
  } else if (cost) {
    score += 10;
  }

  // Duration match (up to 15 points)
  const maxDays = c.processingDaysMax || 30;
  if (answers.duration === 'short' && maxDays >= 7) score += 15;
  else if (answers.duration === 'medium' && maxDays >= 30) score += 15;
  else if (answers.duration === 'long' && maxDays >= 90) score += 15;
  else if (answers.duration === 'extended' && maxDays >= 180) score += 15;
  else if (maxDays >= 30) score += 8;

  // Ease priority (up to 10 points)
  if (answers.ease === 'easiest' && (c.visaFree || c.visaOnArrival)) score += 10;
  else if (answers.ease === 'easiest' && c.etaAvailable) score += 7;
  else if (answers.ease === 'moderate' && (c.visaFree || c.visaOnArrival || c.etaAvailable)) score += 8;
  else score += 3;

  // Region match (up to 10 points)
  if (answers.region && answers.region !== 'any') {
    const regionMap: Record<string, string[]> = {
      middle_east: ['Asia'],
      southeast_asia: ['Asia'],
      europe: ['Europe'],
      east_asia: ['Asia'],
    };
    // Use continent match as a heuristic
    const target = regionMap[answers.region] || [];
    if (target.includes(c.continent)) score += 10;
    // Special name-based overrides for better accuracy
    else if (answers.region === 'middle_east' && ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Oman', 'Bahrain', 'Kuwait', 'Türkiye', 'Jordan', 'Iraq', 'Iran'].includes(c.name)) score += 10;
    else if (answers.region === 'southeast_asia' && ['Malaysia', 'Thailand', 'Indonesia', 'Singapore', 'Philippines', 'Vietnam', 'Myanmar', 'Cambodia', 'Sri Lanka'].includes(c.name)) score += 10;
    else if (answers.region === 'east_asia' && ['China', 'Japan', 'South Korea', 'Hong Kong'].includes(c.name)) score += 10;
    else if (answers.region === 'europe' && c.continent === 'Europe') score += 10;
  } else {
    score += 5;
  }

  return score;
}

function getVisaType(c: CountryData) {
  if (c.visaFree) return { label: 'Visa Free', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  if (c.visaOnArrival) return { label: 'Visa on Arrival', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
  if (c.etaAvailable) return { label: 'e-Visa', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' };
  return { label: 'Embassy Required', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
}

interface Props {
  countries: CountryData[];
  onClose: () => void;
  onSelectCountry: (name: string) => void;
}

export function VisaQuizPanel({ countries, onClose, onSelectCountry }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<CountryData[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, showResults]);

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [QUESTIONS[step].id]: value };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Calculate results
      const scoreMap: Record<string, number> = {};
      countries.forEach(c => {
        scoreMap[c.code] = scoreCountry(c, newAnswers);
      });
      const ranked = countries
        .filter(c => scoreMap[c.code] > 40)
        .sort((a, b) => scoreMap[b.code] - scoreMap[a.code])
        .slice(0, 6);

      setScores(scoreMap);
      setResults(ranked);
      setShowResults(true);
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setResults([]);
    setScores({});
    setShowResults(false);
  };

  const progress = showResults ? 100 : Math.round(((step + 1) / QUESTIONS.length) * 100);
  const currentQ = QUESTIONS[step];
  const isLastStep = step === QUESTIONS.length - 1;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Visa Quiz</h2>
              <p className="text-[11px] text-muted-foreground">
                {showResults ? `${results.length} recommendations` : `Step ${step + 1} of ${QUESTIONS.length}`}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {!showResults ? (
            /* Question */
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold mb-2">{currentQ.question}</h3>
              <p className="text-sm text-muted-foreground mb-8">
                {isLastStep ? 'Last question — almost there!' : `Select one option to continue`}
              </p>
              <div className="grid gap-3 max-w-md mx-auto">
                {currentQ.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(opt.value)}
                    className={`text-left px-5 py-4 rounded-xl border transition-all hover:border-amber-400 hover:shadow-sm
                      ${answers[QUESTIONS[step]?.id] === opt.value
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/10'
                        : 'border-border bg-card'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Go back
                </button>
              )}
            </div>
          ) : (
            /* Results */
            <div>
              <div className="text-center mb-8">
                <Globe className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="text-xl sm:text-2xl font-bold mb-1">Your Best Matches</h3>
                <p className="text-sm text-muted-foreground">
                  Based on your answers, here are the top countries for you
                </p>
              </div>

              {results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((country, idx) => {
                    const visa = getVisaType(country);
                    const cost = country.costProfile;
                    return (
                      <div
                        key={country.code}
                        className="rounded-xl border bg-card overflow-hidden"
                      >
                        <div className="flex items-center gap-4 p-4">
                          <span className="text-2xl font-bold text-muted-foreground w-8 text-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-3xl shrink-0">{country.flagEmoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold">{country.name}</h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${visa.color}`}>
                                {visa.label}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              {cost && cost.visaFeeUSD > 0 && (
                                <span className="flex items-center gap-1">${cost.visaFeeUSD}</span>
                              )}
                              <span className="flex items-center gap-1">
                                {country.processingDaysMin}–{country.processingDaysMax} days
                              </span>
                              <span>Score: {scores[country.code]}/100</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 shrink-0"
                            onClick={() => { onSelectCountry(country.name); onClose(); }}
                          >
                            View <ArrowRight className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No strong matches found. Try the search bar to explore all 70+ countries.
                  </p>
                  <Button variant="outline" onClick={onClose}>
                    Back to Search
                  </Button>
                </div>
              )}

              <div className="flex justify-center gap-3 mt-8">
                <Button variant="outline" className="gap-1.5" onClick={reset}>
                  <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                </Button>
                <Button variant="outline" className="gap-1.5" onClick={onClose}>
                  <X className="w-3.5 h-3.5" /> Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
