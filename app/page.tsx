'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { EVENT_CONFIG } from '@/lib/event-config';
import { ASSETS_CONFIG } from '@/lib/assets-config';
import { RibbonInauguration } from '@/components/RibbonInauguration';
import { playClickSound, playSuccessSound, playErrorSound, isAudioMuted, setAudioMuted } from '@/lib/audio';
import {
  Shield,
  KeyRound,
  Users,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  Radio,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'TEAM' | 'ADMIN'>('TEAM');
  
  // Team Login Fields
  const [teamNameInput, setTeamNameInput] = useState('');
  const [mobileInput, setMobileInput] = useState('');
  
  // Admin Login Fields
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isAudioMuted());
  }, []);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
    if (!next) playClickSound();
  };

  const [ribbonEnabled, setRibbonEnabled] = useState(false);

  // Check existing session and ribbon inauguration setting on mount
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            router.push('/dashboard');
            return;
          }
        }
      } catch (e) {
        // Not authenticated
      }

      // Check if Ribbon Cutting is enabled in Admin settings (strictly uncached)
      try {
        const statusRes = await fetch(`/api/allocation/status?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setRibbonEnabled(statusData.ribbonEnabled === true);
        }
      } catch (e) {
        setRibbonEnabled(false);
      }
    }
    checkExistingSession();
  }, [router]);

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Display in uppercase as requested in prompt
    setTeamNameInput(e.target.value.toUpperCase());
  };

  const handleTeamLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!teamNameInput.trim() || !mobileInput.trim()) {
      setErrorMessage('Please enter both Team Name and Team Leader Mobile Number.');
      playErrorSound();
      return;
    }

    setIsLoading(true);
    playClickSound();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: teamNameInput.trim(),
          mobile: mobileInput.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid Team Name or Team Leader Mobile Number.');
        setIsLoading(false);
        playErrorSound();
        return;
      }

      // Success -> Route to team dashboard
      playSuccessSound();
      router.push('/dashboard');
    } catch (err) {
      setErrorMessage('Network connection failure. Please retry.');
      setIsLoading(false);
      playErrorSound();
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!adminUsername.trim() || !adminPassword.trim()) {
      setErrorMessage('Please enter Admin Username and Password.');
      playErrorSound();
      return;
    }

    setIsLoading(true);
    playClickSound();

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername.trim(),
          password: adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Invalid administrative credentials.');
        setIsLoading(false);
        playErrorSound();
        return;
      }

      // Success -> Route to admin command center
      playSuccessSound();
      router.push('/admin');
    } catch (err) {
      setErrorMessage('Network connection failure. Please retry.');
      setIsLoading(false);
      playErrorSound();
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between relative bg-background cyber-grid-bg selection:bg-electric-blue selection:text-black">
      
      {/* Official Launch Ceremony Ribbon Cutting Overlay (Only active when enabled by Admin for Chief Guest) */}
      {ribbonEnabled && <RibbonInauguration />}

      {/* Floating Audio Control in Corner */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <button
          onClick={toggleSound}
          aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
          title={muted ? 'Audio Muted' : 'Audio Enabled'}
          className="p-3 rounded-full bg-[#0D1117]/80 backdrop-blur-md border border-white/10 text-text-secondary hover:text-white hover:border-electric-blue/50 transition-all shadow-lg cursor-pointer"
        >
          {muted ? <VolumeX className="w-5 h-5 text-text-muted" /> : <Volume2 className="w-5 h-5 text-electric-blue" />}
        </button>
      </div>

      {/* Main Authentication Arena */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 relative z-10">
        <div className="w-full max-w-4xl mx-auto space-y-8">
          
          {/* Top Institutional Branding Header - Grand High-Resolution Presentation */}
          <div className="text-center space-y-6 py-4">
            
            {/* 1. College Crest (Top Center - Transparent without black box) */}
            <div className="flex justify-center">
              <div className="relative h-28 w-28 sm:h-36 sm:w-36 md:h-44 md:w-44 drop-shadow-[0_10px_35px_rgba(0,200,255,0.45)] transition-transform duration-300 hover:scale-105">
                <Image
                  src={ASSETS_CONFIG.collegeLogo}
                  alt="S.A. Engineering College Crest"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
            </div>

            {/* 2. College Name + AUTONOMOUS Red Pill Badge */}
            <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-widest text-white uppercase font-mono drop-shadow-md">
                {EVENT_CONFIG.institution.collegeName}
              </h1>
              <span className="px-4 py-1 rounded-full bg-[#E50914] text-white text-xs sm:text-sm md:text-base font-black uppercase tracking-wider font-mono shadow-lg shadow-red-900/40">
                AUTONOMOUS
              </span>
            </div>

            {/* 3. Institute Level Research Centre & Accreditation Text */}
            <div className="space-y-1 text-sm sm:text-base md:text-lg text-text-secondary max-w-3xl mx-auto font-medium leading-relaxed">
              <p>
                Institute Level Research Centre • Affiliated to Anna University, Chennai • Accredited by NAAC ‘A’ Grade, NBA &amp;
              </p>
              <p className="font-bold text-white text-base sm:text-lg md:text-xl">
                ISO 9001:2015 Certified
              </p>
            </div>

            {/* 4. Three Accreditation Badges Row (28 Yrs, NAAC 'A', NBA) */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 pt-2">
              <div className="h-12 w-20 sm:h-16 sm:w-28 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center p-2 relative shadow-sm border border-white/5">
                <Image
                  src={ASSETS_CONFIG.years28Badge}
                  alt="28 Years of Excellence"
                  fill
                  className="object-contain p-1"
                />
              </div>

              <div className="h-12 w-20 sm:h-16 sm:w-28 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center p-2 relative shadow-sm border border-white/5">
                <Image
                  src={ASSETS_CONFIG.naacLogo}
                  alt="NAAC 'A' Grade"
                  fill
                  className="object-contain p-1"
                />
              </div>

              <div className="h-12 w-20 sm:h-16 sm:w-28 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center p-2 relative shadow-sm border border-white/5">
                <Image
                  src={ASSETS_CONFIG.nbaLogo}
                  alt="NBA"
                  fill
                  className="object-contain p-1"
                />
              </div>
            </div>

            {/* 5. Department Details */}
            <div className="pt-3 text-xs sm:text-sm md:text-base text-text-secondary space-y-1 font-medium max-w-2xl mx-auto">
              <p className="text-white font-semibold tracking-wide">Department of Electronics &amp; Communication Engineering</p>
              <p className="text-premium-gold font-bold text-xs sm:text-sm">&amp;</p>
              <p className="text-white font-semibold tracking-wide">Department of Electronics Engineering (VLSI Design &amp; Technology)</p>
            </div>

            {/* 6. Event Logo (Kernel Prime '26 - The Core of Innovation) */}
            <div className="pt-6 space-y-4">
              <div className="relative h-36 sm:h-52 md:h-64 lg:h-72 w-full max-w-2xl mx-auto filter drop-shadow-[0_0_35px_rgba(0,200,255,0.5)] transition-transform duration-300 hover:scale-[1.03]">
                <Image
                  src={ASSETS_CONFIG.kernelPrimeLogo}
                  alt="Kernel Prime '26 - The Core of Innovation Official Logo"
                  fill
                  priority
                  className="object-contain"
                />
              </div>

              {/* 7. Portal Subtitle */}
              <div className="pt-1">
                <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-mono tracking-widest text-electric-blue uppercase font-black drop-shadow-[0_0_15px_rgba(0,200,255,0.6)]">
                  SOFTWARE PROBLEM STATEMENT ALLOCATION PORTAL
                </p>
              </div>

              {/* 8. Event Date Badge */}
              <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-surface/90 border border-white/10 text-xs sm:text-sm md:text-base font-mono text-premium-gold font-medium shadow-md">
                <Radio className="w-4 h-4 text-electric-blue animate-pulse" />
                <span className="font-bold">{EVENT_CONFIG.eventDate}</span>
                <span className="text-white/30">•</span>
                <span className="text-text-secondary">National Level 24-Hour Hackathon</span>
              </div>
            </div>
          </div>

          {/* Authentication Container - Centered and Sleek */}
          <div className="max-w-lg mx-auto w-full">
            <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
              
              {/* Subtle Mode Switcher Tabs */}
              <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 p-1 rounded-xl bg-surface border border-white/10 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setActiveTab('TEAM');
                      setErrorMessage(null);
                    }}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                      activeTab === 'TEAM'
                        ? 'bg-electric-blue text-background shadow-glow-blue'
                        : 'text-text-secondary hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>TEAM LOGIN</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      playClickSound();
                      setActiveTab('ADMIN');
                      setErrorMessage(null);
                    }}
                    className={`py-2.5 px-4 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 ${
                      activeTab === 'ADMIN'
                        ? 'bg-premium-gold text-background shadow-glow-gold'
                        : 'text-text-secondary hover:text-white'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>ADMIN LOGIN</span>
                  </button>
                </div>
              </div>

              {/* Error Message Alert */}
              {errorMessage && (
                <div className="mt-6 p-4 rounded-xl bg-red-950/70 border border-red-500/30 text-red-200 text-xs font-mono flex items-start gap-3 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-red-300">Authentication Warning</p>
                    <p className="mt-0.5 text-red-200/90">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* TEAM LOGIN FORM */}
              {activeTab === 'TEAM' && (
                <form onSubmit={handleTeamLogin} className="mt-6 space-y-5">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-2">
                      Registered Team Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={teamNameInput}
                        onChange={handleTeamNameChange}
                        placeholder="E.G. ZEYPHER"
                        className="w-full bg-surface/90 border border-white/10 focus:border-electric-blue rounded-xl py-3.5 pl-4 pr-10 text-white font-mono placeholder:text-text-muted text-sm tracking-wide focus:outline-none focus:ring-1 focus:ring-electric-blue transition-all"
                      />
                      <Users className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-2">
                      Team Leader Mobile Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={mobileInput}
                        onChange={(e) => setMobileInput(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full bg-surface/90 border border-white/10 focus:border-electric-blue rounded-xl py-3.5 pl-4 pr-10 text-white font-mono placeholder:text-text-muted text-sm tracking-wide focus:outline-none focus:ring-1 focus:ring-electric-blue transition-all"
                      />
                      <KeyRound className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-text-muted font-mono mt-1.5">
                      * Authenticated securely via one-way encrypted bcrypt verification.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 px-6 rounded-xl font-mono text-sm tracking-widest uppercase font-black flex items-center justify-center gap-2 bg-gradient-to-r from-electric-blue to-cyan-400 text-background shadow-glow-blue hover:shadow-glow-blue-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>AUTHENTICATING TEAM...</span>
                        </>
                      ) : (
                        <>
                          <span>ENTER ALLOCATION ARENA</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* ADMIN LOGIN FORM */}
              {activeTab === 'ADMIN' && (
                <form onSubmit={handleAdminLogin} className="mt-6 space-y-5">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-2">
                      Admin Username
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="admin"
                        className="w-full bg-surface/90 border border-white/10 focus:border-premium-gold rounded-xl py-3.5 pl-4 pr-10 text-white font-mono placeholder:text-text-muted text-sm tracking-wide focus:outline-none focus:ring-1 focus:ring-premium-gold transition-all"
                      />
                      <Shield className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-text-secondary mb-2">
                      Admin Master Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••••••••••"
                        className="w-full bg-surface/90 border border-white/10 focus:border-premium-gold rounded-xl py-3.5 pl-4 pr-10 text-white font-mono placeholder:text-text-muted text-sm tracking-wide focus:outline-none focus:ring-1 focus:ring-premium-gold transition-all"
                      />
                      <Lock className="w-4 h-4 text-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 px-6 rounded-xl font-mono text-sm tracking-widest uppercase font-black flex items-center justify-center gap-2 bg-gradient-to-r from-premium-gold to-yellow-500 text-background shadow-glow-gold hover:shadow-glow-gold-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>AUTHENTICATING COMMAND...</span>
                        </>
                      ) : (
                        <>
                          <span>ACCESS COMMAND DASHBOARD</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>

          {/* Quick Helper Hint (Subtle) */}
          <div className="text-center">
            <p className="text-[11px] font-mono text-text-muted">
              Official Portal for 20 Registered Software Teams (e.g., <code className="text-electric-blue">ZEYPHER</code> / Mobile: <code className="text-text-secondary">8056264662</code>)
            </p>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle py-4 px-6 text-center text-xs text-text-muted font-mono flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <p>
          © 2026 S.A. Engineering College • {EVENT_CONFIG.eventName} • {EVENT_CONFIG.eventTagline}
        </p>
        {ribbonEnabled && (
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('kp26_inaugurated_v1');
              window.location.reload();
            }}
            className="text-[11px] text-text-muted hover:text-premium-gold transition-colors flex items-center gap-1 cursor-pointer"
            title="Replay Official Launch Ceremony"
          >
            <span>✂️ Replay Launch Ceremony</span>
          </button>
        )}
      </footer>
    </div>
  );
}
