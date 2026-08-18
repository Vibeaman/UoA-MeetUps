import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

export const CampusPulseBar: React.FC = () => {
  const { selectedVibeFilter, setSelectedVibeFilter, profiles } = useApp();
  const visibleProfiles = profiles.filter((profile) => !profile.isBanned);

  const activeCount = visibleProfiles.filter((profile) => profile.isOnline).length;
  const facultyCounts = visibleProfiles.reduce<Record<string, number>>((counts, profile) => {
    if (profile.faculty) counts[profile.faculty] = (counts[profile.faculty] || 0) + 1;
    return counts;
  }, {});
  const topFaculty = Object.entries(facultyCounts).sort(([, countA], [, countB]) => Number(countB) - Number(countA))[0]?.[0];

  const VIBE_FILTERS = [
    { id: 'all', label: 'All profiles' },
    { id: 'science', label: 'Science & engineering' },
    { id: 'law', label: 'Law & arts' },
    { id: 'med', label: 'Health sciences' },
    { id: 'verified', label: 'Verified students' },
    { id: 'dating', label: 'Dating intent' },
  ];

  return (
    <div className="w-full space-y-3 pb-1" id="campus-pulse-bar">
      {/* Live Campus Pulse Banner */}
      <div className="uoa-surface-soft flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-[11px] text-pink-100">
        <div className="flex items-center space-x-2 truncate">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="font-semibold text-white truncate">
            {activeCount > 0 ? `${activeCount} UniAbuja students online` : 'Be part of the first campus wave'}
          </span>
          <span className="text-orange-400 hidden sm:inline">•</span>
          <span className="text-orange-300/80 truncate hidden sm:inline">
            {topFaculty ? `Most represented: ${topFaculty}` : 'Campus activity starts with people like you'}
          </span>
        </div>
        <span className="ml-1 shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-bold text-white/65">
          {visibleProfiles.length > 0 ? `${visibleProfiles.length} profiles` : 'Start exploring'}
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
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-white text-[#1a0d20] border-white font-bold'
                  : 'bg-white/[0.04] text-white/65 border-white/10 hover:border-white/25 hover:text-white'
              }`}
            >
              <span>{chip.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
