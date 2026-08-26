import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

function validateToken(token: string): { valid: boolean; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    const [id, username] = parts;
    if (!id || !username) return { valid: false };
    const timestamp = parseInt(parts[3]);
    if (!timestamp || Date.now() - timestamp > 604800000) return { valid: false };
    return { valid: true, username };
  } catch {
    return { valid: false };
  }
}

function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const validation = validateToken(token);
  return validation.valid ? token : null;
}

export async function POST(request: NextRequest) {
  try {
    const token = authenticate(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    if (!rateLimit(ip, 5, 60000)) {
      return NextResponse.json({ success: false, error: 'Rate limited' }, { status: 429 });
    }

    const body = await request.json();
    const { name, email, subject, message: userMessage } = body;

    if (!name || !userMessage) {
      return NextResponse.json({ success: false, error: 'Name and message are required' }, { status: 400 });
    }

    // Dynamic import of z-ai-web-dev-sdk (server-only)
    const ZAI = await import('z-ai-web-dev-sdk').then(m => m.default);
    const zai = await ZAI.create();

    const systemPrompt = `You are a professional customer support agent for PakVisa Advisor, a visa information website for Pakistani passport holders.

Your job is to draft 3 concise, helpful reply suggestions for an incoming user message. Each reply should:
- Be warm but professional
- Directly address the user's question
- Include relevant visa information if applicable
- Be 2-4 sentences long
- Never promise something you're not sure about
- Suggest checking official sources when appropriate

IMPORTANT: You must respond with ONLY a valid JSON array of 3 strings. No other text, no markdown, no explanation. Example:
["Reply one text here.", "Reply two text here.", "Reply three text here."]`;

    const userPrompt = `User name: ${name}
User email: ${email || 'not provided'}
Subject: ${subject || 'no subject'}
Message: ${userMessage}

Generate 3 reply suggestions as a JSON array of strings.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    });

    let raw = completion.choices[0]?.message?.content || '';

    // Extract JSON array from the response (handle markdown wrapping)
    const jsonMatch = raw.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      return NextResponse.json({
        success: true,
        suggestions: [
          'Thank you for reaching out! We will review your query and get back to you within 24 hours.',
          'For the most up-to-date visa information, please use our AI Visa Consultant chat on the website.',
          'We recommend checking the official embassy website for the latest requirements and appointment availability.',
        ],
      });
    }

    let suggestions: string[];
    try {
      suggestions = JSON.parse(jsonMatch[0]);
    } catch {
      // If JSON parse fails, try to split by numbered lines
      suggestions = raw
        .split(/\n/)
        .map(l => l.replace(/^\d+[.)]\s*/, '').trim())
        .filter(l => l.length > 10)
        .slice(0, 3);
    }

    // Validate we have at least some suggestions
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      suggestions = [
        'Thank you for your message. We are looking into this and will respond shortly.',
      ];
    }

    return NextResponse.json({
      success: true,
      suggestions: suggestions.slice(0, 3).map(s => s.slice(0, 500)), // Cap length
    });
  } catch (error) {
    console.error('AI suggest reply error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate suggestions',
    }, { status: 500 });
  }
}
