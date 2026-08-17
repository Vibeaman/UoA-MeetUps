import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Crown,
  Zap,
  Lock,
  Flame,
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
    <header className="uoa-header sticky top-0 z-30 w-full min-w-0 border-b px-3 py-3 transition-all sm:px-5">
      <div className="mx-auto flex w-full max-w-[1400px] min-w-0 flex-wrap items-center justify-between gap-3 md:flex-nowrap">
        {/* Left: Logo & Campus Tag */}
        <div
          onClick={handleLogoClick}
          className="flex min-w-0 shrink-0 items-center space-x-2.5 cursor-pointer group"
          id="header-logo-container"
        >
          <Logo size="sm" />
          <div className="hidden sm:flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-violet-300/85">
              UniAbuja Campus
            </span>
            <span className="text-[9px] text-white/45">Student network for UniAbuja</span>
          </div>
        </div>

        {/* Center: Normal vs Lowkey Mode Switcher */}
        <div className="relative order-3 flex w-full justify-center md:order-none md:w-auto md:shrink-0">
          <div
            className="uoa-surface-soft flex items-center rounded-full p-1"
            id="mode-switcher-container"
          >
            <button
              onClick={() => toggleAppMode('normal')}
              className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                currentMode === 'normal'
                  ? 'uoa-primary-button text-white'
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
              className={`flex items-center space-x-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                currentMode === 'lowkey'
                  ? 'bg-white/10 text-white ring-1 ring-white/15'
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
              Lowkey mode active
            </div>
          )}
        </div>

        {/* Right Action Icons: Boost, Premium, Filters, Admin */}
        <div className="ml-auto flex shrink-0 items-center space-x-1.5 sm:space-x-2">
          {/* Boost Button */}
          <button
            onClick={isBoostActive ? undefined : triggerBoost}
            className={`relative rounded-xl border p-2 transition-all ${
              isBoostActive
                ? 'bg-violet-500/15 border-violet-300/40 text-violet-100'
                : 'uoa-quiet-button text-violet-200'
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
            className={`flex items-center space-x-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
              isPremium
                ? 'bg-white/10 text-amber-200 ring-1 ring-amber-300/25'
                : 'uoa-quiet-button text-white/75'
            }`}
            id="vip-header-btn"
          >
            <Crown className={`w-3.5 h-3.5 ${isPremium ? 'text-amber-400 fill-amber-400' : 'text-purple-400'}`} />
            <span className="hidden sm:inline">{isPremium ? 'VIP' : 'Upgrade'}</span>
          </button>

          {/* Filters Toggle */}
          <button
            onClick={() => setIsFiltersModalOpen(true)}
            className="uoa-quiet-button relative rounded-xl p-2 transition-all"
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
