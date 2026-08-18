import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  MapPin,
  GraduationCap,
  Sparkles,
  Heart,
  Flag,
  UserX,
  Lock,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Music,
  Share2,
} from 'lucide-react';
import { UserProfile } from '../types';
import { useApp } from '../context/AppContext';

interface ProfileDetailModalProps {
  profile: UserProfile | null;
  onClose: () => void;
  onOpenReport: (profile: UserProfile) => void;
}

export const ProfileDetailModal: React.FC<ProfileDetailModalProps> = ({
  profile,
  onClose,
  onOpenReport,
}) => {
  const { swipeRight, swipeLeft, blockUser } = useApp();
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!profile) return null;

  const handleLike = () => {
    swipeRight(profile);
    onClose();
  };

  const handlePass = () => {
    swipeLeft(profile);
    onClose();
  };

  const handleBlock = () => {
    if (window.confirm(`Are you sure you want to block ${profile.name}? They will no longer see your profile.`)) {
      blockUser(profile.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0c0517] border border-orange-900/40 rounded-none sm:rounded-3xl shadow-2xl overflow-hidden min-h-screen sm:min-h-0 sm:max-h-[92vh] flex flex-col">
        {/* Close Button Floating */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-black/80 transition-all shadow-lg"
          id="close-profile-detail-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-24">
          {/* Main Photo Gallery Hero */}
          <div className="relative w-full h-[400px] sm:h-[440px] bg-black">
            <img
              src={profile.photos[photoIndex] || profile.photos[0]}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0517] via-transparent to-black/40" />

            {/* Photo Navigation dots */}
            {profile.photos.length > 1 && (
              <div className="absolute top-4 left-4 right-16 flex space-x-1.5 z-20">
                {profile.photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIndex(i)}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i === photoIndex ? 'bg-orange-300 shadow-[0_0_8px_#ff59ad]' : 'bg-black/60'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Arrow Navs */}
            {profile.photos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIndex((p) => (p - 1 >= 0 ? p - 1 : profile.photos.length - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white backdrop-blur-sm border border-white/10 hover:bg-black/70"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPhotoIndex((p) => (p + 1 < profile.photos.length ? p + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white backdrop-blur-sm border border-white/10 hover:bg-black/70"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Floating Badges */}
            <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-center gap-2 z-10">
              {profile.isVerified && (
                <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-orange-900/90 border border-orange-400 text-orange-100 text-xs font-bold shadow-md backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4 text-orange-300" />
                  <span>UniAbuja Verified Student</span>
                </span>
              )}
              {profile.mode === 'lowkey' && (
                <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-orange-950/90 border border-orange-400 text-orange-200 text-xs font-bold backdrop-blur-md">
                  <Lock className="w-3.5 h-3.5 text-orange-300" />
                  <span>Lowkey Discreet Mode</span>
                </span>
              )}
            </div>
          </div>

          {/* Profile Details Body */}
          <div className="p-5 sm:p-6 space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-baseline justify-between">
                <h1 className="text-3xl font-black font-display text-white">
                  {profile.name} <span className="text-2xl font-light text-orange-300">{profile.age}</span>
                </h1>
                <span className="text-xs text-neutral-400">{profile.gender}</span>
              </div>

              {/* Department, Faculty, Level */}
              <div className="mt-2 flex flex-col space-y-1">
                <div className="flex items-center space-x-2 text-sm text-orange-200 font-semibold">
                  <GraduationCap className="w-4 h-4 text-orange-400" />
                  <span className="bg-orange-950 px-2 py-0.5 rounded text-xs text-orange-300 border border-orange-800/40">
                    {profile.level}
                  </span>
                  <span>{profile.department}</span>
                </div>
                <div className="text-xs text-neutral-400 pl-6">
                  {profile.faculty} • {profile.course}
                </div>
                <div className="flex items-center space-x-2 text-xs text-neutral-400 pl-6 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0 -ml-5" />
                  <span>{profile.campusLocation}</span>
                </div>
              </div>
            </div>

            {/* Looking For Card */}
            <div className="p-4 rounded-2xl bg-[#140a24] border border-orange-900/40 flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Looking For</span>
                <p className="text-sm font-bold text-orange-200 capitalize mt-0.5">
                  {profile.lookingFor === 'both' ? 'Dating & Lowkey Connections' : `${profile.lookingFor} on Campus`}
                </p>
              </div>
              <span className="text-2xl">
                {profile.lookingFor === 'lowkey' ? '🔒' : profile.lookingFor === 'both' ? '💜' : '🥂'}
              </span>
            </div>

            {/* Bio Section */}
            <div>
              <h3 className="text-xs uppercase font-bold tracking-wider text-orange-400 mb-2">About Me</h3>
              <p className="text-neutral-200 text-sm leading-relaxed whitespace-pre-line bg-[#10061d] p-4 rounded-2xl border border-orange-950">
                {profile.bio}
              </p>
            </div>

            {/* Icebreaker Prompts */}
            {profile.icebreakerPrompts && profile.icebreakerPrompts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs uppercase font-bold tracking-wider text-orange-400 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Icebreaker Prompts</span>
                </h3>
                {profile.icebreakerPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="p-4 rounded-2xl bg-gradient-to-br from-[#180b2c] to-[#120817] border border-orange-800/40 shadow-sm"
                  >
                    <p className="text-xs font-semibold text-orange-300 uppercase tracking-wide">
                      {prompt.question}
                    </p>
                    <p className="text-sm text-neutral-100 font-medium mt-1.5 leading-relaxed">
                      "{prompt.answer}"
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Additional Photos Grid if user has > 1 photo */}
            {profile.photos.length > 1 && (
              <div className="space-y-2">
                <h3 className="text-xs uppercase font-bold tracking-wider text-orange-400">More Photos</h3>
                <div className="grid grid-cols-2 gap-2">
                  {profile.photos.slice(1).map((photo, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPhotoIndex(idx + 1)}
                      className="relative h-44 rounded-2xl overflow-hidden border border-orange-950 cursor-pointer group"
                    >
                      <img
                        src={photo}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interests Tags */}
            {profile.interests && profile.interests.length > 0 && (
              <div>
                <h3 className="text-xs uppercase font-bold tracking-wider text-orange-400 mb-2">Campus Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full bg-orange-950/70 border border-orange-800/50 text-xs font-medium text-orange-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* University Verified Guarantee Badge */}
            <div className="p-4 rounded-2xl bg-orange-950/40 border border-orange-800/30 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-300">
                <span className="font-bold text-white block">UniAbuja Identity Safeguard</span>
                {profile.isVerified
                  ? 'This profile has passed UniAbuja identity verification.'
                  : 'This profile has not been identity-verified yet.'}
              </div>
            </div>

            {/* Safety Actions: Report & Block */}
            <div className="pt-4 border-t border-orange-950/60 flex items-center justify-between">
              <button
                onClick={() => {
                  onClose();
                  onOpenReport(profile);
                }}
                className="flex items-center space-x-1.5 text-xs text-neutral-400 hover:text-rose-400 transition-colors"
                id="report-profile-btn"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Report Student</span>
              </button>

              <button
                onClick={handleBlock}
                className="flex items-center space-x-1.5 text-xs text-neutral-400 hover:text-rose-400 transition-colors"
                id="block-profile-btn"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Block User</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#090410] via-[#090410]/95 to-transparent border-t border-orange-950/80 flex items-center justify-center space-x-6 backdrop-blur-xl z-40">
          <button
            onClick={handlePass}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#160924] border border-rose-600/40 text-rose-300 font-bold text-sm flex items-center justify-center space-x-2 hover:bg-rose-950/50 transition-all shadow-md"
            id="detail-modal-pass-btn"
          >
            <X className="w-4 h-4" />
            <span>Pass</span>
          </button>

          <button
            onClick={handleLike}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-600 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-orange-900/50 hover:brightness-110 transition-all"
            id="detail-modal-like-btn"
          >
            <Heart className="w-4 h-4 fill-white" />
            <span>Meet & Connect</span>
          </button>
        </div>
      </div>
    </div>
  );
};
