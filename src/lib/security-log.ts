import { db } from '@/lib/db';

export async function logSecurityEvent(data: {
  action: string;
  email?: string;
  ip: string;
  userAgent?: string;
  success: boolean;
  details?: string;
}) {
  try {
    await db.securityLog.create({
      data: {
        action: data.action,
        email: data.email || '',
        ip: data.ip,
        userAgent: data.userAgent || '',
        success: data.success,
        details: data.details || '',
      },
    });
  } catch {
    /* silent — never break the request */
  }
}
