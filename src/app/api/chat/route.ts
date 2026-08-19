import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { detectCountries } from '@/lib/country-detect';
import type { ScoreBreakdown, UserProfileData } from '@/lib/types';

interface ChatRequestBody {
  message: string;
  history?: { role: string; content: string }[];
  context?: {
    countryCode?: string;
    profile?: UserProfileData;
    scoreBreakdown?: ScoreBreakdown;
  };
  isPro?: boolean;
}

// Rate limits per tier
const FREE_RATE_LIMIT = 5;     // 5 queries per day
const FREE_WINDOW = 86400000;  // 24 hours
const PRO_RATE_LIMIT = 60;     // 60 queries per minute

// In-memory tracking for free tier daily limits
const freeUsageCounts = new Map<string, { count: number; resetAt: number }>();

function checkFreeLimit(ip: string): boolean {
  const now = Date.now();
  let entry = freeUsageCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    freeUsageCounts.set(ip, { count: 1, resetAt: now + FREE_WINDOW });
    return true;
  }
  if (entry.count >= FREE_RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const body: ChatRequestBody = await request.json();
    const { message, context, history } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'message is required' },
        { status: 400 }
      );
    }

    // Never trust client-supplied isPro — always treat as free tier
    const proUser = false;

    // Rate limiting: Pro users get higher limits
    if (proUser) {
      if (!rateLimit(ip, PRO_RATE_LIMIT, 60000)) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
    } else {
      if (!checkFreeLimit(ip)) {
        return NextResponse.json({
          success: false,
          error: 'You\'ve reached the free daily limit of 5 queries. Upgrade to Pro for unlimited access.',
          code: 'LIMIT_REACHED',
          remainingCount: 0,
        });
      }
    }

    // ============================================================
    // COUNTRY DETECTION (Phase 2A)
    // ============================================================
    let detectedCountry = context?.countryCode || null;
    let detectedCountries = detectCountries(message);

    // If no explicit countryCode but we detected one, use it
    if (!detectedCountry && detectedCountries.length > 0) {
      detectedCountry = detectedCountries[0];
    }

    // ============================================================
    // DATABASE CONTEXT INJECTION (Phase 2B) — Pro only
    // ============================================================
    let contextStr = '';
    let verifiedData: {
      countryName: string;
      countryCode: string;
      sourceUrl: string;
      lastUpdated: string;
      requirements: { category: string; requirement: string; mandatory: boolean }[];
      costProfile: { visaFeeUSD: number; monthlyLivingUSD: number; totalMonthlyUSD: number } | null;
      visaTypes: { type: string; maxDuration: string; multipleEntry: boolean }[];
    } | null = null;

    if (proUser && detectedCountry) {
      const country = await db.country.findUnique({
        where: { code: detectedCountry },
        include: {
          visaTypes: true,
          requirements: { where: { mandatory: true }, take: 10 },
          costProfiles: true,
        },
      });

      if (country) {
        verifiedData = {
          countryName: country.name,
          countryCode: country.code,
          sourceUrl: country.sourceUrl || '',
          lastUpdated: country.updatedAt ? new Date(country.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Unknown',
          requirements: country.requirements.map(r => ({ category: r.category, requirement: r.requirement, mandatory: r.mandatory })),
          costProfile: country.costProfiles[0] ? {
            visaFeeUSD: country.costProfiles[0].visaFeeUSD,
            monthlyLivingUSD: country.costProfiles[0].monthlyLivingUSD,
            totalMonthlyUSD: country.costProfiles[0].totalMonthlyUSD,
          } : null,
          visaTypes: country.visaTypes.map(vt => ({ type: vt.type, maxDuration: vt.maxDuration, multipleEntry: vt.multipleEntry })),
        };

        contextStr += `\n\n===== VERIFIED COUNTRY DATA FOR ${country.name.toUpperCase()} =====\n`;
        contextStr += `IMPORTANT: The following data is from our verified database. Use this as the PRIMARY source for your answer.\n`;
        contextStr += `Data last updated: ${verifiedData.lastUpdated}\n`;
        contextStr += `Visa Access: ${country.visaFree ? 'Visa Free' : country.visaOnArrival ? 'Visa on Arrival' : country.etaAvailable ? 'e-Visa Available' : 'Embassy Required'}\n`;
        contextStr += `Processing Time: ${country.processingDaysMin}-${country.processingDaysMax} days\n`;
        contextStr += `Currency: ${country.currency} (${country.currencyCode})\n`;
        contextStr += `Safety Rating: ${country.safetyRating}/10\n`;
        contextStr += `Best Travel Months: ${country.bestTravelMonths}\n`;
        contextStr += `Timezone: ${country.timezone}\n`;
        if (country.safetySummary) contextStr += `Safety Summary: ${country.safetySummary}\n`;

        if (country.visaTypes.length > 0) {
          contextStr += `\nAvailable Visa Types:\n`;
          for (const vt of country.visaTypes) {
            contextStr += `  - ${vt.type}: ${vt.description || 'No description'} (Duration: ${vt.maxDuration}, Multiple Entry: ${vt.multipleEntry})\n`;
          }
        }

        if (country.requirements.length > 0) {
          contextStr += `\nKey Requirements (Mandatory):\n`;
          for (const req of country.requirements) {
            contextStr += `  - ${req.category}: ${req.requirement}\n`;
            if (req.description) contextStr += `    Details: ${req.description}\n`;
          }
        }

        if (country.costProfiles.length > 0) {
          const cp = country.costProfiles[0];
          contextStr += `\nCost Estimates:\n`;
          contextStr += `  - Visa Fee: $${cp.visaFeeUSD} (≈ PKR ${Math.round(cp.visaFeeUSD * 278.5).toLocaleString()})\n`;
          contextStr += `  - Monthly Living: $${cp.monthlyLivingUSD} (≈ PKR ${Math.round(cp.monthlyLivingUSD * 278.5).toLocaleString()})\n`;
          contextStr += `  - Monthly Rent: $${cp.monthlyRentUSD}\n`;
          contextStr += `  - Monthly Food: $${cp.monthlyFoodUSD}\n`;
          contextStr += `  - Total Monthly: $${cp.totalMonthlyUSD}\n`;
        }
        contextStr += `\n===== END VERIFIED DATA =====\n`;
      }
    }

    // Legacy context injection (for explicit countryCode in context — not auto-detected)
    if (context?.countryCode && !verifiedData) {
      const country = await db.country.findUnique({
        where: { code: context.countryCode.toUpperCase() },
        include: { visaTypes: true, requirements: true, costProfiles: true },
      });
      if (country) {
        contextStr += `\n\nCountry: ${country.name}\nVisa Access: ${country.visaFree ? 'Visa Free' : country.visaOnArrival ? 'Visa on Arrival' : country.etaAvailable ? 'e-Visa' : 'Embassy Required'}\nProcessing: ${country.processingDaysMin}-${country.processingDaysMax} days\n`;
        if (country.visaTypes.length > 0) {
          contextStr += `Visa Types: ${country.visaTypes.map(vt => vt.type).join(', ')}\n`;
        }
      }
    }

    // Profile context
    if (context?.profile) {
      contextStr += `\n\nUser Profile:\n`;
      contextStr += `Age: ${context.profile.age}, Occupation: ${context.profile.occupation || 'N/A'}, Income: $${context.profile.monthlyIncomeUSD}/mo, Savings: $${context.profile.savingsUSD}, Purpose: ${context.profile.travelPurpose || 'N/A'}, Stay: ${context.profile.intendedStayDays} days, Prior Travel: ${context.profile.hasPriorTravel ? 'Yes' : 'No'}\n`;
    }

    // Score breakdown context
    if (context?.scoreBreakdown) {
      const sb = context.scoreBreakdown;
      contextStr += `\n\nScore: ${sb.finalScore}/100, Likelihood: ${sb.visaLikelihood}%\n`;
      if (sb.hardFilters.length > 0) {
        contextStr += `Hard Filters: ${sb.hardFilters.map(f => `${f.filter}: ${f.passed ? 'PASS' : 'FAIL'}`).join(', ')}\n`;
      }
      if (sb.missingItems.length > 0) {
        contextStr += `Missing: ${sb.missingItems.join(', ')}\n`;
      }
    }

    // ============================================================
    // SYSTEM PROMPT
    // ============================================================
    const proContextInstruction = verifiedData
      ? `\nCRITICAL INSTRUCTION: You have access to VERIFIED DATABASE DATA for ${verifiedData.countryName}. You MUST base your answer primarily on this data, not on your general knowledge. Reference specific costs, requirements, and processing times from the verified data. If the verified data shows a specific requirement or cost, use those exact numbers.\n\nAt the END of your response, add this disclaimer:\n"📊 Data verified from PakVisa database (updated ${verifiedData.lastUpdated}). Always confirm with the official embassy before applying."`
      : `\nIMPORTANT: You do not have access to verified database data for this query. Answer based on your general knowledge about visa policies for Pakistani passport holders. Be helpful but remind the user that visa policies change frequently and they should verify with the official embassy.\n\nAt the END of your response, add this disclaimer:\n"⚠️ General information only. Verify current requirements with the official embassy before applying."`;

    const systemPrompt = `You are PakVisa AI — an expert Visa Consultant specializing in Pakistani passport visas. Answer in English only. Be helpful, accurate, and specific.

Key rules:
- Always be encouraging but realistic about visa chances
- Format responses clearly with bullet points when listing multiple items
- If mentioning costs, provide both USD and approximate PKR (1 USD ≈ PKR 278)
- Reference the specific country's visa requirements, costs, and processing times when relevant
- Provide actionable advice for Pakistani passport holders

AFFILIATE SUGGESTION RULES (very important):
- You may suggest AT MOST ONE service recommendation per response, and ONLY when it naturally fits the conversation
- When a user asks about applying for a visa or which visa service to use, you may mention: "Many Pakistani travelers use iVisa (ivisa.com) to apply for e-Visas online — it's straightforward and saves a trip to the embassy."
- When a user asks about travel insurance, you may mention: "SafetyWing (safetywing.com) offers affordable travel insurance starting around $42/month, popular with long-term travelers."
- When a user asks about booking flights or hotels, you may briefly mention Skyscanner or Booking.com as useful tools
- NEVER force a recommendation. If it doesn't naturally fit, don't include one.
- NEVER use phrases like "I recommend" or "you should use" — instead say "many travelers use" or "a popular option is"
- Keep any service mention to ONE short sentence. Do not elaborate or push.
${proContextInstruction}`;

    // ============================================================
    // LLM CALL — Google Gemini API
    // ============================================================
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI service is not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

    // Convert our messages array to Gemini format
    // Gemini uses: systemInstruction + contents[] with role "user"/"model"
    const geminiContents: { role: string; parts: { text: string }[] }[] = [];

    // Add conversation history
    if (history && history.length > 0) {
      const recentHistory = history.slice(-20);
      for (const h of recentHistory) {
        if (h.role === 'user' || h.role === 'assistant') {
          geminiContents.push({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }],
          });
        }
      }
    }

    // Add current message with context
    geminiContents.push({
      role: 'user',
      parts: [{
        text: contextStr
          ? `${message}\n\n---Context Data---\n${contextStr}`
          : message,
      }],
    });

    // Try models in order of preference (fallback if one is unavailable)
    const MODELS = [
      'gemini-3.6-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
    ];

    let aiResponse: string | null = null;
    let lastError = '';

    for (const model of MODELS) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: geminiContents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048,
                topP: 0.9,
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const geminiJson = await geminiRes.json();
          aiResponse = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text || null;
          if (aiResponse) break;
        } else {
          const errText = await geminiRes.text().catch(() => '');
          lastError = `${model}: ${geminiRes.status} ${errText.slice(0, 200)}`;
          console.error('Gemini model failed:', lastError);
        }
      } catch (err) {
        lastError = `${model}: ${String(err)}`;
        console.error('Gemini model error:', lastError);
      }
    }

    if (!aiResponse) {
      console.error('All Gemini models failed:', lastError);
      return NextResponse.json(
        { success: false, error: 'AI service temporarily unavailable. Please try again in a moment.' },
        { status: 502 }
      );
    }

    // ============================================================
    // BUILD RESPONSE (Phase 1B + 2C)
    // ============================================================
    // Get global data freshness timestamp
    const latestCountry = await db.country.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true },
    });
    const globalFreshness = latestCountry?.updatedAt
      ? new Date(latestCountry.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : 'August 2025';

    // Check remaining free usage
    const freeEntry = freeUsageCounts.get(ip);
    const remainingFree = proUser ? -1 : (FREE_RATE_LIMIT - (freeEntry?.count || 0));

    return NextResponse.json({
      success: true,
      data: aiResponse,
      meta: {
        proUser,
        dataVerified: !!verifiedData,
        detectedCountry: verifiedData?.countryName || null,
        sourceUrl: verifiedData?.sourceUrl || null,
        lastUpdated: verifiedData?.lastUpdated || null,
        globalFreshness,
        remainingFreeQueries: remainingFree,
      },
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message', ...(process.env.NODE_ENV !== 'production' ? { details: String(error) } : {}) },
      { status: 500 }
    );
  }
}
