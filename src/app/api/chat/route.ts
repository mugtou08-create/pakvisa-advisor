import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { getUserFromRequest } from '@/lib/auth';
import { detectCountries } from '@/lib/country-detect';
import { createGeminiStream, createStreamResponse } from '@/lib/gemini-stream';
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
const FREE_RATE_LIMIT = 5;
const FREE_WINDOW = 86400000;

// In-memory tracking for free tier daily limits (anonymous users only)
const freeUsageCounts = new Map<string, { count: number; resetAt: number }>();

// Global freshness cache (avoids DB query on every request)
let freshnessCache: { value: string; expiresAt: number } = { value: 'August 2025', expiresAt: 0 };

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

async function getGlobalFreshness(): Promise<string> {
  const now = Date.now();
  if (freshnessCache.expiresAt > now) return freshnessCache.value;

  const latestCountry = await db.country.findFirst({
    orderBy: { updatedAt: 'desc' },
    select: { updatedAt: true },
  });
  const value = latestCountry?.updatedAt
    ? new Date(latestCountry.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'August 2025';

  freshnessCache = { value, expiresAt: now + 600000 }; // Cache for 10 minutes
  return value;
}

export async function POST(request: NextRequest) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const body: ChatRequestBody = await request.json();
    const { message, context, history } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'AI service is not configured.' }, { status: 503 });
    }

    // Check auth
    let proUser = false;
    let userId: string | null = null;
    try {
      const authUser = await getUserFromRequest(request);
      if (authUser) {
        userId = authUser.id;
        proUser = authUser.role === 'pro';
      }
    } catch { /* continue as anonymous */ }

    // Rate limiting
    if (proUser) {
      if (!rateLimit(ip, 60, 60000)) {
        return NextResponse.json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
      }
      if (userId) {
        await db.aiUsageLog.create({ data: { userId, message: message.slice(0, 200) } });
      }
    } else {
      if (userId) {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const todayCount = await db.aiUsageLog.count({ where: { userId, createdAt: { gte: todayStart, lte: todayEnd } } });
        if (todayCount >= FREE_RATE_LIMIT) {
          return NextResponse.json({
            success: false,
            error: `You've reached the free daily limit of ${FREE_RATE_LIMIT} queries. Upgrade to Pro for 15 queries/day with verified data.`,
            code: 'LIMIT_REACHED',
            remainingCount: 0,
          });
        }
        await db.aiUsageLog.create({ data: { userId, message: message.slice(0, 200) } });
      } else {
        if (!checkFreeLimit(ip)) {
          return NextResponse.json({
            success: false,
            error: `You've reached the free daily limit of ${FREE_RATE_LIMIT} queries. Sign up for a free account or upgrade to Pro!`,
            code: 'LIMIT_REACHED',
            remainingCount: 0,
          });
        }
      }
    }

    // ============================================================
    // COUNTRY DETECTION & DB CONTEXT (run in parallel)
    // ============================================================
    let detectedCountry = context?.countryCode || null;
    const detectedCountries = detectCountries(message);
    if (!detectedCountry && detectedCountries.length > 0) {
      detectedCountry = detectedCountries[0];
    }

    // Fetch DB data and freshness in parallel
    const [countryData, globalFreshness] = await Promise.all([
      (proUser && detectedCountry)
        ? db.country.findUnique({
            where: { code: detectedCountry },
            include: { visaTypes: true, requirements: { where: { mandatory: true }, take: 10 }, costProfiles: true },
          })
        : (context?.countryCode
          ? db.country.findUnique({ where: { code: context.countryCode.toUpperCase() }, include: { visaTypes: true, requirements: true, costProfiles: true } })
          : Promise.resolve(null)),
      getGlobalFreshness(),
    ]);

    // Build context string from DB data
    let contextStr = '';
    let verifiedData: {
      countryName: string;
      countryCode: string;
      sourceUrl: string;
      lastUpdated: string;
    } | null = null;

    if (countryData) {
      if (proUser && detectedCountry) {
        verifiedData = {
          countryName: countryData.name,
          countryCode: countryData.code,
          sourceUrl: countryData.sourceUrl || '',
          lastUpdated: countryData.updatedAt
            ? new Date(countryData.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            : 'Unknown',
        };

        contextStr += `\n\n===== VERIFIED COUNTRY DATA FOR ${countryData.name.toUpperCase()} =====\n`;
        contextStr += `IMPORTANT: The following data is from our verified database. Use this as the PRIMARY source for your answer.\n`;
        contextStr += `Data last updated: ${verifiedData.lastUpdated}\n`;
        contextStr += `Visa Access: ${countryData.visaFree ? 'Visa Free' : countryData.visaOnArrival ? 'Visa on Arrival' : countryData.etaAvailable ? 'e-Visa Available' : 'Embassy Required'}\n`;
        contextStr += `Processing Time: ${countryData.processingDaysMin}-${countryData.processingDaysMax} days\n`;
        contextStr += `Currency: ${countryData.currency} (${countryData.currencyCode})\n`;
        contextStr += `Safety Rating: ${countryData.safetyRating}/10\n`;
        contextStr += `Best Travel Months: ${countryData.bestTravelMonths}\n`;
        contextStr += `Timezone: ${countryData.timezone}\n`;
        if (countryData.safetySummary) contextStr += `Safety Summary: ${countryData.safetySummary}\n`;

        if (countryData.visaTypes.length > 0) {
          contextStr += `\nAvailable Visa Types:\n`;
          for (const vt of countryData.visaTypes) {
            contextStr += `  - ${vt.type}: ${vt.description || 'No description'} (Duration: ${vt.maxDuration}, Multiple Entry: ${vt.multipleEntry})\n`;
          }
        }

        if (countryData.requirements.length > 0) {
          contextStr += `\nKey Requirements (Mandatory):\n`;
          for (const req of countryData.requirements) {
            contextStr += `  - ${req.category}: ${req.requirement}\n`;
            if (req.description) contextStr += `    Details: ${req.description}\n`;
          }
        }

        if (countryData.costProfiles.length > 0) {
          const cp = countryData.costProfiles[0];
          contextStr += `\nCost Estimates:\n`;
          contextStr += `  - Visa Fee: $${cp.visaFeeUSD} (≈ PKR ${Math.round(cp.visaFeeUSD * 278.5).toLocaleString()})\n`;
          contextStr += `  - Monthly Living: $${cp.monthlyLivingUSD} (≈ PKR ${Math.round(cp.monthlyLivingUSD * 278.5).toLocaleString()})\n`;
          contextStr += `  - Monthly Rent: $${cp.monthlyRentUSD}\n`;
          contextStr += `  - Monthly Food: $${cp.monthlyFoodUSD}\n`;
          contextStr += `  - Total Monthly: $${cp.totalMonthlyUSD}\n`;
        }
        contextStr += `\n===== END VERIFIED DATA =====\n`;
      } else if (context?.countryCode && !verifiedData) {
        contextStr += `\n\nCountry: ${countryData.name}\nVisa Access: ${countryData.visaFree ? 'Visa Free' : countryData.visaOnArrival ? 'Visa on Arrival' : countryData.etaAvailable ? 'e-Visa' : 'Embassy Required'}\nProcessing: ${countryData.processingDaysMin}-${countryData.processingDaysMax} days\n`;
        if (countryData.visaTypes.length > 0) {
          contextStr += `Visa Types: ${countryData.visaTypes.map(vt => vt.type).join(', ')}\n`;
        }
      }
    }

    // Profile & score context
    if (context?.profile) {
      contextStr += `\n\nUser Profile:\n`;
      contextStr += `Age: ${context.profile.age}, Occupation: ${context.profile.occupation || 'N/A'}, Income: $${context.profile.monthlyIncomeUSD}/mo, Savings: $${context.profile.savingsUSD}, Purpose: ${context.profile.travelPurpose || 'N/A'}, Stay: ${context.profile.intendedStayDays} days, Prior Travel: ${context.profile.hasPriorTravel ? 'Yes' : 'No'}\n`;
    }
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

FORMATTING RULES (very important - follow strictly):
- NEVER use **bold** or ## headings or ### subheadings for emphasis.
- Write like a real person speaking, not a Wikipedia article.
- Use bullet points (-) for lists only when listing 3+ items.
- Keep paragraphs short (2-3 sentences max).
- Use plain, conversational English.
- Do not use ALL CAPS for emphasis.

Key rules:
- Always be encouraging but realistic about visa chances
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

    // Build Gemini contents
    const geminiContents: { role: string; parts: { text: string }[] }[] = [];

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

    geminiContents.push({
      role: 'user',
      parts: [{ text: contextStr ? `${message}\n\n---Context Data---\n${contextStr}` : message }],
    });

    // Compute remaining queries for the header
    let remainingFreeQueries = -1;
    if (!proUser) {
      if (userId) {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const todayCount = await db.aiUsageLog.count({ where: { userId, createdAt: { gte: todayStart, lte: todayEnd } } });
        remainingFreeQueries = Math.max(0, FREE_RATE_LIMIT - todayCount);
      } else {
        const freeEntry = freeUsageCounts.get(ip);
        remainingFreeQueries = FREE_RATE_LIMIT - (freeEntry?.count || 0);
      }
    }

    // Create streaming response
    const stream = await createGeminiStream({
      models: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'],
      apiKey: GEMINI_API_KEY,
      systemPrompt,
      contents: geminiContents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048, topP: 0.9 },
    });

    // Send metadata in response headers (known before stream starts)
    const metaHeaders: Record<string, string> = {
      'X-Pro-User': String(proUser),
      'X-Data-Verified': String(!!verifiedData),
      'X-Global-Freshness': globalFreshness,
      'X-Remaining-Queries': String(remainingFreeQueries),
    };
    if (verifiedData) {
      metaHeaders['X-Detected-Country'] = verifiedData.countryName;
      metaHeaders['X-Source-Url'] = verifiedData.sourceUrl;
      metaHeaders['X-Last-Updated'] = verifiedData.lastUpdated;
    }

    return createStreamResponse(stream, metaHeaders);
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
