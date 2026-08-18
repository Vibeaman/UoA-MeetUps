import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker, { Emoji, EmojiStyle, Theme } from 'emoji-picker-react';
import emojiRegex from 'emoji-regex';
import {
  MessageCircle,
  Send,
  Image as ImageIcon,
  ShieldCheck,
  MoreVertical,
  ChevronLeft,
  Flame,
  Lock,
  Clock,
  Flag,
  UserX,
  Sparkles,
  Info,
  CheckCheck,
  Eye,
  Camera,
  Trash2,
  Smile,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MatchItem, ChatMessage, UserProfile } from '../types';
import { supabaseService } from '../services/supabaseService';

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

const unicodeToUnified = (value: string) =>
  Array.from(value)
    .map((character) => character.codePointAt(0)?.toString(16))
    .filter((codePoint): codePoint is string => Boolean(codePoint))
    .join('-');

const renderChatText = (text: string) => {
  const segments: React.ReactNode[] = [];
  const matcher = emojiRegex();
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let emojiIndex = 0;

  while ((match = matcher.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }

    segments.push(
      <span key={`emoji-${emojiIndex}-${match.index}`} className="inline-flex align-middle">
        <Emoji
          unified={unicodeToUnified(match[0])}
          emojiStyle={EmojiStyle.APPLE}
          size={18}
        />
      </span>,
    );
    emojiIndex += 1;
    lastIndex = matcher.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }

  return segments.length > 0 ? segments : text;
};

