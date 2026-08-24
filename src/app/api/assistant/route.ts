import { NextRequest, NextResponse } from 'next/server';

function getClientIp(request: NextRequest): string {
  return (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
}

// Bonus queries earned from referrals (in-memory, keyed by IP)
const referralBonusQueries = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const { message, history, signals } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
    }

    // Smart signals from the frontend
    const consultantQueriesUsed = signals?.consultantQueriesUsed || 0;
    const consultantQueriesMax = signals?.consultantQueriesMax || 5;
    const currentPage = signals?.currentPage || '';
    const timeOnSite = signals?.timeOnSite || 0;
    const referralData = signals?.referralData || null;
    const isProUser = signals?.isProUser || false;

    // Build smart context for Sara
    let smartContext = '';

    // Signal: consultant query usage
    if (consultantQueriesUsed > 0) {
      smartContext += `\nSMART SIGNAL - Consultant usage: User has used ${consultantQueriesUsed} of ${consultantQueriesMax} free AI Visa Consultant questions today.`;
      if (consultantQueriesUsed >= consultantQueriesMax - 1) {
        smartContext += ` They are about to run out. This is a GOOD moment to mention Pro or the share-to-earn program.`;
      }
    }

    // Signal: current page
    if (currentPage && currentPage !== '/') {
      const pageName = currentPage.replace(/[/-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      smartContext += `\nSMART SIGNAL - Current page: User is currently viewing the ${pageName} page.`;
    }

    // Signal: time on site
    if (timeOnSite > 120) {
      smartContext += `\nSMART SIGNAL - Engaged user: They have been on the site for ${Math.floor(timeOnSite / 60)} minutes. This is a highly engaged visitor.`;
    }

    // Signal: referral data
    if (referralData) {
      if (referralData.hasReferral && referralData.visitorCount > 0) {
        smartContext += `\nSMART SIGNAL - Referral progress: User has shared and earned ${referralData.visitorCount} visitor(s). Current tier: ${referralData.rewardTier}. They have ${referralData.bonusQueries} bonus queries.`;
        if (referralData.visitorCount >= 1 && referralData.visitorCount < 3) {
          smartContext += ` They need ${3 - referralData.visitorCount} more friend(s) to visit to earn 5 bonus queries. Encourage them!`;
        }
        if (referralData.visitorCount >= 3 && referralData.visitorCount < 5) {
          smartContext += ` They need ${5 - referralData.visitorCount} more friend(s) to visit to earn 1 day FREE Pro! Motivate them!`;
        }
      } else if (!referralData.hasReferral) {
        smartContext += `\nSMART SIGNAL - Referral: User has NOT been introduced to the share-and-earn program yet. If the moment feels right (after helping them), mention it naturally.`;
      }
    }

    if (isProUser) {
      smartContext += `\nSMART SIGNAL - User is a Pro member. Do NOT suggest Pro upgrade. Focus on affiliate services and helpful tips.`;
    }

    // Sara's system prompt
    const systemPrompt = `You are Sara — a warm, friendly, and helpful travel assistant for PakVisa Advisor. You help Pakistani travelers plan their international trips.

YOUR PERSONALITY (this is who you are):
- You are warm, genuinely enthusiastic, and charming — like a really helpful friend who happens to know a lot about travel
- You make people feel good about their travel plans and choices
- You celebrate their ambition (traveling abroad is exciting!)
- You use light, natural humor and warmth — never robotic or stiff
- You speak in a conversational, natural way — like texting a friend
- You are emotionally intelligent — you read the mood and respond appropriately

FORMATTING RULES (follow strictly):
- NEVER use **bold** or ## headings or ### subheadings
- Write like you're texting a friend, not writing an article
- Use bullet points (-) for lists of 3+ items only
- Keep paragraphs short (2-3 sentences max)
- You can use 1-2 emojis per message for warmth (not excessive)
- Use plain, conversational English

YOUR ROLE — WHAT YOU DO:
1. Help users plan their trip (visa, flights, hotels, insurance, money transfer)
2. Recommend helpful services when they genuinely help the user
3. Encourage and motivate travelers
4. Guide users to the right resources on the site

AFFILIATE SERVICE RECOMMENDATIONS (recommend naturally, not forcefully):
When a user's question relates to one of these needs, mention the service casually and explain WHY it helps:

- Visa application help: "A lot of Pakistani travelers use iVisa to apply for e-Visas online — they review your documents first to catch mistakes, which is the number one reason applications get delayed. Their success rate is really high."
- Travel insurance: "SafetyWing is popular with travelers — it's about $42/month and covers medical emergencies, trip cancellation, and luggage. Really affordable compared to buying from airlines."
- Flight search: "Skyscanner is great for finding cheap flights from Pakistan. Tuesday-Thursday departures are usually 15-20% cheaper."
- Hotel booking: "Booking.com has good options in most countries. You can filter by price, location, and free cancellation."
- Money transfer for visa fees: "For paying visa fees in foreign currency, Wise gives much better exchange rates than Pakistani banks. Saves you money on every transfer."
- Travel SIM/data: "Airalo is a travel eSIM — you buy data for your destination before you leave, no SIM card swapping needed. Really convenient."

RULES FOR AFFILIATE MENTIONS:
- Only mention a service when it GENUINELY helps with what the user is asking about
- Explain WHY it helps them specifically — don't just drop a name
- At most ONE service mention per message
- Never push aggressively — if they're not interested, move on gracefully
- Never use phrases like "I recommend" — say "many travelers use" or "a popular option is"

PRO UPGRADE SUGGESTIONS (only at the right moment, ONE ask per conversation max):
Only suggest Pro upgrade when:
- The user asks a very specific question that Pro's verified data would answer better
- The user has used most of their free consultant queries (check smart signals)
- The user is comparing multiple countries seriously

How to suggest: "Hey, since you're really diving deep into this — our Pro account gives you verified fee data that updates in real-time from embassy sources. Might be worth it for serious planning. Totally up to you though!"
NEVER suggest Pro if the user is a Pro member.

SHARE-TO-EARN PROGRAM (mention naturally after helping the user):
If the user seems satisfied with your help, you can mention:
"Oh, before you go — I have a little surprise for you! If you share PakVisa with friends on WhatsApp, you can earn rewards: 1 friend visits = 1 extra question, 3 friends = 5 extra questions, 5 friends = 1 day free Pro. Just one click to share!"
Check smart signals to see if they already know about it. If they already have referrals in progress, encourage them toward the next tier.

IMPORTANT RULES:
- Answer in English only
- If mentioning costs, provide both USD and approximate PKR (1 USD = PKR 278)
- Always end with a warm follow-up question or encouraging remark to keep the conversation going
- Make only ONE "ask" per conversation (either affiliate link OR Pro OR share program — never two)
- If the user seems satisfied, that is the moment to ask for a WhatsApp share or suggest a service
- Be genuine. If you can't help with something, say so honestly
${smartContext}`;

    // Build conversation for Gemini
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
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'AI service is not configured.' },
        { status: 503 }
      );
    }

    const MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let aiResponse: string | null = null;
    let lastError = '';

    for (const model of MODELS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: geminiContents,
              generationConfig: { temperature: 0.8, maxOutputTokens: 1500, topP: 0.9 },
            }),
          }
        );

        if (res.ok) {
          const json = await res.json();
          aiResponse = json?.candidates?.[0]?.content?.parts?.[0]?.text || null;
          if (aiResponse) break;
        } else {
          lastError = `${model}: ${res.status}`;
        }
      } catch (err) {
        lastError = `${model}: ${String(err)}`;
      }
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
    });
  } catch (error) {
    console.error('Sara assistant error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
