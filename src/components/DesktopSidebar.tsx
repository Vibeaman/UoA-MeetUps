import React from 'react';
import {
  Flame,
  Heart,
  MessageCircle,
  ShieldCheck,
  User,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavigationTab } from '../types';

const navItems: Array<{
  id: NavigationTab;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    id: 'discover',
    label: 'Discover',
    description: 'Meet people on campus',
    icon: <Flame className="h-4 w-4" />,
  },
  {
    id: 'likes',
    label: 'Likes',
    description: 'See your inbound interest',
    icon: <Heart className="h-4 w-4" />,
  },
  {
    id: 'matches',
    label: 'Chats',
    description: 'Keep conversations moving',
    icon: <MessageCircle className="h-4 w-4" />,
  },
  {
    id: 'safety',
    label: 'Safety',
    description: 'Your campus wellbeing',
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    id: 'profile',
    label: 'Profile',
    description: 'Shape how people meet you',
    icon: <User className="h-4 w-4" />,
  },
];

export const DesktopSidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    matches,
    whoLikedMeProfiles,
    currentUser,
    isAuthenticated,
  } = useApp();

  const unreadMatchesCount = matches.filter((match) => match.hasUnread).length;

  return (
    <aside className="hidden min-w-0 flex-col gap-4 lg:flex" aria-label="Primary navigation">
      <div className="uoa-surface-soft rounded-3xl p-2">
        <div className="px-3 pb-3 pt-2">
          <p className="uoa-section-kicker">Your campus space</p>
          <p className="mt-1 text-xs leading-relaxed text-white/55">
            Discover first. Let the rest follow naturally.
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const badge = item.id === 'likes' ? whoLikedMeProfiles.length : item.id === 'matches' ? unreadMatchesCount : 0;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`group relative flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all ${
                  isActive
                    ? 'uoa-primary-button text-white shadow-[0_10px_24px_rgba(255,23,127,0.16)]'
                    : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-white/15 text-white' : 'bg-white/[0.05] text-pink-200/80'}`}>
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-extrabold">{item.label}</span>
                  <span className={`mt-0.5 block truncate text-[10px] ${isActive ? 'text-white/70' : 'text-white/35'}`}>
                    {item.description}
                  </span>
                </span>
                {badge > 0 && (
                  <span className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[9px] font-black ${isActive ? 'bg-white/20 text-white' : 'bg-pink-500/20 text-pink-200'}`}>
                    {badge}
                  </span>
                )}
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/70" />}
              </button>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={() => setActiveTab('profile')}
        className="uoa-surface group rounded-3xl p-3 text-left transition-colors hover:bg-white/[0.08]"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl bg-white/[0.06] ring-1 ring-white/10">
            {isAuthenticated && currentUser.photos[0] ? (
              <img src={currentUser.photos[0]} alt={currentUser.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-pink-200/75">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-extrabold text-white">
              {isAuthenticated && currentUser.name ? currentUser.name : 'Your profile'}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-white/40">
              {isAuthenticated && currentUser.username ? `@${currentUser.username}` : 'Complete your profile'}
            </span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/30 transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>

      <div className="uoa-surface rounded-3xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 text-pink-200 ring-1 ring-pink-300/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-white">Make the first move.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-white/45">
              {isAuthenticated && currentUser.name
                ? `Your profile is the first hello people see. Keep it real, ${currentUser.name.split(' ')[0]}.`
                : 'A real profile makes every hello feel more natural.'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