interface ChatViewProps {
  onOpenProfileDetails: (profile: UserProfile) => void;
  onOpenReport: (profile: UserProfile) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ onOpenProfileDetails, onOpenReport }) => {
  const {
    matches,
    currentChatMatch,
    setCurrentChatMatch,
    messages,
    sendMessage,
    currentUser,
    unmatchUser,
    blockUser,
  } = useApp();

  const [inputMessage, setInputMessage] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [viewOnceActive, setViewOnceActive] = useState(false);
  const [viewedOncePhotos, setViewedOncePhotos] = useState<Record<string, boolean>>({});
  const [showIcebreakerPicker, setShowIcebreakerPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = currentChatMatch ? messages[currentChatMatch.id] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, currentChatMatch]);

  const handleSend = async () => {
    if (!currentChatMatch || !inputMessage.trim()) return;
    const sent = await sendMessage(currentChatMatch.id, inputMessage);
    if (sent) {
      setInputMessage('');
      setShowEmojiPicker(false);
    }
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setInputMessage((current) => `${current}${emojiData.emoji}`);
  };

  const handlePhotoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !currentChatMatch || !currentUser.id) return;

    setPhotoUploadError(null);
    setIsUploadingPhoto(true);
    const { url, error } = await supabaseService.uploadUserMedia(file, currentUser.id, 'chat');
    setIsUploadingPhoto(false);

    if (!url) {
      setPhotoUploadError(error || 'Photo upload failed. Please try again.');
      return;
    }

    const sent = await sendMessage(currentChatMatch.id, '', url, viewOnceActive);
    if (sent) {
      setShowPhotoPicker(false);
      setViewOnceActive(false);
    }
  };

  const handleSendPromptAnswer = async (promptText: string) => {
    if (!currentChatMatch) return;
    const sent = await sendMessage(currentChatMatch.id, `💬 Icebreaker: ${promptText}`);
    if (sent) setShowIcebreakerPicker(false);
  };

  const calculateExpiryDays = (expiresAt: number) => {
    const diffMs = expiresAt - Date.now();
    if (diffMs <= 0) return 'Expired';
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left`;
  };

  // If a chat thread is selected, render the conversation view
  if (currentChatMatch) {
    const matched = currentChatMatch.matchedUser;
    const expiryText = calculateExpiryDays(currentChatMatch.expiresAt);

    return (
      <div className="uoa-surface relative mx-auto flex h-[calc(100dvh-9rem)] min-h-0 w-full max-w-5xl min-w-0 flex-col overflow-hidden rounded-[28px] sm:h-[calc(100dvh-10rem)]">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-3.5 bg-[#120817] border-b border-orange-900/40 z-20">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setCurrentChatMatch(null)}
              className="p-1.5 rounded-full hover:bg-white/10 text-neutral-300 transition-colors"
              id="back-to-matches-list-btn"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Profile Avatar & Info */}
            <div
              onClick={() => onOpenProfileDetails(matched)}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <div className="relative">
                {matched.photos[0] ? (
                  <img
                    src={matched.photos[0]}
                    alt={matched.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-orange-500 shadow-md group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-orange-500 bg-orange-900/70 text-orange-100 flex items-center justify-center text-xs font-bold shadow-md group-hover:scale-105 transition-transform">
                    {getInitials(matched.name)}
                  </div>
                )}
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#120817] ${
                    matched.isOnline ? 'bg-emerald-400' : 'bg-neutral-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-sm text-white group-hover:text-orange-300 transition-colors">
                    {matched.name}
                  </span>
                  {matched.isVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  )}
                  {matched.mode === 'lowkey' && (
                    <Lock className="w-3 h-3 text-orange-400 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-orange-300/80">
                  {matched.level} • {matched.department}
                </div>
              </div>
            </div>
          </div>

          {/* Options dropdown button */}
          <div className="relative">
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="p-2 rounded-full hover:bg-white/10 text-neutral-300"
              id="chat-options-menu-btn"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showOptionsMenu && (
              <div className="absolute right-0 top-10 w-48 bg-[#18092d] border border-orange-800/60 rounded-2xl shadow-2xl py-1.5 z-50 text-xs text-neutral-200 backdrop-blur-xl animate-fadeIn">
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    onOpenProfileDetails(matched);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-orange-900/50 flex items-center space-x-2"
                >
                  <Info className="w-4 h-4 text-orange-400" />
                  <span>View Full Profile</span>
                </button>
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    onOpenReport(matched);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-rose-950/60 text-rose-300 flex items-center space-x-2"
                >
                  <Flag className="w-4 h-4" />
                  <span>Report Student</span>
                </button>
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    if (window.confirm(`Unmatch with ${matched.name}? Conversation will be deleted.`)) {
                      unmatchUser(currentChatMatch.id);
                    }
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-rose-950/60 text-neutral-300 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Unmatch</span>
                </button>
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    if (window.confirm(`Block ${matched.name}?`)) {
                      blockUser(matched.id);
                    }
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-rose-950/60 text-rose-400 flex items-center space-x-2"
                >
                  <UserX className="w-4 h-4" />
                  <span>Block User</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Match Expiry Bar */}
        <div className="bg-orange-950/70 border-b border-orange-900/40 px-3 py-1 flex items-center justify-between text-[11px] text-orange-300">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>Match Expiry: <strong className="text-white">{expiryText}</strong></span>
          </div>
          <span className="text-[10px] text-orange-400/80">Keeps connections fresh</span>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gradient-to-b from-[#0e051a] via-[#090312] to-[#0c0416]">
          {/* Matched Greeting Card */}
          <div className="text-center py-4 px-3 rounded-2xl bg-orange-950/30 border border-orange-900/30 space-y-1.5 my-2">
            <Sparkles className="w-5 h-5 text-orange-400 mx-auto" />
            <p className="text-xs font-bold text-white">
              You matched with {matched.name}!
            </p>
            <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
              {activeMessages.length > 0
                ? 'Keep the conversation going with a message or campus icebreaker.'
                : 'This conversation is ready for its first message. Send a hello or campus icebreaker to start.'}
            </p>
          </div>

          {/* Messages */}
          {activeMessages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const isViewOnce = msg.isPhotoViewOnce;
            const hasBeenViewed = viewedOncePhotos[msg.id];

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`relative max-w-[78%] p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-orange-700 to-orange-700 text-white rounded-br-none shadow-[0_2px_10px_rgba(168,85,247,0.3)]'
                      : 'bg-[#1a0c2e] text-neutral-100 border border-orange-900/50 rounded-bl-none shadow-sm'
                  }`}
                >
                  {/* Photo content */}
                  {msg.imageUrl && (
                    <div className="mb-1.5 rounded-xl overflow-hidden border border-white/10">
                      {isViewOnce && !hasBeenViewed ? (
                        <button
                          onClick={() => setViewedOncePhotos({ ...viewedOncePhotos, [msg.id]: true })}
                          className="flex items-center space-x-2 py-3 px-4 bg-orange-950/90 text-orange-200 font-bold hover:bg-orange-900 transition-all w-full"
                        >
                          <Eye className="w-4 h-4 text-orange-300" />
                          <span>📸 Tap to view view-once photo</span>
                        </button>
                      ) : isViewOnce && hasBeenViewed ? (
                        <div className="py-3 px-4 bg-neutral-900/90 text-neutral-400 italic text-[11px]">
                          Photo expired & opened
                        </div>
                      ) : (
                        <img
                          src={msg.imageUrl}
                          alt="shared"
                          className="w-full max-h-56 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  )}

                  {/* Text content */}
                  {msg.text && (
                    <p className="whitespace-pre-line inline-flex flex-wrap items-center gap-0.5">
                      {renderChatText(msg.text)}
                    </p>
                  )}

                  {/* Message timestamp & ticks */}
                  <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] opacity-75">
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-orange-300" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Icebreaker suggestions floating picker */}
        {showIcebreakerPicker && (
          <div className="border-t border-white/10 bg-white/[0.035] p-3 space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-orange-300 font-bold mb-1">
              <span>Send a Quick Campus Icebreaker:</span>
              <button onClick={() => setShowIcebreakerPicker(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>
            {[
              `What's your favourite meal around the student arcade?`,
              `Surviving 8 AM lectures or sleeping in?`,
              `Are you free for suya at the campus spot this evening?`,
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendPromptAnswer(prompt)}
                className="w-full text-left p-2 rounded-xl bg-orange-950/60 border border-orange-900/40 text-xs text-neutral-200 hover:bg-orange-900/70 truncate"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Real gallery photo picker */}
        {showPhotoPicker && (
          <div className="border-t border-white/10 bg-white/[0.035] p-3 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-orange-300 font-bold">
              <span>Attach a photo from your gallery</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewOnceActive(!viewOnceActive)}
                  disabled={isUploadingPhoto}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all disabled:opacity-50 ${
                    viewOnceActive
                      ? 'bg-orange-600 text-white border-orange-400'
                      : 'bg-orange-950 text-neutral-400 border-orange-800'
                  }`}
                >
                  {viewOnceActive ? 'View Once ON' : 'View Once OFF'}
                </button>
                <button
                  onClick={() => {
                    setShowPhotoPicker(false);
                    setPhotoUploadError(null);
                  }}
                  disabled={isUploadingPhoto}
                  className="text-neutral-400 hover:text-white disabled:opacity-50"
                >
                  ✕
                </button>
              </div>
            </div>
            <input
              ref={photoInputRef}
              id="chat-photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="sr-only"
              disabled={isUploadingPhoto}
            />
            <label
              htmlFor="chat-photo-upload"
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-dashed border-orange-700/70 bg-orange-950/50 text-xs font-bold text-orange-200 hover:bg-orange-900/60 cursor-pointer transition-colors ${
                isUploadingPhoto ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              <Camera className="w-4 h-4" />
              {isUploadingPhoto ? 'Uploading photo…' : 'Choose from gallery'}
            </label>
            {photoUploadError && <p className="text-[11px] text-rose-300">{photoUploadError}</p>}
          </div>
        )}

        {showEmojiPicker && (
          <div className="shrink-0 border-t border-white/10 bg-[#100719] p-2">
            <div className="h-[min(27dvh,220px)] overflow-hidden rounded-2xl sm:h-[280px]">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                emojiStyle={EmojiStyle.APPLE}
                theme={Theme.DARK}
                width="100%"
                height="100%"
                className="!h-full !w-full"
                lazyLoadEmojis
                previewConfig={{ showPreview: false }}
                skinTonesDisabled={false}
              />
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="shrink-0 border-t border-white/10 bg-black/10 p-3 flex items-center space-x-2">
          {/* Photos Button */}
          <button
            onClick={() => {
              setShowPhotoPicker(!showPhotoPicker);
              setShowEmojiPicker(false);
              setShowIcebreakerPicker(false);
            }}
            className="uoa-quiet-button rounded-xl p-2 text-pink-200 transition-all"
            title="Attach Photo"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Icebreaker button */}
          <button
            onClick={() => {
              setShowIcebreakerPicker(!showIcebreakerPicker);
              setShowEmojiPicker(false);
              setShowPhotoPicker(false);
            }}
            className="uoa-quiet-button rounded-xl p-2 text-pink-200 transition-all"
            title="Send Icebreaker"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Consistent cross-platform emoji button */}
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowIcebreakerPicker(false);
              setShowPhotoPicker(false);
            }}
            className={`uoa-quiet-button rounded-xl p-2 transition-all ${showEmojiPicker ? 'text-orange-200 ring-1 ring-orange-300/40' : 'text-pink-200'}`}
            title="Add emoji"
            aria-label="Add emoji"
            aria-expanded={showEmojiPicker}
          >
            <Smile className="h-4 w-4" />
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={`Message ${matched.name.split(' ')[0]}...`}
            className="flex-1 rounded-2xl border border-white/10 bg-white/[0.045] px-3.5 py-2.5 text-xs text-white placeholder-white/35 focus:outline-none focus:ring-2 focus:ring-pink-300/40"
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim()}
            className="uoa-primary-button rounded-2xl p-2.5 text-white transition-all disabled:opacity-40 hover:brightness-110"
            id="chat-send-btn"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Matches & Conversations Directory View
  return (
    <div className="w-full max-w-6xl mx-auto min-w-0 flex-1 flex flex-col p-3 sm:p-4 space-y-4 overflow-y-auto custom-scrollbar pb-24">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black font-display text-white tracking-tight">
            Matches & Chats
          </h2>
          <p className="text-xs text-neutral-400">
            {matches.length} active connection{matches.length === 1 ? '' : 's'} on campus
          </p>
        </div>

        <div className="uoa-surface-soft flex items-center space-x-1 rounded-full px-3 py-1 text-xs font-bold text-pink-200">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span>7-Day Expiry</span>
        </div>
      </div>

      {/* Top Matches Story Rings Carousel */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-orange-400 mb-2 block">
          New Matches
        </span>
        <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-2 pt-1">
          {matches.map((match) => (
            <div
              key={match.id}
              onClick={() => setCurrentChatMatch(match)}
              className="flex flex-col items-center space-y-1 cursor-pointer group shrink-0"
            >
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-orange-600 via-orange-500 to-indigo-500 shadow-[0_0_12px_rgba(168,85,247,0.4)] group-hover:scale-105 transition-transform">
                {match.matchedUser.photos[0] ? (
                  <img
                    src={match.matchedUser.photos[0]}
                    alt={match.matchedUser.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#090312]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full border-2 border-[#090312] bg-orange-900/70 text-orange-100 flex items-center justify-center text-sm font-bold">
                    {getInitials(match.matchedUser.name)}
                  </div>
                )}
                {match.hasUnread && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-[#090312]" />
                )}
              </div>
              <span className="text-[11px] font-semibold text-neutral-200 truncate w-14 text-center">
                {match.matchedUser.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-orange-400 block">
          Messages
        </span>

        {matches.length === 0 ? (
          <div className="uoa-surface-soft rounded-2xl p-8 text-center">
            <MessageCircle className="w-10 h-10 text-orange-400 mx-auto mb-2 opacity-60" />
            <h4 className="text-sm font-bold text-white">Your first conversation starts in Discover</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
              Meet someone who feels like your kind of person, then come back here to keep the conversation going.
            </p>
          </div>
        ) : (
          matches.map((match) => {
            const expiryText = calculateExpiryDays(match.expiresAt);
            const user = match.matchedUser;

            return (
              <div
                key={match.id}
                onClick={() => setCurrentChatMatch(match)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center space-x-3 group ${
                  match.hasUnread
                    ? 'bg-pink-500/10 border-pink-300/30'
                    : 'bg-white/[0.035] border-white/10 hover:border-white/20'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {user.photos[0] ? (
                    <img
                      src={user.photos[0]}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border border-orange-800/60 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full border border-orange-800/60 bg-orange-900/70 text-orange-100 flex items-center justify-center text-xs font-bold group-hover:scale-105 transition-transform">
                      {getInitials(user.name)}
                    </div>
                  )}
                  {user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#120620]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-white group-hover:text-orange-300 transition-colors">
                        {user.name}
                      </span>
                      {user.isVerified && (
                        <ShieldCheck className="w-3 h-3 text-orange-400" />
                      )}
                      {user.mode === 'lowkey' && (
                        <Lock className="w-3 h-3 text-orange-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-orange-400/80 font-medium">
                      {expiryText} remaining
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {match.lastMessage || 'Say hello to start chatting!'}
                  </p>
                  <div className="text-[9px] text-neutral-400 mt-0.5">
                    {user.level} • {user.department}
                  </div>
                </div>

                {/* Unread indicator */}
                {match.hasUnread && (
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-pink-300" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
