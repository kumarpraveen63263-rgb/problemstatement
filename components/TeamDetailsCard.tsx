'use client';

import React from 'react';
import { GraduationCap, Phone, Award, Terminal } from 'lucide-react';

interface TeamDetailsCardProps {
  team: {
    id: string;
    teamName: string;
    collegeName: string;
    leaderName: string;
    leaderMobile: string;
    leaderEmail: string;
    membersCount?: number;
    track: string;
    registrationStatus: string;
    paymentStatus: string;
  };
}

export const TeamDetailsCard: React.FC<TeamDetailsCardProps> = ({ team }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-white/10 hover:border-electric-blue/30 transition-all duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-electric-blue animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-electric-blue font-bold">
              Software Track • Verified Participant
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider mt-1 uppercase font-mono">
            {team.teamName}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-1">
            <GraduationCap className="w-3.5 h-3.5 text-premium-gold shrink-0" />
            <span className="font-medium">{team.collegeName}</span>
          </div>
        </div>
      </div>

      {/* Grid of Team Meta Fields (TEAM LEADER, MOBILE, TRACK) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 text-xs">
        <div className="p-3.5 rounded-xl bg-surface/60 border border-white/5 space-y-1">
          <span className="text-text-muted flex items-center gap-1.5 font-mono text-[11px]">
            <Award className="w-3.5 h-3.5 text-premium-gold" />
            TEAM LEADER
          </span>
          <p className="font-semibold text-white truncate text-sm">{team.leaderName}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-surface/60 border border-white/5 space-y-1">
          <span className="text-text-muted flex items-center gap-1.5 font-mono text-[11px]">
            <Phone className="w-3.5 h-3.5 text-emerald-400" />
            REGISTERED MOBILE
          </span>
          <p className="font-mono text-white text-sm">•••• •• {team.leaderMobile.slice(-4)}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-surface/60 border border-white/5 space-y-1">
          <span className="text-text-muted flex items-center gap-1.5 font-mono text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-electric-blue" />
            HACKATHON TRACK
          </span>
          <p className="font-semibold text-electric-blue text-sm">{team.track}</p>
        </div>
      </div>
    </div>
  );
};

export default TeamDetailsCard;
