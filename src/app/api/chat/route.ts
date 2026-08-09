import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import type { ScoreBreakdown, UserProfileData } from '@/lib/types';

interface ChatRequestBody {
  message: string;
  history?: { role: string; content: string }[];
  context?: {
    countryCode?: string;
    profile?: UserProfileData;
    scoreBreakdown?: ScoreBreakdown;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20 requests/minute
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(ip, 20, 60000)) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body: ChatRequestBody = await request.json();
    const { message, context, history } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'message is required' },
        { status: 400 }
      );
    }

    // Build context string for the LLM
    let contextStr = '';

    if (context?.countryCode) {
      const country = await db.country.findUnique({
        where: { code: context.countryCode.toUpperCase() },
        include: {
          visaTypes: true,
          requirements: true,
          costProfiles: true,
        },
      });

      if (country) {
        contextStr += `\n\nCountry: ${country.name} (${country.code})\n`;
        contextStr += `Continent: ${country.continent}\n`;
        contextStr += `Visa Free: ${country.visaFree}\n`;
        contextStr += `Visa On Arrival: ${country.visaOnArrival}\n`;
        contextStr += `ETA Available: ${country.etaAvailable}\n`;
        contextStr += `Safety Rating: ${country.safetyRating}/10\n`;
        contextStr += `Safety Summary: ${country.safetySummary}\n`;
        contextStr += `Processing Time: ${country.processingDaysMin}-${country.processingDaysMax} days\n`;
        contextStr += `Best Travel Months: ${country.bestTravelMonths}\n`;
        contextStr += `Currency: ${country.currency} (${country.currencyCode})\n`;
        contextStr += `Timezone: ${country.timezone}\n`;
        contextStr += `Source URL: ${country.sourceUrl}\n`;

        if (country.visaTypes.length > 0) {
          contextStr += `\nVisa Types:\n`;
          for (const vt of country.visaTypes) {
            contextStr += `  - ${vt.type}: ${vt.description} (Duration: ${vt.maxDuration}, Extensions: ${vt.extensions}, Multiple Entry: ${vt.multipleEntry})\n`;
          }
        }

        if (country.requirements.length > 0) {
          contextStr += `\nVisa Requirements:\n`;
          for (const req of country.requirements) {
            contextStr += `  - [${req.mandatory ? 'Required' : 'Optional'}] ${req.category}: ${req.requirement}${req.description ? ` - ${req.description}` : ''}\n`;
            if (req.sourceUrl) {
              contextStr += `    Source: ${req.sourceUrl}\n`;
            }
          }
        }

        if (country.costProfiles.length > 0) {
          const cp = country.costProfiles[0];
          contextStr += `\nCost Profile:\n`;
          contextStr += `  - Visa Fee: $${cp.visaFeeUSD}\n`;
          contextStr += `  - Service Fee: $${cp.serviceFeeUSD}\n`;
          contextStr += `  - Processing Days: ${cp.processingDays}\n`;
          contextStr += `  - Monthly Living Cost: $${cp.monthlyLivingUSD}\n`;
          contextStr += `  - Monthly Rent: $${cp.monthlyRentUSD}\n`;
          contextStr += `  - Monthly Food: $${cp.monthlyFoodUSD}\n`;
          contextStr += `  - Monthly Transport: $${cp.monthlyTransportUSD}\n`;
          contextStr += `  - Health Insurance: $${cp.healthInsuranceUSD}\n`;
          contextStr += `  - Total Monthly Cost: $${cp.totalMonthlyUSD}\n`;
        }
      }
    }

    if (context?.profile) {
      contextStr += `\n\nUser Profile:\n`;
      contextStr += `Name: ${context.profile.fullName || 'Not provided'}\n`;
      contextStr += `Age: ${context.profile.age}\n`;
      contextStr += `Nationality: ${context.profile.nationality || 'Pakistani'}\n`;
      contextStr += `Occupation: ${context.profile.occupation || 'Not provided'}\n`;
      contextStr += `Education: ${context.profile.education || 'Not provided'}\n`;
      contextStr += `Monthly Income: $${context.profile.monthlyIncomeUSD}\n`;
      contextStr += `Savings: $${context.profile.savingsUSD}\n`;
      contextStr += `Budget: $${context.profile.budgetUSD}\n`;
      contextStr += `Travel Purpose: ${context.profile.travelPurpose || 'Not provided'}\n`;
      contextStr += `Intended Stay: ${context.profile.intendedStayDays} days\n`;
      contextStr += `Has Prior Travel: ${context.profile.hasPriorTravel}\n`;
      contextStr += `Has Health Insurance: ${context.profile.hasHealthInsurance}\n`;
      contextStr += `Has Return Ticket: ${context.profile.hasReturnTicket}\n`;
      contextStr += `Has Hotel Booking: ${context.profile.hasHotelBooking}\n`;
      contextStr += `Has Sponsor: ${context.profile.hasSponsor}\n`;
      contextStr += `Has Criminal Record: ${context.profile.hasCriminalRecord}\n`;
      contextStr += `Languages: ${(context.profile.languages || []).join(', ') || 'Not specified'}\n`;
    }

    if (context?.scoreBreakdown) {
      const sb = context.scoreBreakdown;
      contextStr += `\n\nScore Breakdown for ${sb.country}:\n`;
      contextStr += `Final Score: ${sb.finalScore}/100\n`;
      contextStr += `Visa Likelihood: ${sb.visaLikelihood}%\n`;
      contextStr += `Cost Suitability: ${sb.costSuitability}%\n`;
      contextStr += `Eligibility: ${sb.eligibility}%\n`;
      contextStr += `Confidence: ${sb.confidence}\n`;

      if (sb.components.length > 0) {
        contextStr += `\nScore Components:\n`;
        for (const comp of sb.components) {
          contextStr += `  - ${comp.name}: ${Math.round(comp.score)}% (Weight: ${comp.weight * 100}%, Details: ${comp.details})\n`;
        }
      }

      if (sb.hardFilters.length > 0) {
        contextStr += `\nHard Filters:\n`;
        for (const filter of sb.hardFilters) {
          contextStr += `  - ${filter.filter}: ${filter.passed ? 'PASSED' : 'FAILED'} (${filter.severity}) - ${filter.message}\n`;
        }
      }

      if (sb.missingItems.length > 0) {
        contextStr += `\nMissing Items:\n`;
        for (const item of sb.missingItems) {
          contextStr += `  - ${item}\n`;
        }
      }

      if (sb.tips.length > 0) {
        contextStr += `\nTips:\n`;
        for (const tip of sb.tips) {
          contextStr += `  - ${tip}\n`;
        }
      }

      if (sb.sourceCitations.length > 0) {
        contextStr += `\nSource Citations:\n`;
        for (const citation of sb.sourceCitations) {
          contextStr += `  - ${citation.title}: ${citation.url} (Confidence: ${citation.confidence})\n`;
        }
      }
    }

    const systemPrompt = `You are an expert Visa Consultant specializing in Pakistani passport visas. Answer in English only. Always cite official sources when making factual claims. Base your answers on the provided country data, score breakdown, and user profile. Be helpful, accurate, and specific.

Key points:
- Always reference the specific country's visa requirements, costs, and processing times when relevant
- Use the score breakdown data to explain visa likelihood and eligibility
- Mention missing documents or areas for improvement based on the profile data
- Provide actionable advice for Pakistani passport holders
- If data confidence is below 80%, note that information should be verified with the embassy
- Format responses clearly with bullet points when listing multiple items
- Always be encouraging but realistic about visa chances`;

    // Build messages array for multi-turn support
    const messages: { role: string; content: string }[] = [
      {
        role: 'assistant',
        content: systemPrompt,
      },
    ];

    // Add conversation history if provided
    if (history && history.length > 0) {
      for (const h of history) {
        if (h.role === 'user' || h.role === 'assistant') {
          messages.push({ role: h.role, content: h.content });
        }
      }
    }

    // Add current message with context
    messages.push({
      role: 'user',
      content: contextStr
        ? `${message}\n\n---Context Data---\n${contextStr}`
        : message,
    });

    // Call the LLM using correct SDK format
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    });

    const aiResponse = completion.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { success: false, error: 'Empty response from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: aiResponse,
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message', details: String(error) },
      { status: 500 }
    );
  }
}
