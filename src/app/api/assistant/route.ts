import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest, isProUser } from '@/lib/auth';
import { detectCountries } from '@/lib/country-detect';

// Rate limits
const FREE_RATE_LIMIT = 5;
const PRO_RATE_LIMIT = 20;
const FREE_WINDOW = 86400000; // 24 hours

// In-memory tracking for anonymous users
const freeUsageCounts = new Map<string, { count: number; resetAt: number }>();

function checkFreeLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  let entry = freeUsageCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    freeUsageCounts.set(ip, { count: 1, resetAt: now + FREE_WINDOW });
    return { allowed: true, remaining: FREE_RATE_LIMIT - 1 };
  }
  if (entry.count >= FREE_RATE_LIMIT) return { allowed: false, remaining: 0 };
  entry.count++;
  return { allowed: true, remaining: FREE_RATE_LIMIT - entry.count };
}

function getClientIp(request: NextRequest): string {
  return (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const { message, history, signals } = body as {
      message: string;
      history?: { role: string; content: string }[];
      signals?: Record<string, unknown>;
    };

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI service is not configured.' },
        { status: 503 }
      );
    }

    // Auth check
    let authUser: Awaited<ReturnType<typeof getUserFromRequest>> = null;
    let proUser = false;
    let userId: string | null = null;
    try {
      authUser = await getUserFromRequest(request);
      if (authUser) {
        userId = authUser.id;
        proUser = isProUser(authUser);
      }
    } catch { /* continue as anonymous */ }

    // Rate limiting
    if (proUser) {
      // Pro users: DB-based daily limit
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayCount = await db.aiUsageLog.count({
        where: { userId, createdAt: { gte: todayStart, lte: todayEnd } },
      });
      if (todayCount >= PRO_RATE_LIMIT) {
        return NextResponse.json({
          success: false,
          error: `You've used all ${PRO_RATE_LIMIT} Pro questions for today. Check back tomorrow!`,
          code: 'LIMIT_REACHED',
          remainingQueries: 0,
        });
      }
      await db.aiUsageLog.create({ data: { userId: userId!, message: message.slice(0, 200) } });
    } else if (userId) {
      // Authenticated free user: DB-based
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayCount = await db.aiUsageLog.count({
        where: { userId, createdAt: { gte: todayStart, lte: todayEnd } },
      });
      if (todayCount >= FREE_RATE_LIMIT) {
        return NextResponse.json({
          success: false,
          error: `You've used all ${FREE_RATE_LIMIT} free questions today. Share PakVisa with friends to earn more, or upgrade to Pro for ${PRO_RATE_LIMIT}/day!`,
          code: 'LIMIT_REACHED',
          remainingQueries: 0,
        });
      }
      await db.aiUsageLog.create({ data: { userId, message: message.slice(0, 200) } });
    } else {
      // Anonymous: IP-based
      const freeResult = checkFreeLimit(ip);
      if (!freeResult.allowed) {
        return NextResponse.json({
          success: false,
          error: `You've used all ${FREE_RATE_LIMIT} free questions today. Sign up for a free account or share PakVisa with friends to earn more!`,
          code: 'LIMIT_REACHED',
          remainingQueries: 0,
        });
      }
    }

    // Calculate remaining queries
    let remainingQueries = 0;
    if (proUser) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayCount = await db.aiUsageLog.count({
        where: { userId, createdAt: { gte: todayStart, lte: todayEnd } },
      });
      remainingQueries = PRO_RATE_LIMIT - todayCount;
    } else if (userId) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const todayCount = await db.aiUsageLog.count({
        where: { userId, createdAt: { gte: todayStart, lte: todayEnd } },
      });
      remainingQueries = FREE_RATE_LIMIT - todayCount;
    } else {
      const entry = freeUsageCounts.get(ip);
      remainingQueries = FREE_RATE_LIMIT - (entry?.count || 0);
    }

    // Smart signals from the frontend
    const currentPage = (signals?.currentPage as string) || '';
    const timeOnSite = (signals?.timeOnSite as number) || 0;
    const referralData = signals?.referralData as Record<string, unknown> | null;
    const isProFromSignal = (signals?.isProUser as boolean) || false;

    // Build smart context for Sara
    let smartContext = '';

    if (currentPage && currentPage !== '/') {
      const pageName = currentPage.replace(/[/-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      smartContext += `\nSMART SIGNAL - Current page: User is currently viewing the ${pageName} page.`;
    }

    if (timeOnSite > 120) {
      smartContext += `\nSMART SIGNAL - Engaged user: They have been on the site for ${Math.floor(timeOnSite / 60)} minutes.`;
    }

    if (referralData) {
      if (referralData.hasReferral && (referralData.visitorCount as number) > 0) {
        smartContext += `\nSMART SIGNAL - Referral progress: User has shared and earned ${referralData.visitorCount} visitor(s). Current tier: ${referralData.rewardTier}. They have ${referralData.bonusQueries} bonus queries.`;
      } else if (!referralData.hasReferral) {
        smartContext += `\nSMART SIGNAL - Referral: User has NOT been introduced to the share-and-earn program yet.`;
      }
    }

    if (proUser) {
      smartContext += `\nSMART SIGNAL - User is a Pro member. Do NOT suggest Pro upgrade. Focus on helpful tips and affiliate services.`;
    }

    // Country detection + Pro data injection
    let proDataInstruction = '';
    const detectedCountries = detectCountries(message);

    if (proUser && detectedCountries.length > 0) {
      const countryCode = detectedCountries[0];
      const country = await db.country.findUnique({
        where: { code: countryCode },
        include: {
          visaTypes: true,
          requirements: { where: { mandatory: true }, take: 10 },
          costProfiles: true,
        },
      });

      if (country) {
        let verifiedStr = `\n\n===== VERIFIED DATA FOR ${country.name.toUpperCase()} =====\n`;
        verifiedStr += `Use this as the PRIMARY source for your answer about ${country.name}.\n`;
        verifiedStr += `Visa Access: ${country.visaFree ? 'Visa Free' : country.visaOnArrival ? 'Visa on Arrival' : country.etaAvailable ? 'e-Visa Available' : 'Embassy Required'}\n`;
        verifiedStr += `Processing Time: ${country.processingDaysMin}-${country.processingDaysMax} days\n`;
        verifiedStr += `Currency: ${country.currency} (${country.currencyCode})\n`;
        verifiedStr += `Safety Rating: ${country.safetyRating}/10\n`;
        verifiedStr += `Best Travel Months: ${country.bestTravelMonths}\n`;

        if (country.visaTypes.length > 0) {
          verifiedStr += `\nAvailable Visa Types:\n`;
          for (const vt of country.visaTypes) {
            verifiedStr += `  - ${vt.type}: ${vt.description || 'No description'} (Duration: ${vt.maxDuration}, Multiple Entry: ${vt.multipleEntry})\n`;
          }
        }

        if (country.requirements.length > 0) {
          verifiedStr += `\nKey Requirements (Mandatory):\n`;
          for (const req of country.requirements) {
            verifiedStr += `  - ${req.category}: ${req.requirement}\n`;
          }
        }

        if (country.costProfiles.length > 0) {
          const cp = country.costProfiles[0];
          verifiedStr += `\nCost Estimates:\n`;
          verifiedStr += `  - Visa Fee: $${cp.visaFeeUSD} (≈ PKR ${Math.round(cp.visaFeeUSD * 278.5).toLocaleString()})\n`;
          verifiedStr += `  - Monthly Living: $${cp.monthlyLivingUSD} (≈ PKR ${Math.round(cp.monthlyLivingUSD * 278.5).toLocaleString()})\n`;
          verifiedStr += `  - Total Monthly: $${cp.totalMonthlyUSD}\n`;
        }
        verifiedStr += `\n===== END VERIFIED DATA =====\n`;
        smartContext += verifiedStr;

        proDataInstruction = `\nCRITICAL: You have verified database data for ${country.name} above. Base your answer on it. At the end of your response add: "📊 Data verified from PakVisa database. Always confirm with the official embassy before applying."`;
      }
    }

    if (!proDataInstruction && !proUser) {
      proDataInstruction = `\nIMPORTANT: You do not have verified data for this query. Answer from general knowledge. Remind user that PakVisa Pro gives verified embassy data for 70+ countries.`;
    }

    // System prompt
    const systemPrompt = `You are Sara — a knowledgeable travel assistant for PakVisa Advisor, helping Pakistani travelers plan international trips.

LANGUAGE:
- Your FIRST message should be bilingual — introduce yourself in BOTH English and Roman Urdu, then ask which language they prefer.
- After the user responds, MATCH their language for the ENTIRE rest of the conversation.
- If they switch languages, follow their lead.

YOUR PERSONALITY:
- You are knowledgeable and helpful, like a well-traveled friend who gives practical advice
- You are direct and concise — don't pad responses with unnecessary praise
- You vary your responses — don't repeat the same phrases or structures
- You don't need to comment on every country being "beautiful" or every choice being "smart"
- Ask follow-up questions ONLY when you genuinely need more info to help

FORMATTING:
- NEVER use **bold**, ## headings, or ### subheadings
- Write like texting a knowledgeable friend, not writing an article
- Use bullet points (-) only for lists of 3+ items
- Keep paragraphs short (2-3 sentences)
- 1-2 emojis per message max
- When mentioning an official source, provide a clickable link in markdown format: [Official Website](https://example.com)
- When referring to a country page on this site, link to it: [Turkey Visa Info](/country/turkey)

IMPORTANT — ANTI-SCAM MESSAGING (mention naturally when relevant, in the user's language):
- Many visa consultants in Pakistan overcharge or give wrong information
- Using verified tools and information from PakVisa helps travelers avoid scams
- Our data comes from official embassy sources and is regularly updated
- Travelers who use PakVisa save money and have higher visa success rates because they apply with correct information

IMPORTANT — DISCLAIMER (include naturally in relevant responses, not every message):
- While PakVisa data is very accurate and sourced from official channels, visa requirements can change at any time
- There is no 100% guarantee — always verify with the official embassy before applying
- Our information gives travelers the best possible preparation, which significantly increases their chances

AFFILIATE SERVICES (recommend naturally, max ONE per message, only when it genuinely helps):
- iVisa for e-Visas: [Apply with iVisa](/api/go?p=ivisa)
- SafetyWing for travel insurance: [SafetyWing Insurance](https://safetywing.com/nomad-insurance?referenceID=26323190&utm_source=26323190&utm_medium=Ambassador)
- Booking.com for hotels: [Booking.com](https://www.booking.com/searchresults.html?aid=304142&label=pakvisa)
- Skyscanner for flights: [Skyscanner](https://www.skyscanner.net/)
- Wise for money transfer: [Wise](https://wise.com)
- Holafly for travel eSIM: [Holafly eSIM](/api/go?p=holafly)
- Only mention when the user's question relates to that service
- Say "many travelers use" not "I recommend"
- Never push if they're not interested

PRO UPGRADE (mention only at the right moment, once per conversation max):
- When user has used most free queries or asks something that Pro data would answer better
- English: "Our Pro account gives you verified embassy data for 70+ countries — fees, requirements, processing times all confirmed from official sources. Might be worth it if you're seriously planning."
- Never suggest if user is already Pro

SHARE PROGRAM (mention naturally after helping, once per conversation):
- Share on WhatsApp and earn: 1 friend = 1 extra question, 3 friends = 5 extra, 5 friends = 1 day free Pro
${smartContext}

${proDataInstruction}`;

    // Build conversation contents for Gemini
    const geminiContents: { role: string; parts: { text: string }[] }[] = [];

    if (history && history.length > 0) {
      const recentHistory = history.slice(-15);
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
      parts: [{ text: message }],
    });

    // Gemini API call
    const MODEL = 'gemini-3.6-flash';
    let aiResponse: string | null = null;
    let lastError = '';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: geminiContents,
            generationConfig: { temperature: 0.8, maxOutputTokens: 4096, topP: 0.9 },
          }),
        }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        aiResponse = json?.candidates?.[0]?.content?.parts?.[0]?.text || null;
      } else {
        const errText = await res.text().catch(() => '');
        lastError = `${MODEL}: ${res.status} ${errText.slice(0, 200)}`;
      }
    } catch (err) {
      lastError = `${MODEL}: ${String(err)}`;
    }

    if (!aiResponse) {
      console.error('Sara AI failed:', lastError);
      return NextResponse.json(
        { success: false, error: 'Sara is temporarily unavailable. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: aiResponse,
      remainingQueries,
    });
  } catch (error) {
    console.error('Sara assistant error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
