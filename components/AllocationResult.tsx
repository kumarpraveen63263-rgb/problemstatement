'use client';

import React, { useState } from 'react';
import { Download, CheckCircle, FileText, Calendar, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { playClickSound } from '@/lib/audio';

interface AllocationResultProps {
  teamName: string;
  assignedPs: {
    id: string;
    code: string;
    title: string;
    description: string;
  };
  allocatedAt: string;
  initialDownloadCount?: number;
}

export const AllocationResult: React.FC<AllocationResultProps> = ({
  teamName,
  assignedPs,
  allocatedAt,
  initialDownloadCount = 0,
}) => {
  const [downloadCount, setDownloadCount] = useState(initialDownloadCount);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastDownloadTime, setLastDownloadTime] = useState<string | null>(null);

  const formattedDate = new Date(allocatedAt).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleDownload = async () => {
    playClickSound();
    setIsDownloading(true);

    try {
      // Trigger download from secure authenticated endpoint
      const response = await fetch('/api/allocation/download');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
        alert(errorData.error || 'Failed to download problem statement. Please try again.');
        setIsDownloading(false);
        return;
      }

      // Convert stream to blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KERNEL_PRIME_26_${assignedPs.code}_Official_Problem_Statement.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloadCount((prev) => prev + 1);
      setLastDownloadTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Download error:', err);
      alert('An error occurred during file download. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Main Result Card */}
      <div className="glass-panel-glow rounded-3xl p-8 sm:p-10 relative overflow-hidden border-2 border-electric-blue/40 shadow-glow-blue-lg">
        {/* Ambient background glow orb */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-electric-blue/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-premium-gold/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          {/* Header Badge */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-electric-blue/15 border border-electric-blue/40 text-electric-blue text-xs font-mono font-bold tracking-widest uppercase">
            <Sparkles className="w-4 h-4 text-premium-gold" />
            <span>ALLOCATION CONFIRMED</span>
          </div>

          <div>
            <h4 className="text-sm font-mono tracking-widest text-text-secondary uppercase">
              CONGRATULATIONS
            </h4>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider font-mono mt-1 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-electric-blue">
              {teamName}
            </h2>
            <p className="text-xs font-mono text-premium-gold tracking-widest uppercase mt-2">
              YOUR ALLOTTED PROBLEM STATEMENT
            </p>
          </div>

          {/* Large Problem Statement Code Tag */}
          <div className="relative group">
            <div className="px-8 py-3 rounded-2xl bg-surface border-2 border-electric-blue shadow-glow-blue flex items-center gap-3">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-white">
                {assignedPs.code}
              </span>
            </div>
          </div>

          {/* Statement Title & Description */}
          <div className="space-y-3 max-w-2xl px-4 py-5 rounded-2xl bg-surface/70 border border-white/10 text-left sm:text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {assignedPs.title}
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {assignedPs.description}
            </p>
          </div>

          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-text-secondary pt-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-white/5">
              <Calendar className="w-3.5 h-3.5 text-premium-gold" />
              <span>Assigned at: {formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border border-white/5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Status: Final &amp; Locked</span>
            </div>
            {downloadCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <FileText className="w-3.5 h-3.5" />
                <span>Downloaded ({downloadCount}x)</span>
              </div>
            )}
          </div>

          {/* Secure Download Button */}
          <div className="w-full max-w-md pt-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-4 px-6 rounded-2xl font-mono text-sm uppercase tracking-widest font-black flex items-center justify-center gap-3 bg-gradient-to-r from-premium-gold to-premium-gold-bright hover:brightness-110 text-background shadow-glow-gold hover:shadow-glow-gold-lg transition-all duration-300 active:scale-[0.98]"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>PREPARING SECURE PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>DOWNLOAD PROBLEM STATEMENT PDF</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-text-muted text-center mt-2 font-mono">
              SHA-256 Verified • Watermarked Official Hackathon Document
            </p>
          </div>
        </div>
      </div>

      {/* Motivational Sign-off Banner */}
      <div className="glass-panel rounded-2xl p-6 text-center border border-white/5 space-y-2">
        <p className="text-xs font-mono text-text-muted uppercase tracking-widest">
          Best Wishes for KERNEL PRIME'26
        </p>
        <p className="text-base sm:text-lg font-black tracking-widest text-electric-blue uppercase font-mono">
          Think. Build. Innovate. Be the Core.
        </p>
      </div>
    </div>
  );
};

export default AllocationResult;
