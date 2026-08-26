import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    if (!validateToken(token).valid) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }

    const body = await request.json();
    const { toEmail, smtpHost, smtpPort, smtpUser, smtpPass } = body;

    if (!toEmail || !smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    const port = parseInt(smtpPort) || 587;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: port === 465,
      auth: { user: smtpUser, pass: smtpPass },
      timeout: 10000,
    });

    await transporter.sendMail({
      from: smtpUser,
      to: toEmail,
      subject: 'PakVisa Advisor — Email Notifications Working!',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <div style="background: #059669; color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">PakVisa Advisor</h1>
            <p style="margin: 4px 0 0; opacity: 0.9; font-size: 14px;">Email Notification Test</p>
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
            <p style="color: #059669; font-size: 18px; font-weight: 600; margin: 0 0 12px;">✅ Email notifications are working!</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">You will now receive an email notification whenever a new contact form message is submitted on your website.</p>
            <p style="color: #9ca3af; font-size: 12px; margin: 16px 0 0;">Sent at ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })} PKT</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'Test email sent successfully!' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email test error:', msg);
    return NextResponse.json({ success: false, error: `Failed to send: ${msg}` }, { status: 500 });
  }
}
