import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Edit3,
  Crown,
  Lock,
  Flame,
  Sparkles,
  GraduationCap,
  MapPin,
  Camera,
  LogIn,
  LogOut,
  ChevronRight,
  Sliders,
  ShieldAlert,
  HelpCircle,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';

interface MyProfileViewProps {
  onOpenEditProfile: () => void;
  onOpenGuidelines: () => void;
  onOpenTips: () => void;
}

export const MyProfileView: React.FC<MyProfileViewProps> = ({
  onOpenEditProfile,
  onOpenGuidelines,
  onOpenTips,
}) => {
  const {
    currentUser,
    isAuthenticated,
    isAuthLoading,
    isPremium,
    activePlan,
    setIsPremiumModalOpen,
    setIsVerificationModalOpen,
    openAuthModal,
    signOut,
    refreshAuthentication,
    toggleMode,
    appMode,
  } = useApp();

  useEffect(() => {
    if (isAuthLoading || isAuthenticated) return;
    void refreshAuthentication();
  }, [isAuthLoading, isAuthenticated]);

  const hasProfile = Boolean(currentUser.name.trim() && currentUser.matricNumber.trim());

  if (isAuthLoading || !isAuthenticated || !hasProfile) {
    return (
      <div className="w-full max-w-6xl mx-auto min-w-0 flex-1 flex flex-col p-3 sm:p-4 space-y-4 overflow-y-auto custom-scrollbar pb-24">
        <div className="p-6 rounded-3xl bg-gradient-to-b from-[#18092f] via-[#110520] to-[#090312] border border-purple-800/40 shadow-2xl text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-purple-950/70 border border-purple-700/50 flex items-center justify-center text-purple-300">
            {isAuthLoading ? <Sparkles className="w-7 h-7 animate-pulse" /> : <LogIn className="w-7 h-7" />}
          </div>
          <h2 className="mt-4 text-xl font-black font-display text-white">
            {isAuthLoading ? 'Checking your session' : isAuthenticated ? 'Complete your student profile' : 'Create your student profile'}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-neutral-400">
            {isAuthLoading
              ? 'We are checking your secure Supabase session.'
              : isAuthenticated
                ? 'Add your real student details and photos before appearing in the campus feed.'
                : 'Sign in to add real photos, publish stories, and manage your UniAbuja profile.'}
          </p>
          {!isAuthLoading && (
            <button
              onClick={() => (isAuthenticated ? onOpenEditProfile() : openAuthModal('signup'))}
              className="mt-5 w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-bold shadow-lg shadow-purple-900/50"
            >
              {isAuthenticated ? 'Complete Profile' : 'Sign In'}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto min-w-0 flex-1 flex flex-col p-3 sm:p-4 space-y-4 overflow-y-auto custom-scrollbar pb-24">
      {/* Top Profile Card */}
      <div className="relative rounded-3xl overflow-hidden border border-purple-800/40 bg-gradient-to-b from-[#18092f] via-[#110520] to-[#090312] p-5 shadow-2xl">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-start justify-between">
          {/* Avatar with live photo verification ring */}
          <div className="relative">
            <div className="p-1 rounded-full bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-amber-400">
              {currentUser.photos[0] ? (
                <img
                  src={currentUser.photos[0]}
                  alt={currentUser.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#090312]"
                />
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-[#090312] bg-purple-950/70 flex items-center justify-center text-purple-300">
                  <Camera className="w-7 h-7" />
                </div>
              )}
            </div>
            {currentUser.isVerified ? (
              <span
                className="absolute bottom-0 right-0 p-1 rounded-full bg-purple-600 border-2 border-[#090312] text-white shadow-md"
                title="Verified Student"
              >
                <ShieldCheck className="w-4 h-4" />
              </span>
            ) : (
              <button
                onClick={() => setIsVerificationModalOpen(true)}
                className="absolute bottom-0 right-0 p-1 rounded-full bg-amber-500 border-2 border-[#090312] text-black shadow-md hover:scale-110 transition-transform"
                title="Tap to verify"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Edit Profile Button */}
          <button
            onClick={onOpenEditProfile}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-2xl bg-purple-950/80 border border-purple-700/50 text-purple-200 text-xs font-bold hover:bg-purple-900/90 transition-all shadow-sm"
            id="edit-profile-btn"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* User Info */}
        <div className="mt-4 space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-black font-display text-white">
              {currentUser.name}, {currentUser.age}
            </h2>
            {currentUser.isVerified && (
              <span className="px-2 py-0.5 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
                🛡️ Verified
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-purple-300/90">
            <span className="font-mono bg-black/40 px-2 py-0.5 rounded-lg border border-purple-950 text-[11px] text-purple-200 font-bold">
              {currentUser.matricNumber}
            </span>
            <span>•</span>
            <span>{currentUser.level}</span>
            <span>•</span>
            <span>{currentUser.department}</span>
          </div>

          <div className="flex items-center space-x-1 text-[11px] text-neutral-400 pt-0.5">
            <MapPin className="w-3 h-3 text-purple-400" />
            <span>{currentUser.campusLocation}</span>
          </div>
        </div>

        {/* Verification Alert Banner if unverified */}
        {!currentUser.isVerified && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-950/40 border border-amber-600/40 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-left">
                <span className="text-xs font-bold text-amber-200 block">
                  Verify Student Identity
                </span>
                <span className="text-[10px] text-amber-300/80">
                  Take a quick selfie to get 3x more matches
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsVerificationModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black shadow hover:brightness-110"
            >
              Verify
            </button>
          </div>
        )}
      </div>

      {/* Mode Switcher Interactive Card */}
      <div className="p-4 rounded-3xl bg-[#120620] border border-purple-950 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {appMode === 'lowkey' ? (
              <Lock className="w-5 h-5 text-fuchsia-400" />
            ) : (
              <Flame className="w-5 h-5 text-purple-400" />
            )}
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-white block">
                Active Campus Mode: {appMode === 'lowkey' ? 'Lowkey 🔒' : 'Normal 💜'}
              </span>
              <span className="text-[10px] text-neutral-400">
                {appMode === 'lowkey'
                  ? 'Only visible to students in Lowkey Mode'
                  : 'Visible to everyone in public campus discovery'}
              </span>
            </div>
          </div>

          <button
            onClick={toggleMode}
            className={`w-12 h-7 rounded-full transition-all relative ${
              appMode === 'lowkey' ? 'bg-fuchsia-600' : 'bg-purple-600'
            }`}
            id="toggle-mode-profile-btn"
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${
                appMode === 'lowkey' ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* VIP Subscription Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#230a3d] to-[#140624] border border-purple-700/60 relative overflow-hidden shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {isPremium ? 'VIP Royal Pass Active' : 'UoA MeetUps VIP'}
              </h3>
              <p className="text-[11px] text-purple-200/80">
                {isPremium
                  ? `Active on ${activePlan} plan (Paystack verified)`
                  : 'See who liked you, rewind swipes, and incognito mode'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPremiumModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-purple-600 text-black font-extrabold text-xs shadow hover:brightness-110"
          >
            {isPremium ? 'Manage' : 'Upgrade'}
          </button>
        </div>
      </div>

      {/* Settings Actions */}
      <div className="space-y-1.5 rounded-3xl bg-[#120620] border border-purple-950 p-2 text-xs">
        {/* Community Guidelines */}
        <button
          onClick={onOpenGuidelines}
          className="w-full p-3 rounded-2xl hover:bg-purple-950/50 flex items-center justify-between transition-colors group"
        >
          <div className="flex items-center space-x-2.5 text-neutral-200">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span className="font-semibold">Community Guidelines & Rules</span>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Tips */}
        <button
          onClick={onOpenTips}
          className="w-full p-3 rounded-2xl hover:bg-purple-950/50 flex items-center justify-between transition-colors group"
        >
          <div className="flex items-center space-x-2.5 text-neutral-200">
            <HelpCircle className="w-4 h-4 text-purple-400" />
            <span className="font-semibold">Campus Dating & Wellness Tips</span>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Authentication */}
        <button
          onClick={() => {
            if (isAuthenticated) {
              signOut();
            } else {
              openAuthModal('signup');
            }
          }}
          className="w-full p-3 rounded-2xl hover:bg-rose-950/40 flex items-center justify-between transition-colors text-rose-400"
        >
          <div className="flex items-center space-x-2.5">
            {isAuthenticated ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span className="font-semibold">{isAuthenticated ? 'Log Out' : 'Sign In'}</span>
          </div>
        </button>
      </div>
    </div>
  );
};
