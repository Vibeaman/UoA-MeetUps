import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Bell,
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
    isAuthenticated,
    notifications,
    unreadNotificationCount,
    markNotificationsRead,
    isAdminAuthenticated,
    logoutAdmin,
  } = useApp();

  const [showModeTooltip, setShowModeTooltip] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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

  const formatNotificationTime = (createdAt: string) => {
    const timestamp = new Date(createdAt).getTime();
    if (!Number.isFinite(timestamp)) return '';
    const minutesAgo = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (minutesAgo < 1) return 'Now';
    if (minutesAgo < 60) return `${minutesAgo}m`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    if (hoursAgo < 24) return `${hoursAgo}h`;
    return new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-pink-300/85">
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
              <Lock className="w-3.5 h-3.5 text-orange-300" />
              <span>Lowkey</span>
              {currentMode === 'lowkey' && (
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping"></span>
              )}
            </button>
          </div>

          {/* Lowkey Mode Floating Badge */}
          {currentMode === 'lowkey' && (
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold text-orange-300 bg-orange-950/80 px-2 py-0.5 rounded-full border border-orange-800/40 shadow-sm animate-pulse">
              Lowkey mode active
            </div>
          )}
        </div>

        {/* Right Action Icons: Notifications, Boost, Premium, Filters, Admin */}
        <div className="ml-auto flex shrink-0 items-center space-x-1.5 sm:space-x-2">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                const opening = !isNotificationsOpen;
                setIsNotificationsOpen(opening);
                if (opening) void markNotificationsRead();
              }}
              className={`uoa-quiet-button relative rounded-xl p-2 transition-all ${isNotificationsOpen ? 'text-orange-200 ring-1 ring-orange-300/30' : ''}`}
              title="Notifications"
              aria-label="Notifications"
              aria-expanded={isNotificationsOpen}
              id="notifications-header-btn"
            >
              <Bell className="h-4 w-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-[#08040d] bg-rose-500 px-1 text-[9px] font-bold text-white">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-orange-800/50 bg-[#160a20] shadow-2xl shadow-black/50">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-300">Notifications</p>
                    <p className="mt-0.5 text-[11px] text-white/45">Activity about your account</p>
                  </div>
                  {notifications.length > 0 && <span className="text-[10px] font-bold text-white/40">{notifications.length} recent</span>}
                </div>
                <div className="max-h-[min(24rem,65vh)] overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <p className="px-3 py-8 text-center text-xs leading-relaxed text-white/50">
                      {isAuthenticated ? 'You’re all caught up.' : 'Sign in to receive account notifications.'}
                    </p>
                  ) : (
                    notifications.map((notification) => (
                      <div key={notification.id} className={`flex gap-3 rounded-xl px-3 py-3 ${notification.readAt ? '' : 'bg-orange-500/[0.08]'}`}>
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-200 ring-1 ring-orange-300/20">
                          <Bell className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-bold text-white">{notification.title}</p>
                            <span className="shrink-0 text-[10px] text-white/35">{formatNotificationTime(notification.createdAt)}</span>
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-white/65">{notification.body}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Boost Button */}
          <button
            onClick={triggerBoost}
            className={`relative rounded-xl border p-2 transition-all ${
              isBoostActive
                ? 'bg-pink-500/15 border-pink-300/40 text-pink-100'
                : 'uoa-quiet-button text-pink-200'
            }`}
            title={isBoostActive ? `Boost Active (${formatBoostTime(boostTimeLeft)})` : 'Boost Profile (30 min)'}
            id="boost-header-btn"
          >
            <Zap className="w-4 h-4 text-orange-400" />
            {isBoostActive && (
              <span className="absolute -top-1 -right-1 text-[8px] font-extrabold bg-orange-600 text-white px-1 rounded-full">
                {Math.ceil(boostTimeLeft / 60)}m
              </span>
            )}
          </button>

          {/* Premium VIP Crown */}
          <button
            onClick={() => setIsPremiumModalOpen(true)}
            className={`flex items-center space-x-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all ${
              isPremium
                ? 'bg-white/10 text-orange-200 ring-1 ring-orange-300/25'
                : 'uoa-quiet-button text-white/75'
            }`}
            id="vip-header-btn"
          >
            <Crown className={`w-3.5 h-3.5 ${isPremium ? 'text-orange-400 fill-orange-400' : 'text-orange-400'}`} />
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
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-600 text-white text-[9px] font-bold flex items-center justify-center border border-[#08040d]">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
