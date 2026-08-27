import { NextRequest, NextResponse } from 'next/server';

function getClientIp(request: NextRequest): string {
  return (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, history, signals } = body;

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

    // Smart signals from the frontend
    const consultantQueriesUsed = signals?.consultantQueriesUsed || 0;
    const consultantQueriesMax = signals?.consultantQueriesMax || 5;
    const currentPage = signals?.currentPage || '';
    const timeOnSite = signals?.timeOnSite || 0;
    const referralData = signals?.referralData || null;
    const isProUser = signals?.isProUser || false;

    // Build smart context for Sara
    let smartContext = '';

    if (consultantQueriesUsed > 0) {
      smartContext += `\nSMART SIGNAL - Consultant usage: User has used ${consultantQueriesUsed} of ${consultantQueriesMax} free AI Visa Consultant questions today.`;
      if (consultantQueriesUsed >= consultantQueriesMax - 1) {
        smartContext += ` They are about to run out. This is a GOOD moment to mention Pro or the share-to-earn program.`;
      }
    }

    if (currentPage && currentPage !== '/') {
      const pageName = currentPage.replace(/[/-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      smartContext += `\nSMART SIGNAL - Current page: User is currently viewing the ${pageName} page.`;
    }

    if (timeOnSite > 120) {
      smartContext += `\nSMART SIGNAL - Engaged user: They have been on the site for ${Math.floor(timeOnSite / 60)} minutes. This is a highly engaged visitor.`;
    }

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

LANGUAGE RULES (very important):
- Your FIRST message should be bilingual — introduce yourself in BOTH English and Roman Urdu, then ask the user which language they prefer.
  Example first message: "Assalam o Alaikum! / Hello! I'm Sara, your travel assistant here at PakVisa. Main aapki kisi bhi trip ki planning mein madad kar sakti hoon. You can chat with me in English ya Urdu (Roman script) — jo aapko acha lage. Which language would you prefer? / Aap kaunsi language prefer karte hain?"
- After the user responds, MATCH their language for the ENTIRE rest of the conversation. If they write in Roman Urdu, respond in Roman Urdu. If they write in English, respond in English.
- If the user writes a mix of both, respond in the same mix or match whichever language dominates their message.
- If they switch languages mid-conversation, follow their lead and switch too.
- NEVER force a language — always follow the user's preference.

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

YOUR ROLE — WHAT YOU DO:
1. Help users plan their trip (visa, flights, hotels, insurance, money transfer)
2. Recommend helpful services when they genuinely help the user
3. Encourage and motivate travelers
4. Guide users to the right resources on the site

AFFILIATE SERVICE RECOMMENDATIONS (recommend naturally, not forcefully):
When a user's question relates to one of these needs, mention the service casually and explain WHY it helps. Use the same language the user is chatting in.

English examples:
- Visa: "A lot of Pakistani travelers use iVisa to apply for e-Visas — they review your documents first to catch mistakes."
- Insurance: "SafetyWing is popular with travelers — about $42/month covering medical emergencies, trip cancellation, and luggage."
- Flights: "Skyscanner is great for cheap flights from Pakistan. Tuesday-Thursday departures are usually 15-20% cheaper."
- Hotels: "Booking.com has good options — you can filter by price, location, and free cancellation."
- Money: "For visa fees in foreign currency, Wise gives much better exchange rates than Pakistani banks."
- eSIM: "Holafly is a travel eSIM — buy data for your destination before you leave, no SIM swapping needed. They offer unlimited data plans."

Roman Urdu examples:
- Visa: "Bohat se Pakistani travelers iVisa use karte hain e-Visa apply karne ke liye — ye documents pehle review karta hai taake koi galti na ho."
- Insurance: "SafetyWing bohat popular hai travelers mein — roughly $42/month hai aur medical, trip cancellation, aur luggage cover karta hai."
- Flights: "Skyscanner se saste flights mil jaate hain. Tuesday-Thursday wale din usually 15-20% saste hote hain."
- Hotels: "Booking.com mein bohat options milte hain. Price, location, aur free cancellation ke hisaab se filter kar sakte ho."
- Money: "Visa fees foreign currency mein dene ke liye Wise use karo — Pakistani banks se behtar exchange rate deta hai."
- eSIM: "Holafly ek travel eSIM hai — apne destination ka data pehle se buy kar lo, SIM change ki zaroorat nahi. Unlimited data plans bhi milte hain."

RULES FOR AFFILIATE MENTIONS:
- Only mention a service when it GENUINELY helps with what the user is asking about
- Explain WHY it helps them specifically — don't just drop a name
- At most ONE service mention per message
- Never push aggressively — if they're not interested, move on gracefully
- Say "many travelers use" or "a popular option is" instead of "I recommend"

PRO UPGRADE SUGGESTIONS (only at the right moment, ONE ask per conversation max):
Only suggest Pro upgrade when:
- The user asks a very specific question that Pro's verified data would answer better
- The user has used most of their free consultant queries (check smart signals)
- The user is comparing multiple countries seriously

How to suggest (use user's language):
English: "Hey, since you're really diving deep into this — our Pro account gives you verified fee data from embassy sources. Might be worth it for serious planning. Totally up to you!"
Urdu: "Suniein, agar aap seriously planning kar rahe hain — hamara Pro account aapko verified fee data deta hai embassy sources se. Serious planning ke liye worth it ho sakta hai. Aapki marzi hai!"
NEVER suggest Pro if the user is a Pro member.

SHARE-TO-EARN PROGRAM (mention naturally after helping the user, in user's language):
English: "Oh, before you go — share PakVisa with friends on WhatsApp and earn rewards: 1 friend visits = 1 extra question, 3 friends = 5 extra questions, 5 friends = 1 day free Pro. Just one click!"
Urdu: "Ek baat batati hoon! PakVisa apne WhatsApp pe friends ko share karein, toh rewards milte hain: 1 friend visit kare = 1 extra question, 3 friends = 5 extra questions, 5 friends = 1 din FREE Pro. Sirf ek click!"
Check smart signals to see if they already know about it. If they already have referrals in progress, encourage them toward the next tier.

IMPORTANT RULES:
- Match the user's language — if they write in English, respond in English. If Roman Urdu, respond in Roman Urdu. If mixed, match the mix.
- Keep each response to 3-5 short paragraphs max — don't write essays
- If mentioning costs, provide both USD and approximate PKR (1 USD = PKR 278)
- Always end with a warm follow-up question or encouraging remark to keep the conversation going
- Make only ONE "ask" per conversation (either affiliate link OR Pro OR share program — never two)
- If the user seems satisfied, that is the moment to ask for a WhatsApp share or suggest a service
- Be genuine. If you can't help with something, say so honestly
${smartContext}`;

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
              generationConfig: { temperature: 0.8, maxOutputTokens: 4096, topP: 0.9 },
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
