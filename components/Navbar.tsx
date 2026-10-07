'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Volume2, VolumeX, Shield, LogOut, Cpu, Radio } from 'lucide-react';
import { isAudioMuted, setAudioMuted, playClickSound } from '@/lib/audio';
import { EVENT_CONFIG } from '@/lib/event-config';
import { ASSETS_CONFIG } from '@/lib/assets-config';

interface NavbarProps {
  userType?: 'TEAM' | 'ADMIN' | 'GUEST';
  teamName?: string;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ userType = 'GUEST', teamName, onLogout }) => {
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-background/85 backdrop-blur-xl">

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Identity with Original Logos */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3 group">
            {/* College Official Emblem */}
            <div className="relative h-12 w-12 shrink-0 drop-shadow">
              <Image
                src={ASSETS_CONFIG.collegeLogo}
                alt="S.A. Engineering College Emblem"
                fill
                priority
                className="object-contain"
              />
            </div>

            {/* Event Logo */}
            <div className="relative h-12 w-44 sm:w-52 transition-transform duration-300 group-hover:scale-[1.02]">
              <Image
                src={ASSETS_CONFIG.kernelPrimeLogo}
                alt="Kernel Prime '26 Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
          </Link>
        </div>

        {/* Right Controls & Session */}
        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            title={muted ? 'Audio Muted (Click to Unmute)' : 'Audio Enabled (Click to Mute)'}
            className="p-2 rounded-lg bg-surface border border-white/10 text-text-secondary hover:text-white hover:border-electric-blue/40 transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4 text-text-muted" /> : <Volume2 className="w-4 h-4 text-electric-blue" />}
          </button>

          {/* User Badge or Admin Link */}
          {userType === 'TEAM' && teamName && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-mono uppercase text-electric-blue font-bold tracking-wider">
                  {teamName}
                </span>
                <span className="text-[10px] text-text-muted">TEAM LEADER PORTAL</span>
              </div>
              <button
                onClick={onLogout}
                title="Log Out"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all font-mono"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">LOGOUT</span>
              </button>
            </div>
          )}

          {userType === 'ADMIN' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-premium-gold/10 border border-premium-gold/30 text-premium-gold text-xs font-mono font-semibold">
                <Shield className="w-3.5 h-3.5" />
                <span>COMMAND CENTER</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Admin Log Out"
                  className="p-2 rounded-lg bg-surface border border-white/10 text-text-muted hover:text-red-400 hover:border-red-500/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {userType === 'GUEST' && (
            <div className="flex items-center gap-2">
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-surface hover:bg-surface-highlight border border-white/10 text-text-muted hover:text-text-secondary transition-all font-mono"
              >
                <Shield className="w-3 h-3 text-premium-gold" />
                <span>ADMIN</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
