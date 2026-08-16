import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Flame, ShieldCheck, GraduationCap, Zap, Heart } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CampusPulseBar: React.FC = () => {
  const { selectedVibeFilter, setSelectedVibeFilter, currentMode } = useApp();

  const VIBE_FILTERS = [
    { id: 'all', label: 'All Vibes', icon: '⚡' },
    { id: 'trending', label: 'Trending Crushes', icon: '🔥' },
    { id: 'new', label: 'New Today', icon: '✨' },
    { id: 'science', label: 'Tech & Science', icon: '💻' },
    { id: 'law', label: 'Law & Arts', icon: '⚖️' },
    { id: 'med', label: 'Med Squad', icon: '🩺' },
    { id: 'verified', label: 'Verified Only', icon: '🛡️' },
    { id: 'dating', label: 'Dating Mode', icon: '❤️' },
  ];

  return (
    <div className="w-full mb-3 space-y-2" id="campus-pulse-bar">
      {/* Live Campus Pulse Banner */}
      <div className="w-full p-2 rounded-xl bg-[#120622]/90 border border-purple-900/50 flex items-center justify-between text-[11px] text-purple-200">
        <div className="flex items-center space-x-2 truncate">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-white truncate">
            148 UniAbuja Students Active
          </span>
          <span className="text-purple-400 hidden sm:inline">•</span>
          <span className="text-purple-300/80 truncate hidden sm:inline">
            Hot: Law & CS faculties
          </span>
        </div>
        <span className="text-[10px] font-extrabold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full shrink-0 ml-1">
          Peak Hour ⚡
        </span>
      </div>

      {/* Quick Vibe Category Filter Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
        {VIBE_FILTERS.map((chip) => {
          const isActive = selectedVibeFilter === chip.id;
          return (
            <motion.button
              key={chip.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedVibeFilter(chip.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-md shadow-purple-950/60 border border-purple-400/60 font-bold'
                  : 'bg-[#120620] text-neutral-300 border border-purple-950 hover:border-purple-800 hover:text-white'
              }`}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
