'use client';
import React, { useState, useMemo } from 'react';
import {
  X, Mail, Lock, User, Phone, Eye, EyeOff, Loader2, LogIn, UserPlus,
  Shield, Check, Plane, Globe, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/auth-store';
import { cn } from '@/lib/utils';

type AuthTab = 'login' | 'signup';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' };
  return { score, label: 'Strong', color: 'bg-emerald-500' };
}

function StrengthBar({ strength }: { strength: ReturnType<typeof getPasswordStrength> }) {
  if (!strength.label) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i <= strength.score ? strength.color : 'bg-muted'
            )}
          />
        ))}
      </div>
      <p className={cn(
        'text-[11px] font-medium',
        strength.score <= 1 ? 'text-red-500' :
        strength.score <= 2 ? 'text-orange-500' :
        strength.score <= 3 ? 'text-yellow-600' : 'text-emerald-500'
      )}>
        {strength.label}
      </p>
    </div>
  );
}

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<AuthTab>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(signupPassword), [signupPassword]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) { toast.error('Email is required'); return; }
    if (!loginPassword) { toast.error('Password is required'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        useAuthStore.getState().setUser(data.user, data.token);
        toast.success(`Welcome back, ${data.user.fullName}!`);
        onClose();
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) { toast.error('Full name is required'); return; }
    if (!signupEmail.trim()) { toast.error('Email is required'); return; }
    if (signupPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (signupPassword !== signupConfirmPassword) { toast.error('Passwords do not match'); return; }
    if (!agreedTerms) { toast.error('Please agree to the Terms of Service'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail.trim(),
          password: signupPassword,
          fullName: signupName.trim(),
          phone: signupPhone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        useAuthStore.getState().setUser(data.user, data.token);
        toast.success(`Welcome to PakVisa, ${data.user.fullName}!`);
        onClose();
      } else {
        toast.error(data.error || 'Sign up failed');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative w-full max-w-[440px] bg-card rounded-2xl border border-border/50 shadow-2xl shadow-black/20 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Decorative gradient top bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">PakVisa</h2>
              <p className="text-[11px] text-muted-foreground">Your gateway to the world</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher — more elegant */}
        <div className="px-6 pt-5 pb-1">
          <div className="flex rounded-xl bg-muted/80 p-1">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-300',
                tab === 'login'
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5'
                  : 'text-muted-foreground hover:text-foreground/70'
              )}
            >
              <LogIn className="h-4 w-4" />
              Login
            </button>
            <button
              type="button"
              onClick={() => setTab('signup')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-300',
                tab === 'signup'
                  ? 'bg-card text-foreground shadow-sm ring-1 ring-black/5'
                  : 'text-muted-foreground hover:text-foreground/70'
              )}
            >
              <UserPlus className="h-4 w-4" />
              Sign Up
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 pt-4 pb-6">
          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Welcome message */}
              <div className="mb-1">
                <h3 className="text-base font-semibold">Welcome back</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Sign in to access your saved countries and preferences</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-sm font-medium text-foreground/80">Email address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-11 h-11 bg-muted/40 border-border/60 focus:bg-background focus:border-emerald-500/50 transition-all rounded-xl"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-sm font-medium text-foreground/80">Password</label>
                  <button type="button" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                    Forgot password?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-11 pr-11 h-11 bg-muted/40 border-border/60 focus:bg-background focus:border-emerald-500/50 transition-all rounded-xl"
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all mt-6"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )}
                Sign In
              </Button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60" /></div>
                <div className="relative flex justify-center text-xs"><span className="px-3 bg-card text-muted-foreground">or continue with</span></div>
              </div>

              <p className="text-sm text-center text-muted-foreground">
                New to PakVisa?{' '}
                <button
                  type="button"
                  onClick={() => setTab('signup')}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  Create free account
                </button>
              </p>
            </form>
          )}

          {/* Signup Form */}
          {tab === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Welcome message */}
              <div className="mb-1">
                <h3 className="text-base font-semibold">Create your account</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Join 10,000+ Pakistani travelers planning their next trip</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-name" className="text-sm font-medium text-foreground/80">Full name</label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Muhammad Ali"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="pl-11 h-11 bg-muted/40 border-border/60 focus:bg-background focus:border-emerald-500/50 transition-all rounded-xl"
                    disabled={loading}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="text-sm font-medium text-foreground/80">Email address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="pl-11 h-11 bg-muted/40 border-border/60 focus:bg-background focus:border-emerald-500/50 transition-all rounded-xl"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-phone" className="text-sm font-medium text-foreground/80">
                  Phone number <span className="text-muted-foreground/60 font-normal">(optional)</span>
                </label>
                <div className="relative group">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="+92 300 1234567"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="pl-11 h-11 bg-muted/40 border-border/60 focus:bg-background focus:border-emerald-500/50 transition-all rounded-xl"
                    disabled={loading}
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="text-sm font-medium text-foreground/80">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="pl-11 pr-11 h-11 bg-muted/40 border-border/60 focus:bg-background focus:border-emerald-500/50 transition-all rounded-xl"
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <StrengthBar strength={passwordStrength} />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="signup-confirm-password" className="text-sm font-medium text-foreground/80">Confirm password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-emerald-500 transition-colors" />
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className={cn(
                      'pl-11 pr-11 h-11 bg-muted/40 border-border/60 focus:bg-background transition-all rounded-xl',
                      signupConfirmPassword && signupConfirmPassword !== signupPassword
                        ? 'border-red-400 focus:border-red-400'
                        : signupConfirmPassword && signupConfirmPassword === signupPassword
                          ? 'border-emerald-400 focus:border-emerald-500/50'
                          : 'focus:border-emerald-500/50'
                    )}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {signupConfirmPassword && signupConfirmPassword === signupPassword && (
                  <p className="text-[11px] text-emerald-500 flex items-center gap-1"><Check className="h-3 w-3" /> Passwords match</p>
                )}
                {signupConfirmPassword && signupConfirmPassword !== signupPassword && (
                  <p className="text-[11px] text-red-500">Passwords don&apos;t match</p>
                )}
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group mt-2">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-4.5 w-4.5 min-h-[18px] min-w-[18px] rounded border-2 border-muted-foreground/30 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 flex items-center justify-center transition-all">
                    <Check className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I agree to PakVisa&apos;s{' '}
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline cursor-pointer">Terms of Service</span>
                  {' '}and{' '}
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline cursor-pointer">Privacy Policy</span>
                </span>
              </label>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all mt-4"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )}
                Create Account
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}

          {/* Benefits section — shows on login tab */}
          {tab === 'login' && (
            <div className="mt-6 pt-5 border-t border-border/50">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Why join PakVisa?</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-muted/30">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mb-1.5">
                    <Globe className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-medium leading-tight">70+ Countries</span>
                </div>
                <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-muted/30">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mb-1.5">
                    <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-medium leading-tight">AI Consultant</span>
                </div>
                <div className="flex flex-col items-center text-center p-2.5 rounded-xl bg-muted/30">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mb-1.5">
                    <Plane className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-medium leading-tight">Travel Tools</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
