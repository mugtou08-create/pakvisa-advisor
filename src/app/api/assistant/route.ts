import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserFromRequest, isProUser } from '@/lib/auth';
import { detectCountries } from '@/lib/country-detect';

// Rate limits
const FREE_RATE_LIMIT = 5;
const PRO_DAILY_LIMIT = 25;
const PRO_MONTHLY_LIMIT = 200;
const FREE_WINDOW = 86400000; // 24 hours
const PKR_RATE = 278.5;

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
      // Pro users: DB-based daily + monthly limit
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const monthStart = new Date(todayStart);
      monthStart.setDate(1);

      const [todayCount, monthCount] = await Promise.all([
        db.aiUsageLog.count({ where: { userId, createdAt: { gte: todayStart, lte: todayEnd } } }),
        db.aiUsageLog.count({ where: { userId, createdAt: { gte: monthStart, lte: todayEnd } } }),
      ]);

      if (todayCount >= PRO_DAILY_LIMIT) {
        return NextResponse.json({
          success: false,
          error: `You've used all ${PRO_DAILY_LIMIT} questions for today. Come back tomorrow!`,
          code: 'LIMIT_REACHED',
          remainingQueries: 0,
        });
      }
      if (monthCount >= PRO_MONTHLY_LIMIT) {
        return NextResponse.json({
          success: false,
          error: `You've used all ${PRO_MONTHLY_LIMIT} questions this month. Your limit resets next month.`,
          code: 'LIMIT_REACHED',
          remainingQueries: 0,
        });
      }
      await db.aiUsageLog.create({ data: { userId: userId!, message: message.slice(0, 200) } });
    } else if (userId) {
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
          error: `You've used all ${FREE_RATE_LIMIT} free questions today. Share PakVisa with friends to earn more, or upgrade to Pro for ${PRO_DAILY_LIMIT} questions/day!`,
          code: 'LIMIT_REACHED',
          remainingQueries: 0,
        });
      }
      await db.aiUsageLog.create({ data: { userId, message: message.slice(0, 200) } });
    } else {
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
      remainingQueries = PRO_DAILY_LIMIT - todayCount;
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
          verifiedStr += `  - Visa Fee: $${cp.visaFeeUSD} (≈ PKR ${Math.round(cp.visaFeeUSD * PKR_RATE).toLocaleString()})\n`;
          verifiedStr += `  - Monthly Living: $${cp.monthlyLivingUSD} (≈ PKR ${Math.round(cp.monthlyLivingUSD * PKR_RATE).toLocaleString()})\n`;
          verifiedStr += `  - Total Monthly: $${cp.totalMonthlyUSD}\n`;
        }
        verifiedStr += `\n===== END VERIFIED DATA =====\n`;
        smartContext += verifiedStr;

        proDataInstruction = `\nCRITICAL: You have verified database data for ${country.name} above. Base your answer on it. At the end of your response add: "Data verified from PakVisa database. Always confirm with the official embassy before applying."`;
      }
    }

    if (!proDataInstruction && !proUser) {
      proDataInstruction = `\nIMPORTANT: You do not have verified data for this query. Answer from general knowledge. This is a great opportunity to mention that PakVisa Pro gives verified embassy data for 70+ countries with exact fees, requirements, and processing times.`;
    }

    // System prompt
    const systemPrompt = `You are Sara — a knowledgeable travel assistant for PakVisa Advisor, helping Pakistani travelers plan international trips and avoid getting scammed by greedy visa consultants.

LANGUAGE:
- Your FIRST message should be bilingual — introduce yourself in BOTH English and Roman Urdu, then ask which language they prefer.
- After the user responds, MATCH their language for the ENTIRE rest of the conversation.
- If they switch languages, follow their lead.

YOUR PERSONALITY (very important — follow strictly):
- You are knowledgeable and helpful, like a well-traveled friend who gives practical advice
- You are direct and concise — don't pad responses with unnecessary praise
- Vary your responses — NEVER repeat phrases like "beautiful country", "smart choice", "great decision", "wonderful destination"
- Do NOT comment on the user's choice of country being good/smart. Just give the information they need.
- Ask follow-up questions ONLY when you genuinely need more info to help — do NOT force a follow-up at the end of every message
- Sound like a real person texting, not an AI writing an article

FORMATTING:
- NEVER use **bold**, ## headings, or ### subheadings
- Write like texting a knowledgeable friend, not writing an article
- Use bullet points (-) only for lists of 3+ items
- Keep paragraphs short (2-3 sentences)
- 1-2 emojis per message max
- When mentioning prices, ALWAYS show USD first then PKR in brackets. Example: "$80 (≈ PKR 22,280)"
- When mentioning an official source, provide a clickable link: [Official Website](https://example.com)
- When referring to a country page on this site, link to it: [Turkey Visa Info](/country/turkey)

CLICKABLE LINKS (very important):
- When you mention an embassy, consulate, or official government website, create a clickable markdown link
- Example: "Check the [UK Visas & Immigration website](https://www.gov.uk/browse/visas-immigration) for the latest requirements"
- Example: "You can apply at the [UAE ICP portal](https://icp.gov.ae/)"
- When you mention a country available on PakVisa, link to its page: [Germany Visa Info](/country/germany)
- ALWAYS use markdown link format: [Link Text](URL) — the frontend will render these as clickable

ANTI-SCAM MESSAGING (mention naturally when relevant, in the user's language):
- Many visa consultants in Pakistan charge PKR 20,000-40,000 (≈ $72-144) just for basic visa information
- For work visas, some consultants demand half or even a full month's salary of the destination country
- On top of their fee, they often add hidden charges: "document verification fee", "priority processing fee", "translation charges" — the final bill can be double what was quoted
- They give generic advice, not country-specific verified data
- If the visa gets rejected, they blame the user — no accountability
- PakVisa provides the same verified information transparently for a fraction of that cost
- Our data comes from official embassy sources and is regularly updated
- Users who use PakVisa save money and apply with confidence because they have correct, verified information

PRO SALES MESSAGING (your most important job — be a helpful guide who naturally shows the value of Pro):
- You are not just a travel assistant — you are also a guide who helps users understand why PakVisa Pro is worth it
- When a user asks detailed questions about visa requirements, fees, processing times, or document checklists, this is the PERFECT moment to mention Pro
- Mention Pro naturally, not like a sales ad. Example: "By the way, with Pro I can pull up verified embassy data for 70+ countries — exact fees, all document requirements, processing times, everything confirmed from official sources. It costs $19.99/month (≈ PKR 5,565) which is nothing compared to the PKR 20,000-40,000 visa consultants charge — and you get info for ALL countries, not just one."
- Emphasize the comparison with visa consultants: "A visa consultant charges you PKR 20,000-40,000 for info about ONE country. PakVisa Pro gives you verified data for 70+ countries at $19.99/month (≈ PKR 5,565). That's the real value."
- Mention transparency: "What I like about PakVisa is there are no hidden fees. You pay $19.99/month (≈ PKR 5,565) and you get everything — verified data, PDF guides, saved chat history, all visa types for all countries. No surprises."
- When mentioning Pro pricing, always say: "$19.99/month (≈ PKR 5,565)" — USD first, then PKR in brackets
- Mention the savings on longer plans when relevant: "If you commit to a year it's $159.99 (≈ PKR 44,500) — that's like getting 4 months free"
- Do NOT suggest Pro if user is already Pro (you'll be told via smart signal)
- Maximum one Pro mention per conversation — don't be annoying about it
- The best time to mention Pro is after you've helped with something specific — they can see the value

DISCLAIMER (include naturally in relevant responses, not every message):
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
