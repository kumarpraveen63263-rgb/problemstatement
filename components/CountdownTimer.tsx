'use client';

import React, { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Target event: October 8, 2026 09:00:00 IST
    const targetDate = new Date('2026-10-08T09:00:00+05:30').getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return null;
  }

  const timeUnits = [
    { label: 'DAYS', value: timeLeft.days, color: 'text-electric-blue' },
    { label: 'HOURS', value: timeLeft.hours, color: 'text-white' },
    { label: 'MINUTES', value: timeLeft.minutes, color: 'text-electric-blue' },
    { label: 'SECONDS', value: timeLeft.seconds, color: 'text-premium-gold' },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-panel-glow rounded-3xl p-4 sm:p-6 border border-white/10 backdrop-blur-xl shadow-card-cyber relative overflow-hidden">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-16 bg-electric-blue/20 blur-3xl pointer-events-none" />
        
        <div className="text-center mb-3">
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-electric-blue font-bold flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-ping" />
            HACKATHON LAUNCH COUNTDOWN
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {timeUnits.map((unit, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center p-2.5 sm:p-4 rounded-2xl bg-surface/70 border border-white/5 relative group hover:border-electric-blue/40 transition-all duration-300"
            >
              <div className="text-2xl sm:text-4xl md:text-5xl font-black font-mono tracking-tight drop-shadow-md">
                <span className={unit.color}>
                  {String(unit.value).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[9px] sm:text-xs font-mono font-bold tracking-widest text-text-muted mt-1">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
