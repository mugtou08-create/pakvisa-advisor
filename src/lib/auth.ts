import { cookies } from 'next/headers';
import { db } from './db';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'free' | 'pro' | 'admin';
  proExpiresAt: string | null;
}

export function parseUserToken(token: string): { valid: boolean; userId?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    if (!decoded.startsWith('user:')) return { valid: false };
    const parts = decoded.split(':');
    const userId = parts[1];
    const timestamp = parseInt(parts[2]);
    if (!userId || !timestamp || Date.now() - timestamp > 604800000) return { valid: false };
    return { valid: true, userId };
  } catch {
    return { valid: false };
  }
}

export async function getUserFromRequest(request?: Request): Promise<AuthUser | null> {
  let token = '';
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) token = authHeader.replace('Bearer ', '');
  }
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get('user_token')?.value || '';
    } catch { /* SSR context */ }
  }
  if (!token) return null;
  const parsed = parseUserToken(token);
  if (!parsed.valid || !parsed.userId) return null;
  const user = await db.user.findUnique({ where: { id: parsed.userId } });
  if (!user || !user.isActive) return null;
  // Auto-downgrade expired pro
  if (user.role === 'pro' && user.proExpiresAt && new Date(user.proExpiresAt) < new Date()) {
    await db.user.update({ where: { id: user.id }, data: { role: 'free', proExpiresAt: null } });
    return { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: 'free', proExpiresAt: null };
  }
  return { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: user.role as 'free' | 'pro', proExpiresAt: user.proExpiresAt?.toISOString() || null };
}

export function isProUser(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.role === 'pro' && !!user.proExpiresAt && new Date(user.proExpiresAt) > new Date();
}
