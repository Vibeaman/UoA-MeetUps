import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Crown,
  Zap,
  ShieldCheck,
  EyeOff,
  Sparkles,
  Lock,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';

export const Header: React.FC = () => {
  const {
    currentMode,
    toggleAppMode,
    isPremium,
    setIsPremiumModalOpen,
    setIsFiltersModalOpen,
    filters,
    isBoostActive,
    boostTimeLeft,
    triggerBoost,
    setActiveTab,
    activeTab,
    isAdminAuthenticated,
    logoutAdmin,
  } = useApp();

  const [showModeTooltip, setShowModeTooltip] = useState(false);

  // Calculate active filter count
  const activeFilterCount =
    (filters.gender !== 'all' ? 1 : 0) +
    (filters.faculty !== 'all' ? 1 : 0) +
    (filters.department !== 'all' ? 1 : 0) +
    (filters.level !== 'all' ? 1 : 0) +
    (filters.onlyMyFaculty ? 1 : 0) +
    (filters.onlyMyDepartment ? 1 : 0) +
    (filters.onlyVerified ? 1 : 0) +
    (filters.searchQuery ? 1 : 0);

  const formatBoostTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleLogoClick = () => {
    if (activeTab === 'admin' || isAdminAuthenticated) {
      logoutAdmin();
      if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
        window.history.replaceState({}, '', '/');
      }
    }
    setActiveTab('discover');
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#090410]/90 backdrop-blur-xl border-b border-purple-950/60 px-3 sm:px-4 py-2.5 transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Logo & Campus Tag */}
        <div
          onClick={handleLogoClick}
          className="flex items-center space-x-2.5 cursor-pointer group"
          id="header-logo-container"
        >
          <Logo size="sm" />
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-purple-400 uppercase">
              UniAbuja Campus
            </span>
            <span className="text-[9px] text-neutral-400">Exclusive Student Network</span>
          </div>
        </div>

        {/* Center: Normal vs Lowkey Mode Switcher */}
        <div className="relative">
          <div
            className="flex items-center p-1 rounded-full bg-[#130920] border border-purple-900/40 shadow-inner"
            id="mode-switcher-container"
          >
            <button
              onClick={() => toggleAppMode('normal')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                currentMode === 'normal'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              id="mode-normal-btn"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Normal</span>
            </button>

            <button
              onClick={() => toggleAppMode('lowkey')}
              onMouseEnter={() => setShowModeTooltip(true)}
              onMouseLeave={() => setShowModeTooltip(false)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                currentMode === 'lowkey'
                  ? 'bg-gradient-to-r from-violet-800 to-fuchsia-900 text-purple-100 shadow-[0_0_15px_rgba(216,70,239,0.5)] border border-purple-400/40'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              id="mode-lowkey-btn"
            >
              <Lock className="w-3.5 h-3.5 text-purple-300" />
              <span>Lowkey</span>
              {currentMode === 'lowkey' && (
                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping"></span>
              )}
            </button>
          </div>

          {/* Lowkey Mode Floating Badge */}
          {currentMode === 'lowkey' && (
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-fuchsia-300 bg-fuchsia-950/80 px-2 py-0.5 rounded-full border border-fuchsia-800/40 shadow-sm animate-pulse">
              🔒 Discreet Lowkey Active
            </div>
          )}
        </div>

        {/* Right Action Icons: Boost, Premium, Filters, Admin */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Boost Button */}
          <button
            onClick={isBoostActive ? undefined : triggerBoost}
            className={`relative p-2 rounded-xl border transition-all ${
              isBoostActive
                ? 'bg-purple-900/60 border-purple-500 text-purple-200 animate-pulse'
                : 'bg-purple-950/30 border-purple-900/40 text-purple-300 hover:bg-purple-900/40 hover:text-purple-100'
            }`}
            title={isBoostActive ? `Boost Active (${formatBoostTime(boostTimeLeft)})` : 'Boost Profile (5x Matches)'}
            id="boost-header-btn"
          >
            <Zap className="w-4 h-4 text-purple-400" />
            {isBoostActive && (
              <span className="absolute -top-1 -right-1 text-[8px] font-extrabold bg-purple-600 text-white px-1 rounded-full">
                {Math.ceil(boostTimeLeft / 60)}m
              </span>
            )}
          </button>

          {/* Premium VIP Crown */}
          <button
            onClick={() => setIsPremiumModalOpen(true)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isPremium
                ? 'bg-gradient-to-r from-amber-500/20 to-purple-600/20 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                : 'bg-gradient-to-r from-purple-950/60 to-purple-900/40 text-purple-200 border border-purple-800/50 hover:border-purple-600'
            }`}
            id="vip-header-btn"
          >
            <Crown className={`w-3.5 h-3.5 ${isPremium ? 'text-amber-400 fill-amber-400' : 'text-purple-400'}`} />
            <span className="hidden sm:inline">{isPremium ? 'VIP' : 'Upgrade'}</span>
          </button>

          {/* Filters Toggle */}
          <button
            onClick={() => setIsFiltersModalOpen(true)}
            className="relative p-2 rounded-xl bg-purple-950/30 border border-purple-900/40 text-neutral-300 hover:text-white hover:bg-purple-900/40 transition-all"
            id="filters-header-btn"
            title="Filter Profiles"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center border border-[#08040d]">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
