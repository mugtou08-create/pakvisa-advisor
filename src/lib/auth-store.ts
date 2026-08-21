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
