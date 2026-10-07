'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Volume2, VolumeX, Menu, X, ArrowRight, Shield } from 'lucide-react';
import { isAudioMuted, setAudioMuted, playClickSound } from '@/lib/audio';
import { ASSETS_CONFIG } from '@/lib/assets-config';

export const LandingNavbar: React.FC = () => {
  const [muted, setMuted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMuted(isAudioMuted());

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
    if (!next) playClickSound();
  };

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'About', href: '#about' },
    { label: 'Timeline', href: '#timeline' },
    { label: 'Tracks', href: '#tracks' },
    { label: 'Sponsors', href: '#sponsors' },
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? 'bg-[#050505]/90 backdrop-blur-2xl border-b border-white/10 shadow-2xl'
          : 'bg-[#050505]/40 backdrop-blur-md border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Left Branding Group: College Logo + Event Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="#hero" className="flex items-center gap-2.5 sm:gap-3 group">
            {/* S.A. Engineering College Crest (Transparent) */}
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 shrink-0 drop-shadow-[0_0_10px_rgba(0,200,255,0.3)] transition-transform duration-300 group-hover:scale-105">
              <Image
                src={ASSETS_CONFIG.collegeLogo}
                alt="S.A. Engineering College Emblem"
                fill
                priority
                className="object-contain"
              />
            </div>

            {/* ECE & VLSI + Kernel Prime Logo */}
            <div className="relative h-9 w-32 sm:h-11 sm:w-44 transition-transform duration-300 group-hover:scale-[1.02]">
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

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-xs lg:text-sm font-mono tracking-wider">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => playClickSound()}
              className="text-text-secondary hover:text-white transition-colors duration-200 hover:drop-shadow-[0_0_8px_rgba(0,200,255,0.6)] uppercase font-semibold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTA & Controls */}
        <div className="flex items-center gap-3">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
            title={muted ? 'Audio Muted' : 'Audio Enabled'}
            className="p-2.5 rounded-xl bg-surface/80 border border-white/10 text-text-secondary hover:text-white hover:border-electric-blue/40 transition-all shadow-sm"
          >
            {muted ? <VolumeX className="w-4 h-4 text-text-muted" /> : <Volume2 className="w-4 h-4 text-electric-blue" />}
          </button>

          {/* Team Portal Login CTA */}
          <a
            href="#portal-login"
            onClick={() => playClickSound()}
            className="hidden sm:inline-flex items-center gap-2 py-2.5 px-5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase bg-gradient-to-r from-electric-blue to-cyan-400 text-background shadow-glow-blue hover:shadow-glow-blue-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Shield className="w-4 h-4" />
            <span>PORTAL LOGIN</span>
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => {
              playClickSound();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="p-2.5 rounded-xl bg-surface/80 border border-white/10 text-text-secondary hover:text-white md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#090D14]/98 backdrop-blur-2xl border-b border-white/10 px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-3 font-mono text-sm">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => {
                  playClickSound();
                  setMobileMenuOpen(false);
                }}
                className="py-2 text-text-secondary hover:text-electric-blue transition-colors uppercase font-bold"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="pt-4 border-t border-white/10">
            <a
              href="#portal-login"
              onClick={() => {
                playClickSound();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 px-4 rounded-xl text-xs font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 bg-electric-blue text-background shadow-glow-blue"
            >
              <span>ACCESS ALLOCATION PORTAL</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
