'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Lock, Eye, EyeOff, Shield, Globe, Users, Activity,
  ToggleLeft, ToggleRight, BarChart3, LogOut, Database, Zap, AlertTriangle,
  RefreshCw, Server, FileCheck, MessageSquare, Mail, Send, Trash2,
  ChevronLeft, ChevronRight, Check, Clock, User, Inbox, TrendingUp,
  Phone, ExternalLink, Reply,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

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

type AdminSection = 'overview' | 'messages' | 'newsletter' | 'analytics' | 'settings';

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

  // Newsletter state
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [subscribersTotal, setSubscribersTotal] = useState(0);
  const [subscribersActive, setSubscribersActive] = useState(0);
  const [subscribersPage, setSubscribersPage] = useState(1);
  const [subscribersLoading, setSubscribersLoading] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('pakvisa-admin-token');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
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
    setActiveSection('overview');
    toast.success('Logged out');
  }, []);

  const fetchAnalytics = useCallback(async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setAnalyticsLoading(true);
    setRefreshingAnalytics(true);
    try {
      const res = await fetch('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
        setMaintenanceMode(data.data.settings?.maintenance_mode === 'true');
      }
    } catch { toast.error('Failed to fetch analytics'); }
    finally { setAnalyticsLoading(false); setRefreshingAnalytics(false); }
  }, [token]);

  const fetchMessages = useCallback(async (page = 1) => {
    if (!token) return;
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/admin/messages?page=${page}&limit=15`, {
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

  // Fetch data on section change
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    if (activeSection === 'overview' || activeSection === 'analytics') {
      if (!analytics) fetchAnalytics();
    }
    if (activeSection === 'overview') {
      fetchMessages();
      fetchSubscribers();
    }
    if (activeSection === 'messages') fetchMessages();
    if (activeSection === 'newsletter') fetchSubscribers();
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
      setSubscribersActive(prev => prev - 1);
      toast.success('Subscriber removed');
    } catch { toast.error('Failed to remove'); }
  };

  const navItems: { key: AdminSection; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'messages', label: 'Messages', icon: <Inbox className="w-4 h-4" />, badge: messagesUnread || undefined },
    { key: 'newsletter', label: 'Newsletter', icon: <Mail className="w-4 h-4" /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // ===== RENDER =====
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 pb-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg">Admin Dashboard</DialogTitle>
                <DialogDescription className="text-xs">Manage your PakVisa Advisor</DialogDescription>
              </div>
            </div>
            {isLoggedIn && (
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-1.5" /> Logout
              </Button>
            )}
          </div>
        </DialogHeader>

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
            <div className="w-52 border-r bg-muted/20 p-3 space-y-1 hidden md:flex flex-col">
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
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
                  <>
                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <StatCard icon={<Inbox className="w-4 h-4" />} label="Unread Messages" value={messagesUnread} color="red" />
                      <StatCard icon={<Mail className="w-4 h-4" />} label="Subscribers" value={subscribersActive} color="blue" />
                      <StatCard icon={<Globe className="w-4 h-4" />} label="Countries" value={analytics?.countries.total ?? '—'} color="emerald" />
                      <StatCard icon={<Zap className="w-4 h-4" />} label="AI Status" value={aiEnabled ? 'Online' : 'Offline'} color={aiEnabled ? 'green' : 'amber'} />
                    </div>

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
                              View All
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

                      {/* Visa Breakdown + Data Health */}
                      <div className="space-y-5">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-emerald-500" /> Visa Breakdown
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {analytics ? (
                              <div className="grid grid-cols-2 gap-3">
                                <MiniStat label="Visa Free" value={analytics.countries.visaFree} color="text-green-600" />
                                <MiniStat label="On Arrival" value={analytics.countries.visaOnArrival} color="text-orange-600" />
                                <MiniStat label="e-Visa/ETA" value={analytics.countries.etaAvailable} color="text-blue-600" />
                                <MiniStat label="Regular Visa" value={analytics.visaCategories.regularVisa} color="text-red-600" />
                              </div>
                            ) : <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>}
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
                      </div>
                    </div>
                  </>
                )}

                {/* ====== MESSAGES TAB ====== */}
                {activeSection === 'messages' && (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Inbox className="w-5 h-5 text-emerald-500" />
                        Messages
                        {messagesUnread > 0 && <Badge className="bg-red-500">{messagesUnread} unread</Badge>}
                      </h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => fetchMessages(messagesPage)} disabled={messagesLoading}>
                          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${messagesLoading ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                      </div>
                    </div>
                    {messagesLoading && messages.length === 0 ? (
                      <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-16 text-muted-foreground">
                        <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-medium">No messages yet</p>
                        <p className="text-sm">Messages from the Contact Us form will appear here.</p>
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
                                      <span className="text-xs text-muted-foreground">{m.email}</span>
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
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => deleteMessage(m.id)} title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {messagesTotal > 15 && (
                          <div className="flex items-center justify-center gap-2 pt-2">
                            <Button variant="outline" size="sm" disabled={messagesPage <= 1} onClick={() => fetchMessages(messagesPage - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                            <span className="text-sm text-muted-foreground">Page {messagesPage} of {Math.ceil(messagesTotal / 15)}</span>
                            <Button variant="outline" size="sm" disabled={messagesPage >= Math.ceil(messagesTotal / 15)} onClick={() => fetchMessages(messagesPage + 1)}><ChevronRight className="w-4 h-4" /></Button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* ====== NEWSLETTER TAB ====== */}
                {activeSection === 'newsletter' && (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Mail className="w-5 h-5 text-emerald-500" />
                        Newsletter Subscribers
                      </h3>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">{subscribersActive} active / {subscribersTotal} total</Badge>
                        <Button variant="outline" size="sm" onClick={() => fetchSubscribers(subscribersPage)} disabled={subscribersLoading}>
                          <RefreshCw className={`w-3.5 h-3.5 mr-1 ${subscribersLoading ? 'animate-spin' : ''}`} /> Refresh
                        </Button>
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-600">{subscribersTotal}</div>
                        <div className="text-xs text-muted-foreground mt-1">Total Subscribers</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{subscribersActive}</div>
                        <div className="text-xs text-muted-foreground mt-1">Active</div>
                      </Card>
                      <Card className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-500">{subscribersTotal - subscribersActive}</div>
                        <div className="text-xs text-muted-foreground mt-1">Inactive</div>
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
                        {/* Country Stats */}
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

                        {/* Continent Distribution */}
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

                        {/* Data Records + Freshness */}
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
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Failed to load analytics</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchAnalytics(true)}>Try Again</Button>
                      </div>
                    )}
                  </>
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

                    {/* WhatsApp Config */}
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><Phone className="w-5 h-5 text-green-600" /></div>
                          <div><CardTitle className="text-base">WhatsApp Number</CardTitle><CardDescription>Phone number for the floating WhatsApp button</CardDescription></div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                          <AlertTriangle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                          <p className="text-xs text-muted-foreground">
                            To change the WhatsApp number, edit <code className="bg-muted px-1 rounded">src/components/app/whatsapp-button.tsx</code> and replace <code className="bg-muted px-1 rounded">923001234567</code> with your number (country code, no +).
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
  };
  const textColorMap: Record<string, string> = {
    red: 'text-red-600 dark:text-red-400',
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400',
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
