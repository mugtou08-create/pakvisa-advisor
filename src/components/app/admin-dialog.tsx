'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Settings, Lock, Eye, EyeOff, Shield, Globe, Users, Activity,
  ToggleLeft, ToggleRight, BarChart3, LogOut, Database, Zap, AlertTriangle,
  RefreshCw, Server, FileCheck, MessageSquare, Mail, Send, Trash2,
  ChevronLeft, ChevronRight, Check, Clock, User, Inbox, TrendingUp,
  Phone, ExternalLink, Reply, Search, CheckCheck, Download, Copy,
  Filter, X, ChevronDown, MessageCircle, XIcon, CreditCard, FileImage,
  Bell, ArrowRightLeft, Loader2, AlertCircle, Info, ClipboardCheck,
  Lightbulb, ShieldAlert, Search as SearchIcon, MousePointerClick, Monitor, Smartphone, Tablet, Globe2, Link2, Share2, Clock as ClockIcon, CheckCircle2, XCircle, BarChart2, PieChart as PieChartIcon, Eye as EyeIcon, Flag, Fingerprint, UsersRound, ArrowUpRight, AlertOctagon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface AdminDialogProps {
  open: boolean;
  onClose: () => void;
  aiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;
}

interface AnalyticsData {
  countries: { total: number; visaFree: number; visaOnArrival: number; etaAvailable: number };
  visaCategories: { visaFree: number; visaOnArrival: number; etaAvailable: number; regularVisa: number };
  continents: Array<{ continent: string; count: number }>;
  dataFreshness: string | null;
  requirements: number;
  costProfiles: number;
  users: number;
  sessions: number;
  adminUsers: Array<{ username: string; lastLogin: string | null; isOnline: boolean; createdAt: string }>;
  settings: Record<string, string>;
  messageStats: {
    total: number;
    thisWeek: number;
    unread: number;
    replied: number;
    responseRate: number;
    dailyMessages: Array<{ date: string; count: number }>;
  };
  subscriberStats: {
    total: number;
    active: number;
    thisWeek: number;
  };
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  isReplied: boolean;
  reply: string;
  ip: string;
  createdAt: string;
}

interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  isActive: boolean;
}

interface PaymentProofWithUser {
  id: string;
  userId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  status: string;
  userNote: string;
  adminNote: string;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    role: string;
    proExpiresAt: string | null;
  };
}

type AdminSection = 'overview' | 'visitors' | 'messages' | 'newsletter' | 'payment-proofs' | 'analytics' | 'settings' | 'data-sync' | 'insights' | 'hero-images';
type SyncStage = 'idle' | 'researching' | 'preview' | 'applying' | 'done';
type MessageFilter = 'all' | 'unread' | 'replied';

const QUICK_REPLIES = [
  'Thank you for reaching out! We will review your query and get back to you within 24 hours.',
  'For the most up-to-date visa information, please check our website or use Sara AI.',
  'We recommend checking the official embassy/consulate website for the latest requirements and appointment availability.',
  'Your question has been noted. For urgent visa matters, please contact the relevant embassy directly.',
];

