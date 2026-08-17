import React from 'react';
import {
  Flame,
  Heart,
  MessageCircle,
  ShieldCheck,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavigationTab } from '../types';

export const BottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    matches,
    whoLikedMeProfiles,
  } = useApp();

  // Calculate unread messages
  const unreadMatchesCount = matches.filter((m) => m.hasUnread).length;
  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'discover',
      label: 'Discover',
      icon: <Flame className="w-5 h-5" />,
    },
    {
      id: 'likes',
      label: 'Likes',
      icon: <Heart className="w-5 h-5" />,
      badge: whoLikedMeProfiles.length,
    },
    {
      id: 'matches',
      label: 'Chats',
      icon: <MessageCircle className="w-5 h-5" />,
      badge: unreadMatchesCount,
    },
    {
      id: 'safety',
      label: 'Safety',
      icon: <ShieldCheck className="w-5 h-5" />,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="uoa-bottom-nav fixed inset-x-0 bottom-0 z-40 w-full min-w-0 border-t pb-safe backdrop-blur-2xl lg:hidden">
      <div className="mx-auto flex w-full max-w-[900px] items-center justify-around gap-1 px-2 py-2 sm:gap-2 sm:px-4 sm:py-2.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center py-1 px-1.5 sm:px-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-pink-200 font-bold'
                  : 'text-white/45 hover:text-white/80'
              }`}
              id={`bottom-nav-${item.id}`}
            >
              {/* Active Indicator Top Dot */}
              {isActive && (
                <span className="absolute -top-2 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-pink-300"></span>
              )}

              <div className="relative">
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -right-2 -top-1 min-w-[16px] rounded-full border border-[#0d0710] bg-pink-500 px-1.5 py-0.2 text-center text-[9px] font-black text-white">
                    {item.badge}
                  </span>
                ) : null}
              </div>

              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? 'text-pink-200' : 'text-white/45'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
