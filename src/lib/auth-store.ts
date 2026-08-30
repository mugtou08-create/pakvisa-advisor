import { create } from 'zustand';

interface AuthState {
  user: { id: string; email: string; fullName: string; phone: string; role: string; proExpiresAt: string | null } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  latestProof: { id: string; status: string; createdAt: string; adminNote: string } | null;
  setUser: (user: any, token: string | null) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('user_token') : null,
  isAuthenticated: false,
  isLoading: true,
  latestProof: null,
  setUser: (user, token) => {
    if (token) localStorage.setItem('user_token', token);
    set({ user, token, isAuthenticated: !!user });
  },
  logout: () => {
    localStorage.removeItem('user_token');
    fetch('/api/auth/logout', { method: 'POST' });
    set({ user: null, token: null, isAuthenticated: false, latestProof: null });
  },
  setLoading: (loading) => set({ isLoading: loading }),
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = get().token || localStorage.getItem('user_token');
      if (!token) { set({ isLoading: false, user: null, isAuthenticated: false, latestProof: null }); return; }
      const res = await fetch('/api/auth/me', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, token, isAuthenticated: true, latestProof: data.latestProof || null });
      } else {
        localStorage.removeItem('user_token');
        set({ user: null, token: null, isAuthenticated: false, latestProof: null });
      }
    } catch {
      set({ user: null, token: null, isAuthenticated: false, latestProof: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));

/**
 * Check if the current user has Pro-level access.
 * Returns true if:
 *  - An admin session exists (owner/admin always has full access)
 *  - The user object has role 'admin'
 *  - The user object has role 'pro' AND proExpiresAt is a future date
 */
export function isProUser(user: AuthState['user']): boolean {
  // Check for admin panel session (separate auth system)
  if (typeof window !== 'undefined' && localStorage.getItem('pakvisa-admin-token')) {
    return true;
  }
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.role === 'pro' && !!user.proExpiresAt && new Date(user.proExpiresAt) > new Date();
}
