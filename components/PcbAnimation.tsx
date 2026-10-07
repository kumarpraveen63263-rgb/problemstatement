'use client';

import React from 'react';
import { Cpu, Zap, Radio, Shield, Sparkles, Terminal } from 'lucide-react';

export const PcbAnimation: React.FC = () => {
  return (
    <div className="relative w-full aspect-square max-w-md mx-auto p-4 flex items-center justify-center">
      {/* Outer Glow Pulse */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-electric-blue/15 via-transparent to-premium-gold/15 blur-2xl animate-pulse" />

      {/* Main PCB Motherboard Layer */}
      <div className="relative w-full h-full rounded-3xl bg-[#090D14]/90 border border-electric-blue/30 p-6 flex flex-col items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(0,200,255,0.15)]">
        
        {/* PCB Trace Grid Pattern Background */}
        <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="pcb-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 200, 255, 0.2)" strokeWidth="0.8" />
              <circle cx="0" cy="0" r="1.5" fill="#00C8FF" />
              <circle cx="40" cy="40" r="1.5" fill="#F4B400" />
            </pattern>
            <linearGradient id="trace-glow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00C8FF" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#F4B400" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00C8FF" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#pcb-grid)" />

          {/* Animated Circuit Pulses */}
          <path
            d="M 20 50 L 80 50 L 120 90 L 220 90 L 260 130"
            fill="none"
            stroke="url(#trace-glow)"
            strokeWidth="2"
            strokeDasharray="8 6"
            className="animate-pulse"
          />
          <path
            d="M 380 350 L 320 350 L 280 310 L 180 310 L 140 270"
            fill="none"
            stroke="url(#trace-glow)"
            strokeWidth="2"
            strokeDasharray="8 6"
            className="animate-pulse"
          />
          <path
            d="M 50 350 L 110 350 L 150 300 L 150 180"
            fill="none"
            stroke="#00C8FF"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <path
            d="M 350 50 L 290 50 L 250 100 L 250 200"
            fill="none"
            stroke="#F4B400"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Floating Semiconductor Corner Nodes */}
        <div className="absolute top-4 left-4 p-2 rounded-lg bg-surface/80 border border-electric-blue/40 text-[10px] font-mono text-electric-blue flex items-center gap-1.5 shadow-glow-blue">
          <span className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-ping" />
          <span>VLSI CORE</span>
        </div>

        <div className="absolute top-4 right-4 p-2 rounded-lg bg-surface/80 border border-premium-gold/40 text-[10px] font-mono text-premium-gold flex items-center gap-1.5 shadow-glow-gold">
          <Zap className="w-3 h-3 text-premium-gold" />
          <span>24H ENGINE</span>
        </div>

        <div className="absolute bottom-4 left-4 p-2 rounded-lg bg-surface/80 border border-white/10 text-[10px] font-mono text-text-secondary flex items-center gap-1.5">
          <Radio className="w-3 h-3 text-electric-blue" />
          <span>OFFLINE ARENA</span>
        </div>

        <div className="absolute bottom-4 right-4 p-2 rounded-lg bg-surface/80 border border-white/10 text-[10px] font-mono text-text-secondary flex items-center gap-1.5">
          <Terminal className="w-3 h-3 text-electric-blue" />
          <span>SOFTWARE + HW</span>
        </div>

        {/* Central Semiconductor Processor (Kernel Prime SoC) */}
        <div className="relative z-10 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0D1117] via-[#050505] to-[#121822] border-2 border-electric-blue/60 shadow-[0_0_35px_rgba(0,200,255,0.4)] flex flex-col items-center justify-center text-center max-w-[220px] transition-transform duration-500 hover:scale-105">
          {/* Gold Pin Accents around chip */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="w-1 h-1.5 bg-premium-gold rounded-t-sm" />
            <span className="w-1 h-1.5 bg-premium-gold rounded-t-sm" />
            <span className="w-1 h-1.5 bg-premium-gold rounded-t-sm" />
            <span className="w-1 h-1.5 bg-premium-gold rounded-t-sm" />
          </div>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            <span className="w-1 h-1.5 bg-premium-gold rounded-b-sm" />
            <span className="w-1 h-1.5 bg-premium-gold rounded-b-sm" />
            <span className="w-1 h-1.5 bg-premium-gold rounded-b-sm" />
            <span className="w-1 h-1.5 bg-premium-gold rounded-b-sm" />
          </div>

          <Cpu className="w-12 h-12 text-electric-blue mb-2 animate-pulse" />
          <span className="text-xs font-black tracking-widest text-white font-mono uppercase">
            KERNEL PRIME
          </span>
          <span className="text-[10px] font-bold text-premium-gold font-mono tracking-wider">
            24H SOC ENGINE
          </span>
          <span className="mt-2 px-2 py-0.5 rounded-full bg-electric-blue/10 text-electric-blue text-[9px] font-mono border border-electric-blue/30">
            ECE &amp; VLSI
          </span>
        </div>

      </div>
    </div>
  );
};
