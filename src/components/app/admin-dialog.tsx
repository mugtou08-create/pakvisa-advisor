'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Settings, Lock, Eye, EyeOff, Shield, Globe, Users, Activity,
  ToggleLeft, ToggleRight, BarChart3, LogOut, Database, Zap, AlertTriangle,
  RefreshCw, Server, FileCheck, MessageSquare, Mail, Send, Trash2,
  ChevronLeft, ChevronRight, Check, Clock, User, Inbox, TrendingUp,
  Phone, ExternalLink, Reply, Search, CheckCheck, Download, Copy,
  Filter, X, ChevronDown, MessageCircle, Hash, XIcon, CreditCard, FileImage,
  Bell, ArrowRightLeft, Loader2, AlertCircle, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
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

type AdminSection = 'overview' | 'messages' | 'newsletter' | 'payment-proofs' | 'analytics' | 'settings' | 'data-sync';
type SyncStage = 'idle' | 'researching' | 'preview' | 'applying' | 'done';
type MessageFilter = 'all' | 'unread' | 'replied';

const QUICK_REPLIES = [
  'Thank you for reaching out! We will review your query and get back to you within 24 hours.',
  'For the most up-to-date visa information, please check our website or use the AI Visa Consultant chat.',
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
  const [whatsappNumber, setWhatsappNumber] = useState('');
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
        setWhatsappNumber(data.data.settings?.whatsapp_number || '');
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

  const saveWhatsappNumber = useCallback(async () => {
    if (!token) return;
    setSavingWhatsapp(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key: 'whatsapp_number', value: whatsappNumber.replace(/[^\d]/g, '') }),
      });
      const data = await res.json();
      if (data.success) toast.success('WhatsApp number saved');
      else toast.error('Failed to save');
    } catch { toast.error('Connection error'); }
    finally { setSavingWhatsapp(false); }
  }, [token, whatsappNumber]);

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
        setSyncError(data.error || 'Research failed');
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
  }, []);

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
    { key: 'messages', label: 'Messages', icon: <Inbox className="w-4 h-4" />, badge: messagesUnread || undefined },
    { key: 'payment-proofs', label: 'Payment Proofs', icon: <CreditCard className="w-4 h-4" />, badge: paymentProofsPending || undefined },
    { key: 'newsletter', label: 'Newsletter', icon: <Mail className="w-4 h-4" /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'data-sync', label: 'Data Sync', icon: <ArrowRightLeft className="w-4 h-4" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

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
                    <h3 className="text-lg font-semibold flex items-center gap-2"><ArrowRightLeft className="w-5 h-5 text-emerald-500" /> Database Sync</h3>

                    {/* Info Card */}
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"><Database className="w-5 h-5 text-emerald-600" /></div>
                          <div>
                            <CardTitle className="text-base">AI-Powered Data Verification</CardTitle>
                            <CardDescription>Research and update visa data for all {syncTotalCountries || 70} countries</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                          <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p><strong>How it works:</strong></p>
                            <p>1. <strong>Research</strong> — AI checks all 70 countries against the latest Henley Passport Index and official government sources.</p>
                            <p>2. <strong>Preview</strong> — You review every suggested change before anything is saved.</p>
                            <p>3. <strong>Apply</strong> — Only your confirmed changes are written to the database.</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

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
                    {syncStage === 'idle' && (
                      <Card>
                        <CardContent className="flex flex-col items-center py-8 gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <RefreshCw className="w-8 h-8 text-emerald-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">Ready to Sync</p>
                            <p className="text-xs text-muted-foreground mt-1">Click below to start researching the latest visa data</p>
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
                            <p className="text-xs text-muted-foreground mt-1">AI is checking all countries against official sources. This may take 30-60 seconds.</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* PREVIEW STAGE */}
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
                          {syncChanges.map((change, idx) => (
                            <Card key={change.id || idx} className="overflow-hidden">
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{change.name}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                      <Badge variant="secondary" className="text-[10px] line-through opacity-60">{change.before.accessType}</Badge>
                                      <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                                      <Badge className="text-[10px] bg-emerald-600">{change.after.accessType}</Badge>
                                      {change.before.visaFeeUSD !== change.after.visaFeeUSD && (
                                        <span className="text-[10px] text-muted-foreground">
                                          ${change.before.visaFeeUSD} → ${change.after.visaFeeUSD}
                                        </span>
                                      )}
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
                          ))}
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
                          <Button variant="outline" onClick={handleResetSync} className="gap-2">
                            <RefreshCw className="w-3.5 h-3.5" />
                            Sync Again
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* ====== SETTINGS TAB ====== */}
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
                      <CardContent>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Hash className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              value={whatsappNumber}
                              onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^\d]/g, ''))}
                              placeholder="923001234567"
                              className="pl-9"
                            />
                          </div>
                          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={saveWhatsappNumber} disabled={savingWhatsapp || whatsappNumber.length < 8}>
                            {savingWhatsapp ? 'Saving...' : 'Save'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-3 h-3" />
                          Include country code (no + sign). E.g. 923001234567 for Pakistan.
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
