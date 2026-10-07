'use client';

import React from 'react';
import { AlertTriangle, CheckSquare, Square, ShieldAlert } from 'lucide-react';
import { playClickSound } from '@/lib/audio';

interface AllocationNoticeProps {
  hasAccepted: boolean;
  onToggleAccept: (accepted: boolean) => void;
}

export const AllocationNotice: React.FC<AllocationNoticeProps> = ({
  hasAccepted,
  onToggleAccept,
}) => {
  const handleToggle = () => {
    playClickSound();
    onToggleAccept(!hasAccepted);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-white/10 hover:border-electric-blue/30 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-premium-gold shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-4 flex-1">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-premium-gold font-bold">
              Mandatory Protocol
            </span>
            <h3 className="text-lg font-bold text-white tracking-wide">
              Official Allocation Rules &amp; Guidelines
            </h3>
          </div>

          <ul className="space-y-2.5 text-xs sm:text-sm text-text-secondary leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-electric-blue mt-0.5">•</span>
              <span>
                <strong className="text-white">Strict Single Spin:</strong> Only the officially registered Team Leader is permitted to perform the digital allocation wheel spin.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-electric-blue mt-0.5">•</span>
              <span>
                <strong className="text-white">Final &amp; Irreversible:</strong> Once a Problem Statement is assigned by the server, it is permanently locked. Reallocation or statement exchange is strictly prohibited.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-electric-blue mt-0.5">•</span>
              <span>
                <strong className="text-white">Fair Concurrency:</strong> Allocation is performed atomically on the server among Problem Statements with available capacity.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-electric-blue mt-0.5">•</span>
              <span>
                <strong className="text-white">Continuous Session:</strong> Do not close, refresh, or navigate away while the allocation spin is in progress.
              </span>
            </li>
          </ul>

          {/* Mandatory Checkbox Agreement */}
          <div
            onClick={handleToggle}
            className="pt-2 flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="p-1 text-electric-blue transition-transform group-hover:scale-110">
              {hasAccepted ? (
                <CheckSquare className="w-5 h-5 text-electric-blue filter drop-shadow-[0_0_8px_#00C8FF]" />
              ) : (
                <Square className="w-5 h-5 text-text-muted group-hover:text-text-secondary" />
              )}
            </div>
            <label className="text-xs sm:text-sm font-medium text-text-secondary group-hover:text-white cursor-pointer">
              I have read and understood the allocation rules.
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllocationNotice;