export function AdminDialog({ open, onClose, aiEnabled, setAiEnabled }: AdminDialogProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [togglingAi, setTogglingAi] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesTotal, setMessagesTotal] = useState(0);
  const [messagesUnread, setMessagesUnread] = useState(0);
  const [messagesPage, setMessagesPage] = useState(1);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [messageFilter, setMessageFilter] = useState<MessageFilter>('all');
  const [messageSearch, setMessageSearch] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Newsletter state
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [subscribersTotal, setSubscribersTotal] = useState(0);
  const [subscribersActive, setSubscribersActive] = useState(0);
  const [subscribersPage, setSubscribersPage] = useState(1);
  const [subscribersLoading, setSubscribersLoading] = useState(false);

  // Payment proofs state
  const [paymentProofs, setPaymentProofs] = useState<PaymentProofWithUser[]>([]);
  const [paymentProofsPending, setPaymentProofsPending] = useState(0);
  const [paymentProofsLoading, setPaymentProofsLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  // Notifications state
  const [notifications, setNotifications] = useState<Array<{ id: string; type: string; title: string; message: string; isRead: boolean; data: string; createdAt: string }>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  // WhatsApp number settings
  const [whatsappRaw, setWhatsappRaw] = useState('');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // Data Sync state
  const [syncStage, setSyncStage] = useState<SyncStage>('idle');
  const [syncChanges, setSyncChanges] = useState<Array<{
    id: string; name: string;
    before: { accessType: string; visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean; visaFeeUSD: number; processingDaysMin: number; processingDaysMax: number };
    after: { accessType: string; visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean; visaFeeUSD: number; processingDaysMin: number; processingDaysMax: number };
    reason: string; source: string;
  }>>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncTotalCountries, setSyncTotalCountries] = useState(0);
  const [syncAppliedCount, setSyncAppliedCount] = useState(0);
  const [syncFailedCount, setSyncFailedCount] = useState(0);
  const [syncResearchTime, setSyncResearchTime] = useState<string | null>(null);
  // Audit state (View All Data)
  const [auditData, setAuditData] = useState<Array<{
    name: string; code: string; accessType: string;
    visaFree: boolean; visaOnArrival: boolean; etaAvailable: boolean;
    visaFeeUSD: number; processingDaysMin: number; processingDaysMax: number;
    hasCostProfile: boolean;
  }>>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  // Backup download state
  const [backupDownloading, setBackupDownloading] = useState(false);

  // Visitors state
  const [visitorData, setVisitorData] = useState<{
    live: Array<{ id: string; sessionId: string; country: string; city: string; page: string; lastSeen: string; flag: string }>;
    todayCount: number; weekCount: number; monthCount: number;
    topCountries: Array<{ country: string; flag: string; count: number }>;
    weekBreakdown: Array<{ date: string; visitors: number }>;
    monthBreakdown: Array<{ date: string; visitors: number }>;
    totalAllTime: number;
    userActivity: {
      totalUsers: number;
      recentSignups: Array<{ id: string; email: string; fullName: string; createdAt: string }>;
      recentLogins: Array<{ id: string; email: string; fullName: string; lastLogin: string | null }>;
    };
  } | null>(null);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [visitorPeriod, setVisitorPeriod] = useState<'live' | 'today' | 'week' | 'month'>('live');

  // Insights state
  const [insightsData, setInsightsData] = useState<{
    alerts: Array<{ type: 'error' | 'warning' | 'info'; title: string; message: string }>;
    totalUsers: number; freeUsers: number; proUsers: number; newUsersWeek: number; newUsersMonth: number;
    searchesToday: number; searchesWeek: number;
    affiliateClicks: number;
    failedLogins: number;
    topSearchQueries: Array<{ query: string; count: number }>;
    popularCountries: Array<{ flag: string; name: string; visitors: number }>;
    trafficSources: { organic: number; direct: number; social: number; referral: number };
    deviceBreakdown: { desktop: number; mobile: number; tablet: number };
    browserBreakdown: Array<{ browser: string; percentage: number }>;
    visaDataFreshness: Array<{ flag: string; name: string; daysSinceUpdate: number }>;
    securityLog: Array<{ timestamp: string; action: string; email: string; ip: string; success: boolean }>;
    securityStats: { totalLogins: number; failedAttempts: number };
    affiliateTracking: Array<{ partner: string; clicks: number }>;
  } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('pakvisa-admin-token');
    if (savedToken) {
      try {
        const decoded = Buffer.from(savedToken, 'base64').toString('utf-8');
        const parts = decoded.split(':');
        const timestamp = parseInt(parts[parts.length - 1]);
        if (timestamp && Date.now() - timestamp <= 604800000) {
          setToken(savedToken);
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem('pakvisa-admin-token');
        }
      } catch {
        localStorage.removeItem('pakvisa-admin-token');
      }
    }
  }, []);

  const handleLogin = useCallback(async () => {
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter username and password');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('pakvisa-admin-token', data.data.token);
        setToken(data.data.token);
        setIsLoggedIn(true);
        toast.success('Logged in successfully');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setLoginLoading(false);
    }
  }, [username, password]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('pakvisa-admin-token');
    setToken(null);
    setIsLoggedIn(false);
    setUsername(''); setPassword('');
    setAnalytics(null);
    setMessages([]);
    setSubscribers([]);
    setPaymentProofs([]);
    setPaymentProofsPending(0);
    setVisitorData(null);
    setInsightsData(null);
    setNotifications([]);
    setUnreadCount(0);
    setActiveSection('overview');
    toast.success('Logged out');
  }, []);

  const fetchAnalytics = useCallback(async (showLoading = true) => {
    if (!token) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    if (showLoading) { setAnalyticsLoading(true); setAnalyticsError(null); }
    setRefreshingAnalytics(true);
    try {
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${token}` }, signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.status === 401) { setAnalyticsError('Session expired. Please log in again.'); handleLogout(); return; }
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
        setMaintenanceMode(data.data.settings?.maintenance_mode === 'true');
        setWhatsappRaw(data.data.settings?.whatsapp_number || '');
        setAnalyticsError(null);
      } else {
        setAnalyticsError(data.error || 'Failed to load analytics');
        toast.error(data.error || 'Failed to load analytics');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setAnalyticsError('Request timed out. Please try again.');
      } else {
        setAnalyticsError('Network error. Please try again.');
        toast.error('Failed to fetch analytics');
      }
    } finally { setAnalyticsLoading(false); setRefreshingAnalytics(false); abortRef.current = null; }
  }, [token, handleLogout]);

  const fetchMessages = useCallback(async (page = 1, filter?: MessageFilter, search?: string) => {
    if (!token) return;
    setMessagesLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filter === 'unread') params.set('unread', 'true');
      if (filter === 'replied') params.set('replied', 'true');
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/messages?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages);
        setMessagesTotal(data.data.total);
        setMessagesUnread(data.data.unreadCount);
        setMessagesPage(data.data.page);
      }
    } catch { toast.error('Failed to fetch messages'); }
    finally { setMessagesLoading(false); }
  }, [token]);

  const fetchSubscribers = useCallback(async (page = 1) => {
    if (!token) return;
    setSubscribersLoading(true);
    try {
      const res = await fetch(`/api/admin/newsletter?page=${page}&limit=15`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setSubscribers(data.data.subscribers);
        setSubscribersTotal(data.data.total);
        setSubscribersActive(data.data.activeCount);
        setSubscribersPage(data.data.page);
      }
    } catch { toast.error('Failed to fetch subscribers'); }
    finally { setSubscribersLoading(false); }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/notifications', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch { /* silent */ }
  }, [token]);

  const markNotificationRead = useCallback(async (id: string) => {
    if (!token) return;
    try {
      await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id }),
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, [token]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!token) return;
    try {
      await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }, [token]);

  const fetchPaymentProofs = useCallback(async () => {
    if (!token) return;
    setPaymentProofsLoading(true);
    try {
      const res = await fetch('/api/admin/payment-proofs?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setPaymentProofs(data.data.proofs);
        setPaymentProofsPending(data.data.pendingCount);
      }
    } catch { toast.error('Failed to fetch payment proofs'); }
    finally { setPaymentProofsLoading(false); }
  }, [token]);

  const approveProof = useCallback(async (id: string, durationDays: number) => {
    if (!token) return;
    setApprovingId(id);
    try {
      const res = await fetch('/api/admin/payment-proofs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, action: 'approve', durationDays }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentProofs(prev => prev.map(p => p.id === id ? { ...p, status: 'approved', reviewedAt: new Date().toISOString() } : p));
        setPaymentProofsPending(prev => Math.max(0, prev - 1));
        setApprovingId(null);
        toast.success('Proof approved — user upgraded to Pro');
      } else {
        toast.error(data.error || 'Failed to approve');
        setApprovingId(null);
      }
    } catch { toast.error('Connection error'); setApprovingId(null); }
  }, [token]);

  const rejectProof = useCallback(async (id: string, adminNote: string) => {
    if (!token) return;
    setRejectingId(id);
    try {
      const res = await fetch('/api/admin/payment-proofs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, action: 'reject', adminNote }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentProofs(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected', reviewedAt: new Date().toISOString(), adminNote } : p));
        setPaymentProofsPending(prev => Math.max(0, prev - 1));
        setRejectingId(null);
        setRejectNote('');
        toast.success('Proof rejected');
      } else {
        toast.error(data.error || 'Failed to reject');
        setRejectingId(null);
      }
    } catch { toast.error('Connection error'); setRejectingId(null); }
  }, [token]);

  // Fetch data on section change
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    if (activeSection === 'overview' || activeSection === 'analytics') {
      if (!analytics) fetchAnalytics();
    }
    if (activeSection === 'overview') {
      fetchMessages(1);
      fetchSubscribers();
      fetchPaymentProofs();
    }
    if (activeSection === 'messages') fetchMessages(1, messageFilter, messageSearch);
    if (activeSection === 'newsletter') fetchSubscribers();
    if (activeSection === 'payment-proofs') fetchPaymentProofs();
    if (activeSection === 'notifications') fetchNotifications();
    // Always fetch notifications for the bell badge
    if (isLoggedIn && token) fetchNotifications();
    }, [isLoggedIn, token, activeSection]);

  const toggleAiFeature = useCallback(async (enabled: boolean) => {
    if (!token) return;
    setTogglingAi(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key: 'ai_enabled', value: String(enabled) }),
      });
      const data = await res.json();
      if (data.success) { setAiEnabled(enabled); toast.success(`AI features ${enabled ? 'enabled' : 'disabled'}`); }
      else toast.error('Failed to update setting');
    } catch { toast.error('Connection error'); }
    finally { setTogglingAi(false); }
  }, [token, setAiEnabled]);

  const toggleMaintenance = useCallback(async (enabled: boolean) => {
    if (!token) return;
    setTogglingMaintenance(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key: 'maintenance_mode', value: String(enabled) }),
      });
      const data = await res.json();
      if (data.success) { setMaintenanceMode(enabled); toast.success(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`); }
      else toast.error('Failed to update setting');
    } catch { toast.error('Connection error'); }
    finally { setTogglingMaintenance(false); }
  }, [token]);

  const whatsappDigits = whatsappRaw.replace(/[^\d]/g, '');
  const whatsappPreview = whatsappDigits.length >= 10 ? `https://wa.me/${whatsappDigits}` : '';
  const whatsappIsLocal = whatsappDigits.startsWith('03');

  const fixWhatsappNumber = () => {
    // If user typed a Pakistani local number like 03001234567 or 30012345678, convert to international format
    let digits = whatsappRaw.replace(/[^\d]/g, '');
    if (digits.startsWith('03')) {
      digits = '92' + digits.slice(1);
    } else if (digits.length === 10 && digits.startsWith('3')) {
      digits = '92' + digits;
    }
    setWhatsappRaw(digits);
  };

  const saveWhatsappNumber = useCallback(async () => {
    if (!token) return;
    // Auto-fix Pakistani local numbers before saving
    let digits = whatsappDigits;
    if (digits.startsWith('03')) {
      digits = '92' + digits.slice(1);
    } else if (digits.length === 10 && digits.startsWith('3')) {
      digits = '92' + digits;
    }
    if (digits !== whatsappDigits) setWhatsappRaw(digits);
    setSavingWhatsapp(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key: 'whatsapp_number', value: digits }),
      });
      const data = await res.json();
      if (data.success) toast.success(`WhatsApp number saved: ${digits}`);
      else toast.error('Failed to save');
    } catch { toast.error('Connection error'); }
    finally { setSavingWhatsapp(false); }
  }, [token, whatsappDigits]);

  // ===== BACKUP DOWNLOAD HANDLER =====
  const handleDownloadBackup = useCallback(async () => {
    if (!token) return;
    setBackupDownloading(true);
    try {
      const res = await fetch(`/api/download-backup?key=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Backup download failed');
        return;
      }
      const blob = await res.blob();
      const now = new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pakvisa-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup downloaded successfully!');
    } catch (err) {
      console.error('Backup download error:', err);
      toast.error('Failed to download backup');
    } finally {
      setBackupDownloading(false);
    }
  }, [token]);

  // ===== DATA SYNC HANDLERS =====
  const handleStartResearch = useCallback(async () => {
    if (!token) return;
    setSyncStage('researching');
    setSyncError(null);
    setSyncChanges([]);
    try {
      const res = await fetch('/api/admin/sync-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'research' }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncTotalCountries(data.totalCountries);
        setSyncChanges(data.changes || []);
        setSyncResearchTime(data.researchedAt);
        if (data.changes?.length > 0) {
          setSyncStage('preview');
          toast.success(`Found ${data.changes.length} corrections needed`);
        } else {
          setSyncStage('done');
          toast.success('All data is already up to date!');
        }
      } else {
        setSyncError(data.details || data.error || 'Research failed');
        setSyncStage('idle');
        toast.error('Data sync research failed');
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Connection error');
      setSyncStage('idle');
      toast.error('Connection error during research');
    }
  }, [token]);

  const handleApplyChanges = useCallback(async () => {
    if (!token || syncChanges.length === 0) return;
    setSyncStage('applying');
    try {
      const corrections = syncChanges.map(c => ({
        name: c.name,
        visaFree: c.after.visaFree,
        visaOnArrival: c.after.visaOnArrival,
        etaAvailable: c.after.etaAvailable,
        visaFeeUSD: c.after.visaFeeUSD,
        processingDaysMin: c.after.processingDaysMin,
        processingDaysMax: c.after.processingDaysMax,
      }));
      const res = await fetch('/api/admin/sync-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'apply', corrections }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncAppliedCount(data.applied);
        setSyncFailedCount(data.failed);
        setSyncStage('done');
        toast.success(`Applied ${data.applied} changes successfully`);
        // Refresh analytics to reflect new data
        fetchAnalytics(true);
      } else {
        setSyncError(data.error || 'Apply failed');
        setSyncStage('preview');
        toast.error('Failed to apply changes');
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Connection error');
      setSyncStage('preview');
      toast.error('Connection error during apply');
    }
  }, [token, syncChanges]);

  const handleResetSync = useCallback(() => {
    setSyncStage('idle');
    setSyncChanges([]);
    setSyncError(null);
    setSyncAppliedCount(0);
    setSyncFailedCount(0);
    setSyncResearchTime(null);
    setShowAudit(false);
  }, []);

  const handleLoadAudit = useCallback(async () => {
    if (!token) return;
    setAuditLoading(true);
    try {
      const res = await fetch('/api/admin/sync-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'audit' }),
      });
      const data = await res.json();
      if (data.success) {
        setAuditData(data.countries || []);
        setSyncTotalCountries(data.totalCountries);
        setShowAudit(true);
      } else {
        toast.error(data.error || 'Failed to load audit data');
      }
    } catch {
      toast.error('Connection error during audit');
    } finally {
      setAuditLoading(false);
    }
  }, [token]);

  const markMessageRead = async (id: string) => {
    if (!token) return;
    try {
      await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, action: 'mark_read' }),
      });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
      setMessagesUnread(prev => Math.max(0, prev - 1));
    } catch { toast.error('Failed to mark as read'); }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    setMarkingAllRead(true);
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
        setMessagesUnread(0);
        toast.success(`${data.data?.updated || 'All'} messages marked as read`);
      }
    } catch { toast.error('Failed to mark all as read'); }
    finally { setMarkingAllRead(false); }
  };

  const sendMessageReply = async (id: string) => {
    if (!token || !replyText.trim()) return;
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, action: 'reply', reply: replyText }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, isReplied: true, reply: replyText.trim(), isRead: true } : m));
        setReplyingTo(null); setReplyText('');
        toast.success('Reply saved');
      }
    } catch { toast.error('Failed to send reply'); }
  };

  const deleteMessage = async (id: string) => {
    if (!token) return;
    try {
      await fetch('/api/admin/messages', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, action: 'delete' }),
      });
      setMessages(prev => prev.filter(m => m.id !== id));
      setMessagesTotal(prev => prev - 1);
      setDeleteConfirmId(null);
      toast.success('Message deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const deleteSubscriber = async (id: string) => {
    if (!token) return;
    try {
      await fetch(`/api/admin/newsletter?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setSubscribers(prev => prev.filter(s => s.id !== id));
      setSubscribersTotal(prev => prev - 1);
      setSubscribersActive(prev => Math.max(0, prev - 1));
      toast.success('Subscriber removed');
    } catch { toast.error('Failed to remove'); }
  };

  // Export functions
  const exportMessagesCSV = () => {
    if (messages.length === 0) { toast.error('No messages to export'); return; }
    const header = 'Name,Email,Subject,Message,Status,Reply,Date\n';
    const rows = messages.map(m =>
      `"${m.name.replace(/"/g, '""')}","${m.email.replace(/"/g, '""')}","${m.subject.replace(/"/g, '""')}","${m.message.replace(/"/g, '""')}","${m.isRead ? (m.isReplied ? 'Replied' : 'Read') : 'Unread'}","${m.reply.replace(/"/g, '""')}","${m.createdAt}"`
    ).join('\n');
    downloadCSV(header + rows, 'pakvisa-messages.csv');
  };

  const exportSubscribersCSV = () => {
    if (subscribers.length === 0) { toast.error('No subscribers to export'); return; }
    const header = 'Email,Status,Subscribed Date\n';
    const rows = subscribers.map(s =>
      `"${s.email}","${s.isActive ? 'Active' : 'Inactive'}","${s.subscribedAt}"`
    ).join('\n');
    downloadCSV(header + rows, 'pakvisa-subscribers.csv');
  };

  const copySubscriberEmails = () => {
    if (subscribers.length === 0) { toast.error('No emails to copy'); return; }
    const emails = subscribers.map(s => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    toast.success(`${subscribers.length} emails copied to clipboard`);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success(`Exported ${filename}`);
  };

  const handleMessageFilterChange = (filter: MessageFilter) => {
    setMessageFilter(filter);
    setMessagesPage(1);
    fetchMessages(1, filter, messageSearch);
  };

  const handleMessageSearch = (search: string) => {
    setMessageSearch(search);
    setMessagesPage(1);
    // Debounce - fetch immediately for simplicity
    if (search.length > 0 && search.length < 2) return;
    fetchMessages(1, messageFilter, search);
  };

  const navItems: { key: AdminSection; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'visitors', label: 'Live Visitors', icon: <Users className="w-4 h-4" /> },
    { key: 'messages', label: 'Messages', icon: <Inbox className="w-4 h-4" />, badge: messagesUnread || undefined },
    { key: 'payment-proofs', label: 'Payment Proofs', icon: <CreditCard className="w-4 h-4" />, badge: paymentProofsPending || undefined },
    { key: 'newsletter', label: 'Newsletter', icon: <Mail className="w-4 h-4" /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'data-sync', label: 'Data Sync', icon: <ArrowRightLeft className="w-4 h-4" /> },
    { key: 'insights', label: 'Insights', icon: <Lightbulb className='w-4 h-4' /> },
    { key: 'hero-images', label: 'Hero Images', icon: <FileImage className="w-4 h-4" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  // Fetch visitors data
  const fetchVisitors = useCallback(async (period: 'live' | 'today' | 'week' | 'month' = 'live') => {
    if (!token) return;
    setVisitorsLoading(true);
    try {
      const res = await fetch(`/api/admin/visitors?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setVisitorData(data);
      }
    } catch { /* silent */ } finally {
      setVisitorsLoading(false);
    }
  }, [token]);

  // Auto-refresh visitors tab every 30s
  useEffect(() => {
    if (!isLoggedIn || activeSection !== 'visitors') return;
    fetchVisitors(visitorPeriod);
    const interval = setInterval(() => fetchVisitors(visitorPeriod), 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn, activeSection, visitorPeriod, fetchVisitors]);

  // Fetch insights data
  const fetchInsights = useCallback(async () => {
    if (!token) return;
    setInsightsLoading(true);
    try {
      const res = await fetch('/api/admin/insights', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const r = await res.json();
      if (r.success) {
        const d = r;
        const srcMap: Record<string, number> = {};
        for (const s of (d.trafficSources || [])) srcMap[s.source.toLowerCase()] = s.count;
        const devMap: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
        for (const dev of (d.devices || [])) devMap[(dev.type || '').toLowerCase()] = dev.count;
        setInsightsData({
          alerts: (d.alerts || []).map((a: any) => ({ type: a.severity || 'info', title: a.title, message: a.message })),
          totalUsers: d.subscription?.totalUsers || 0,
          freeUsers: d.subscription?.freeUsers || 0,
          proUsers: d.subscription?.proUsers || 0,
          newUsersWeek: d.subscription?.newUsersWeek || 0,
          newUsersMonth: d.subscription?.newUsersMonth || 0,
          searchesToday: d.searchQueries?.searchesToday || 0,
          searchesWeek: d.searchQueries?.searchesWeek || 0,
          affiliateClicks: d.affiliate?.total || 0,
          failedLogins: d.security?.stats?.failedLogins || 0,
          topSearchQueries: (d.searchQueries?.topSearches || []).map((s: any) => ({ query: s.query, count: s.count })),
          popularCountries: (d.popularCountries || []).map((c: any) => ({ flag: c.flag, name: c.country, visitors: c.count })),
          trafficSources: { organic: srcMap['organic search'] || 0, direct: srcMap['direct'] || 0, social: srcMap['social media'] || 0, referral: srcMap['referral'] || 0 },
          deviceBreakdown: devMap,
          browserBreakdown: (d.browsers || []).map((b: any) => ({ browser: b.name, percentage: b.pct })),
          visaDataFreshness: (d.visaFreshness || []).map((c: any) => ({ flag: c.flagEmoji, name: c.name, daysSinceUpdate: c.daysSince })),
          securityLog: (d.security?.recent || []).map((l: any) => ({ timestamp: l.createdAt, action: l.action, email: l.email, ip: l.ip, success: l.success })),
          securityStats: { totalLogins: d.security?.stats?.totalLogins || 0, failedAttempts: d.security?.stats?.failedLogins || 0 },
          affiliateTracking: (d.affiliate?.partners || []).map((p: any) => ({ partner: p.partner, clicks: p.clicks })),
        });
      }
    } catch { /* silent */ } finally {
      setInsightsLoading(false);
    }
  }, [token]);

  // Auto-refresh insights tab every 60 seconds
  useEffect(() => {
    if (!isLoggedIn || activeSection !== 'insights') return;
    fetchInsights();
    const interval = setInterval(() => fetchInsights(), 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn, activeSection, fetchInsights]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Daily sparkline data for overview
  const sparklineData = useMemo(() => analytics?.messageStats?.dailyMessages || [], [analytics]);
  const sparklineMax = useMemo(() => Math.max(1, ...sparklineData.map(d => d.count)), [sparklineData]);

  // ===== RENDER =====
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-semibold leading-none">Admin Dashboard</h2>
            <p className="text-xs text-muted-foreground hidden sm:block mt-1">Manage your PakVisa Advisor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoggedIn && (
            <>
              <div className="relative">
                <Button variant="ghost" size="icon" className="h-8 w-8 relative" onClick={() => { setShowNotifPanel(!showNotifPanel); }}>
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-4 h-4 flex items-center justify-center px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                {showNotifPanel && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifPanel(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-80 rounded-lg border bg-card shadow-lg py-2 max-h-96 flex flex-col">
                      <div className="flex items-center justify-between px-3 py-2 border-b">
                        <span className="text-sm font-semibold">Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={() => markAllNotificationsRead()} className="text-xs text-emerald-600 hover:underline">Mark all read</button>
                        )}
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-6">No notifications</p>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className={`flex items-start gap-2.5 px-3 py-2.5 hover:bg-muted/50 transition-colors ${!n.isRead ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!n.isRead ? 'font-medium' : 'text-muted-foreground'}`}>{n.title}</p>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">{n.message}</p>
                                <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                              </div>
                              {!n.isRead && (
                                <button onClick={() => markNotificationRead(n.id)} className="shrink-0 p-1 hover:bg-muted rounded" title="Mark as read">
                                  <CheckCheck className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-1.5" /> <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <XIcon className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {!isLoggedIn ? (
        <div className="p-8 flex-1 flex items-center justify-center">
            <Card className="w-full max-w-sm border-emerald-200 dark:border-emerald-800">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="text-lg">Admin Login</CardTitle>
                <CardDescription>Enter credentials to access dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="admin-username">Username</label>
                  <Input id="admin-username" placeholder="admin" value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} autoComplete="username" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="admin-password">Password</label>
                  <div className="relative">
                    <Input id="admin-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} autoComplete="current-password" />
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleLogin} disabled={loginLoading}>
                  {loginLoading ? (<><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Logging in...</>) : (<><Lock className="w-4 h-4 mr-2" />Sign In</>)}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-48 lg:w-56 border-r bg-muted/20 p-3 space-y-1 hidden md:flex flex-col shrink-0">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors relative ${
                    activeSection === item.key
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveSection(item.key)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 flex items-center justify-center px-1">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>

            {/* Mobile Nav */}
            <div className="md:hidden p-3 border-b flex gap-1.5 overflow-x-auto">
              {navItems.map((item) => (
                <Button
                  key={item.key}
                  variant={activeSection === item.key ? 'default' : 'outline'}
                  size="sm"
                  className={`shrink-0 gap-1.5 text-xs ${activeSection === item.key ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                  onClick={() => setActiveSection(item.key)}
                >
                  {item.icon}
                  {item.label}
                  {item.badge ? <span className="bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{item.badge}</span> : null}
                </Button>
              ))}
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1">
              <div className="p-5 space-y-5">
                {/* ====== OVERVIEW TAB ====== */}
                {activeSection === 'overview' && (
                  analyticsLoading && !analytics ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
                  ) : (
                  <>
                    {/* Quick Stats Row - 6 cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                      <StatCard icon={<Inbox className="w-4 h-4" />} label="Unread" value={analytics?.messageStats.unread ?? '—'} color="red" />
                      <StatCard icon={<MessageSquare className="w-4 h-4" />} label="This Week" value={analytics?.messageStats.thisWeek ?? '—'} color="orange" />
                      <StatCard icon={<CheckCheck className="w-4 h-4" />} label="Response Rate" value={analytics?.messageStats.responseRate != null ? `${analytics.messageStats.responseRate}%` : '—'} color="blue" />
                      <StatCard icon={<Mail className="w-4 h-4" />} label="Subscribers" value={analytics?.subscriberStats.active ?? '—'} color="violet" />
                      <StatCard icon={<Globe className="w-4 h-4" />} label="Countries" value={analytics?.countries.total ?? '—'} color="emerald" />
                      <StatCard icon={<Zap className="w-4 h-4" />} label="AI" value={aiEnabled ? 'Online' : 'Off'} color={aiEnabled ? 'green' : 'amber'} />
                    </div>

                    {/* Daily Messages Sparkline */}
                    {analytics?.messageStats && sparklineData.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-500" /> Messages — Last 7 Days
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-end gap-2 h-20">
                            {sparklineData.map((d, i) => {
                              const height = sparklineMax > 0 ? (d.count / sparklineMax) * 100 : 0;
                              const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                              return (
                                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                                  <span className="text-[10px] font-medium text-muted-foreground">{d.count}</span>
                                  <div className="w-full max-w-8 rounded-t-sm transition-all duration-500" style={{ height: `${Math.max(4, height)}%`, backgroundColor: i === sparklineData.length - 1 ? '#059669' : '#a7f3d0' }} />
                                  <span className="text-[10px] text-muted-foreground">{dayLabel}</span>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Two Column */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Recent Messages */}
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-emerald-500" /> Recent Messages
                            </CardTitle>
                            <Button variant="ghost" size="sm" className="text-xs text-emerald-600" onClick={() => setActiveSection('messages')}>
                              View All →
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {messagesLoading ? (
                            <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
                          ) : messages.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No messages yet</p>
                          ) : (
                            <div className="space-y-2">
                              {messages.slice(0, 5).map((m) => (
                                <div key={m.id} className={`flex items-start gap-3 p-2.5 rounded-lg transition-colors ${!m.isRead ? 'bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30' : 'hover:bg-muted/50'}`}>
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${!m.isRead ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                                    {m.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm ${!m.isRead ? 'font-semibold' : 'font-medium'}`}>{m.name}</span>
                                      {!m.isRead && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                                      {m.isReplied && <Check className="w-3 h-3 text-blue-500" />}
                                      <span className="text-xs text-muted-foreground ml-auto shrink-0">{timeAgo(m.createdAt)}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{m.subject || m.message}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Visa Breakdown + System Health */}
                      <div className="space-y-5">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-emerald-500" /> Visa Breakdown
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {analytics ? (
                              <VisaBreakdownChart visaCategories={analytics.visaCategories} total={analytics.countries.total} />
                            ) : null}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <Activity className="w-4 h-4 text-emerald-500" /> System Health
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">AI Engine</span>
                              <Badge variant={aiEnabled ? 'default' : 'secondary'} className={aiEnabled ? 'bg-green-600' : ''}>{aiEnabled ? 'Online' : 'Offline'}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Maintenance</span>
                              <Badge variant={maintenanceMode ? 'destructive' : 'secondary'}>{maintenanceMode ? 'Active' : 'Normal'}</Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Data Records</span>
                              <span className="font-medium">{analytics?.requirements ?? '—'} reqs, {analytics?.costProfiles ?? '—'} costs</span>
                            </div>
                            {analytics?.dataFreshness && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Last Updated</span>
                                <span className="text-xs">{timeAgo(analytics.dataFreshness)}</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <Database className="w-4 h-4 text-emerald-500" /> Data Backup
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-xs text-muted-foreground">Download a complete JSON backup of all country data, settings, and site configuration.</p>
                            <Button
                              size="sm"
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => {
                                const key = 'pakvisa-admin-backup-2026';
                                window.open(`/api/download-backup?key=${key}`, '_blank');
                                toast.success('Backup download started');
                              }}
                            >
                              <Download className="w-3.5 h-3.5 mr-1.5" /> Download Full Backup (.json)
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </>
                  )
                )}

                {/* ====== LIVE VISITORS TAB ====== */}
                {activeSection === 'visitors' && (
                  visitorsLoading && !visitorData ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
                  ) : (
                  <>
                    {/* Stat Cards Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <StatCard icon={<Users className="w-4 h-4" />} label="Online Now" value={visitorData?.live.length ?? 0} color="emerald" />
                      <StatCard icon={<Clock className="w-4 h-4" />} label="Today" value={visitorData?.todayCount ?? 0} color="blue" />
                      <StatCard icon={<TrendingUp className="w-4 h-4" />} label="This Week" value={visitorData?.weekCount ?? 0} color="violet" />
                      <StatCard icon={<Globe className="w-4 h-4" />} label="This Month" value={visitorData?.monthCount ?? 0} color="orange" />
                    </div>

                    {/* Live Visitors Table */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-500" /> Live Visitors
                            {visitorData?.live.length ? (
                              <Badge className="bg-emerald-600 text-[10px]">{visitorData.live.length} online</Badge>
                            ) : null}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-muted-foreground">Auto-refreshing</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        {!visitorData?.live.length ? (
                          <div className="text-center py-10 text-muted-foreground text-sm">
                            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            No visitors currently online
                          </div>
                        ) : (
                          <div className="max-h-72 overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-[10px] sticky top-0 bg-background z-10">Location</TableHead>
                                  <TableHead className="text-[10px] sticky top-0 bg-background z-10">Page</TableHead>
                                  <TableHead className="text-[10px] sticky top-0 bg-background z-10 text-right">Last Seen</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {visitorData.live.map((v: { id: string; country: string; city: string; page: string; lastSeen: string; flag: string }) => (
                                  <TableRow key={v.id} className="hover:bg-muted/50">
                                    <TableCell className="py-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-base">{v.flag || '\uD83C\uDF0D'}</span>
                                        <div>
                                          <div className="text-xs font-medium">{v.country || 'Unknown'}</div>
                                          {v.city ? <div className="text-[10px] text-muted-foreground">{v.city}</div> : null}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-2 text-xs text-muted-foreground font-mono max-w-[140px] truncate">
                                      {v.page || '/'}
                                    </TableCell>
                                    <TableCell className="py-2 text-[10px] text-muted-foreground text-right">{timeAgo(v.lastSeen)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Top Countries */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Globe className="w-4 h-4 text-orange-500" /> Top Countries
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {!visitorData?.topCountries?.length ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                          ) : (
                            <div className="space-y-2">
                              {visitorData.topCountries.map((c: { country: string; flag: string; count: number }, i: number) => {
                                const maxCount = visitorData.topCountries[0]?.count || 1;
                                const pct = (c.count / maxCount) * 100;
                                return (
                                  <div key={c.country} className="flex items-center gap-3">
                                    <span className="text-sm w-5 text-center text-muted-foreground text-xs">{i + 1}</span>
                                    <span className="text-base">{c.flag}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="text-xs font-medium truncate">{c.country}</span>
                                        <span className="text-xs font-mono text-muted-foreground">{c.count}</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Daily Breakdown */}
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-violet-500" /> Daily Breakdown
                            </CardTitle>
                            <div className="flex gap-1">
                              {(['week', 'month'] as const).map((p: 'week' | 'month') => (
                                <Button
                                  key={p}
                                  variant={visitorPeriod === p ? 'default' : 'outline'}
                                  size="sm"
                                  className={`text-[10px] h-6 px-2 ${visitorPeriod === p ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                                  onClick={() => setVisitorPeriod(p)}
                                >
                                  {p === 'week' ? '7d' : '30d'}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {visitorPeriod === 'week' && visitorData?.weekBreakdown && (
                            <div className="flex items-end gap-1.5 h-28">
                              {visitorData.weekBreakdown.map((d: { date: string; visitors: number }) => {
                                const maxVal = Math.max(1, ...visitorData.weekBreakdown.map(x => x.visitors));
                                const height = (d.visitors / maxVal) * 100;
                                const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
                                return (
                                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-medium text-muted-foreground">{d.visitors}</span>
                                    <div className="w-full max-w-8 rounded-t-sm transition-all duration-500" style={{ height: `${Math.max(4, height)}%`, backgroundColor: '#059669' }} />
                                    <span className="text-[9px] text-muted-foreground">{dayLabel}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {visitorPeriod === 'month' && visitorData?.monthBreakdown && (
                            <div className="flex items-end gap-0.5 h-28">
                              {visitorData.monthBreakdown.map((d: { date: string; visitors: number }) => {
                                const maxVal = Math.max(1, ...visitorData.monthBreakdown.map(x => x.visitors));
                                const height = (d.visitors / maxVal) * 100;
                                return (
                                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[9px] font-medium text-muted-foreground">{d.visitors}</span>
                                    <div className="w-full rounded-t-sm transition-all duration-500" style={{ height: `${Math.max(2, height)}%`, backgroundColor: '#059669' }} />
                                    <span className="text-[7px] text-muted-foreground">{new Date(d.date + 'T00:00:00').getDate()}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-3 pt-2 border-t">
                            <span className="text-[10px] text-muted-foreground">All-time total</span>
                            <span className="text-sm font-bold text-emerald-600">{visitorData?.totalAllTime ?? 0} visitors</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* User Activity */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" /> User Activity
                          {visitorData?.userActivity.totalUsers ? (
                            <Badge variant="secondary" className="text-[10px]">{visitorData.userActivity.totalUsers} registered</Badge>
                          ) : null}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground mb-2">Recent Signups</h4>
                            {!visitorData?.userActivity.recentSignups?.length ? (
                              <p className="text-xs text-muted-foreground">No signups yet</p>
                            ) : (
                              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {visitorData.userActivity.recentSignups.map((u: { id: string; email: string; fullName: string; createdAt: string }) => (
                                  <div key={u.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-muted/50">
                                    <div className="min-w-0">
                                      <div className="font-medium truncate">{u.fullName || u.email}</div>
                                      <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{timeAgo(u.createdAt)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-medium text-muted-foreground mb-2">Recent Logins</h4>
                            {!visitorData?.userActivity.recentLogins?.length ? (
                              <p className="text-xs text-muted-foreground">No logins yet</p>
                            ) : (
                              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                {visitorData.userActivity.recentLogins.map((u: { id: string; email: string; fullName: string; lastLogin: string | null }) => (
                                  <div key={u.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-muted/50">
                                    <div className="min-w-0">
                                      <div className="font-medium truncate">{u.fullName || u.email}</div>
                                      <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{u.lastLogin ? timeAgo(u.lastLogin) : 'Never'}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                  )
                )}

                {/* ====== MESSAGES TAB ====== */}
                {activeSection === 'messages' && (
                  <>
                    {/* Header with actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Inbox className="w-5 h-5 text-emerald-500" />
                        Messages
                        {messagesUnread > 0 && <Badge className="bg-red-500">{messagesUnread} unread</Badge>}
                        <Badge variant="secondary" className="text-xs">{messagesTotal} total</Badge>
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        {messagesUnread > 0 && (
                          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={markingAllRead}>
                            <CheckCheck className={`w-3.5 h-3.5 mr-1 ${markingAllRead ? 'animate-pulse' : ''}`} /> Mark All Read
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={exportMessagesCSV} disabled={messages.length === 0}>
                          <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => fetchMessages(messagesPage, messageFilter, messageSearch)} disabled={messagesLoading}>
                          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${messagesLoading ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                      </div>
                    </div>

                    {/* Filter Tabs + Search */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex gap-1 bg-muted p-1 rounded-lg">
                        {(['all', 'unread', 'replied'] as MessageFilter[]).map((f) => (
                          <button
                            key={f}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              messageFilter === f ? 'bg-white dark:bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => handleMessageFilterChange(f)}
                          >
                            {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Replied'}
                          </button>
                        ))}
                      </div>
                      <div className="relative flex-1 w-full sm:max-w-xs">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          ref={searchInputRef}
                          placeholder="Search name, email, message..."
                          value={messageSearch}
                          onChange={(e) => handleMessageSearch(e.target.value)}
                          className="pl-8 h-8 text-sm"
                        />
                        {messageSearch && (
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => { setMessageSearch(''); fetchMessages(1, messageFilter, ''); }}
                          >
                            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                          </button>
                        )}
                      </div>
                    </div>

                    {messagesLoading && messages.length === 0 ? (
                      <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">{messageSearch ? 'No messages match your search' : messageFilter !== 'all' ? `No ${messageFilter} messages` : 'No messages yet'}</p>
                        <p className="text-sm">{messageSearch ? 'Try a different search term' : 'Messages from the Contact Us form will appear here.'}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((m) => (
                          <Card key={m.id} className={`transition-colors ${!m.isRead ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/30 dark:bg-emerald-900/10' : ''}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${!m.isRead ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                                    {m.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`font-semibold ${!m.isRead ? '' : 'text-muted-foreground'}`}>{m.name}</span>
                                      <a href={`mailto:${m.email}`} className="text-xs text-emerald-600 hover:underline flex items-center gap-0.5">
                                        <Mail className="w-3 h-3" />{m.email}
                                      </a>
                                      {!m.isRead && <Badge variant="default" className="bg-emerald-600 text-[10px] px-1.5 py-0">New</Badge>}
                                      {m.isReplied && <Badge variant="secondary" className="text-[10px] px-1.5 py-0"><Check className="w-3 h-3 mr-0.5" />Replied</Badge>}
                                    </div>
                                    {m.subject && <p className="text-sm font-medium mt-1">{m.subject}</p>}
                                    <p className={`text-sm text-muted-foreground mt-1 whitespace-pre-wrap ${expandedMessage === m.id ? '' : 'line-clamp-2'}`}>{m.message}</p>
                                    {m.message.length > 150 && (
                                      <button onClick={() => setExpandedMessage(expandedMessage === m.id ? null : m.id)} className="text-xs text-emerald-600 mt-1 hover:underline">
                                        {expandedMessage === m.id ? 'Show less' : 'Read more'}
                                      </button>
                                    )}
                                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(m.createdAt)}</span>
                                    </div>

                                    {/* Reply saved display */}
                                    {m.reply && (
                                      <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1"><Reply className="w-3 h-3" /> Your Reply:</p>
                                        <p className="text-sm text-blue-800 dark:text-blue-300">{m.reply}</p>
                                      </div>
                                    )}

                                    {/* Reply box */}
                                    {replyingTo === m.id && (
                                      <div className="mt-3 space-y-2">
                                        {/* Quick reply suggestions */}
                                        <div className="flex flex-wrap gap-1.5">
                                          <span className="text-[10px] text-muted-foreground leading-7">Quick:</span>
                                          {QUICK_REPLIES.slice(0, 3).map((qr, i) => (
                                            <button
                                              key={i}
                                              className="text-[10px] px-2 py-0.5 rounded-full border hover:bg-muted transition-colors truncate max-w-[200px]"
                                              onClick={() => setReplyText(qr)}
                                              title={qr}
                                            >
                                              {qr.slice(0, 40)}...
                                            </button>
                                          ))}
                                        </div>
                                        <Textarea placeholder="Write your reply... (saved for reference)" value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={2} className="text-sm" />
                                        <div className="flex gap-2">
                                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => sendMessageReply(m.id)} disabled={!replyText.trim()}>
                                            <Send className="w-3.5 h-3.5 mr-1" /> Save Reply
                                          </Button>
                                          <Button size="sm" variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                  {!m.isRead && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markMessageRead(m.id)} title="Mark as read">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {!m.isReplied && (
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setReplyingTo(replyingTo === m.id ? null : m.id)} title="Reply">
                                      <Reply className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {deleteConfirmId === m.id ? (
                                    <div className="flex flex-col gap-0.5">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 bg-red-50 dark:bg-red-900/20" onClick={() => deleteMessage(m.id)} title="Confirm delete">
                                        <Check className="w-4 h-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setDeleteConfirmId(null)} title="Cancel">
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setDeleteConfirmId(m.id)} title="Delete">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {messagesTotal > 20 && (
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <Button variant="outline" size="sm" disabled={messagesPage <= 1} onClick={() => fetchMessages(messagesPage - 1, messageFilter, messageSearch)}><ChevronLeft className="w-4 h-4" /></Button>
                            <span className="text-sm text-muted-foreground">Page {messagesPage} of {Math.ceil(messagesTotal / 20)}</span>
                            <Button variant="outline" size="sm" disabled={messagesPage >= Math.ceil(messagesTotal / 20)} onClick={() => fetchMessages(messagesPage + 1, messageFilter, messageSearch)}><ChevronRight className="w-4 h-4" /></Button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* ====== PAYMENT PROOFS TAB ====== */}
                {activeSection === 'payment-proofs' && (
                  <>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-emerald-500" />
                        Payment Proofs
                        {paymentProofsPending > 0 && <Badge className="bg-amber-500">{paymentProofsPending} pending</Badge>}
                      </h3>
                      <Button variant="outline" size="sm" onClick={() => fetchPaymentProofs()} disabled={paymentProofsLoading}>
                        <RefreshCw className={`w-3.5 h-3.5 mr-1 ${paymentProofsLoading ? 'animate-spin' : ''}`} /> Refresh
                      </Button>
                    </div>

                    {paymentProofsLoading && paymentProofs.length === 0 ? (
                      <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
                    ) : paymentProofs.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No payment proofs yet</p>
                        <p className="text-sm">Proofs submitted by users will appear here.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {paymentProofs.map((p) => (
                          <Card key={p.id} className={p.status === 'pending' ? 'border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-900/10' : ''}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                                    p.status === 'pending' ? 'bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300' :
                                    p.status === 'approved' ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300' :
                                    'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300'
                                  }`}>
                                    {p.user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold">{p.user?.fullName || 'Unknown'}</span>
                                      <a href={`mailto:${p.user?.email}`} className="text-xs text-emerald-600 hover:underline flex items-center gap-0.5">
                                        <Mail className="w-3 h-3" />{p.user?.email}
                                      </a>
                                      {p.user?.phone && (
                                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                          <Phone className="w-3 h-3" />{p.user.phone}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                      <Badge className={`text-[10px] px-1.5 py-0 ${
                                        p.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' :
                                        p.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' :
                                        'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'
                                      }`}>
                                        {p.status === 'pending' ? 'Pending' : p.status === 'approved' ? 'Approved' : 'Rejected'}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(p.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <a
                                        href={p.filePath}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                                      >
                                        <FileImage className="w-3 h-3" />{p.fileName}
                                      </a>
                                      <span className="text-[10px] text-muted-foreground">({(p.fileSize / 1024).toFixed(0)} KB)</span>
                                    </div>
                                    {p.userNote && (
                                      <p className="text-xs text-muted-foreground mt-1 bg-muted/50 px-2 py-1 rounded inline-block max-w-full truncate" title={p.userNote}>
                                        Note: {p.userNote}
                                      </p>
                                    )}
                                    {p.adminNote && (
                                      <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                        <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 mb-0.5">Admin Note:</p>
                                        <p className="text-xs text-blue-800 dark:text-blue-300">{p.adminNote}</p>
                                      </div>
                                    )}

                                    {/* Approve / Reject actions for pending */}
                                    {p.status === 'pending' && (
                                      <div className="mt-3 space-y-2">
                                        {approvingId === p.id ? (
                                          <div className="flex items-center gap-2">
                                            <select
                                              id={`duration-${p.id}`}
                                              defaultValue="30"
                                              className="h-8 text-xs rounded-md border bg-background px-2"
                                            >
                                              <option value="30">1 month</option>
                                              <option value="90">3 months</option>
                                              <option value="180">6 months</option>
                                              <option value="365">1 year</option>
                                            </select>
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8" onClick={() => {
                                              const sel = document.getElementById(`duration-${p.id}`) as HTMLSelectElement;
                                              approveProof(p.id, parseInt(sel.value));
                                            }}>
                                              Confirm
                                            </Button>
                                            <Button size="sm" variant="ghost" className="h-8" onClick={() => setApprovingId(null)}>Cancel</Button>
                                          </div>
                                        ) : rejectingId === p.id ? (
                                          <div className="space-y-2">
                                            <Textarea placeholder="Reason for rejection (optional)..." value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={2} className="text-xs" />
                                            <div className="flex gap-2">
                                              <Button size="sm" className="bg-red-600 hover:bg-red-700 h-8" onClick={() => { rejectProof(p.id, rejectNote); }}>
                                                Reject
                                              </Button>
                                              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setRejectingId(null); setRejectNote(''); }}>Cancel</Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex gap-2">
                                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8 gap-1" onClick={() => setApprovingId(p.id)}>
                                              <Check className="w-3.5 h-3.5" /> Approve
                                            </Button>
                                            <Button size="sm" variant="outline" className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => { setRejectingId(p.id); setRejectNote(''); }}>
                                              <X className="w-3.5 h-3.5" /> Reject
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* ====== NEWSLETTER TAB ====== */}
                {activeSection === 'newsletter' && (
                  <>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Mail className="w-5 h-5 text-emerald-500" />
                        Newsletter Subscribers
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={copySubscriberEmails} disabled={subscribers.length === 0}>
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy Emails
                        </Button>
                        <Button variant="outline" size="sm" onClick={exportSubscribersCSV} disabled={subscribers.length === 0}>
                          <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => fetchSubscribers(subscribersPage)} disabled={subscribersLoading}>
                          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${subscribersLoading ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600">{analytics?.subscriberStats.total ?? subscribersTotal}</div>
                        <div className="text-xs text-muted-foreground mt-1">Total</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{analytics?.subscriberStats.active ?? subscribersActive}</div>
                        <div className="text-xs text-muted-foreground mt-1">Active</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-500">{analytics?.subscriberStats.thisWeek ?? 0}</div>
                        <div className="text-xs text-muted-foreground mt-1">This Week</div>
                      </Card>
                    </div>

                    {subscribersLoading && subscribers.length === 0 ? (
                      <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
                    ) : subscribers.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No subscribers yet</p>
                        <p className="text-sm">Newsletter signups will appear here.</p>
                      </div>
                    ) : (
                      <Card>
                        <CardContent className="p-0">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b bg-muted/30">
                                  <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground hidden sm:table-cell">Subscribed</th>
                                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                  <th className="p-3 w-10"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {subscribers.map((s) => (
                                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                    <td className="p-3 font-medium">{s.email}</td>
                                    <td className="p-3 text-muted-foreground hidden sm:table-cell">{formatDate(s.subscribedAt)}</td>
                                    <td className="p-3">
                                      <Badge variant={s.isActive ? 'default' : 'secondary'} className={s.isActive ? 'bg-green-600' : ''}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
                                    </td>
                                    <td className="p-3">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => deleteSubscriber(s.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                    {subscribersTotal > 15 && (
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="sm" disabled={subscribersPage <= 1} onClick={() => fetchSubscribers(subscribersPage - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                        <span className="text-sm text-muted-foreground">Page {subscribersPage} of {Math.ceil(subscribersTotal / 15)}</span>
                        <Button variant="outline" size="sm" disabled={subscribersPage >= Math.ceil(subscribersTotal / 15)} onClick={() => fetchSubscribers(subscribersPage + 1)}><ChevronRight className="w-4 h-4" /></Button>
                      </div>
                    )}
                  </>
                )}

                {/* ====== ANALYTICS TAB ====== */}
                {activeSection === 'analytics' && (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-500" /> Detailed Analytics
                      </h3>
                      <Button variant="outline" size="sm" onClick={() => fetchAnalytics(true)} disabled={refreshingAnalytics}>
                        <RefreshCw className={`w-3.5 h-3.5 mr-1 ${refreshingAnalytics ? 'animate-spin' : ''}`} /> Refresh
                      </Button>
                    </div>

                    {analyticsLoading && !analytics ? (
                      <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
                    ) : analytics ? (
                      <div className="space-y-5">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-500" /> Country Database</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <MiniStat label="Total Countries" value={analytics.countries.total} />
                              <MiniStat label="Visa Free" value={analytics.countries.visaFree} color="text-green-600" />
                              <MiniStat label="Visa on Arrival" value={analytics.countries.visaOnArrival} color="text-orange-600" />
                              <MiniStat label="ETA Available" value={analytics.countries.etaAvailable} color="text-blue-600" />
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-emerald-500" /> Continent Distribution</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2.5">
                              {analytics.continents.map((c) => {
                                const pct = analytics.countries.total > 0 ? (c.count / analytics.countries.total) * 100 : 0;
                                return (
                                  <div key={c.continent} className="flex items-center gap-3">
                                    <span className="text-sm text-muted-foreground w-28 truncate">{c.continent}</span>
                                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-sm font-medium w-16 text-right">{c.count} <span className="text-xs text-muted-foreground">({Math.round(pct)}%)</span></span>
                                  </div>
                                );
                              })}
                            </div>
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Database className="w-4 h-4 text-emerald-500" /> Data Records</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Requirements</span><span className="font-medium">{analytics.requirements}</span></div>
                              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cost Profiles</span><span className="font-medium">{analytics.costProfiles}</span></div>
                              <div className="flex justify-between text-sm"><span className="text-muted-foreground">User Profiles</span><span className="font-medium">{analytics.users}</span></div>
                              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sessions</span><span className="font-medium">{analytics.sessions}</span></div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><MessageCircle className="w-4 h-4 text-emerald-500" /> Contact Stats</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Messages</span><span className="font-medium">{analytics.messageStats.total}</span></div>
                              <div className="flex justify-between text-sm"><span className="text-muted-foreground">This Week</span><span className="font-medium">{analytics.messageStats.thisWeek}</span></div>
                              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Response Rate</span><span className="font-medium">{analytics.messageStats.responseRate}%</span></div>
                              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Unread</span><span className="font-medium text-red-500">{analytics.messageStats.unread}</span></div>
                            </CardContent>
                          </Card>
                        </div>

                        <Card>
                          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-500" /> Data Freshness</CardTitle></CardHeader>
                          <CardContent>
                            {analytics.dataFreshness ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-sm">Last updated:</span></div>
                                <p className="text-sm font-medium">{new Date(analytics.dataFreshness).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                <p className="text-xs text-muted-foreground">{Math.round((Date.now() - new Date(analytics.dataFreshness).getTime()) / (1000 * 60 * 60 * 24))} days ago</p>
                              </div>
                            ) : <p className="text-sm text-muted-foreground">No data fetch recorded</p>}
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Failed to load analytics</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchAnalytics(true)}>Try Again</Button>
                      </div>
                    )}
                  </>
                )}

                {/* ====== DATA SYNC TAB ====== */}
                {activeSection === 'data-sync' && (
                  <div className="space-y-5">
                    {/* Database Backup Card */}
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Download className="w-5 h-5 text-blue-600" /></div>
                            <div>
                              <CardTitle className="text-base">Database Backup</CardTitle>
                              <CardDescription>Download a full backup of all database tables as JSON</CardDescription>
                            </div>
                          </div>
                          <Button
                            variant="outline" size="sm"
                            className="gap-2"
                            onClick={handleDownloadBackup}
                            disabled={backupDownloading}
                          >
                            {backupDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            {backupDownloading ? 'Downloading...' : 'Download Backup'}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          Exports all countries, visa types, requirements, cost profiles, and site settings.
                          The backup file will be named with the current date and time.
                        </p>
                      </CardContent>
                    </Card>

                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-emerald-500" /> Database Sync</h3>
                      <Button
                        variant="outline" size="sm"
                        className={showAudit ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700' : ''}
                        onClick={showAudit ? () => setShowAudit(false) : handleLoadAudit}
                        disabled={auditLoading}
                      >
                        {auditLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
                        {showAudit ? 'Hide Audit Table' : 'View All Data'}
                      </Button>
                    </div>

                    {/* Info Card */}
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><Database className="w-5 h-5 text-emerald-600" /></div>
                          <div>
                            <CardTitle className="text-base">Data Verification</CardTitle>
                            <CardDescription>Research and update visa data for all {syncTotalCountries || 70} countries</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                          <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p><strong>How it works:</strong></p>
                            <p>1. <strong>View All Data</strong> — See every country's current visa type, fee, and processing time in one table.</p>
                            <p>2. <strong>Research</strong> — Compares database against the verified data file (Henley Passport Index 2025, official e-Visa portals).</p>
                            <p>3. <strong>Preview</strong> — Review every suggested change before anything is saved. Each card shows ALL fields.</p>
                            <p>4. <strong>Apply</strong> — Only your confirmed changes are written to the database.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* FULL AUDIT TABLE */}
                    {showAudit && auditData.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">All {auditData.length} Countries — Complete Data</CardTitle>
                          <CardDescription>Visa type, fee, and processing time for every country. Use this to manually verify accuracy.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="max-h-[55vh] overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-[10px] sticky top-0 bg-background z-10">#</TableHead>
                                  <TableHead className="text-[10px] sticky top-0 bg-background z-10">Country</TableHead>
                                  <TableHead className="text-[10px] sticky top-0 bg-background z-10">Visa Type</TableHead>
                                  <TableHead className="text-[10px] sticky top-0 bg-background z-10 text-right">Fee (USD)</TableHead>
                                  <TableHead className="text-[10px] sticky top-0 bg-background z-10 text-right">Processing</TableHead>
                                  <TableHead className="text-[10px] sticky top-0 bg-background z-10 text-center">Profile</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {auditData.map((c, idx) => (
                                  <TableRow key={c.code} className="hover:bg-muted/50">
                                    <TableCell className="text-[10px] text-muted-foreground py-1.5">{idx + 1}</TableCell>
                                    <TableCell className="text-[11px] font-medium py-1.5">{c.name}</TableCell>
                                    <TableCell className="py-1.5">
                                      <Badge className={
                                        c.accessType === 'Visa Free' ? 'bg-emerald-600 text-[9px]' :
                                        c.accessType === 'Visa on Arrival' ? 'bg-amber-600 text-[9px]' :
                                        c.accessType === 'e-Visa' ? 'bg-sky-600 text-[9px]' :
                                        'bg-gray-600 text-[9px]'
                                      }>{c.accessType}</Badge>
                                    </TableCell>
                                    <TableCell className={`text-[11px] text-right py-1.5 font-mono ${c.visaFeeUSD === 0 ? 'text-muted-foreground' : 'font-medium'}`}>
                                      {c.visaFeeUSD === 0 ? 'Free / N/A' : `$${c.visaFeeUSD}`}
                                    </TableCell>
                                    <TableCell className="text-[11px] text-right py-1.5 font-mono">
                                      {c.processingDaysMin === 0 && c.processingDaysMax === 0 ? (
                                        <span className="text-muted-foreground">N/A</span>
                                      ) : c.processingDaysMin === c.processingDaysMax ? (
                                        `${c.processingDaysMin} days`
                                      ) : (
                                        `${c.processingDaysMin}-${c.processingDaysMax} days`
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center py-1.5">
                                      {c.hasCostProfile ? (
                                        <Check className="w-3 h-3 text-emerald-600 inline" />
                                      ) : (
                                        <X className="w-3 h-3 text-red-400 inline" />
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {auditLoading && (
                      <Card>
                        <CardContent className="flex items-center justify-center py-8 gap-3">
                          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                          <p className="text-sm text-muted-foreground">Loading all country data...</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Error Display */}
                    {syncError && (
                      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                        <CardContent className="flex items-start gap-3 pt-4">
                          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">Sync Error</p>
                            <p className="text-xs text-muted-foreground mt-1">{syncError}</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* IDLE STAGE */}
                    {syncStage === 'idle' && !showAudit && (
                      <Card>
                        <CardContent className="flex flex-col items-center py-8 gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-emerald-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">Ready to Sync</p>
                            <p className="text-xs text-muted-foreground mt-1">Click below to compare database against the verified data file</p>
                          </div>
                          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleStartResearch}>
                            <RefreshCw className="w-4 h-4" />
                            Start Research
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* RESEARCHING STAGE */}
                    {syncStage === 'researching' && (
                      <Card>
                        <CardContent className="flex flex-col items-center py-10 gap-4">
                          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                          <div className="text-center">
                            <p className="text-sm font-medium">Researching Latest Visa Data...</p>
                            <p className="text-xs text-muted-foreground mt-1">Comparing database against verified data file. This takes a few seconds.</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* PREVIEW STAGE — improved with ALL fields shown */}
                    {syncStage === 'preview' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold">{syncChanges.length} Correction{syncChanges.length !== 1 ? 's' : ''} Found</h4>
                            {syncResearchTime && <p className="text-xs text-muted-foreground mt-0.5">Researched at {new Date(syncResearchTime).toLocaleString()}</p>}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleResetSync}>Cancel</Button>
                            <Button className="bg-emerald-600 hover:bg-emerald-700 gap-1.5" size="sm" onClick={handleApplyChanges}>
                              <Check className="w-3.5 h-3.5" />
                              Apply All Changes
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                          {syncChanges.map((change, idx) => {
                            const feeChanged = change.before.visaFeeUSD !== change.after.visaFeeUSD;
                            const daysChanged = change.before.processingDaysMin !== change.after.processingDaysMin || change.before.processingDaysMax !== change.after.processingDaysMax;
                            const categoryChanged = change.before.accessType !== change.after.accessType;

                            const formatDays = (min: number, max: number) => {
                              if (min === 0 && max === 0) return 'N/A';
                              if (min === max) return `${min} days`;
                              return `${min}-${max} days`;
                            };
                            const formatFee = (fee: number) => fee === 0 ? 'Free / N/A' : `$${fee}`;

                            return (
                              <Card key={change.id || idx} className="overflow-hidden">
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold truncate">{change.name}</p>
                                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                        <Badge variant="secondary" className={`text-[10px] ${categoryChanged ? 'line-through opacity-60' : 'opacity-80'}`}>{change.before.accessType}</Badge>
                                        {categoryChanged && <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />}
                                        <Badge className={`text-[10px] ${categoryChanged ? 'bg-emerald-600' : 'bg-emerald-600/40'}`}>{change.after.accessType}</Badge>
                                      </div>

                                      {/* Always show Fee and Processing Time */}
                                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] text-muted-foreground shrink-0">Fee:</span>
                                          <span className={`text-[11px] font-mono ${feeChanged ? 'text-amber-600 font-semibold' : ''}`}>{formatFee(change.after.visaFeeUSD)}</span>
                                          {feeChanged && (
                                            <span className="text-[9px] text-muted-foreground line-through">{formatFee(change.before.visaFeeUSD)}</span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] text-muted-foreground shrink-0">Processing:</span>
                                          <span className={`text-[11px] font-mono ${daysChanged ? 'text-amber-600 font-semibold' : ''}`}>{formatDays(change.after.processingDaysMin, change.after.processingDaysMax)}</span>
                                          {daysChanged && (
                                            <span className="text-[9px] text-muted-foreground line-through">{formatDays(change.before.processingDaysMin, change.before.processingDaysMax)}</span>
                                          )}
                                        </div>
                                      </div>

                                      {change.reason && (
                                        <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">{change.reason}</p>
                                      )}
                                    </div>
                                    {change.source && (
                                      <Badge variant="outline" className="text-[9px] shrink-0">{change.source}</Badge>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* APPLYING STAGE */}
                    {syncStage === 'applying' && (
                      <Card>
                        <CardContent className="flex flex-col items-center py-10 gap-4">
                          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                          <div className="text-center">
                            <p className="text-sm font-medium">Applying Changes to Database...</p>
                            <p className="text-xs text-muted-foreground mt-1">Updating {syncChanges.length} countries. Please wait.</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* DONE STAGE */}
                    {syncStage === 'done' && (
                      <Card>
                        <CardContent className="flex flex-col items-center py-8 gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <CheckCheck className="w-8 h-8 text-emerald-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-semibold">Sync Complete!</p>
                            {syncChanges.length > 0 ? (
                              <p className="text-xs text-muted-foreground mt-1">
                                {syncAppliedCount} applied, {syncFailedCount} failed out of {syncChanges.length} corrections.
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1">All visa data is already up to date.</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={handleResetSync} className="gap-2">
                              <RefreshCw className="w-3.5 h-3.5" />
                              Sync Again
                            </Button>
                            <Button variant="outline" onClick={handleLoadAudit} className="gap-2">
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              View All Data
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* ====== INSIGHTS TAB ====== */}
                {activeSection === 'insights' && (
                  insightsLoading && !insightsData ? (
                    <div className='flex items-center justify-center py-20'>
                      <Loader2 className='w-6 h-6 animate-spin text-emerald-500' />
                      <span className='ml-2 text-sm text-muted-foreground'>Loading insights...</span>
                    </div>
                  ) : insightsData ? (
                    <div className='space-y-6 p-4 max-h-[70vh] overflow-y-auto'>
                      {/* ====== Section A: Critical Alerts ====== */}
                      {insightsData.alerts.length > 0 && (
                        <div className='space-y-2'>
                          <h3 className='text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2'>
                            <ShieldAlert className='w-4 h-4' /> Critical Alerts
                          </h3>
                          {insightsData.alerts.map((alert, i) => {
                            const borderColors = {
                              error: 'border-l-red-500 bg-red-50 dark:bg-red-950/20',
                              warning: 'border-l-amber-500 bg-amber-50 dark:bg-amber-950/20',
                              info: 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20',
                            };
                            const alertIcons = {
                              error: <XCircle className='w-4 h-4 text-red-500 shrink-0' />,
                              warning: <AlertTriangle className='w-4 h-4 text-amber-500 shrink-0' />,
                              info: <Info className='w-4 h-4 text-blue-500 shrink-0' />,
                            };
                            return (
                              <div key={i} className={`border-l-4 ${borderColors[alert.type]} rounded-r-lg p-3 flex items-start gap-3`}>
                                {alertIcons[alert.type]}
                                <div className='min-w-0'>
                                  <div className='text-sm font-medium'>{alert.title}</div>
                                  <div className='text-xs text-muted-foreground mt-0.5'>{alert.message}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* ====== Section B: Stat Cards Row ====== */}
                      <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                        {/* Total Users */}
                        <Card className='border-l-4 border-l-emerald-500'>
                          <CardContent className='p-3'>
                            <div className='flex items-center gap-2 mb-1'>
                              <UsersRound className='w-4 h-4 text-emerald-500' />
                              <span className='text-xs text-muted-foreground'>Total Users</span>
                            </div>
                            <div className='text-xl font-bold'>{insightsData.totalUsers}</div>
                            <div className='text-[10px] text-muted-foreground mt-1'>
                              {insightsData.freeUsers} free / {insightsData.proUsers} pro
                            </div>
                            {(insightsData.newUsersWeek > 0 || insightsData.newUsersMonth > 0) && (
                              <div className='text-[10px] mt-0.5'>
                                {insightsData.newUsersWeek > 0 && <span className='text-emerald-600'>+{insightsData.newUsersWeek} this week</span>}
                                {insightsData.newUsersWeek > 0 && insightsData.newUsersMonth > 0 && ' · '}
                                {insightsData.newUsersMonth > 0 && <span className='text-emerald-600'>+{insightsData.newUsersMonth} this month</span>}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Searches This Week */}
                        <Card className='border-l-4 border-l-blue-500'>
                          <CardContent className='p-3'>
                            <div className='flex items-center gap-2 mb-1'>
                              <SearchIcon className='w-4 h-4 text-blue-500' />
                              <span className='text-xs text-muted-foreground'>Searches This Week</span>
                            </div>
                            <div className='text-xl font-bold'>{insightsData.searchesWeek}</div>
                            <div className='text-[10px] text-muted-foreground mt-1'>
                              {insightsData.searchesToday} today
                            </div>
                          </CardContent>
                        </Card>

                        {/* Affiliate Clicks */}
                        <Card className='border-l-4 border-l-purple-500'>
                          <CardContent className='p-3'>
                            <div className='flex items-center gap-2 mb-1'>
                              <MousePointerClick className='w-4 h-4 text-purple-500' />
                              <span className='text-xs text-muted-foreground'>Affiliate Clicks</span>
                            </div>
                            <div className='text-xl font-bold'>{insightsData.affiliateClicks}</div>
                            <div className='text-[10px] text-muted-foreground mt-1'>Total clicks</div>
                          </CardContent>
                        </Card>

                        {/* Security Alerts */}
                        <Card className='border-l-4 border-l-red-500'>
                          <CardContent className='p-3'>
                            <div className='flex items-center gap-2 mb-1'>
                              <ShieldAlert className='w-4 h-4 text-red-500' />
                              <span className='text-xs text-muted-foreground'>Security Alerts</span>
                            </div>
                            <div className='text-xl font-bold'>{insightsData.failedLogins}</div>
                            <div className='text-[10px] text-muted-foreground mt-1'>Failed logins</div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* ====== Section C: Two-column grid ====== */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {/* Left column */}
                        <div className='space-y-4'>
                          {/* Top Search Queries */}
                          <Card>
                            <CardHeader className='pb-2'>
                              <CardTitle className='text-sm font-semibold flex items-center gap-2'>
                                <SearchIcon className='w-4 h-4 text-blue-500' /> Top Search Queries
                              </CardTitle>
                              <CardDescription>
                                {insightsData.searchesToday} today / {insightsData.searchesWeek} this week
                              </CardDescription>
                            </CardHeader>
                            <CardContent className='space-y-1.5 max-h-48 overflow-y-auto'>
                              {insightsData.topSearchQueries.length === 0 ? (
                                <p className='text-xs text-muted-foreground'>No search data yet</p>
                              ) : (
                                insightsData.topSearchQueries.map((q, i) => (
                                  <div key={i} className='flex items-center justify-between py-1'>
                                    <span className='text-sm truncate mr-2'>{q.query}</span>
                                    <Badge variant='secondary' className='shrink-0 text-xs'>{q.count}</Badge>
                                  </div>
                                ))
                              )}
                            </CardContent>
                          </Card>

                          {/* Popular Countries */}
                          <Card>
                            <CardHeader className='pb-2'>
                              <CardTitle className='text-sm font-semibold flex items-center gap-2'>
                                <Globe className='w-4 h-4 text-emerald-500' /> Popular Countries
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-2 max-h-48 overflow-y-auto'>
                              {insightsData.popularCountries.length === 0 ? (
                                <p className='text-xs text-muted-foreground'>No country data yet</p>
                              ) : (
                                insightsData.popularCountries.map((c, i) => {
                                  const maxVisitors = insightsData.popularCountries[0]?.visitors || 1;
                                  const pct = Math.round((c.visitors / maxVisitors) * 100);
                                  return (
                                    <div key={i} className='space-y-0.5'>
                                      <div className='flex items-center justify-between text-sm'>
                                        <span className='flex items-center gap-1.5'>
                                          <span>{c.flag}</span>
                                          <span className='truncate'>{c.name}</span>
                                        </span>
                                        <span className='text-xs text-muted-foreground shrink-0 ml-2'>{c.visitors}</span>
                                      </div>
                                      <div className='h-1.5 bg-muted rounded-full overflow-hidden'>
                                        <div className='h-full bg-emerald-500 rounded-full' style={{ width: `${pct}%` }} />
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </CardContent>
                          </Card>
                        </div>

                        {/* Right column */}
                        <div className='space-y-4'>
                          {/* Traffic Sources */}
                          <Card>
                            <CardHeader className='pb-2'>
                              <CardTitle className='text-sm font-semibold flex items-center gap-2'>
                                <Globe2 className='w-4 h-4 text-emerald-500' /> Traffic Sources
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-3'>
                              {(() => {
                                const ts = insightsData.trafficSources;
                                const total = ts.organic + ts.direct + ts.social + ts.referral;
                                if (total === 0) return <p className='text-xs text-muted-foreground'>No traffic data yet</p>;
                                const orgPct = Math.round((ts.organic / total) * 100);
                                const dirPct = Math.round((ts.direct / total) * 100);
                                const socPct = Math.round((ts.social / total) * 100);
                                const refPct = Math.max(0, 100 - orgPct - dirPct - socPct);
                                return (
                                  <>
                                    {/* Stacked bar */}
                                    <div className='flex h-3 rounded-full overflow-hidden'>
                                      {ts.organic > 0 && <div className='bg-emerald-500' style={{ width: `${orgPct}%` }} />}
                                      {ts.direct > 0 && <div className='bg-blue-500' style={{ width: `${dirPct}%` }} />}
                                      {ts.social > 0 && <div className='bg-purple-500' style={{ width: `${socPct}%` }} />}
                                      {ts.referral > 0 && <div className='bg-orange-500' style={{ width: `${refPct}%` }} />}
                                    </div>
                                    {/* Legend */}
                                    <div className='grid grid-cols-2 gap-x-4 gap-y-1.5'>
                                      {[
                                        { name: 'Organic', count: ts.organic, pct: orgPct, color: 'bg-emerald-500' },
                                        { name: 'Direct', count: ts.direct, pct: dirPct, color: 'bg-blue-500' },
                                        { name: 'Social', count: ts.social, pct: socPct, color: 'bg-purple-500' },
                                        { name: 'Referral', count: ts.referral, pct: refPct, color: 'bg-orange-500' },
                                      ].map((s) => (
                                        <div key={s.name} className='flex items-center gap-2 text-xs'>
                                          <div className={`w-2.5 h-2.5 rounded-sm shrink-0 ${s.color}`} />
                                          <span className='text-muted-foreground'>{s.name}</span>
                                          <span className='ml-auto font-medium'>{s.count}</span>
                                          <span className='text-muted-foreground w-8 text-right'>{s.pct}%</span>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                );
                              })()}
                            </CardContent>
                          </Card>

                          {/* Device Breakdown */}
                          <Card>
                            <CardHeader className='pb-2'>
                              <CardTitle className='text-sm font-semibold flex items-center gap-2'>
                                <Monitor className='w-4 h-4 text-emerald-500' /> Device Breakdown
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-2'>
                              {(() => {
                                const db = insightsData.deviceBreakdown;
                                const total = db.desktop + db.mobile + db.tablet;
                                if (total === 0) return <p className='text-xs text-muted-foreground'>No device data yet</p>;
                                return [
                                  { label: 'Desktop', value: db.desktop, icon: <Monitor className='w-3.5 h-3.5' /> },
                                  { label: 'Mobile', value: db.mobile, icon: <Smartphone className='w-3.5 h-3.5' /> },
                                  { label: 'Tablet', value: db.tablet, icon: <Tablet className='w-3.5 h-3.5' /> },
                                ].map((d) => {
                                  const pct = Math.round((d.value / total) * 100);
                                  return (
                                    <div key={d.label} className='space-y-0.5'>
                                      <div className='flex items-center justify-between text-xs'>
                                        <span className='flex items-center gap-1.5 text-muted-foreground'>{d.icon} {d.label}</span>
                                        <span className='font-medium'>{pct}%</span>
                                      </div>
                                      <div className='h-1.5 bg-muted rounded-full overflow-hidden'>
                                        <div className='h-full bg-emerald-500 rounded-full' style={{ width: `${pct}%` }} />
                                      </div>
                                    </div>
                                  );
                                });
                              })()}
                            </CardContent>
                          </Card>

                          {/* Browser Breakdown */}
                          <Card>
                            <CardHeader className='pb-2'>
                              <CardTitle className='text-sm font-semibold flex items-center gap-2'>
                                <Globe2 className='w-4 h-4 text-blue-500' /> Browser Breakdown
                              </CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-2'>
                              {insightsData.browserBreakdown.length === 0 ? (
                                <p className='text-xs text-muted-foreground'>No browser data yet</p>
                              ) : (
                                insightsData.browserBreakdown.map((b, i) => (
                                  <div key={i} className='space-y-0.5'>
                                    <div className='flex items-center justify-between text-xs'>
                                      <span className='text-muted-foreground'>{b.browser}</span>
                                      <span className='font-medium'>{b.percentage}%</span>
                                    </div>
                                    <div className='h-1.5 bg-muted rounded-full overflow-hidden'>
                                      <div className='h-full bg-emerald-500 rounded-full' style={{ width: `${b.percentage}%` }} />
                                    </div>
                                  </div>
                                ))
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* ====== Section D: Bottom row - two columns ====== */}
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        {/* Visa Data Freshness */}
                        <Card>
                          <CardHeader className='pb-2'>
                            <CardTitle className='text-sm font-semibold flex items-center gap-2'>
                              <ClockIcon className='w-4 h-4 text-amber-500' /> Visa Data Freshness
                            </CardTitle>
                            <CardDescription>10 oldest-updated countries</CardDescription>
                          </CardHeader>
                          <CardContent>
                            {insightsData.visaDataFreshness.length === 0 ? (
                              <p className='text-xs text-muted-foreground'>No freshness data</p>
                            ) : (
                              <div className='overflow-x-auto'>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className='text-xs'>Country</TableHead>
                                      <TableHead className='text-xs text-right'>Days Ago</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {insightsData.visaDataFreshness.map((v, i) => {
                                      const colorClass = v.daysSinceUpdate < 30
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : v.daysSinceUpdate <= 90
                                          ? 'text-amber-600 dark:text-amber-400'
                                          : 'text-red-600 dark:text-red-400';
                                      return (
                                        <TableRow key={i}>
                                          <TableCell className='text-sm py-1.5'>
                                            <span className='mr-1.5'>{v.flag}</span>{v.name}
                                          </TableCell>
                                          <TableCell className={`text-sm text-right font-medium py-1.5 ${colorClass}`}>
                                            {v.daysSinceUpdate}d
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* Security Log */}
                        <Card>
                          <CardHeader className='pb-2'>
                            <CardTitle className='text-sm font-semibold flex items-center gap-2'>
                              <Fingerprint className='w-4 h-4 text-red-500' /> Security Log
                            </CardTitle>
                            <CardDescription>
                              {insightsData.securityStats.totalLogins} logins, {insightsData.securityStats.failedAttempts} failed attempts
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {insightsData.securityLog.length === 0 ? (
                              <p className='text-xs text-muted-foreground'>No security events</p>
                            ) : (
                              <div className='overflow-x-auto max-h-52 overflow-y-auto'>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className='text-xs'>Time</TableHead>
                                      <TableHead className='text-xs'>Action</TableHead>
                                      <TableHead className='text-xs'>User / IP</TableHead>
                                      <TableHead className='text-xs text-right'>Status</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {insightsData.securityLog.map((ev, i) => {
                                      const actionColor = ev.action === 'login_failed'
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : ev.action === 'login_success'
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
                                      return (
                                        <TableRow key={i}>
                                          <TableCell className='text-xs py-1.5 text-muted-foreground whitespace-nowrap'>
                                            {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                          </TableCell>
                                          <TableCell className='py-1.5'>
                                            <Badge variant='secondary' className={`text-[10px] ${actionColor}`}>
                                              {ev.action.replace(/_/g, ' ')}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className='text-xs py-1.5'>
                                            <div className='truncate max-w-[120px]'>{ev.email || ev.ip}</div>
                                          </TableCell>
                                          <TableCell className='py-1.5 text-right'>
                                            {ev.success
                                              ? <CheckCircle2 className='w-4 h-4 text-emerald-500 inline' />
                                              : <XCircle className='w-4 h-4 text-red-500 inline' />}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* ====== Section E: Affiliate Tracking ====== */}
                      <Card>
                        <CardHeader className='pb-2'>
                          <CardTitle className='text-sm font-semibold flex items-center gap-2'>
                            <Link2 className='w-4 h-4 text-purple-500' /> Affiliate Tracking
                          </CardTitle>
                          <CardDescription>Partner click performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {insightsData.affiliateTracking.length === 0 ? (
                            <p className='text-xs text-muted-foreground'>No affiliate data yet</p>
                          ) : (
                            <div className='space-y-2'>
                              {insightsData.affiliateTracking.map((a, i) => {
                                const maxClicks = Math.max(...insightsData.affiliateTracking.map(x => x.clicks), 1);
                                const pct = Math.round((a.clicks / maxClicks) * 100);
                                return (
                                  <div key={i} className='space-y-0.5'>
                                    <div className='flex items-center justify-between text-sm'>
                                      <span className='text-muted-foreground'>{a.partner}</span>
                                      <span className='font-medium'>{a.clicks} clicks</span>
                                    </div>
                                    <div className='h-1.5 bg-muted rounded-full overflow-hidden'>
                                      <div className='h-full bg-emerald-500 rounded-full' style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className='flex flex-col items-center justify-center py-20 text-muted-foreground'>
                      <AlertCircle className='w-8 h-8 mb-2' />
                      <p className='text-sm'>Unable to load insights data</p>
                    </div>
                  )
                )}

                {/* ====== SETTINGS TAB ====== */}
                {activeSection === 'hero-images' && (
                  <HeroImagesSection token={token} />
                )}

                {activeSection === 'settings' && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Settings className="w-5 h-5 text-emerald-500" /> Feature Toggles</h3>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><Zap className="w-5 h-5 text-emerald-600" /></div>
                            <div><CardTitle className="text-base">AI Features</CardTitle><CardDescription>Enable or disable AI Chat and Document Analysis</CardDescription></div>
                          </div>
                          <Switch checked={aiEnabled} onCheckedChange={toggleAiFeature} disabled={togglingAi} className="data-[state=checked]:bg-emerald-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2"><Badge variant={aiEnabled ? 'default' : 'secondary'} className={aiEnabled ? 'bg-emerald-600' : ''}>{aiEnabled ? 'Enabled' : 'Disabled'}</Badge>{togglingAi && <span className="text-xs text-muted-foreground">Updating...</span>}</div>
                      </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"><Server className="w-5 h-5 text-orange-600" /></div>
                            <div><CardTitle className="text-base">Maintenance Mode</CardTitle><CardDescription>Show maintenance banner to all users</CardDescription></div>
                          </div>
                          <Switch checked={maintenanceMode} onCheckedChange={toggleMaintenance} disabled={togglingMaintenance} className="data-[state=checked]:bg-orange-600" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                          <p className="text-xs text-muted-foreground">When enabled, a maintenance banner will be shown to all users. Use during updates or data refreshes.</p>
                        </div>
                        <div className="flex items-center gap-2 mt-2"><Badge variant={maintenanceMode ? 'destructive' : 'secondary'}>{maintenanceMode ? 'Active' : 'Normal'}</Badge>{togglingMaintenance && <span className="text-xs text-muted-foreground">Updating...</span>}</div>
                      </CardContent>
                    </Card>

                    {/* WhatsApp Number - Inline Editor */}
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><MessageCircle className="w-5 h-5 text-green-600" /></div>
                          <div><CardTitle className="text-base">WhatsApp Number</CardTitle><CardDescription>Messages only — no calls allowed</CardDescription></div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Phone className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={whatsappDigits}
                              onChange={(e) => setWhatsappRaw(e.target.value.replace(/[^\d]/g, ''))}
                              placeholder="923001234567"
                              className="pl-9"
                            />
                          </div>
                          {whatsappIsLocal && whatsappDigits.length > 0 && (
                            <Button variant="outline" onClick={fixWhatsappNumber} className="shrink-0 text-amber-600 border-amber-300 hover:bg-amber-50">
                              Auto-fix +92
                            </Button>
                          )}
                          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveWhatsappNumber} disabled={savingWhatsapp || whatsappDigits.length < 10}>
                            {savingWhatsapp ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                        {whatsappIsLocal && whatsappDigits.length > 0 && (
                          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-800 dark:text-amber-200">
                              <p className="font-medium">This looks like a local Pakistani number (starts with 03).</p>
                              <p className="mt-1">WhatsApp needs the international format: <span className="font-mono font-bold">92</span> + your number without the 0. Example: <span className="font-mono font-bold">923001234567</span></p>
                              <p className="mt-1">Click <span className="font-semibold">"Auto-fix +92"</span> to fix it automatically.</p>
                            </div>
                          </div>
                        )}
                        {whatsappPreview && !whatsappIsLocal && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3" />
                            Link preview: <span className="font-mono text-emerald-600">{whatsappPreview}</span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Format: country code + number, no + sign. Pakistan: <span className="font-mono">923001234567</span>
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
    </div>
  );
}

// Helper Components
function HeroImagesSection({ token }: { token: string | null }) {
  const HERO_COUNTRIES = [
    { slug: 'uae', code: 'UAE', name: 'UAE' },
    { slug: 'saudi-arabia', code: 'SaudiArabia', name: 'Saudi Arabia' },
    { slug: 'malaysia', code: 'Malaysia', name: 'Malaysia' },
    { slug: 'turkey', code: 'Turkey', name: 'Türkiye' },
    { slug: 'uk', code: 'UK', name: 'United Kingdom' },
    { slug: 'usa', code: 'USA', name: 'United States' },
    { slug: 'thailand', code: 'Thailand', name: 'Thailand' },
    { slug: 'china', code: 'China', name: 'China' },
    { slug: 'oman', code: 'Oman', name: 'Oman' },
    { slug: 'qatar', code: 'Qatar', name: 'Qatar' },
    { slug: 'bahrain', code: 'Bahrain', name: 'Bahrain' },
    { slug: 'egypt', code: 'Egypt', name: 'Egypt' },
    { slug: 'indonesia', code: 'Indonesia', name: 'Indonesia' },
    { slug: 'jordan', code: 'Jordan', name: 'Jordan' },
    { slug: 'singapore', code: 'Singapore', name: 'Singapore' },
  ];
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchState = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const res = await fetch('/api/admin/hero-images', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setGlobalEnabled(data.data.globalEnabled);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchState(); }, [fetchState]);

  const handleToggleGlobal = useCallback(async (enabled: boolean) => {
    if (!token) return;
    setToggling(true);
    try {
      const res = await fetch('/api/admin/hero-images', {
        method: enabled ? 'PUT' : 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: enabled ? JSON.stringify({ enabled: true }) : undefined,
      });
      const data = await res.json();
      if (data.success) {
        setGlobalEnabled(enabled);
        toast.success(enabled ? 'Hero images enabled' : 'All hero images disabled');
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch { toast.error('Connection error'); }
    finally { setToggling(false); }
  }, [token]);

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileImage className="w-5 h-5 text-emerald-500" /> Hero Images
      </h3>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <FileImage className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-base">Global Toggle</CardTitle>
                <CardDescription>Show hero images on 15 top country pages</CardDescription>
              </div>
            </div>
            <Switch
              checked={globalEnabled}
              onCheckedChange={handleToggleGlobal}
              disabled={toggling}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={globalEnabled ? 'default' : 'secondary'} className={globalEnabled ? 'bg-emerald-600' : ''}>
              {globalEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
            <span className="text-sm text-muted-foreground">{HERO_COUNTRIES.length} countries with hero banners</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {HERO_COUNTRIES.map((country) => (
          <Card key={country.code} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <img
                  src={`/country-heroes/${country.slug}.webp`}
                  alt={country.name}
                  width={80}
                  height={45}
                  className={`w-20 h-[45px] rounded-md object-cover border shrink-0 ${globalEnabled ? '' : 'opacity-40 grayscale'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{country.name}</p>
                  <p className="text-xs text-muted-foreground">/{country.slug}</p>
                </div>
                <Badge variant={globalEnabled ? 'default' : 'secondary'} className={globalEnabled ? 'bg-emerald-600 text-xs' : 'text-xs'}>
                  {globalEnabled ? 'Active' : 'Hidden'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/30',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/30',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-800/30',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200/50 dark:border-green-800/30',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/30',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200/50 dark:border-orange-800/30',
    violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200/50 dark:border-violet-800/30',
  };
  const textColorMap: Record<string, string> = {
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400',
    orange: 'text-orange-600 dark:text-orange-400',
    violet: 'text-violet-600 dark:text-violet-400',
  };
  return (
    <div className={`p-3 rounded-xl border ${colorMap[color] || colorMap.emerald}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={textColorMap[color] || textColorMap.emerald}>{icon}</div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className={`text-xl font-bold ${textColorMap[color] || textColorMap.emerald}`}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 text-center">
      <div className={`text-xl font-bold ${color || ''}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

const VISA_COLORS = ['#059669', '#f97316', '#3b82f6', '#ef4444'];
const VISA_LABELS: Record<string, string> = { visaFree: 'Visa Free', visaOnArrival: 'On Arrival', etaAvailable: 'e-Visa/ETA', regularVisa: 'Regular Visa' };

function VisaBreakdownChart({ visaCategories, total }: { visaCategories: { visaFree: number; visaOnArrival: number; etaAvailable: number; regularVisa: number }; total: number }) {
  const data = [
    { name: 'Visa Free', value: visaCategories.visaFree },
    { name: 'On Arrival', value: visaCategories.visaOnArrival },
    { name: 'e-Visa/ETA', value: visaCategories.etaAvailable },
    { name: 'Regular Visa', value: visaCategories.regularVisa },
  ].filter(d => d.value > 0);

  return (
    <div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={VISA_COLORS[index % VISA_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} countries`, name]}
              contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-1.5 mt-2">
        {['visaFree', 'visaOnArrival', 'etaAvailable', 'regularVisa'].map((key, i) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: VISA_COLORS[i] }} />
            <span className="text-muted-foreground">{VISA_LABELS[key]}</span>
            <span className="ml-auto font-medium">{visaCategories[key as keyof typeof visaCategories]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
