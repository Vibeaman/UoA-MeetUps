import React from 'react';
import { Crown, Heart, Sparkles, Lock, ShieldCheck, Eye, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';

interface WhoLikedMeViewProps {
  onOpenProfileDetails: (profile: UserProfile) => void;
}

export const WhoLikedMeView: React.FC<WhoLikedMeViewProps> = ({ onOpenProfileDetails }) => {
  const {
    whoLikedMeProfiles,
    isPremium,
    setIsPremiumModalOpen,
    swipeRight,
    swipeLeft,
  } = useApp();

  return (
    <div className="w-full max-w-md mx-auto flex-1 flex flex-col p-3 sm:p-4 space-y-4 overflow-y-auto custom-scrollbar pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black font-display text-white tracking-tight flex items-center space-x-2">
            <span>Who Liked You</span>
            <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-purple-900/80 text-purple-200 border border-purple-700/50">
              {whoLikedMeProfiles.length}
            </span>
          </h2>
          <p className="text-xs text-neutral-400">
            UniAbuja students who swiped right on your profile
          </p>
        </div>

        {!isPremium && (
          <button
            onClick={() => setIsPremiumModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-purple-600 text-black font-extrabold text-xs shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:brightness-110"
          >
            <Crown className="w-3.5 h-3.5 fill-black" />
            <span>Unlock All</span>
          </button>
        )}
      </div>

      {/* Paystack VIP Promo Banner if not premium */}
      {!isPremium && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#21093a] to-[#140624] border border-purple-700/60 shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-600/30 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <Crown className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                See Who Likes You Instantly
              </h4>
              <p className="text-[11px] text-purple-200/80 mt-0.5 leading-relaxed">
                Skip the swipe queue! Unblur profiles, see exact matric levels, and match back with 1 tap.
              </p>
              <button
                onClick={() => setIsPremiumModalOpen(true)}
                className="mt-2.5 py-1.5 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-bold shadow-md hover:brightness-110"
              >
                Upgrade to VIP Pass (From ₦1,500)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Profiles */}
      <div className="grid grid-cols-2 gap-3">
        {whoLikedMeProfiles.map((profile) => (
          <div
            key={profile.id}
            className="relative h-60 rounded-2xl overflow-hidden border border-purple-900/50 bg-[#120622] group shadow-md flex flex-col justify-end"
          >
            {/* Background photo */}
            <img
              src={profile.photos[0]}
              alt={profile.name}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
                isPremium ? 'filter none group-hover:scale-105' : 'filter blur-md scale-110 brightness-[0.7]'
              }`}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#090312] via-[#090312]/60 to-transparent" />

            {/* Lock badge if not premium */}
            {!isPremium && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center z-10">
                <div className="w-10 h-10 rounded-full bg-black/70 border border-purple-500/50 flex items-center justify-center text-purple-300 mb-2 backdrop-blur-md shadow-lg">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-white drop-shadow">
                  {profile.level} Student
                </span>
                <span className="text-[10px] text-purple-300 drop-shadow truncate max-w-[120px]">
                  {profile.department}
                </span>
              </div>
            )}

            {/* Unlocked Profile View if premium */}
            {isPremium ? (
              <div className="relative z-10 p-3 flex flex-col justify-end space-y-1.5">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-xs text-white truncate">{profile.name}, {profile.age}</span>
                  {profile.isVerified && <ShieldCheck className="w-3 h-3 text-purple-400 shrink-0" />}
                </div>

                <div className="text-[10px] text-purple-300 truncate">
                  {profile.level} • {profile.department}
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={() => swipeLeft(profile)}
                    className="flex-1 py-1.5 rounded-xl bg-rose-950/80 border border-rose-700/50 text-rose-300 text-xs font-bold hover:bg-rose-900"
                  >
                    Pass
                  </button>
                  <button
                    onClick={() => swipeRight(profile)}
                    className="flex-1 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-bold shadow-md hover:brightness-110 flex items-center justify-center space-x-1"
                  >
                    <Heart className="w-3 h-3 fill-white" />
                    <span>Match</span>
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsPremiumModalOpen(true)}
                className="relative z-10 p-2 text-center cursor-pointer"
              >
                <span className="text-[10px] font-bold text-amber-300 flex items-center justify-center space-x-1">
                  <Crown className="w-3 h-3" />
                  <span>Tap to reveal</span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
