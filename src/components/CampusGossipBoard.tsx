import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  MessageCircle,
  Share2,
  Flag,
  Send,
  Sparkles,
  Heart,
  Eye,
  CheckCircle2,
  UserCheck,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Plus,
  X,
  Filter,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabaseService } from '../services/supabaseService';
import { GossipPost } from '../types';

const GOSSIP_TAGS = [
  'All',
  '🔥 Hot Tea',
  '💘 Campus Crush',
  '🏢 Hostel Drama',
  '📚 Faculty Gist',
  '👀 Spotted',
  '🤐 Secret Confession',
  '💃 Socials & Vibes',
];

const ANON_ALIASES = [
  'Main Campus Spy 🕵️',
  'Hostel B Roommate 🤫',
  'Law Library Ghost 👻',
  'Management Sciences Gossip Girl 💅',
  'ETF Hall Whispers 👂',
  'Faculty of Arts Poet 🎭',
  'UniAbuja Techie Bro 💻',
  'Senate Building Insider 🏛️',
];

export const CampusGossipBoard: React.FC = () => {
  const {
    gossipPosts,
    addGossipPost,
    reactToGossipPost,
    addGossipComment,
    likeGossipComment,
    reportGossipPost,
    currentUser,
    isAuthenticated,
    requestAuthentication,
  } = useApp();

  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [isComposing, setIsComposing] = useState(false);
  const [content, setContent] = useState('');
  const [tag, setTag] = useState('🔥 Hot Tea');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [anonymousAlias, setAnonymousAlias] = useState(ANON_ALIASES[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState('');

  // Active expanded comments per post ID
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  // Comment inputs per post ID
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentAnonMap, setCommentAnonMap] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAuthenticatedAction = (action: () => void) => {
    if (requestAuthentication()) action();
  };

  const filteredPosts = gossipPosts.filter((post) => {
    if (selectedTag === 'All') return true;
    return post.tag.toLowerCase().includes(selectedTag.replace(/[^a-zA-Z]/g, '').toLowerCase()) ||
      post.tag === selectedTag;
  });

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImageError('');
    if (!file.type.startsWith('image/')) {
      setImageError('Please choose an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError('Images must be smaller than 10 MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setShowImageInput(true);
  };

  const clearSelectedImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview('');
    setImageError('');
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestAuthentication()) return;
    if (!content.trim() || isUploadingImage) return;

    let uploadedImageUrl: string | undefined;
    if (imageFile) {
      setImageError('');
      setIsUploadingImage(true);
      const upload = await supabaseService.uploadUserMedia(imageFile, currentUser.id, 'gossip');
      setIsUploadingImage(false);
      if (!upload.url) {
        setImageError(upload.error || 'Could not upload that photo.');
        return;
      }
      uploadedImageUrl = upload.url;
    }

    addGossipPost(
      content.trim(),
      tag,
      isAnonymous,
      isAnonymous ? anonymousAlias : undefined,
      uploadedImageUrl
    );

    setContent('');
    clearSelectedImage();
    setShowImageInput(false);
    setIsComposing(false);
    showToast('☕ Tea spilled on UniAbuja Gossip Board!');
  };

  const handleSendComment = (postId: string) => {
    if (!requestAuthentication()) return;
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const isAnon = commentAnonMap[postId] !== false; // default to true
    addGossipComment(postId, text, isAnon);

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    showToast('💬 Comment dropped!');
  };

  const handleShare = (post: GossipPost) => {
    if (navigator.share) {
      navigator.share({
        title: `UniAbuja Tea: ${post.tag}`,
        text: `"${post.content.slice(0, 80)}..." - Read more on UoA MeetUps Gossip Board!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`UniAbuja Gossip: "${post.content}" - On UoA MeetUps`);
      showToast('📋 Gossip link copied to clipboard!');
    }
  };

  return (
    <div className="w-full mt-4 text-left" id="campus-gossip-board">
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-purple-900/95 border border-purple-400 text-white text-xs font-semibold shadow-xl backdrop-blur-md flex items-center space-x-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Board Header Banner */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1e0734] via-[#160628] to-[#0d0218] border border-purple-800/50 shadow-xl mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-fuchsia-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-fuchsia-900/40">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="text-sm font-black text-white tracking-wide flex items-center">
                  Campus Gossip & Tea
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-gradient-to-r from-red-500/20 to-orange-500/20 text-orange-300 border border-orange-500/30">
                  LIVE GIST
                </span>
              </div>
              <p className="text-[11px] text-purple-300/80">
                Hostel drama, secret crushes & confessions across UniAbuja
              </p>
              {!isAuthenticated && (
                <p className="mt-1 text-[10px] font-semibold text-amber-300/90">
                  Sign up to spill tea, react, comment, or flag a post.
                </p>
              )}
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (requestAuthentication()) setIsComposing(!isComposing);
            }}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold shadow-md shadow-purple-900/50 flex items-center space-x-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Spill Tea</span>
          </motion.button>
        </div>

        {/* Compose Form */}
        <AnimatePresence>
          {isComposing && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handlePostSubmit}
              className="mt-3 pt-3 border-t border-purple-800/40 space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs text-purple-200">
                <span className="font-bold flex items-center space-x-1">
                  <span>☕ Spill Campus Gist</span>
                  <span className="text-[10px] text-purple-400 font-normal">(Visible to all students)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="p-1 text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's the tea? (e.g. Someone just proposed at ETF Lecture Hall! Or: Who is the fine guy in 300L Law? 👀)"
                rows={3}
                className="w-full text-xs p-3 rounded-xl bg-black/40 border border-purple-800/60 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400 resize-none"
                required
              />

              {/* Tag Selector & Gallery Photo */}
              <div className="flex flex-wrap items-center gap-1.5">
                {GOSSIP_TAGS.filter((t) => t !== 'All').map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      tag === t
                        ? 'bg-purple-600 text-white border-purple-400'
                        : 'bg-purple-950/40 text-purple-300 border-purple-900 hover:border-purple-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {showImageInput && (
                <div className="space-y-2">
                  {imagePreview ? (
                    <div className="relative w-full h-32 rounded-xl overflow-hidden border border-purple-700/60">
                      <img src={imagePreview} alt="Selected attachment preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={clearSelectedImage}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-rose-700"
                        aria-label="Remove selected photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {isUploadingImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-[11px] font-bold text-white">
                          Uploading photo...
                        </div>
                      )}
                    </div>
                  ) : (
                    <label htmlFor="gossip-photo-upload" className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-purple-800/60 bg-black/30 text-xs font-semibold text-purple-200 cursor-pointer hover:border-purple-400">
                      <ImageIcon className="w-4 h-4" />
                      Choose a photo from your gallery
                      <input
                        id="gossip-photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="sr-only"
                      />
                    </label>
                  )}
                  {imageError && <p className="text-[10px] font-semibold text-rose-300">{imageError}</p>}
                </div>
              )}

              {/* Identity selector & Post action */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center space-x-1.5 transition-all ${
                      isAnonymous
                        ? 'bg-fuchsia-950/80 border-fuchsia-500 text-fuchsia-300'
                        : 'bg-neutral-900 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <span>{isAnonymous ? '🎭 Posting as Anonymous' : `👤 Posting as ${currentUser.name.split(' ')[0]}`}</span>
                  </button>

                  {isAnonymous && (
                    <select
                      value={anonymousAlias}
                      onChange={(e) => setAnonymousAlias(e.target.value)}
                      className="text-[10px] p-1 rounded-lg bg-purple-950 border border-purple-800 text-purple-200 focus:outline-none"
                    >
                      {ANON_ALIASES.map((alias) => (
                        <option key={alias} value={alias}>
                          {alias}
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowImageInput(!showImageInput)}
                    className={`p-1.5 rounded-lg border text-xs transition-colors ${
                      showImageInput || imageFile
                        ? 'bg-purple-900/60 border-purple-400 text-purple-200'
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    title="Add photo"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md disabled:opacity-40"
                >
                  <Send className="w-3 h-3" />
                  <span>Spill Tea</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
        {GOSSIP_TAGS.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTag(t)}
            className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
              selectedTag === t
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'bg-[#150727] text-neutral-400 hover:text-neutral-200 border border-purple-950'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Gossip Post Cards List */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-[#120521] border border-purple-950 text-neutral-400 text-xs">
            <Flame className="w-8 h-8 mx-auto mb-2 text-purple-500/50" />
            <p className="font-semibold text-neutral-300">No tea spilled under this category yet.</p>
            <p className="text-[11px] text-neutral-500 mt-1">Be the first to share campus gist!</p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isCommentsOpen = !!expandedComments[post.id];
            const currentInput = commentInputs[post.id] || '';
            const isAnonComment = commentAnonMap[post.id] !== false;

            return (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 rounded-2xl bg-gradient-to-b from-[#160628] to-[#0f041b] border border-purple-900/40 shadow-lg text-left transition-all hover:border-purple-700/50"
              >
                {/* Post Author Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    {post.isAnonymous ? (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-800 to-fuchsia-900 border border-purple-500/40 flex items-center justify-center text-sm shadow">
                        🎭
                      </div>
                    ) : (
                      post.authorAvatar ? (
                        <img
                          src={post.authorAvatar}
                          alt={post.authorName}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-purple-500/40 shadow"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-950 border border-purple-500/40 flex items-center justify-center text-xs font-black text-purple-200">
                          {post.authorName.slice(0, 1).toUpperCase()}
                        </div>
                      )
                    )}

                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-xs font-bold text-white leading-none">
                          {post.authorName}
                        </h4>
                        {!post.isAnonymous && (
                          <CheckCircle2 className="w-3 h-3 text-purple-400" />
                        )}
                      </div>
                      <p className="text-[10px] text-purple-300/70 mt-0.5">
                        {post.authorDepartment} {post.authorLevel ? `• ${post.authorLevel}` : ''} • {post.timeAgo}
                      </p>
                    </div>
                  </div>

                  {/* Post Tag Pill */}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-800/60 shadow-sm shrink-0">
                    {post.tag}
                  </span>
                </div>

                {/* Post Content */}
                <p className="mt-2.5 text-xs text-neutral-100 leading-relaxed whitespace-pre-wrap font-normal">
                  {post.content}
                </p>

                {/* Optional Image */}
                {post.imageUrl && (
                  <div className="mt-2.5 rounded-xl overflow-hidden border border-purple-900/60 max-h-56 bg-black">
                    <img
                      src={post.imageUrl}
                      alt="Gossip attachment"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Interactive Reactions Bar */}
                <div className="mt-3 pt-2.5 border-t border-purple-950 flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center space-x-1">
                    {/* Spicy */}
                    <button
                      onClick={() => handleAuthenticatedAction(() => reactToGossipPost(post.id, 'spicy'))}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold border flex items-center space-x-1 transition-all ${
                        post.userReaction === 'spicy'
                          ? 'bg-red-950/90 border-red-500 text-red-300 shadow-sm shadow-red-950'
                          : 'bg-purple-950/30 border-purple-900/60 text-neutral-300 hover:border-purple-700'
                      }`}
                    >
                      <span>🌶️</span>
                      <span>{post.spicyCount}</span>
                    </button>

                    {/* Cap */}
                    <button
                      onClick={() => handleAuthenticatedAction(() => reactToGossipPost(post.id, 'cap'))}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold border flex items-center space-x-1 transition-all ${
                        post.userReaction === 'cap'
                          ? 'bg-blue-950/90 border-blue-500 text-blue-300 shadow-sm shadow-blue-950'
                          : 'bg-purple-950/30 border-purple-900/60 text-neutral-300 hover:border-purple-700'
                      }`}
                    >
                      <span>🧢</span>
                      <span>{post.capCount}</span>
                    </button>

                    {/* Facts */}
                    <button
                      onClick={() => handleAuthenticatedAction(() => reactToGossipPost(post.id, 'facts'))}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold border flex items-center space-x-1 transition-all ${
                        post.userReaction === 'facts'
                          ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-950'
                          : 'bg-purple-950/30 border-purple-900/60 text-neutral-300 hover:border-purple-700'
                      }`}
                    >
                      <span>💯</span>
                      <span>{post.factsCount}</span>
                    </button>

                    {/* Tea */}
                    <button
                      onClick={() => handleAuthenticatedAction(() => reactToGossipPost(post.id, 'tea'))}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold border flex items-center space-x-1 transition-all ${
                        post.userReaction === 'tea'
                          ? 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-sm shadow-amber-950'
                          : 'bg-purple-950/30 border-purple-900/60 text-neutral-300 hover:border-purple-700'
                      }`}
                    >
                      <span>☕</span>
                      <span>{post.teaCount}</span>
                    </button>
                  </div>

                  {/* Actions Right: Comments & Share */}
                  <div className="flex items-center space-x-1.5 text-neutral-400">
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="px-2 py-1 rounded-lg bg-purple-950/40 hover:bg-purple-900/50 text-[11px] font-medium text-purple-300 flex items-center space-x-1 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{post.comments.length}</span>
                      {isCommentsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <button
                      onClick={() => handleShare(post)}
                      className="p-1.5 rounded-lg hover:bg-purple-950/60 text-neutral-400 hover:text-white transition-colors"
                      title="Share Gossip"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleAuthenticatedAction(() => reportGossipPost(post.id))}
                      className="p-1.5 rounded-lg hover:bg-red-950/60 text-neutral-400 hover:text-red-400 transition-colors"
                      title="Flag post"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Comments Section */}
                <AnimatePresence>
                  {isCommentsOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-purple-900/40 space-y-2.5"
                    >
                      {/* Comments list */}
                      {post.comments.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {post.comments.map((comment) => (
                            <div
                              key={comment.id}
                              className="p-2 rounded-xl bg-purple-950/30 border border-purple-900/40 text-xs text-left"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-purple-200 text-[11px]">
                                    {comment.authorName}
                                  </span>
                                  {comment.authorBadge && (
                                    <span className="px-1 py-0.2 rounded text-[8px] bg-purple-900/80 text-purple-300">
                                      {comment.authorBadge}
                                    </span>
                                  )}
                                  <span className="text-[9px] text-neutral-500">
                                    • {comment.timeAgo}
                                  </span>
                                </div>

                                <button
                                  onClick={() => handleAuthenticatedAction(() => likeGossipComment(post.id, comment.id))}
                                  className={`flex items-center space-x-1 text-[10px] ${
                                    comment.userLiked ? 'text-pink-400 font-bold' : 'text-neutral-400 hover:text-pink-300'
                                  }`}
                                >
                                  <Heart className={`w-3 h-3 ${comment.userLiked ? 'fill-current' : ''}`} />
                                  <span>{comment.likes}</span>
                                </button>
                              </div>
                              <p className="text-neutral-200 mt-1 text-[11px] leading-relaxed">
                                {comment.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-neutral-500 italic">No comments yet. Drop your reaction below!</p>
                      )}

                      {/* Comment Input Form */}
                      <div className="flex items-center space-x-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleAuthenticatedAction(() =>
                            setCommentAnonMap((prev) => ({
                              ...prev,
                              [post.id]: !isAnonComment,
                            }))
                          )}
                          className={`p-1.5 rounded-xl border text-[10px] font-bold shrink-0 transition-colors ${
                            isAnonComment
                              ? 'bg-fuchsia-950 border-fuchsia-700 text-fuchsia-300'
                              : 'bg-purple-950 border-purple-700 text-purple-300'
                          }`}
                          title={isAnonComment ? 'Commenting as Anon' : `Commenting as ${currentUser.name.split(' ')[0]}`}
                        >
                          {isAnonComment ? '🎭 Anon' : '👤 Me'}
                        </button>

                        <input
                          type="text"
                          value={currentInput}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendComment(post.id);
                          }}
                          disabled={!isAuthenticated}
                          placeholder={isAuthenticated ? 'Drop a comment or confirm gist...' : 'Sign up to comment'}
                          className="flex-1 text-xs p-2 rounded-xl bg-black/40 border border-purple-800/60 text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400"
                        />

                        <button
                          type="button"
                          onClick={() => handleAuthenticatedAction(() => handleSendComment(post.id))}
                          disabled={!currentInput.trim()}
                          className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:opacity-90 disabled:opacity-40 shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
