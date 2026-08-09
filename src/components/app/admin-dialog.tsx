'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings, Lock, Eye, EyeOff, Shield, Globe, Users, Activity,
  ToggleLeft, ToggleRight, BarChart3, LogOut, Database, Zap, AlertTriangle,
  ChevronRight, RefreshCw, Server, FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export function AdminDialog({ open, onClose, aiEnabled, setAiEnabled }: AdminDialogProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'settings' | 'analytics'>('settings');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [togglingAi, setTogglingAi] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);

  // Check localStorage for existing token on mount
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
    setUsername('');
    setPassword('');
    setAnalytics(null);
    toast.success('Logged out');
  }, []);

  const fetchAnalytics = useCallback(async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setAnalyticsLoading(true);
    if (showLoading) setRefreshingAnalytics(true);
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
        setMaintenanceMode(data.data.settings?.maintenance_mode === 'true');
      }
    } catch {
      toast.error('Failed to fetch analytics');
    } finally {
      setAnalyticsLoading(false);
      setRefreshingAnalytics(false);
    }
  }, [token]);

  // Fetch analytics when logged in and section changes
  useEffect(() => {
    if (isLoggedIn && token && activeSection === 'analytics' && !analytics) {
      fetchAnalytics();
    }
  }, [isLoggedIn, token, activeSection, analytics, fetchAnalytics]);

  const toggleAiFeature = useCallback(async (enabled: boolean) => {
    if (!token) return;
    setTogglingAi(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ key: 'ai_enabled', value: String(enabled) }),
      });
      const data = await res.json();
      if (data.success) {
        setAiEnabled(enabled);
        toast.success(`AI features ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        toast.error('Failed to update setting');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setTogglingAi(false);
    }
  }, [token, setAiEnabled]);

  const toggleMaintenance = useCallback(async (enabled: boolean) => {
    if (!token) return;
    setTogglingMaintenance(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ key: 'maintenance_mode', value: String(enabled) }),
      });
      const data = await res.json();
      if (data.success) {
        setMaintenanceMode(enabled);
        toast.success(`Maintenance mode ${enabled ? 'enabled' : 'disabled'}`);
      } else {
        toast.error('Failed to update setting');
      }
    } catch {
      toast.error('Connection error');
    } finally {
      setTogglingMaintenance(false);
    }
  }, [token]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            Admin Dashboard
          </DialogTitle>
          <DialogDescription>Manage site settings and view analytics</DialogDescription>
        </DialogHeader>

        {!isLoggedIn ? (
          // Login Gate
          <div className="p-6 flex-1 flex items-center justify-center">
            <Card className="w-full max-w-sm border-amber-200 dark:border-amber-800">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-8 h-8 text-amber-600" />
                </div>
                <CardTitle className="text-lg">Admin Login</CardTitle>
                <CardDescription>Enter your credentials to access the dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="admin-username">Username</label>
                  <Input
                    id="admin-username"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="admin-password">Password</label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      autoComplete="current-password"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={handleLogin}
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Sign In
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Admin Dashboard
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-48 border-r bg-muted/30 p-3 space-y-1 hidden sm:block">
              <button
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === 'settings' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveSection('settings')}
              >
                <ToggleLeft className="w-4 h-4" />
                Settings
              </button>
              <button
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === 'analytics' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium' : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveSection('analytics')}
              >
                <BarChart3 className="w-4 h-4" />
                Analytics
              </button>
              <Separator className="my-3" />
              <button
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 p-6">
              {/* Mobile Section Toggle */}
              <div className="sm:hidden flex gap-2 mb-4">
                <Button
                  variant={activeSection === 'settings' ? 'default' : 'outline'}
                  size="sm"
                  className={activeSection === 'settings' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                  onClick={() => setActiveSection('settings')}
                >
                  Settings
                </Button>
                <Button
                  variant={activeSection === 'analytics' ? 'default' : 'outline'}
                  size="sm"
                  className={activeSection === 'analytics' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                  onClick={() => setActiveSection('analytics')}
                >
                  Analytics
                </Button>
                <Button variant="outline" size="sm" className="ml-auto text-red-500" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>

              {activeSection === 'settings' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-amber-500" />
                    Feature Toggles
                  </h3>

                  {/* AI Features Toggle */}
                  <Card className="border-amber-200 dark:border-amber-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">AI Features</CardTitle>
                            <CardDescription>Enable or disable AI Chat and Document Analysis</CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={aiEnabled}
                          onCheckedChange={toggleAiFeature}
                          disabled={togglingAi}
                          className="data-[state=checked]:bg-amber-600"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          When disabled, the AI Consultant tab and floating chat widget will be hidden from users. Users will see a placeholder message instead.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={aiEnabled ? 'default' : 'secondary'} className={aiEnabled ? 'bg-amber-600' : ''}>
                          {aiEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        {togglingAi && (
                          <span className="text-xs text-muted-foreground">Updating...</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Maintenance Mode Toggle */}
                  <Card className="border-orange-200 dark:border-orange-800">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <Server className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base">Maintenance Mode</CardTitle>
                            <CardDescription>Show maintenance banner to users</CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={maintenanceMode}
                          onCheckedChange={toggleMaintenance}
                          disabled={togglingMaintenance}
                          className="data-[state=checked]:bg-orange-600"
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                        <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          When enabled, a maintenance banner will be shown to all users. Use this during updates or data refreshes.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={maintenanceMode ? 'default' : 'secondary'} className={maintenanceMode ? 'bg-orange-600' : ''}>
                          {maintenanceMode ? 'Active' : 'Inactive'}
                        </Badge>
                        {togglingMaintenance && (
                          <span className="text-xs text-muted-foreground">Updating...</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-500" />
                        Quick Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50">
                          <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">AI Engine</span>
                          </div>
                          <span className={`text-sm font-semibold ${aiEnabled ? 'text-green-600' : 'text-red-500'}`}>
                            {aiEnabled ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200/50">
                          <div className="flex items-center gap-2 mb-1">
                            <Server className="w-3.5 h-3.5 text-orange-500" />
                            <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Maintenance</span>
                          </div>
                          <span className={`text-sm font-semibold ${maintenanceMode ? 'text-red-500' : 'text-green-600'}`}>
                            {maintenanceMode ? 'Active' : 'Normal'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === 'analytics' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-amber-500" />
                      Site Analytics
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchAnalytics(true)}
                      disabled={refreshingAnalytics}
                      className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshingAnalytics ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>

                  {analyticsLoading && !analytics ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : analytics ? (
                    <>
                      {/* Country Statistics */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Globe className="w-4 h-4 text-amber-500" />
                            Country Database
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 text-center">
                              <div className="text-xl font-bold text-amber-700 dark:text-amber-400">{analytics.countries.total}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">Total Countries</div>
                            </div>
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200/50 text-center">
                              <div className="text-xl font-bold text-green-700 dark:text-green-400">{analytics.countries.visaFree}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">Visa Free</div>
                            </div>
                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 text-center">
                              <div className="text-xl font-bold text-blue-700 dark:text-blue-400">{analytics.countries.visaOnArrival}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">Visa on Arrival</div>
                            </div>
                            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200/50 text-center">
                              <div className="text-xl font-bold text-purple-700 dark:text-purple-400">{analytics.countries.etaAvailable}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">ETA Available</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Visa Categories */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-amber-500" />
                            Visa Categories
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-lg bg-muted/50 text-center">
                              <div className="text-xl font-bold">{analytics.visaCategories.visaFree}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">Visa Free</div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50 text-center">
                              <div className="text-xl font-bold">{analytics.visaCategories.visaOnArrival}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">On Arrival</div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50 text-center">
                              <div className="text-xl font-bold">{analytics.visaCategories.etaAvailable}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">ETA</div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50 text-center">
                              <div className="text-xl font-bold">{analytics.visaCategories.regularVisa}</div>
                              <div className="text-[10px] text-muted-foreground mt-1">Regular Visa</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Continent Distribution */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Globe className="w-4 h-4 text-amber-500" />
                            Continent Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {analytics.continents.map((c) => {
                              const pct = analytics.countries.total > 0 ? (c.count / analytics.countries.total) * 100 : 0;
                              return (
                                <div key={c.continent} className="flex items-center gap-3">
                                  <span className="text-sm text-muted-foreground w-28 truncate">{c.continent}</span>
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium w-16 text-right">{c.count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Data & Usage Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Database className="w-4 h-4 text-amber-500" />
                              Data Records
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Requirements</span>
                              <span className="font-medium">{analytics.requirements}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Cost Profiles</span>
                              <span className="font-medium">{analytics.costProfiles}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">User Profiles</span>
                              <span className="font-medium">{analytics.users}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Sessions</span>
                              <span className="font-medium">{analytics.sessions}</span>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Shield className="w-4 h-4 text-amber-500" />
                              Data Freshness
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {analytics.dataFreshness ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                  <span className="text-sm">Last updated:</span>
                                </div>
                                <p className="text-sm font-medium">
                                  {new Date(analytics.dataFreshness).toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'long', day: 'numeric',
                                    hour: '2-digit', minute: '2-digit',
                                  })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {Math.round((Date.now() - new Date(analytics.dataFreshness).getTime()) / (1000 * 60 * 60 * 24))} days ago
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No data fetch recorded</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Failed to load analytics</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => fetchAnalytics(true)}>
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
