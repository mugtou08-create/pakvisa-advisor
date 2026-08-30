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

/**
 * Parse a regular user token (format: base64("user:{id}:{timestamp}"))
 */
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

/**
 * Parse an admin token (format: base64("{id}:{username}:{role}:{timestamp}"))
 */
function parseAdminToken(token: string): { valid: boolean; adminId?: string; username?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    // Admin tokens do NOT start with "user:" and have 4 colon-separated parts
    if (decoded.startsWith('user:')) return { valid: false };
    const parts = decoded.split(':');
    if (parts.length !== 4) return { valid: false };
    const [id, username, role, ts] = parts;
    const timestamp = parseInt(ts);
    if (!id || !username || role !== 'admin' || !timestamp || Date.now() - timestamp > 604800000) return { valid: false };
    return { valid: true, adminId: id, username };
  } catch {
    return { valid: false };
  }
}

/**
 * Get the authenticated user from a request.
 * Supports both regular user tokens and admin tokens.
 * Admin users are treated as Pro users with no expiry.
 */
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

  // Try admin token first
  const adminParsed = parseAdminToken(token);
  if (adminParsed.valid && adminParsed.adminId) {
    const admin = await db.adminUser.findUnique({ where: { id: adminParsed.adminId } });
    if (admin) {
      return {
        id: admin.id,
        email: `${admin.username}@admin.pakvisa.com`,
        fullName: admin.username,
        phone: '',
        role: 'admin',
        proExpiresAt: null, // Admin never expires
      };
    }
  }

  // Try regular user token
  const parsed = parseUserToken(token);
  if (!parsed.valid || !parsed.userId) return null;
  const user = await db.user.findUnique({ where: { id: parsed.userId } });
  if (!user || !user.isActive) return null;

  // Auto-downgrade expired pro (never touches admin — they come through the path above)
  if (user.role === 'pro' && user.proExpiresAt && new Date(user.proExpiresAt) < new Date()) {
    await db.user.update({ where: { id: user.id }, data: { role: 'free', proExpiresAt: null } });
    return { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: 'free', proExpiresAt: null };
  }

  return { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: user.role as 'free' | 'pro' | 'admin', proExpiresAt: user.proExpiresAt?.toISOString() || null };
}

/**
 * Check if a user has Pro-level access.
 * Admin users always have access (never expires).
 * Pro users must have a valid future proExpiresAt.
 */
export function isProUser(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.role === 'pro' && !!user.proExpiresAt && new Date(user.proExpiresAt) > new Date();
}