import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Sparkles, X, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CampusStory } from '../types';

export const CampusStoriesBar: React.FC = () => {
  const { stories, setActiveStory, currentUser, addCampusStory } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [selectedTag, setSelectedTag] = useState('Campus Vibe');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [postError, setPostError] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (!isAddModalOpen) {
      setSelectedPhotoIndex(0);
      setPostError('');
      return;
    }

    setSelectedPhotoIndex((currentIndex) =>
      currentUser.photos.length > 0
        ? Math.min(currentIndex, currentUser.photos.length - 1)
        : 0,
    );
  }, [isAddModalOpen, currentUser.photos.length]);

  const PRESET_TAGS = [
    'Campus Vibe',
    'Study Session',
    'Senate Plaza',
    'Music',
    'Suya & Chill',
    'Gym Session',
    'Arts & Drama',
  ];

  const handlePostStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim()) return;
    const photoUrl = currentUser.photos[selectedPhotoIndex] || currentUser.photos[0];
    if (!photoUrl) {
      setPostError('Add a real profile photo before posting a story.');
      return;
    }

    setPostError('');
    setIsPosting(true);
    const posted = await addCampusStory(newCaption.trim(), selectedTag, photoUrl);
    setIsPosting(false);
    if (!posted) {
      setPostError('Your story could not be published. Please try again.');
      return;
    }

    setNewCaption('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="w-full pb-1" id="campus-stories-section">
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <p className="uoa-section-kicker">Campus stories</p>
          <h2 className="mt-1 text-lg font-extrabold tracking-tight text-white">What’s happening on campus</h2>
        </div>
        <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-white/55 ring-1 ring-white/10">
          {stories.length > 0 ? 'Live stories' : 'Be the first to post'}
        </span>
      </div>

      {/* Horizontal Story Reel */}
      <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-1 pt-0.5 px-0.5">
        {/* Add Story Button */}
        <div className="flex flex-col items-center space-y-1 shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAddModalOpen(true)}
            className="relative h-14 w-14 rounded-full border border-pink-300/40 bg-pink-500/10 p-[2px] transition-transform group hover:scale-[1.03] sm:h-16 sm:w-16"
            id="btn-add-campus-story"
          >
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-[#0d0710] bg-[#1b1022] text-sm font-black text-pink-100">
              {currentUser.photos[0] ? (
                <img
                  src={currentUser.photos[0]}
                  alt="Your profile"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <Camera className="w-5 h-5 text-orange-300" />
              )}
            </div>
            <div className="absolute bottom-0 right-0 rounded-full border-2 border-[#0d0710] bg-white p-1 text-[#29112e] shadow-sm">
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
          </motion.button>
          <span className="max-w-[62px] truncate text-[11px] font-semibold text-white/65">
            Add story
          </span>
        </div>

        {/* Stories from students */}
        {stories.length === 0 && (
          <p className="px-2 text-[11px] leading-relaxed text-neutral-400">Be the first to post—share what’s happening around campus.</p>
        )}
        {stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center space-y-1 shrink-0">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveStory(story)}
              className="group relative h-14 w-14 rounded-full border border-pink-300/35 bg-pink-500/10 p-[2px] transition-transform hover:scale-[1.03] sm:h-16 sm:w-16"
              id={`story-btn-${story.id}`}
            >
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-[#0d0710] bg-[#1b1022] text-sm font-black text-pink-100">
                {story.avatar ? (
                  <img
                    src={story.avatar}
                    alt={story.userName}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  story.userName.slice(0, 1).toUpperCase()
                )}
              </div>
            </motion.button>
            <span className="max-w-[64px] truncate text-[11px] font-medium text-white/70">
              {story.userName}
            </span>
          </div>
        ))}
      </div>

      {/* Post Story Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="w-full max-w-sm rounded-3xl bg-[#130722] border border-orange-700/50 p-5 shadow-2xl space-y-4"
              id="modal-add-story"
            >
              <div className="flex items-center justify-between border-b border-orange-900/60 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                  <h3 className="text-base font-black font-display text-white">
                    Post Campus Story
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-full hover:bg-orange-900/50 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePostStory} className="space-y-3.5">
                {/* Photo Preview Selector */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1.5">
                    Select Story Cover Photo
                  </label>
                  <div className="flex items-center space-x-2 overflow-x-auto py-1">
                    {currentUser.photos.length === 0 && (
                      <p className="text-[11px] text-neutral-400">Add a profile photo before sharing a story.</p>
                    )}
                    {currentUser.photos.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedPhotoIndex(idx);
                          setPostError('');
                        }}
                        className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                          selectedPhotoIndex === idx
                            ? 'border-orange-400 scale-105 shadow-md shadow-orange-900/60 ring-2 ring-orange-500/50'
                            : 'border-orange-950 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={p} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {postError && (
                  <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-[11px] font-semibold text-rose-300">
                    {postError}
                  </p>
                )}

                {/* Tag Selection */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1.5">
                    Vibe Tag
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(tag)}
                        className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all ${
                          selectedTag === tag
                            ? 'bg-orange-600 text-white font-bold shadow-sm'
                            : 'bg-[#1a0c2e] text-neutral-300 hover:bg-orange-900/50 border border-orange-950'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caption Input */}
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                    Story Caption
                  </label>
                  <textarea
                    rows={2}
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    placeholder="What are you up to on campus today? (e.g. Smoothie break at Senate Plaza...)"
                    className="w-full p-2.5 rounded-xl bg-[#0a0312] border border-orange-800/50 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-400 resize-none"
                    maxLength={140}
                  />
                  <div className="text-right text-[10px] text-neutral-500 mt-0.5">
                    {newCaption.length}/140
                  </div>
                </div>

                <div className="flex space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-orange-950/40 text-neutral-300 text-xs font-semibold hover:bg-orange-900/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newCaption.trim() || !currentUser.photos.length || isPosting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-900/50 disabled:opacity-40 transition-all"
                  >
                    {isPosting ? 'Publishing...' : 'Share Story'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
