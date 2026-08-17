import React, { useState } from 'react';
import { ChevronLeft, Sparkles, HeartHandshake, Shield, HeartPulse, Check } from 'lucide-react';
import { DATING_AND_HEALTH_TIPS } from '../data/catalogData';

export const TipsView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [activeCategory, setActiveCategory] = useState<number>(0);

  return (
    <div className="w-full max-w-6xl mx-auto min-w-0 flex-1 flex flex-col p-3 sm:p-4 space-y-4 overflow-y-auto custom-scrollbar pb-24">
      {/* Header */}
      <div className="flex items-center space-x-2.5 pb-2 border-b border-orange-950/80">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-black font-display text-white">Campus Dating & Wellness Tips</h2>
          <p className="text-[11px] text-orange-300">Practical guides for UniAbuja students</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto no-scrollbar py-1">
        {DATING_AND_HEALTH_TIPS.map((cat, idx) => (
          <button
            key={idx}
            onClick={() => setActiveCategory(idx)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === idx
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-[#130722] text-neutral-400 border border-orange-950 hover:text-white'
            }`}
          >
            {cat.category}
          </button>
        ))}
      </div>

      {/* Selected Category Content */}
      <div className="space-y-3 flex-1">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#180b2a] to-[#10051d] border border-orange-800/40">
          <h3 className="text-sm font-black font-display text-white mb-2 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>{DATING_AND_HEALTH_TIPS[activeCategory].title}</span>
          </h3>

          <div className="space-y-2.5 mt-3">
            {DATING_AND_HEALTH_TIPS[activeCategory].tips.map((tip, i) => (
              <div key={i} className="flex items-start space-x-2.5 text-xs text-neutral-200">
                <div className="w-4 h-4 rounded-full bg-orange-900/80 text-orange-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-orange-700/50">
                  <Check className="w-2.5 h-2.5" />
                </div>
                <p className="leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Campus Hangout spots recommendation */}
        <div className="p-4 rounded-2xl bg-[#120620] border border-orange-950">
          <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2">
            Top Rated First-Date Spots Around UniAbuja
          </h4>
          <ul className="space-y-1.5 text-xs text-neutral-300">
            <li className="flex items-center space-x-2">
              <span className="text-orange-400">📍</span>
              <span><strong>Senate Plaza Terrace</strong> — Perfect for evening smoothies & sunsets</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-orange-400">📍</span>
              <span><strong>Student Arcade Chill Garden</strong> — Casual lunch and vibrant atmosphere</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-orange-400">📍</span>
              <span><strong>Campus Shawarma & Grill Spot</strong> — Bustling public evening hangout</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-orange-400">📍</span>
              <span><strong>Jabi Lake Mall / Park (Abuja City)</strong> — Weekend daytime coffee & lake walks</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
