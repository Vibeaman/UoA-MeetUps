import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Sparkles, Send, GraduationCap, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfile } from '../types';

export const CampusStoryModal: React.FC = () => {
  const { activeStory, setActiveStory, profiles, sendDirectSpark, toggleCampusStoryLike } = useApp();
  const [replyText, setReplyText] = useState('');
  const [progress, setProgress] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [likeError, setLikeError] = useState('');

  // Find user profile linked to this story
  const authorProfile: UserProfile | undefined = profiles.find(
    (p) => p.id === activeStory?.userId
  );

  // Auto-advancing story timer (7 seconds)
  useEffect(() => {
    if (!activeStory) {
      setProgress(0);
      return;
    }

    setProgress(0);
    const intervalTime = 50; // update every 50ms
    const totalDuration = 7000;
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setActiveStory(null);
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeStory, setActiveStory]);

  if (!activeStory) return null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !authorProfile) return;
    sendDirectSpark(authorProfile, `Replying to your story: "${replyText.trim()}"`);
    setReplyText('');
    setActiveStory(null);
  };

  const handleQuickLike = async () => {
    if (!activeStory || isLiking) return;

    setLikeError('');
    setIsLiking(true);
    try {
      const saved = await toggleCampusStoryLike(activeStory.id);
      if (!saved) setLikeError('Your story like could not be saved. Please try again.');
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-2 sm:p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm h-[82vh] max-h-[640px] rounded-3xl overflow-hidden bg-neutral-950 border border-orange-800/40 shadow-2xl flex flex-col justify-between"
        id="campus-story-viewer-modal"
      >
        {/* Story Background Image */}
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <img
            src={activeStory.storyImage}
            alt={activeStory.userName}
            className="max-h-full max-w-full object-contain brightness-[0.85]"
          />
        </div>

        {/* Top Vignette Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 pointer-events-none" />

        {/* Story Progress Bar */}
        <div className="relative z-20 pt-3 px-3">
          <div className="w-full h-1 rounded-full bg-white/25 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-400 to-orange-400"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Author Header */}
          <div className="flex items-center justify-between mt-2.5">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-orange-400 shrink-0">
                {activeStory.avatar ? (
                  <img src={activeStory.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-orange-900/80 text-orange-100 flex items-center justify-center text-xs font-bold">
                    {activeStory.userName
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div className="text-left">
                <div className="flex items-center space-x-1.5">
                  <span className="text-sm font-bold text-white font-display">
                    {activeStory.userName}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-900/80 text-orange-200 border border-orange-600/40">
                    {activeStory.level}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-[10px] text-neutral-300">
                  <span>{activeStory.department}</span>
                  <span>•</span>
                  <span>{activeStory.postedAt}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveStory(null)}
              className="p-1.5 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Story Middle / Bottom Content */}
        <div className="relative z-20 p-4 space-y-3 mt-auto">
          {/* Tag & Caption Card */}
          <div className="p-3.5 rounded-2xl bg-black/60 backdrop-blur-md border border-orange-700/40 text-left space-y-1.5">
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-orange-900/90 text-orange-200 text-[10px] font-extrabold border border-orange-400/50">
              {activeStory.tag}
            </div>
            <p className="text-xs text-white leading-relaxed font-medium">
              {activeStory.caption}
            </p>
          </div>

          {/* Quick Reaction & Reply Bar */}
          <div className="flex items-center space-x-2">
            <form onSubmit={handleSendReply} className="flex-1 relative flex items-center">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Send a spark to ${activeStory.userName}...`}
                className="w-full py-2.5 pl-3.5 pr-10 rounded-full bg-white/10 border border-white/20 text-xs text-white placeholder-neutral-400 backdrop-blur-md focus:outline-none focus:border-orange-400 focus:bg-white/15"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="absolute right-1.5 p-1.5 rounded-full bg-orange-600 text-white disabled:opacity-30 transition-all hover:bg-orange-500"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="flex shrink-0 flex-col items-center gap-1">
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleQuickLike}
                disabled={isLiking}
                aria-label={activeStory.userLiked ? 'Unlike story' : 'Like story'}
                className={`rounded-full border p-2.5 text-white shadow-lg transition-colors disabled:cursor-wait disabled:opacity-70 ${
                  activeStory.userLiked
                    ? 'border-rose-200/80 bg-rose-500'
                    : 'border-white/20 bg-gradient-to-tr from-rose-600 to-orange-600'
                }`}
                title={activeStory.userLiked ? 'Unlike story' : 'Like story'}
              >
                <Heart className={`h-5 w-5 ${activeStory.userLiked ? 'fill-white' : ''}`} />
              </motion.button>
              <span className="text-[10px] font-semibold text-white/80">
                {activeStory.likesCount ?? 0}
              </span>
            </div>
            {likeError && (
              <p role="alert" className="absolute bottom-20 left-4 right-4 rounded-xl border border-rose-400/30 bg-black/70 px-3 py-2 text-center text-[11px] font-semibold text-rose-200">
                {likeError}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
