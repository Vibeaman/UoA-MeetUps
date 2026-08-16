import React from 'react';
import {
  Flame,
  Heart,
  MessageCircle,
  ShieldCheck,
  User,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NavigationTab } from '../types';

export const BottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    matches,
    whoLikedMeProfiles,
    currentUser,
    reports,
    verificationRequests,
  } = useApp();

  // Calculate unread messages
  const unreadMatchesCount = matches.filter((m) => m.hasUnread).length;
  // Admin pending items
  const pendingAdminItems =
    reports.filter((r) => r.status === 'pending').length +
    verificationRequests.filter((v) => v.status === 'pending').length;

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
    {
      id: 'admin',
      label: 'Admin',
      icon: <ShieldAlert className="w-5 h-5" />,
      badge: pendingAdminItems,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090410]/95 backdrop-blur-2xl border-t border-purple-950/70 pb-safe shadow-[0_-10px_25px_rgba(0,0,0,0.8)]">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-1.5 sm:py-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-purple-300 font-bold scale-105'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              id={`bottom-nav-${item.id}`}
            >
              {/* Active Indicator Top Dot */}
              {isActive && (
                <span className="absolute -top-1.5 w-1 h-1 rounded-full bg-purple-400 shadow-[0_0_8px_#a855f7]"></span>
              )}

              <div className="relative">
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center border border-[#090410]">
                    {item.badge}
                  </span>
                ) : null}
              </div>

              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'text-purple-300' : 'text-neutral-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
