import React from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';

export const CampusPulseBar: React.FC = () => {
  const { selectedVibeFilter, setSelectedVibeFilter, profiles } = useApp();

  const activeCount = profiles.filter((profile) => profile.isOnline).length;
  const facultyCounts = profiles.reduce<Record<string, number>>((counts, profile) => {
    if (profile.faculty) counts[profile.faculty] = (counts[profile.faculty] || 0) + 1;
    return counts;
  }, {});
  const topFaculty = Object.entries(facultyCounts).sort(([, countA], [, countB]) => Number(countB) - Number(countA))[0]?.[0];

  const VIBE_FILTERS = [
    { id: 'all', label: 'All Profiles', icon: '⚡' },
    { id: 'science', label: 'Science & Engineering', icon: '💻' },
    { id: 'law', label: 'Law & Arts', icon: '⚖️' },
    { id: 'med', label: 'Health Sciences', icon: '🩺' },
    { id: 'verified', label: 'Verified Students', icon: '🛡️' },
    { id: 'dating', label: 'Dating Intent', icon: '❤️' },
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
            {activeCount > 0 ? `${activeCount} UniAbuja students online` : 'No students marked online yet'}
          </span>
          <span className="text-purple-400 hidden sm:inline">•</span>
          <span className="text-purple-300/80 truncate hidden sm:inline">
            {topFaculty ? `Most represented: ${topFaculty}` : 'Live activity will appear as students join'}
          </span>
        </div>
        <span className="text-[10px] font-extrabold text-purple-300 bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded-full shrink-0 ml-1">
          {profiles.length > 0 ? `${profiles.length} profiles` : 'No live profiles'}
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
