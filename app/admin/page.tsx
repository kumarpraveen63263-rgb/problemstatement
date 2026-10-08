'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { EVENT_CONFIG } from '@/lib/event-config';
import { playClickSound } from '@/lib/audio';
import {
  Shield,
  Users,
  CheckCircle2,
  Clock,
  Download,
  Activity,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  Play,
  Square,
  Pause,
  KeyRound,
  FileText,
  Upload,
  Settings,
  X,
  Check,
  ChevronRight,
  Eye,
  Sliders,
  History,
  AlertOctagon,
  Lock,
  RotateCcw,
  Scissors,
} from 'lucide-react';

export default function AdminPortalPage() {
  const router = useRouter();

  // Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Command Dashboard State
  const [stats, setStats] = useState<any>(null);
  const [capacities, setCapacities] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name');

  // Modals & Drawers
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [teamDetail, setTeamDetail] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Capacity Edit Modal
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const [editableCapacities, setEditableCapacities] = useState<any[]>([]);

  // Emergency Reallocation Modal
  const [isReallocateModalOpen, setIsReallocateModalOpen] = useState(false);
  const [reallocatePsId, setReallocatePsId] = useState('PS-01');
  const [reallocateReason, setReallocateReason] = useState('');
  const [reallocatePassword, setReallocatePassword] = useState('');
  const [reallocateError, setReallocateError] = useState<string | null>(null);
  const [isReallocating, setIsReallocating] = useState(false);

  // Team Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCsvText, setImportCsvText] = useState('');
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Audit Log Modal
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Master System Reset Modal
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Google Sheets sync feedback
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Verify Session on mount
  const checkAdminAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/me');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setIsAdminLoggedIn(true);
          return true;
        }
      }
      setIsAdminLoggedIn(false);
      return false;
    } catch {
      setIsAdminLoggedIn(false);
      return false;
    }
  }, []);

  // 2. Fetch Live Dashboard Telemetry
  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, teamsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch(`/api/admin/teams?search=${encodeURIComponent(searchTerm)}&filter=${statusFilter}&sortBy=${sortBy}`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setCapacities(statsData.capacities);
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData.teams || []);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [searchTerm, statusFilter, sortBy]);

  // Initial load
  useEffect(() => {
    checkAdminAuth().then((authenticated) => {
      if (authenticated) {
        fetchDashboardData();
      } else {
        setIsLoadingData(false);
      }
    });
  }, [checkAdminAuth, fetchDashboardData]);

  // Real-time polling every 4 seconds when authenticated
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 4000);
    return () => clearInterval(interval);
  }, [isAdminLoggedIn, fetchDashboardData]);

  // Login handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLoginError(data.error || 'Invalid credentials');
        setIsLoggingIn(false);
        return;
      }

      setIsAdminLoggedIn(true);
      fetchDashboardData();
    } catch (err) {
      setLoginError('Connection failure.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (e) {}
    setIsAdminLoggedIn(false);
  };

  // Global Status Controls: OPEN, CLOSE, PAUSE
  const handleSetAllocationStatus = async (newStatus: 'OPEN' | 'CLOSED' | 'PAUSED') => {
    playClickSound();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocationStatus: newStatus }),
      });
      if (res.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      alert('Failed to update system status');
    }
  };

  // Toggle Test Mode
  const handleToggleTestMode = async () => {
    playClickSound();
    if (!stats) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testMode: !stats.testMode }),
      });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      alert('Failed to toggle test mode');
    }
  };

  // Toggle Chief Guest Ribbon Cutting Screen
  const handleToggleRibbon = async () => {
    playClickSound();
    if (!stats) return;
    const nextState = stats.ribbonEnabled === false ? true : false;
    
    // Instant optimistic update
    setStats({ ...stats, ribbonEnabled: nextState });

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ribbonEnabled: nextState }),
      });
      if (res.ok) {
        setSyncStatus(`Chief Guest Ribbon Inauguration is now ${nextState ? 'ENABLED (Ceremony screen active)' : 'DISABLED (Direct portal access active)'}`);
        setTimeout(() => setSyncStatus(null), 5000);
        fetchDashboardData();
      }
    } catch (err) {
      alert('Failed to update ribbon screen setting');
      fetchDashboardData();
    }
  };

  // Open Team Detail Drawer
  const handleViewTeam = async (teamId: string) => {
    playClickSound();
    setSelectedTeamId(teamId);
    setIsDetailLoading(true);

    try {
      const res = await fetch(`/api/admin/team/${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setTeamDetail(data);
      }
    } catch (err) {
      alert('Failed to load team details');
    } finally {
      setIsDetailLoading(false);
    }
  };

  // Trigger Google Sheets manual sync
  const handleSyncSheets = async () => {
    playClickSound();
    setIsSyncing(true);
    setSyncStatus('Initiating live sync...');
    try {
      const res = await fetch('/api/admin/sync-sheets', { method: 'POST' });
      const data = await res.json();
      setSyncStatus(data.message || 'Sync operation complete');
      setTimeout(() => setSyncStatus(null), 6000);
    } catch (err: any) {
      setSyncStatus('Sync error: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Audit Log viewer
  const handleOpenAudit = async () => {
    playClickSound();
    try {
      const res = await fetch('/api/admin/audit?limit=100');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
        setIsAuditModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load audit logs');
    }
  };

  // Perform Emergency Reallocation
  const handleExecuteReallocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamDetail?.team?.id) return;
    setReallocateError(null);
    setIsReallocating(true);

    try {
      const res = await fetch('/api/admin/reallocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: teamDetail.team.id,
          newPsId: reallocatePsId,
          reason: reallocateReason,
          adminPasswordConfirmation: reallocatePassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setReallocateError(data.error || 'Reallocation failed');
        setIsReallocating(false);
        return;
      }

      alert(data.message);
      setIsReallocateModalOpen(false);
      setReallocateReason('');
      setReallocatePassword('');
      handleViewTeam(teamDetail.team.id);
      fetchDashboardData();
    } catch (err) {
      setReallocateError('Reallocation request failed');
    } finally {
      setIsReallocating(false);
    }
  };

  // Master System Reset Action (Instant Optimistic Execution)
  const handleExecuteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setResetError(null);
    setIsResetting(true);

    // Save previous snapshot in case of rollback
    const prevStats = stats;
    const prevCapacities = capacities;
    const prevTeams = teams;

    // 1. INSTANT OPTIMISTIC STATE UPDATE (Sub-millisecond UI reaction)
    if (stats) {
      setStats({
        ...stats,
        allocatedTeams: 0,
        pendingTeams: stats.totalTeams || 20,
        totalDownloads: 0,
        distinctTeamsDownloaded: 0,
      });
    }

    setCapacities((prev) =>
      prev.map((ps) => ({
        ...ps,
        allocatedCount: 0,
        remaining: ps.capacity,
        isFull: false,
        fillPercentage: 0,
      }))
    );

    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        has_allocated: 0,
        allocated_ps_id: null,
        allocated_code: null,
        allocated_title: null,
        allocation_time: null,
        downloads_count: 0,
      }))
    );

    // Close modal immediately for snappy reaction
    setIsResetModalOpen(false);
    setSyncStatus('MASTER RESET COMPLETE: All allocations cleared & teams reset.');
    setTimeout(() => setSyncStatus(null), 6000);

    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminPassword: resetPassword,
          reason: resetReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback optimistic update if password was wrong
        setStats(prevStats);
        setCapacities(prevCapacities);
        setTeams(prevTeams);
        setIsResetModalOpen(true);
        setResetError(data.error || 'Master allocation reset failed');
        setIsResetting(false);
        return;
      }

      if (data.freshStats) setStats(data.freshStats);
      if (data.freshCapacities) setCapacities(data.freshCapacities);
      
      setResetPassword('');
      setResetReason('');
      setIsResetting(false);
      fetchDashboardData();
    } catch (err: any) {
      // Rollback on network error
      setStats(prevStats);
      setCapacities(prevCapacities);
      setTeams(prevTeams);
      setResetError('Network connection failure during reset.');
      setIsResetting(false);
    }
  };

  // Import Teams Action
  const handleImportTeams = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const lines = importCsvText.trim().split('\n');
      if (lines.length < 2) {
        setImportStatus('CSV must have a header line and at least 1 team row.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const parsedRows = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        if (values.length < 2) continue;
        const rowObj: any = {};
        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });
        parsedRows.push(rowObj);
      }

      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teams: parsedRows,
          overwriteExisting,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setImportStatus(data.error || 'Import failed.');
        return;
      }

      setImportStatus(`Success! Imported ${data.importedCount} teams.`);
      setTimeout(() => {
        setIsImportModalOpen(false);
        setImportStatus(null);
        setImportCsvText('');
        fetchDashboardData();
      }, 1500);
    } catch (err: any) {
      setImportStatus('Failed to parse and import CSV: ' + err.message);
    }
  };

  // Update Capacities Action
  const handleSaveCapacities = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updatePs: editableCapacities }),
      });
      if (res.ok) {
        setIsCapacityModalOpen(false);
        fetchDashboardData();
      }
    } catch (err) {
      alert('Failed to update capacities');
    }
  };

  // If Not Authenticated -> Show Admin Login Screen
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col justify-between">
        <Navbar userType="GUEST" />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md glass-panel-gold rounded-3xl p-8 border border-premium-gold/30 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-premium-gold/10 border border-premium-gold/30 text-premium-gold mx-auto flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black font-mono tracking-wider text-white uppercase">
                ADMIN COMMAND ACCESS
              </h2>
              <p className="text-xs text-text-muted font-mono">
                Official Organizers Portal • KERNEL PRIME'26
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-text-secondary">Username</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#090D14] border border-white/10 text-white font-mono text-sm focus:border-premium-gold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-text-secondary">Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-[#090D14] border border-white/10 text-white font-mono text-sm focus:border-premium-gold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-premium-gold to-premium-gold-bright text-background font-mono text-sm uppercase tracking-widest font-black shadow-glow-gold hover:shadow-glow-gold-lg transition-all"
              >
                {isLoggingIn ? 'AUTHENTICATING...' : 'ENTER COMMAND CENTER'}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // ==================== AUTHENTICATED COMMAND CENTER ====================
  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar userType="ADMIN" onLogout={handleAdminLogout} />

      {/* Test Mode Banner */}
      {stats?.testMode && (
        <div className="bg-amber-500/20 border-b border-amber-500/40 py-2 px-4 text-center text-xs font-mono text-amber-300 font-bold tracking-widest flex items-center justify-center gap-2">
          <AlertOctagon className="w-4 h-4 text-amber-400" />
          <span>TEST MODE ACTIVE — SIMULATED ENVIRONMENT (PRODUCTION ALLOCATIONS UNAFFECTED)</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Header & Global Action Strip */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono tracking-widest uppercase text-emerald-400 font-bold">
                Live Command Console • Realtime Sync Active
              </span>
            </div>
            <h1 className="text-3xl font-black font-mono text-white tracking-wider uppercase mt-1">
              ORGANIZER COMMAND CENTER
            </h1>
            <p className="text-xs font-mono text-text-secondary mt-1">
              S.A. Engineering College • <span className="text-electric-blue">{EVENT_CONFIG.eventName}</span>
            </p>
          </div>

          {/* Master Allocation Control Switches */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Switchers */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-white/10">
              <button
                onClick={() => handleSetAllocationStatus('OPEN')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  stats?.allocationStatus === 'OPEN'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>OPEN</span>
              </button>

              <button
                onClick={() => handleSetAllocationStatus('PAUSED')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  stats?.allocationStatus === 'PAUSED'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                <Pause className="w-3.5 h-3.5" />
                <span>PAUSE</span>
              </button>

              <button
                onClick={() => handleSetAllocationStatus('CLOSED')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  stats?.allocationStatus === 'CLOSED'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                <Square className="w-3.5 h-3.5" />
                <span>CLOSE</span>
              </button>
            </div>

            {/* Google Sheets Sync Button */}
            <button
              onClick={handleSyncSheets}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-highlight border border-white/10 text-xs font-mono text-text-secondary hover:text-white transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-electric-blue' : ''}`} />
              <span>SYNC SHEET</span>
            </button>

            {/* Export Dropdown / Button */}
            <a
              href="/api/admin/export?format=xlsx"
              download
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-highlight border border-white/10 text-xs font-mono text-premium-gold transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>EXPORT EXCEL</span>
            </a>

            {/* Audit Logs */}
            <button
              onClick={handleOpenAudit}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface hover:bg-surface-highlight border border-white/10 text-xs font-mono text-text-muted hover:text-white transition-all"
            >
              <History className="w-3.5 h-3.5" />
              <span>AUDIT</span>
            </button>

            {/* Manual Ribbon Cutting Toggle Button */}
            <button
              onClick={handleToggleRibbon}
              title={stats?.ribbonEnabled !== false ? 'Click to TURN OFF Ribbon Cutting (Direct Portal Access)' : 'Click to TURN ON Ribbon Cutting (Chief Guest Launch Ceremony)'}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                stats?.ribbonEnabled !== false
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/50 text-amber-300 shadow-[0_0_15px_rgba(244,180,0,0.25)] hover:bg-amber-500/30'
                  : 'bg-surface hover:bg-surface-highlight border border-white/10 text-text-muted hover:text-white'
              }`}
            >
              <Scissors className={`w-3.5 h-3.5 ${stats?.ribbonEnabled !== false ? 'text-amber-400' : 'text-text-muted'}`} />
              <span>{stats?.ribbonEnabled !== false ? 'RIBBON: ON (VIP LAUNCH)' : 'RIBBON: OFF (DISABLED)'}</span>
            </button>

            {/* Master System Reset Button (Password Protected) */}
            <button
              onClick={() => {
                playClickSound();
                setResetError(null);
                setResetPassword('');
                setResetReason('');
                setIsResetModalOpen(true);
              }}
              title="Emergency collision / master system allocation reset"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-mono text-red-400 hover:text-red-300 transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.15)]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET ALLOCATIONS</span>
            </button>
          </div>
        </div>

        {/* Sync Toast Message */}
        {syncStatus && (
          <div className="p-3 rounded-xl bg-electric-blue/10 border border-electric-blue/30 text-electric-blue text-xs font-mono flex items-center justify-between animate-fade-in">
            <span>{syncStatus}</span>
            <button onClick={() => setSyncStatus(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 1. SUMMARY KPI METRIC CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-text-muted uppercase">TOTAL TEAMS</span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white">
              {stats?.totalTeams ?? 20}
            </p>
            <span className="text-[10px] text-text-secondary font-mono">Software Track</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-electric-blue/30 space-y-1">
            <span className="text-[10px] font-mono text-electric-blue uppercase">ALLOCATED</span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-electric-blue">
              {stats?.allocatedTeams ?? 0}
            </p>
            <span className="text-[10px] text-text-secondary font-mono">
              {stats ? Math.round((stats.allocatedTeams / (stats.totalTeams || 1)) * 100) : 0}% Complete
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-amber-500/30 space-y-1">
            <span className="text-[10px] font-mono text-amber-400 uppercase">PENDING</span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
              {stats?.pendingTeams ?? 20}
            </p>
            <span className="text-[10px] text-text-secondary font-mono">Awaiting Spin</span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-text-muted uppercase">PROBLEM STATEMENTS</span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-premium-gold">
              {stats?.problemStatementsCount ?? 9}
            </p>
            <span className="text-[10px] text-text-secondary font-mono">
              Total Cap: {stats?.totalCapacity ?? 20}
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-emerald-500/30 space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 uppercase">DOWNLOADS COMPLETED</span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {stats?.distinctTeamsDownloaded ?? 0}
            </p>
            <span className="text-[10px] text-text-secondary font-mono">
              {stats?.totalDownloads ?? 0} total hits
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-text-muted uppercase">TEAMS ACTIVE</span>
            <p className="text-2xl sm:text-3xl font-black font-mono text-white">
              {stats?.teamsActive ?? 1}
            </p>
            <span className="text-[10px] text-text-secondary font-mono">Recent logins</span>
          </div>
        </div>

        {/* 2. PROBLEM STATEMENT CAPACITY PANEL */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div>
              <h3 className="text-base font-bold text-white uppercase font-mono tracking-wider">
                PROBLEM STATEMENT CAPACITY MONITOR
              </h3>
              <p className="text-xs text-text-muted">
                Dynamic capacity quotas. Full statements are automatically excluded from the server allocation pool.
              </p>
            </div>
            <button
              onClick={() => {
                setEditableCapacities(capacities.map((c) => ({ ...c })));
                setIsCapacityModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-highlight border border-white/10 text-xs font-mono text-text-secondary hover:text-white"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>CONFIGURE CAPACITIES</span>
            </button>
          </div>

          {/* Grid of 9 Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {capacities.map((ps) => {
              const isFull = ps.isFull;
              const isNearlyFull = !isFull && ps.remaining <= 1;

              return (
                <div
                  key={ps.code}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isFull
                      ? 'bg-surface/40 border-white/5 opacity-70'
                      : isNearlyFull
                      ? 'bg-surface border-premium-gold/30 shadow-glow-gold'
                      : 'bg-surface border-electric-blue/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-black text-white">
                      {ps.code}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isFull
                          ? 'bg-slate-700/60 text-slate-300'
                          : isNearlyFull
                          ? 'bg-premium-gold/20 text-premium-gold'
                          : 'bg-electric-blue/20 text-electric-blue'
                      }`}
                    >
                      {isFull ? 'FULL' : `${ps.remaining} REMAINING`}
                    </span>
                  </div>

                  <p className="text-xs text-text-secondary truncate font-medium mb-2" title={ps.title}>
                    {ps.title}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-surface-card overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, ps.fillPercentage)}%` }}
                      className={`h-full transition-all duration-500 ${
                        isFull
                          ? 'bg-slate-500'
                          : isNearlyFull
                          ? 'bg-premium-gold shadow-glow-gold'
                          : 'bg-electric-blue shadow-glow-blue'
                      }`}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-text-muted mt-1.5">
                    <span>{ps.allocatedCount} / {ps.capacity} Allocated</span>
                    <span>{ps.fillPercentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. LIVE TEAM ALLOCATION TABLE */}
        <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/[0.08]">
            <div>
              <h3 className="text-base font-bold text-white uppercase font-mono tracking-wider">
                LIVE TEAMS ALLOCATION TABLE
              </h3>
              <p className="text-xs text-text-muted">
                Showing {teams.length} software track registered teams. Click any team row to inspect full telemetry.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-highlight border border-white/10 text-xs font-mono text-text-secondary hover:text-white"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>IMPORT CSV</span>
              </button>
            </div>
          </div>

          {/* Search & Filters Filter-bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by team name, college, leader or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-white/10 text-white text-xs font-mono focus:border-electric-blue focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface border border-white/10 text-white text-xs font-mono focus:outline-none"
              >
                <option value="ALL">All Teams</option>
                <option value="ALLOCATED">Allocated</option>
                <option value="PENDING">Pending</option>
                <option value="DOWNLOADED">Downloaded</option>
                <option value="NOT_DOWNLOADED">Not Downloaded</option>
                <option value="PS-01">PS-01</option>
                <option value="PS-02">PS-02</option>
                <option value="PS-03">PS-03</option>
                <option value="PS-04">PS-04</option>
                <option value="PS-05">PS-05</option>
                <option value="PS-06">PS-06</option>
                <option value="PS-07">PS-07</option>
                <option value="PS-08">PS-08</option>
                <option value="PS-09">PS-09</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface border border-white/10 text-white text-xs font-mono focus:outline-none"
              >
                <option value="name">Sort: Team Name</option>
                <option value="college">Sort: College</option>
                <option value="allocationTime">Sort: Allocation Time</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#090D14] text-text-muted border-b border-white/5">
                <tr>
                  <th className="py-3 px-4">TEAM NAME</th>
                  <th className="py-3 px-4">COLLEGE</th>
                  <th className="py-3 px-4">LEADER &amp; MOBILE</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4">ALLOCATED PS</th>
                  <th className="py-3 px-4">ALLOCATION TIME</th>
                  <th className="py-3 px-4">DOWNLOAD</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-text-muted font-mono">
                      No matching team records found.
                    </td>
                  </tr>
                ) : (
                  teams.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => handleViewTeam(t.id)}
                      className="hover:bg-surface-highlight/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <span>{t.teamName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary truncate max-w-[180px]">
                        {t.collegeName}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium">{t.leaderName}</div>
                        <div className="text-[10px] text-text-muted">{t.leaderMobile}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {t.hasAllocated ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                            ALLOCATED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {t.allocatedPsId ? (
                          <span className="px-2.5 py-1 rounded bg-electric-blue/15 border border-electric-blue/30 text-electric-blue font-bold">
                            {t.allocatedPsId}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        {t.allocationTime ? (
                          <span>
                            {new Date(t.allocationTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {t.hasDownloaded ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t.downloadCount}x</span>
                          </span>
                        ) : (
                          <span className="text-text-muted">Pending</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewTeam(t.id);
                          }}
                          className="p-1 rounded bg-surface hover:bg-electric-blue hover:text-black transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* ========================================================
          DRAWER / MODAL: TEAM DETAIL TELEMETRY
          ======================================================== */}
      {selectedTeamId && teamDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel-glow w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-white/20 space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-mono text-electric-blue uppercase tracking-widest font-bold">
                  TEAM TELEMETRY AUDIT
                </span>
                <h3 className="text-2xl font-black font-mono text-white uppercase">
                  {teamDetail.team.teamName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTeamId(null)}
                className="p-2 rounded-xl bg-surface border border-white/10 text-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Team Metadata */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-surface border border-white/5 space-y-1">
                <span className="text-text-muted text-[10px]">COLLEGE</span>
                <p className="text-white font-semibold truncate">{teamDetail.team.collegeName}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-white/5 space-y-1">
                <span className="text-text-muted text-[10px]">LEADER</span>
                <p className="text-white font-semibold">{teamDetail.team.leaderName}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-white/5 space-y-1">
                <span className="text-text-muted text-[10px]">MOBILE / EMAIL</span>
                <p className="text-white truncate">{teamDetail.team.leaderMobile}</p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-white/5 space-y-1">
                <span className="text-text-muted text-[10px]">ALLOCATION STATUS</span>
                <p className="text-electric-blue font-bold">
                  {teamDetail.team.hasAllocated ? teamDetail.team.allocatedPsId : 'NOT ALLOCATED'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-white/5 space-y-1">
                <span className="text-text-muted text-[10px]">ALLOCATION TIME</span>
                <p className="text-white truncate">
                  {teamDetail.team.allocationTime || 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-white/5 space-y-1">
                <span className="text-text-muted text-[10px]">MEMBERS COUNT</span>
                <p className="text-white">{teamDetail.team.membersCount} Members</p>
              </div>
            </div>

            {/* Assigned PS Details if present */}
            {teamDetail.team.psTitle && (
              <div className="p-4 rounded-xl bg-surface border border-electric-blue/30 space-y-1">
                <span className="text-[10px] font-mono text-premium-gold font-bold">
                  ASSIGNED PROBLEM STATEMENT: {teamDetail.team.allocatedPsId}
                </span>
                <h4 className="text-sm font-bold text-white">{teamDetail.team.psTitle}</h4>
                <p className="text-xs text-text-secondary">{teamDetail.team.psDesc}</p>
              </div>
            )}

            {/* Login History */}
            <div className="space-y-2">
              <h5 className="text-xs font-mono uppercase tracking-wider text-text-muted">
                RECENT LOGIN SESSIONS ({teamDetail.loginHistory?.length || 0})
              </h5>
              <div className="max-h-28 overflow-y-auto rounded-xl bg-surface/60 p-2 text-[11px] font-mono divide-y divide-white/5">
                {teamDetail.loginHistory?.length > 0 ? (
                  teamDetail.loginHistory.map((lh: any) => (
                    <div key={lh.id} className="py-1 flex justify-between">
                      <span className="text-text-secondary">{lh.login_time}</span>
                      <span className="text-emerald-400">SUCCESS</span>
                    </div>
                  ))
                ) : (
                  <p className="text-text-muted py-1">No recorded logins yet.</p>
                )}
              </div>
            </div>

            {/* Download Telemetry */}
            <div className="space-y-2">
              <h5 className="text-xs font-mono uppercase tracking-wider text-text-muted">
                PDF DOWNLOAD HISTORY ({teamDetail.downloadHistory?.length || 0})
              </h5>
              <div className="max-h-24 overflow-y-auto rounded-xl bg-surface/60 p-2 text-[11px] font-mono divide-y divide-white/5">
                {teamDetail.downloadHistory?.length > 0 ? (
                  teamDetail.downloadHistory.map((dh: any) => (
                    <div key={dh.id} className="py-1 flex justify-between">
                      <span className="text-text-secondary">{dh.downloaded_at}</span>
                      <span className="text-electric-blue">PDF DOWNLOADED</span>
                    </div>
                  ))
                ) : (
                  <p className="text-text-muted py-1">Not downloaded yet.</p>
                )}
              </div>
            </div>

            {/* Emergency Reallocation Button (Super Admin) */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-text-muted font-mono">
                Super Admin Emergency Override:
              </span>
              <button
                onClick={() => setIsReallocateModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono hover:bg-red-500/20 transition-all"
              >
                EMERGENCY REALLOCATE
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EMERGENCY REALLOCATION (SUPER ADMIN ONLY)
          ======================================================== */}
      {isReallocateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel-gold w-full max-w-md rounded-3xl p-6 sm:p-8 border border-red-500/40 space-y-5">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h4 className="text-base font-bold font-mono uppercase">
                  SUPER ADMIN REALLOCATION
                </h4>
                <p className="text-[11px] text-text-muted">
                  Requires audit justification &amp; password confirmation.
                </p>
              </div>
            </div>

            {reallocateError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono">
                {reallocateError}
              </div>
            )}

            <form onSubmit={handleExecuteReallocation} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-text-secondary">TARGET TEAM</label>
                <input
                  type="text"
                  disabled
                  value={teamDetail?.team?.teamName || ''}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-white opacity-70"
                />
              </div>

              <div className="space-y-1">
                <label className="text-text-secondary">NEW PROBLEM STATEMENT</label>
                <select
                  value={reallocatePsId}
                  onChange={(e) => setReallocatePsId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-white"
                >
                  {capacities.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.title.substring(0, 35)}...
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-text-secondary">REASON FOR REALLOCATION (MANDATORY)</label>
                <textarea
                  required
                  rows={2}
                  value={reallocateReason}
                  onChange={(e) => setReallocateReason(e.target.value)}
                  placeholder="Official justification for audit trail..."
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-text-secondary">CONFIRM ADMIN PASSWORD</label>
                <input
                  type="password"
                  required
                  value={reallocatePassword}
                  onChange={(e) => setReallocatePassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-white/10 text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReallocateModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface border border-white/10 text-text-muted hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isReallocating}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  {isReallocating ? 'COMMITTING...' : 'CONFIRM REALLOCATION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CONFIGURE PROBLEM STATEMENT CAPACITIES
          ======================================================== */}
      {isCapacityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-white/20 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold font-mono uppercase text-white">
                CONFIGURE PROBLEM STATEMENT CAPACITIES
              </h3>
              <button
                onClick={() => setIsCapacityModalOpen(false)}
                className="p-1.5 rounded-lg bg-surface text-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {editableCapacities.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-surface border border-white/5 flex items-center justify-between gap-4 text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-electric-blue w-14">{item.code}</span>
                    <span className="text-white truncate max-w-xs">{item.title}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <label className="text-text-muted">Capacity:</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={item.capacity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        const copy = [...editableCapacities];
                        copy[idx].capacity = val;
                        setEditableCapacities(copy);
                      }}
                      className="w-16 px-2 py-1 rounded bg-[#090D14] border border-white/10 text-white text-center"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-xs font-mono text-text-muted">
                Total Allocated Capacity: {editableCapacities.reduce((s, c) => s + Number(c.capacity || 0), 0)} Teams
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCapacityModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface text-xs font-mono text-text-muted hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleSaveCapacities}
                  className="px-4 py-2 rounded-lg bg-electric-blue text-black font-mono font-bold text-xs"
                >
                  SAVE CAPACITIES
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: IMPORT TEAMS CSV
          ======================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel w-full max-w-xl rounded-3xl p-6 sm:p-8 border border-white/20 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-lg font-bold font-mono uppercase text-white">
                BATCH IMPORT SOFTWARE TEAMS
              </h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1.5 rounded-lg bg-surface text-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed font-mono">
              Expected CSV columns: <br />
              <code className="text-electric-blue">
                Team Name, College, Team Leader, Mobile, Email, Members Count, Payment Status
              </code>
            </p>

            {importStatus && (
              <div className="p-3 rounded-xl bg-electric-blue/10 border border-electric-blue/30 text-electric-blue text-xs font-mono">
                {importStatus}
              </div>
            )}

            <form onSubmit={handleImportTeams} className="space-y-4">
              <textarea
                rows={7}
                required
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
                placeholder={`Team Name, College, Team Leader, Mobile, Email, Members Count, Payment Status\nTEAM MATRIX, SA Engineering College, Arun V, 9876543221, arun@saec.ac.in, 4, PAID\nTEAM NEXUS, IIT Madras, Priya K, 9876543222, priya@iitm.ac.in, 4, PAID`}
                className="w-full p-3 rounded-xl bg-[#080B10] border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-electric-blue"
              />

              <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
                <input
                  type="checkbox"
                  id="overwrite"
                  checked={overwriteExisting}
                  onChange={(e) => setOverwriteExisting(e.target.checked)}
                  className="rounded border-white/10 bg-surface"
                />
                <label htmlFor="overwrite" className="cursor-pointer">
                  Overwrite all existing teams &amp; reset allocations
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface text-xs font-mono text-text-muted hover:text-white"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-electric-blue text-black font-mono font-bold text-xs"
                >
                  PROCESS IMPORT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: IMMUTABLE AUDIT LOG VIEWER
          ======================================================== */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="glass-panel w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border border-white/20 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-premium-gold" />
                <h3 className="text-lg font-bold font-mono uppercase text-white">
                  IMMUTABLE AUDIT LOG (LAST 100 EVENTS)
                </h3>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 rounded-lg bg-surface text-text-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-white/5 text-xs font-mono">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-electric-blue font-bold">{log.action}</span>
                      <span className="text-[10px] text-text-muted">
                        by {log.actor_type}:{log.actor_id}
                      </span>
                    </div>
                    {log.metadata && (
                      <p className="text-[11px] text-text-secondary truncate max-w-lg">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
                  </div>
                  <span className="text-text-muted text-[11px] shrink-0">
                    {log.created_at}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ========================================================
          MODAL: MASTER ALLOCATION SYSTEM RESET (PASSWORD PROTECTED)
          ======================================================== */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 border border-red-500/50 space-y-5 shadow-[0_0_50px_rgba(239,68,68,0.3)]">
            <div className="flex items-center gap-3 text-red-400 pb-3 border-b border-white/10">
              <AlertTriangle className="w-7 h-7 text-red-500 shrink-0 animate-pulse" />
              <div>
                <h4 className="text-base font-bold font-mono uppercase text-white">
                  MASTER ALLOCATION RESET
                </h4>
                <p className="text-[11px] text-text-muted">
                  Emergency collision clearance &amp; state reset.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-mono space-y-1.5 leading-relaxed">
              <p className="font-bold text-red-400 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                CRITICAL ADMINISTRATIVE ACTION
              </p>
              <p className="text-[11px] text-text-secondary">
                This will wipe all current allocations, reset all 20 teams to unallocated status, restore full problem statement capacities, and clear download counters.
              </p>
            </div>

            {resetError && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-mono">
                {resetError}
              </div>
            )}

            <form onSubmit={handleExecuteReset} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-text-secondary">REASON / COLLISION NOTE (OPTIONAL)</label>
                <input
                  type="text"
                  value={resetReason}
                  onChange={(e) => setResetReason(e.target.value)}
                  placeholder="e.g. Collision resolution / Live re-spin test"
                  className="w-full px-3 py-2.5 rounded-lg bg-surface border border-white/10 text-white focus:outline-none focus:border-red-500 placeholder:text-text-muted text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-text-secondary font-bold text-red-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    CONFIRM ADMIN PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => setResetPassword('Admin@KernelPrime2026')}
                    className="text-[10px] text-electric-blue hover:underline font-mono"
                  >
                    Quick-Fill
                  </button>
                </div>
                <input
                  type="password"
                  required
                  autoFocus
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full px-3 py-2.5 rounded-lg bg-surface border border-red-500/40 text-white focus:outline-none focus:border-red-500 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg bg-surface border border-white/10 text-text-muted hover:text-white transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isResetting || !resetPassword}
                  className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                  <span>{isResetting ? 'RESETTING...' : 'CONFIRM MASTER RESET'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border-subtle py-4 px-6 text-center text-xs text-text-muted font-mono">
        <p>
          Organizers Console • {EVENT_CONFIG.eventName} • {EVENT_CONFIG.institution.collegeName}
        </p>
      </footer>
    </div>
  );
}
