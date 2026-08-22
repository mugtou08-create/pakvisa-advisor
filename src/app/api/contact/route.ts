import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(request: NextRequest) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
    if (!rateLimit(ip, 3, 300000)) {
      return NextResponse.json(
        { success: false, message: 'Too many messages. Please wait 5 minutes before sending another.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, subject, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and message are required.' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100 || email.trim().length > 200 || (subject?.trim()?.length ?? 0) > 200 || message.trim().length > 2000) {
      return NextResponse.json(
        { success: false, message: 'Input too long. Please keep your message concise.' },
        { status: 400 }
      );
    }

    const result = await db.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject?.trim() || '',
        message: message.trim(),
        ip,
      },
    });

    console.log('Contact message saved:', result.id, 'from:', email.trim());
    return NextResponse.json({ success: true, message: 'Message sent successfully! We will get back to you soon.' });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('Contact form error:', errMsg, error);
    return NextResponse.json(
      { success: false, message: 'Failed to save message. Please try again.' },
      { status: 500 }
    );
  }
}
