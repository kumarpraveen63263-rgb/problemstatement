'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { TeamDetailsCard } from '@/components/TeamDetailsCard';
import { AllocationNotice } from '@/components/AllocationNotice';
import { SpinWheel, ProblemStatementSummary } from '@/components/SpinWheel';
import { AllocationResult } from '@/components/AllocationResult';
import { Loader2, Radio, Lock, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [team, setTeam] = useState<any>(null);
  const [allocatedPs, setAllocatedPs] = useState<any>(null);
  const [downloadInfo, setDownloadInfo] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<'OPEN' | 'CLOSED' | 'PAUSED'>('OPEN');
  const [problemStatements, setProblemStatements] = useState<ProblemStatementSummary[]>([]);
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false);

  // Fetch session and allocation state
  const loadDashboardData = useCallback(async () => {
    try {
      const [sessionRes, statusRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/allocation/status'),
      ]);

      if (!sessionRes.ok) {
        router.push('/');
        return;
      }

      const sessionData = await sessionRes.json();
      if (!sessionData.authenticated || !sessionData.team) {
        router.push('/');
        return;
      }

      setTeam(sessionData.team);
      setAllocatedPs(sessionData.allocatedPs);
      setDownloadInfo(sessionData.downloadInfo);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSystemStatus(statusData.allocationStatus || 'OPEN');
        setProblemStatements(statusData.problemStatements || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    router.push('/');
  };

  // Called when user clicks "START ALLOCATION SPIN"
  // Contacts backend to perform server-side atomic allocation
  const handleSpinStart = async () => {
    try {
      const res = await fetch('/api/allocation/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: 'Network communication failure. Please retry.' };
    }
  };

  // Called once wheel animation finishes decelerating and lands
  const handleSpinComplete = (assigned: any) => {
    setAllocatedPs(assigned);
    setTeam((prev: any) => ({
      ...prev,
      hasAllocated: true,
      allocatedPsId: assigned.id,
      allocationTime: new Date().toISOString(),
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-electric-blue font-mono">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="mt-4 text-xs tracking-widest text-text-muted uppercase">
          Initializing Secure Hackathon Session...
        </p>
      </div>
    );
  }

  if (!team) return null;

  const isAllocated = team.hasAllocated && allocatedPs;

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Navbar userType="TEAM" teamName={team.teamName} onLogout={handleLogout} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-widest uppercase text-text-muted">
                Welcome,
              </span>
              <span className="text-xs font-mono tracking-widest uppercase text-electric-blue font-bold">
                {team.leaderName}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black font-mono text-white tracking-wider uppercase mt-1">
              {team.teamName}
            </h1>
            <p className="text-xs font-mono text-text-secondary mt-1">
              Software Track • <span className="text-premium-gold">KERNEL PRIME'26</span>
            </p>
          </div>

          {/* Allocation State Tag */}
          <div>
            {isAllocated ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>ALLOCATION STATUS: ASSIGNED ({allocatedPs.code})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-electric-blue/10 border border-electric-blue/30 text-electric-blue font-mono text-xs font-bold animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                <span>READY FOR PROBLEM STATEMENT ALLOCATION</span>
              </div>
            )}
          </div>
        </div>

        {/* Global Notice if Paused or Closed */}
        {systemStatus === 'PAUSED' && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-mono flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>
              <strong>NOTICE:</strong> The allocation system is currently paused by administrators for system maintenance. Please stand by.
            </span>
          </div>
        )}

        {/* Team Details Telemetry Card */}
        <TeamDetailsCard team={team} />

        {/* ========================================================
            STATE 1: NOT ALLOCATED -> SHOW NOTICE & SPIN WHEEL
            ======================================================== */}
        {!isAllocated && (
          <div className="space-y-8 pt-4">
            {/* Allocation Notice with Mandatory Checkbox */}
            <AllocationNotice
              hasAccepted={hasAcceptedRules}
              onToggleAccept={setHasAcceptedRules}
            />

            {/* Spin Wheel Arena */}
            <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 flex flex-col items-center">
              <div className="text-center space-y-1 mb-8">
                <span className="text-[11px] font-mono tracking-widest uppercase text-electric-blue font-bold">
                  Digital Allocation Wheel
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  Spin to Secure Your Problem Statement
                </h3>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  Fair, cryptographically secure server-side allocation across available problem statements with remaining capacity.
                </p>
              </div>

              <SpinWheel
                statements={problemStatements}
                isLocked={!hasAcceptedRules}
                allocationStatus={systemStatus}
                onSpinStart={handleSpinStart}
                onSpinComplete={handleSpinComplete}
              />
            </div>
          </div>
        )}

        {/* ========================================================
            STATE 2: ALREADY ALLOCATED -> SHOW FINAL RESULT CARD
            DO NOT SHOW THE WHEEL AGAIN!
            ======================================================== */}
        {isAllocated && (
          <div className="pt-4">
            <AllocationResult
              teamName={team.teamName}
              assignedPs={allocatedPs}
              allocatedAt={team.allocationTime || new Date().toISOString()}
              initialDownloadCount={downloadInfo?.count || 0}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-6 px-6 text-center text-xs text-text-muted font-mono">
        <p>
          © 2026 S.A. Engineering College • KERNEL PRIME'26 • All allocations permanently recorded and audited.
        </p>
      </footer>
    </div>
  );
}
