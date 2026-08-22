import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { writeFile, appendFile, mkdir } from 'fs/promises';
import { join } from 'path';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// File-based error logger (console.error can get lost in dev server output)
async function logToFile(label: string, data: string) {
  try {
    const logDir = join(process.cwd(), 'db');
    await mkdir(logDir, { recursive: true });
    await appendFile(join(logDir, 'contact-errors.log'), `[${new Date().toISOString()}] ${label}: ${data}\n`);
  } catch { /* ignore log failures */ }
}

export async function POST(request: NextRequest) {
  try {
    const ip = (request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();

    // Rate limit: 5 per 5 minutes
    if (!rateLimit(ip, 5, 300000)) {
      return NextResponse.json(
        { success: false, message: 'Too many messages. Please wait 5 minutes before sending another.' },
        { status: 429 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch (parseErr) {
      const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
      await logToFile('PARSE_ERROR', `IP=${ip} Headers=${JSON.stringify(Object.fromEntries(request.headers.entries()))} Error=${msg}`);
      return NextResponse.json(
        { success: false, message: 'Invalid request. Please refresh the page and try again.' },
        { status: 400 }
      );
    }

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
    const errStack = error instanceof Error ? error.stack : '';
    console.error('Contact form error:', errMsg, error);
    await logToFile('DB_ERROR', `${errMsg}\n${errStack}`);
    return NextResponse.json(
      { success: false, message: 'Failed to save message. Please try again.' },
      { status: 500 }
    );
  }
}
