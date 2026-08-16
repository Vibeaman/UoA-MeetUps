import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Sparkles, X, Image as ImageIcon, Flame, Camera } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CampusStory } from '../types';

export const CampusStoriesBar: React.FC = () => {
  const { stories, setActiveStory, currentUser, addCampusStory } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [selectedTag, setSelectedTag] = useState('✨ Campus Vibe');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  const PRESET_TAGS = [
    '✨ Campus Vibe',
    '📖 Study Session',
    '🥤 Senate Plaza',
    '🎧 Afrotech & Music',
    '🍢 Suya & Chill',
    '💪 Gym Session',
    '🎭 Arts & Drama',
  ];

  const handlePostStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaption.trim()) return;
    const photoUrl = currentUser.photos[selectedPhotoIndex] || currentUser.photos[0];
    addCampusStory(newCaption.trim(), selectedTag, photoUrl);
    setNewCaption('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="w-full mb-3" id="campus-stories-section">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold font-display text-purple-200 uppercase tracking-wider">
            Campus Pulse & Highlights
          </span>
        </div>
        <span className="text-[10px] font-medium text-purple-400/80 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-800/40">
          Live Today
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
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-pink-500 shadow-md group"
            id="btn-add-campus-story"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-neutral-900 border-2 border-[#090410]">
              <img
                src={currentUser.photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt="My Avatar"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="absolute bottom-0 right-0 p-1 rounded-full bg-gradient-to-tr from-purple-500 to-fuchsia-500 text-white border-2 border-[#090410] shadow-sm">
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
          </motion.button>
          <span className="text-[11px] font-semibold text-neutral-300 truncate max-w-[62px]">
            Your Vibe
          </span>
        </div>

        {/* Stories from students */}
        {stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center space-y-1 shrink-0">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveStory(story)}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-amber-400 shadow-lg shadow-purple-950/50 group"
              id={`story-btn-${story.id}`}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-[#10061c] border-2 border-[#090410]">
                <img
                  src={story.avatar}
                  alt={story.userName}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="absolute -top-1 -right-1 px-1 rounded-full bg-purple-900/90 text-[8px] font-black text-purple-200 border border-purple-400/50">
                {story.tag.split(' ')[0]}
              </div>
            </motion.button>
            <span className="text-[11px] font-medium text-neutral-200 truncate max-w-[64px]">
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
              className="w-full max-w-sm rounded-3xl bg-[#130722] border border-purple-700/50 p-5 shadow-2xl space-y-4"
              id="modal-add-story"
            >
              <div className="flex items-center justify-between border-b border-purple-900/60 pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="text-base font-black font-display text-white">
                    Post Campus Story
                  </h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-full hover:bg-purple-900/50 text-neutral-400 hover:text-white transition-colors"
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
                    {currentUser.photos.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPhotoIndex(idx)}
                        className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                          selectedPhotoIndex === idx
                            ? 'border-purple-400 scale-105 shadow-md shadow-purple-900/60 ring-2 ring-purple-500/50'
                            : 'border-purple-950 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={p} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

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
                            ? 'bg-purple-600 text-white font-bold shadow-sm'
                            : 'bg-[#1a0c2e] text-neutral-300 hover:bg-purple-900/50 border border-purple-950'
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
                    className="w-full p-2.5 rounded-xl bg-[#0a0312] border border-purple-800/50 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400 resize-none"
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
                    className="flex-1 py-2.5 rounded-xl bg-purple-950/40 text-neutral-300 text-xs font-semibold hover:bg-purple-900/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newCaption.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-bold shadow-lg shadow-purple-900/50 disabled:opacity-40 transition-all"
                  >
                    Share Vibe ⚡
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
