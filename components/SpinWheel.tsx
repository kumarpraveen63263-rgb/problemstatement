'use client';

import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playTickSound, playCelebrationSound } from '@/lib/audio';
import { Sparkles, Lock, AlertCircle, Loader2 } from 'lucide-react';

export interface ProblemStatementSummary {
  id: string;
  code: string;
  title: string;
  description: string;
  capacity: number;
  allocatedCount: number;
  remaining: number;
  isFull: boolean;
  isActive: boolean;
}

interface SpinWheelProps {
  statements: ProblemStatementSummary[];
  isLocked: boolean;
  allocationStatus: 'OPEN' | 'CLOSED' | 'PAUSED';
  onSpinStart: () => Promise<{ success: boolean; assignedPs?: any; error?: string }>;
  onSpinComplete: (assignedPs: any) => void;
}

export const SpinWheel: React.FC<SpinWheelProps> = ({
  statements,
  isLocked,
  allocationStatus,
  onSpinStart,
  onSpinComplete,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rotationDegree, setRotationDegree] = useState(0);

  const wheelRef = useRef<HTMLDivElement>(null);
  const lastTickAngleRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const SEGMENT_COUNT = 9;
  const ANGLE_PER_SEGMENT = 360 / SEGMENT_COUNT; // 40 degrees

  // List of 9 codes in order
  const segmentCodes = [
    'PS-01', 'PS-02', 'PS-03', 'PS-04', 'PS-05',
    'PS-06', 'PS-07', 'PS-08', 'PS-09'
  ];

  // Helper to check if a specific PS code is full
  const isSegmentFull = (code: string) => {
    const ps = statements.find((s) => s.code === code);
    return ps ? ps.isFull : false;
  };

  const handleSpinClick = async () => {
    if (isSpinning || isLocked || allocationStatus !== 'OPEN') return;

    setErrorMessage(null);
    setIsSpinning(true);
    setStatusMessage('Securing atomic allocation on server...');

    try {
      // 1. Send secure server request first - backend determines winner!
      const response = await onSpinStart();

      if (!response.success || !response.assignedPs) {
        setIsSpinning(false);
        setStatusMessage(null);
        setErrorMessage(response.error || 'Allocation could not be processed. Please try again.');
        return;
      }

      const assignedPs = response.assignedPs;
      setStatusMessage('Allocation confirmed. Synchronizing wheel...');

      // 2. Calculate exact angle to land precisely on server-selected PS
      // Pointer is at the top (270 degrees in SVG coordinate, or 0 / top center).
      // Segments are indexed 0 to 8.
      const targetIndex = segmentCodes.indexOf(assignedPs.code);
      const safeIndex = targetIndex >= 0 ? targetIndex : 0;

      // Pointer is at Top (12 o'clock, 0 deg).
      // For segment `i` centered at `i * 40 + 20` deg to stop under the top pointer:
      // Wheel must rotate such that `(targetCenter + finalAngle) % 360 === 0` (or 360).
      const segmentCenterAngle = safeIndex * ANGLE_PER_SEGMENT + (ANGLE_PER_SEGMENT / 2);
      
      // Add 6 to 8 full revolutions for dramatic suspense (360 * 7 = 2520 deg)
      const fullRotations = 360 * 7;
      // Exact stopping angle
      const finalAngle = fullRotations + (360 - segmentCenterAngle);

      const durationMs = 6500; // 6.5 seconds smooth cinematic deceleration
      const startTime = performance.now();
      const startAngle = rotationDegree % 360;

      // Track ticks for realistic sound
      lastTickAngleRef.current = startAngle;

      const animateWheel = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);

        // Cubic-bezier easing for smooth start and gradual cinematic deceleration
        // easeOutCubic: 1 - Math.pow(1 - progress, 3) or easeOutQuint: 1 - Math.pow(1 - progress, 5)
        const ease = 1 - Math.pow(1 - progress, 4);

        const currentAngle = startAngle + (finalAngle - startAngle) * ease;
        setRotationDegree(currentAngle);

        // Sound tick check
        const angleDifference = Math.abs(currentAngle - lastTickAngleRef.current);
        if (angleDifference >= ANGLE_PER_SEGMENT) {
          playTickSound();
          lastTickAngleRef.current = currentAngle;
        }

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animateWheel);
        } else {
          // Finished spinning
          setIsSpinning(false);
          setStatusMessage(null);

          // Trigger Confetti Celebration
          triggerConfetti();
          playCelebrationSound();

          // Hand off to dashboard
          setTimeout(() => {
            onSpinComplete(assignedPs);
          }, 800);
        }
      };

      animFrameRef.current = requestAnimationFrame(animateWheel);
    } catch (err: any) {
      setIsSpinning(false);
      setStatusMessage(null);
      setErrorMessage('Network connection lost. Please verify your allocation status.');
    }
  };

  const triggerConfetti = () => {
    const end = Date.now() + 3.5 * 1000;
    const colors = ['#00C8FF', '#F4B400', '#FFFFFF', '#00E5FF'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto">
      {/* Top Alignment Pointer Marker */}
      <div className="relative z-20 flex flex-col items-center -mb-5">
        <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-electric-blue filter drop-shadow-[0_0_10px_#00C8FF]" />
        <div className="w-2.5 h-2.5 rounded-full bg-premium-gold -mt-1 shadow-glow-gold" />
      </div>

      {/* Wheel Container with Cyber Neon Rim */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] rounded-full p-2 bg-[#0A0E14] border-2 border-electric-blue/40 shadow-glow-blue-lg">
        {/* Outer Circular Ring with PCB dots */}
        <div className="absolute inset-1 rounded-full border border-white/10 pointer-events-none" />

        {/* Rotating Wheel Disk */}
        <div
          ref={wheelRef}
          style={{ transform: `rotate(${rotationDegree}deg)` }}
          className="relative w-full h-full rounded-full overflow-hidden select-none will-change-transform"
        >
          <svg viewBox="0 0 400 400" className="w-full h-full">
            <defs>
              <linearGradient id="activeBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#0E2238" />
                <stop offset="100%" stop-color="#071320" />
              </linearGradient>
              <linearGradient id="activeGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#241B08" />
                <stop offset="100%" stop-color="#0E0F14" />
              </linearGradient>
              <linearGradient id="fullGreyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#14181F" />
                <stop offset="100%" stop-color="#0B0D11" />
              </linearGradient>
            </defs>

            {/* 9 Wheel Slices */}
            {segmentCodes.map((code, index) => {
              const startAngle = index * ANGLE_PER_SEGMENT - 90;
              const endAngle = startAngle + ANGLE_PER_SEGMENT;

              // Trigonometry for pie slices
              const x1 = 200 + 200 * Math.cos((Math.PI * startAngle) / 180);
              const y1 = 200 + 200 * Math.sin((Math.PI * startAngle) / 180);
              const x2 = 200 + 200 * Math.cos((Math.PI * endAngle) / 180);
              const y2 = 200 + 200 * Math.sin((Math.PI * endAngle) / 180);

              const isFull = isSegmentFull(code);
              const isEven = index % 2 === 0;

              const fill = isFull
                ? 'url(#fullGreyGrad)'
                : isEven
                ? 'url(#activeBlueGrad)'
                : 'url(#activeGoldGrad)';

              const strokeColor = isFull ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 200, 255, 0.3)';

              // Mid angle for text positioning
              const midAngle = startAngle + ANGLE_PER_SEGMENT / 2;
              const textRadius = 135;
              const tx = 200 + textRadius * Math.cos((Math.PI * midAngle) / 180);
              const ty = 200 + textRadius * Math.sin((Math.PI * midAngle) / 180);

              return (
                <g key={code}>
                  {/* Slice Path */}
                  <path
                    d={`M 200 200 L ${x1} ${y1} A 200 200 0 0 1 ${x2} ${y2} Z`}
                    fill={fill}
                    stroke={strokeColor}
                    strokeWidth="1.5"
                  />
                  {/* Text Badge */}
                  <g transform={`translate(${tx}, ${ty}) rotate(${midAngle + 90})`}>
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isFull ? '#5E6673' : isEven ? '#00C8FF' : '#F4B400'}
                      fontSize={isFull ? '11' : '13'}
                      fontWeight="800"
                      fontFamily="'JetBrains Mono', monospace"
                      letterSpacing="1"
                    >
                      {code}
                    </text>
                    {isFull && (
                      <text
                        y="12"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#8B949E"
                        fontSize="8"
                        fontWeight="700"
                        letterSpacing="1"
                      >
                        FULL
                      </text>
                    )}
                  </g>
                </g>
              );
            })}

            {/* Central Glow Ring */}
            <circle cx="200" cy="200" r="54" fill="#0D1117" stroke="#00C8FF" strokeWidth="2.5" />
            <circle cx="200" cy="200" r="46" fill="#050505" stroke="rgba(244, 180, 0, 0.5)" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Central Non-Rotating Hub Emblem */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-20 h-20 rounded-full bg-[#0D1117] border border-electric-blue/60 shadow-glow-blue flex flex-col items-center justify-center text-center p-1">
            <span className="text-[9px] font-mono font-bold tracking-widest text-electric-blue">KERNEL</span>
            <span className="text-xs font-black tracking-widest text-premium-gold">PRIME</span>
            <span className="text-[8px] font-mono text-text-muted">'26</span>
          </div>
        </div>
      </div>

      {/* Dynamic Status / Progress Banner */}
      {statusMessage && (
        <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-electric-blue/10 border border-electric-blue/30 text-electric-blue text-sm font-mono animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Error Message if Any */}
      {errorMessage && (
        <div className="mt-6 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* System Warning if Allocation Closed or Paused */}
      {allocationStatus === 'CLOSED' && (
        <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-text-muted text-sm font-mono">
          <Lock className="w-4 h-4 text-premium-gold" />
          <span>Problem Statement Allocation Has Not Started Yet.</span>
        </div>
      )}

      {allocationStatus === 'PAUSED' && (
        <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm font-mono">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span>Allocation is temporarily paused by organizers. Standing by...</span>
        </div>
      )}

      {/* Spin Button */}
      <div className="mt-8 w-full max-w-sm">
        <button
          onClick={handleSpinClick}
          disabled={isSpinning || isLocked || allocationStatus !== 'OPEN'}
          className={`w-full py-4 px-6 rounded-xl font-mono text-sm tracking-widest uppercase font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${
            isSpinning || isLocked || allocationStatus !== 'OPEN'
              ? 'bg-surface-card border border-white/10 text-text-muted cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-electric-blue to-electric-blue-hover hover:from-electric-blue-hover hover:to-electric-blue text-background font-black shadow-glow-blue hover:shadow-glow-blue-lg active:scale-[0.98]'
          }`}
        >
          {isSpinning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>ALLOCATING STATEMENT...</span>
            </>
          ) : isLocked ? (
            <>
              <Lock className="w-4 h-4" />
              <span>CONFIRM RULES TO UNLOCK</span>
            </>
          ) : allocationStatus !== 'OPEN' ? (
            <>
              <Lock className="w-4 h-4" />
              <span>ALLOCATION STANDBY</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>START ALLOCATION SPIN</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SpinWheel;
