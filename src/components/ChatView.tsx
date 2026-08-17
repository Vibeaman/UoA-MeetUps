import React, { useState, useRef, useEffect } from 'react';
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
  Check,
  CheckCheck,
  Eye,
  Camera,
  Trash2,
  Mic,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MatchItem, ChatMessage, UserProfile } from '../types';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeMessages = currentChatMatch ? messages[currentChatMatch.id] || [] : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, currentChatMatch]);

  const handleSend = () => {
    if (!currentChatMatch || !inputMessage.trim()) return;
    sendMessage(currentChatMatch.id, inputMessage);
    setInputMessage('');
  };

  const handleSendPhotoPreset = (photoUrl: string) => {
    if (!currentChatMatch) return;
    sendMessage(currentChatMatch.id, '', photoUrl, viewOnceActive);
    setShowPhotoPicker(false);
    setViewOnceActive(false);
  };

  const handleSendPromptAnswer = (promptText: string) => {
    if (!currentChatMatch) return;
    sendMessage(currentChatMatch.id, `💬 Icebreaker: ${promptText}`);
    setShowIcebreakerPicker(false);
  };

  const calculateExpiryDays = (expiresAt: number) => {
    const diffMs = expiresAt - Date.now();
    if (diffMs <= 0) return 'Expired';
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `${days}d ${hours}h left`;
  };

  const samplePhotoPresets = [
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=600&q=80',
  ];

  // If a chat thread is selected, render the conversation view
  if (currentChatMatch) {
    const matched = currentChatMatch.matchedUser;
    const expiryText = calculateExpiryDays(currentChatMatch.expiresAt);

    return (
      <div className="relative w-full max-w-5xl mx-auto min-w-0 min-h-0 h-[calc(100dvh-9rem)] sm:h-[calc(100dvh-10rem)] flex flex-col bg-[#0b0414] border border-purple-950/60 rounded-3xl overflow-hidden shadow-2xl">
        {/* Chat Header */}
        <div className="flex items-center justify-between p-3.5 bg-[#120722] border-b border-purple-900/40 z-20">
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
                <img
                  src={matched.photos[0]}
                  alt={matched.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-purple-500 shadow-md group-hover:scale-105 transition-transform"
                />
                <span
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#120722] ${
                    matched.isOnline ? 'bg-emerald-400' : 'bg-neutral-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-sm text-white group-hover:text-purple-300 transition-colors">
                    {matched.name}
                  </span>
                  {matched.isVerified && (
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  )}
                  {matched.mode === 'lowkey' && (
                    <Lock className="w-3 h-3 text-fuchsia-400 shrink-0" />
                  )}
                </div>
                <div className="text-[10px] text-purple-300/80">
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
              <div className="absolute right-0 top-10 w-48 bg-[#18092d] border border-purple-800/60 rounded-2xl shadow-2xl py-1.5 z-50 text-xs text-neutral-200 backdrop-blur-xl animate-fadeIn">
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    onOpenProfileDetails(matched);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-purple-900/50 flex items-center space-x-2"
                >
                  <Info className="w-4 h-4 text-purple-400" />
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
        <div className="bg-purple-950/70 border-b border-purple-900/40 px-3 py-1 flex items-center justify-between text-[11px] text-purple-300">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>Match Expiry: <strong className="text-white">{expiryText}</strong></span>
          </div>
          <span className="text-[10px] text-purple-400/80">Keeps connections fresh</span>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gradient-to-b from-[#0e051a] via-[#090312] to-[#0c0416]">
          {/* Matched Greeting Card */}
          <div className="text-center py-4 px-3 rounded-2xl bg-purple-950/30 border border-purple-900/30 space-y-1.5 my-2">
            <Sparkles className="w-5 h-5 text-purple-400 mx-auto" />
            <p className="text-xs font-bold text-white">
              You matched with {matched.name}!
            </p>
            <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
              Both verified UniAbuja students. Say hello or send an icebreaker to keep the match active.
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
                      ? 'bg-gradient-to-r from-purple-700 to-fuchsia-700 text-white rounded-br-none shadow-[0_2px_10px_rgba(168,85,247,0.3)]'
                      : 'bg-[#1a0c2e] text-neutral-100 border border-purple-900/50 rounded-bl-none shadow-sm'
                  }`}
                >
                  {/* Photo content */}
                  {msg.imageUrl && (
                    <div className="mb-1.5 rounded-xl overflow-hidden border border-white/10">
                      {isViewOnce && !hasBeenViewed ? (
                        <button
                          onClick={() => setViewedOncePhotos({ ...viewedOncePhotos, [msg.id]: true })}
                          className="flex items-center space-x-2 py-3 px-4 bg-purple-950/90 text-purple-200 font-bold hover:bg-purple-900 transition-all w-full"
                        >
                          <Eye className="w-4 h-4 text-purple-300" />
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
                  {msg.text && <p className="whitespace-pre-line">{msg.text}</p>}

                  {/* Message timestamp & ticks */}
                  <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] opacity-75">
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-purple-300" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Icebreaker suggestions floating picker */}
        {showIcebreakerPicker && (
          <div className="bg-[#150727] border-t border-purple-800/60 p-3 space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-purple-300 font-bold mb-1">
              <span>Send a Quick Campus Icebreaker:</span>
              <button onClick={() => setShowIcebreakerPicker(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>
            {[
              `What's your favourite meal around the student arcade? 🍝`,
              `Surviving 8 AM lectures or sleeping in? 😂`,
              `Are you free for suya at the campus spot this evening? 🍢`,
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendPromptAnswer(prompt)}
                className="w-full text-left p-2 rounded-xl bg-purple-950/60 border border-purple-900/40 text-xs text-neutral-200 hover:bg-purple-900/70 truncate"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Photo preset picker */}
        {showPhotoPicker && (
          <div className="bg-[#150727] border-t border-purple-800/60 p-3 space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-purple-300 font-bold">
              <span>Attach a Campus Photo</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewOnceActive(!viewOnceActive)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                    viewOnceActive
                      ? 'bg-fuchsia-600 text-white border-fuchsia-400'
                      : 'bg-purple-950 text-neutral-400 border-purple-800'
                  }`}
                >
                  {viewOnceActive ? '🔒 View Once ON' : 'View Once OFF'}
                </button>
                <button onClick={() => setShowPhotoPicker(false)} className="text-neutral-400 hover:text-white">
                  ✕
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {samplePhotoPresets.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSendPhotoPreset(p)}
                  className="relative h-16 rounded-xl overflow-hidden border border-purple-800 cursor-pointer hover:opacity-80"
                >
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-[#110620] border-t border-purple-900/40 flex items-center space-x-2">
          {/* Photos Button */}
          <button
            onClick={() => setShowPhotoPicker(!showPhotoPicker)}
            className="p-2 rounded-xl bg-purple-950/60 text-purple-300 hover:text-white hover:bg-purple-900/60 transition-all border border-purple-900/40"
            title="Attach Photo"
          >
            <ImageIcon className="w-4 h-4" />
          </button>

          {/* Icebreaker button */}
          <button
            onClick={() => setShowIcebreakerPicker(!showIcebreakerPicker)}
            className="p-2 rounded-xl bg-purple-950/60 text-purple-300 hover:text-white hover:bg-purple-900/60 transition-all border border-purple-900/40"
            title="Send Icebreaker"
          >
            <Sparkles className="w-4 h-4" />
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
            className="flex-1 py-2.5 px-3.5 rounded-2xl bg-[#17092c] border border-purple-800/40 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400"
          />

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!inputMessage.trim()}
            className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white disabled:opacity-40 hover:brightness-110 transition-all shadow-md"
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

        <div className="px-3 py-1 rounded-full bg-purple-950 border border-purple-800/60 text-purple-300 text-xs font-bold flex items-center space-x-1">
          <Flame className="w-3.5 h-3.5 text-purple-400" />
          <span>7-Day Expiry</span>
        </div>
      </div>

      {/* Top Matches Story Rings Carousel */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2 block">
          New Matches
        </span>
        <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-2 pt-1">
          {matches.map((match) => (
            <div
              key={match.id}
              onClick={() => setCurrentChatMatch(match)}
              className="flex flex-col items-center space-y-1 cursor-pointer group shrink-0"
            >
              <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-500 shadow-[0_0_12px_rgba(168,85,247,0.4)] group-hover:scale-105 transition-transform">
                <img
                  src={match.matchedUser.photos[0]}
                  alt={match.matchedUser.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#090312]"
                />
                {match.hasUnread && (
                  <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-fuchsia-500 border-2 border-[#090312]" />
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
        <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block">
          Messages
        </span>

        {matches.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#120722] border border-purple-950/80">
            <MessageCircle className="w-10 h-10 text-purple-400 mx-auto mb-2 opacity-60" />
            <h4 className="text-sm font-bold text-white">No active matches yet</h4>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
              Swipe on students in the Discover feed to get your first campus match!
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
                    ? 'bg-[#190a2c] border-purple-700/60 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                    : 'bg-[#120620] border-purple-950 hover:border-purple-800'
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={user.photos[0]}
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border border-purple-800/60 group-hover:scale-105 transition-transform"
                  />
                  {user.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#120620]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-xs text-white group-hover:text-purple-300 transition-colors">
                        {user.name}
                      </span>
                      {user.isVerified && (
                        <ShieldCheck className="w-3 h-3 text-purple-400" />
                      )}
                      {user.mode === 'lowkey' && (
                        <Lock className="w-3 h-3 text-fuchsia-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-purple-400/80 font-medium">
                      ⏱️ {expiryText}
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
                  <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 shadow-[0_0_8px_#d946ef] shrink-0" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
