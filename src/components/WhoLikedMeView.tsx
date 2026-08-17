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
    <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-1 flex-col space-y-5 overflow-y-auto px-3 pb-24 pt-4 custom-scrollbar sm:px-5 sm:pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black font-display text-white tracking-tight flex items-center space-x-2">
            <span>Who Liked You</span>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-sm font-bold text-violet-100 ring-1 ring-white/10">
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
            className="uoa-quiet-button flex items-center space-x-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold text-amber-200 transition-colors hover:bg-white/10"
          >
            <Crown className="w-3.5 h-3.5 fill-black" />
            <span>Unlock All</span>
          </button>
        )}
      </div>

      {/* Paystack VIP Promo Banner if not premium */}
      {!isPremium && (
        <div className="uoa-surface relative overflow-hidden rounded-2xl p-4">
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
                Skip the swipe queue! Unblur profiles, see who liked you first, and match back with 1 tap.
              </p>
              <button
                onClick={() => setIsPremiumModalOpen(true)}
                className="uoa-primary-button mt-2.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-white hover:brightness-110"
              >
                Upgrade to VIP Pass (From ₦1,500)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live inbound likes */}
      {whoLikedMeProfiles.length === 0 ? (
        <div className="uoa-surface-soft rounded-2xl p-8 text-center">
          <Heart className="w-10 h-10 text-purple-400 mx-auto mb-2 opacity-60" />
          <h4 className="text-sm font-bold text-white">No one has liked your profile yet</h4>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Complete your profile and add real photos to help other UniAbuja students discover you.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {whoLikedMeProfiles.map((profile) => (
          <div
            key={profile.id}
            className="uoa-surface relative flex h-60 flex-col justify-end overflow-hidden rounded-2xl group"
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
                    className="uoa-primary-button flex-1 rounded-xl py-1.5 text-xs font-bold text-white hover:brightness-110 flex items-center justify-center space-x-1"
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
      )}
    </div>
  );
};
