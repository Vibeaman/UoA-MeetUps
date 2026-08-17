import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Heart, Send, MessageCircle, X, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfile, MatchItem } from '../types';

interface MatchModalProps {
  matchedProfile: UserProfile | null;
  onClose: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({ matchedProfile, onClose }) => {
  const {
    currentUser,
    sendMessage,
    matches,
    setCurrentChatMatch,
    setActiveTab,
  } = useApp();

  const [messageText, setMessageText] = useState('');

  if (!matchedProfile) return null;

  const quickStarters = [
    `Hey ${matchedProfile.name.split(' ')[0]}! How's ${matchedProfile.department} going?`,
    `Saw your profile and had to connect! Are you around campus today?`,
    `Best secret spot on campus? I need recommendations!`,
  ];

  const handleSendAndOpenChat = () => {
    // Find matching match item
    const match = matches.find((m) => m.matchedUser.id === matchedProfile.id);
    const textToSend = messageText.trim() || quickStarters[0];

    if (match) {
      sendMessage(match.id, textToSend);
      setCurrentChatMatch(match);
      setActiveTab('matches');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#1c0c2e] via-[#120620] to-[#090312] border border-purple-600/40 rounded-3xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.4)] text-center overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-fuchsia-600/30 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-neutral-300 hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Tag */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="flex flex-col items-center mt-2"
        >
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/50 text-purple-200 text-xs font-bold uppercase tracking-widest mb-2 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>UniAbuja MeetUp</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black font-display text-gradient-purple tracking-tight">
            IT’S A MATCH!
          </h2>
          <p className="text-xs text-neutral-300 mt-1 max-w-xs">
            You and <span className="font-bold text-white">{matchedProfile.name}</span> both swiped right on each other.
          </p>
        </motion.div>

        {/* Overlapping Avatars */}
        <div className="relative flex items-center justify-center my-6">
          {/* Current User */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.6)] transform -translate-x-3 z-10">
            <img src={currentUser.photos[0]} alt="You" className="w-full h-full object-cover" />
          </div>

          {/* Glowing Center Heart */}
          <div className="absolute z-20 w-11 h-11 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 flex items-center justify-center text-white shadow-[0_0_20px_#a855f7] border-2 border-[#090312] animate-bounce">
            <Heart className="w-5 h-5 fill-white" />
          </div>

          {/* Matched Profile */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-fuchsia-500 shadow-[0_0_20px_rgba(216,70,239,0.6)] transform translate-x-3 z-10">
            <img src={matchedProfile.photos[0]} alt={matchedProfile.name} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Level & Faculty tags */}
        <div className="flex items-center justify-center space-x-2 text-xs text-purple-200 mb-5">
          <span className="bg-purple-950 px-2 py-0.5 rounded border border-purple-800/60 font-bold">
            {matchedProfile.level}
          </span>
          <span className="font-semibold">{matchedProfile.department}</span>
        </div>

        {/* Quick Conversation Starters Chips */}
        <div className="space-y-1.5 mb-4 text-left">
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
            Quick Icebreaker Starters:
          </span>
          {quickStarters.map((starter, idx) => (
            <button
              key={idx}
              onClick={() => setMessageText(starter)}
              className="w-full text-left p-2 rounded-xl bg-purple-950/40 border border-purple-900/40 text-xs text-neutral-200 hover:bg-purple-900/60 hover:text-white transition-all truncate"
            >
              {starter}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="relative mb-4">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={`Say something nice to ${matchedProfile.name.split(' ')[0]}...`}
            className="w-full py-3 pl-4 pr-12 rounded-2xl bg-[#140824] border border-purple-700/50 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSendAndOpenChat();
            }}
          />
          <button
            onClick={handleSendAndOpenChat}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:brightness-110"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Expiration Note */}
        <div className="text-[11px] text-neutral-400 mb-4 flex items-center justify-center space-x-1">
          <span>Matches expire after 7 days if no conversation starts.</span>
        </div>

        {/* Buttons */}
        <div className="flex flex-col space-y-2">
          <button
            onClick={handleSendAndOpenChat}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:brightness-110 transition-all flex items-center justify-center space-x-2"
            id="match-start-chat-btn"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send Message & Open Chat</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs text-neutral-400 hover:text-white font-semibold transition-colors"
          >
            Keep Swiping
          </button>
        </div>
      </div>
    </div>
  );
};
