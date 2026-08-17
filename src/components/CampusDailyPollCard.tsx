import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquareQuote,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  X,
  Send,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const CampusDailyPollCard: React.FC = () => {
  const {
    campusPolls,
    activePollIndex,
    setActivePollIndex,
    voteCampusPoll,
    addCampusPoll,
    isAuthenticated,
    requestAuthentication,
  } = useApp();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState('Campus Vibe');
  const [newOpt1, setNewOpt1] = useState('');
  const [newOpt2, setNewOpt2] = useState('');
  const [newOpt3, setNewOpt3] = useState('');

  const currentPoll = campusPolls[activePollIndex] || campusPolls[0];
  const hasVoted = !!currentPoll?.userVotedOptionId;

  const handleNextPoll = () => {
    setActivePollIndex((activePollIndex + 1) % campusPolls.length);
  };

  const handlePrevPoll = () => {
    setActivePollIndex((activePollIndex - 1 + campusPolls.length) % campusPolls.length);
  };

  const handleCreatePollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestAuthentication()) return;
    if (!newQuestion.trim() || !newOpt1.trim() || !newOpt2.trim()) return;

    const opts = [newOpt1.trim(), newOpt2.trim()];
    if (newOpt3.trim()) opts.push(newOpt3.trim());

    addCampusPoll(newQuestion.trim(), newCategory, opts);
    setNewQuestion('');
    setNewOpt1('');
    setNewOpt2('');
    setNewOpt3('');
    setIsCreatingPoll(false);
  };

  if (!currentPoll) {
    return (
      <div className="uoa-surface-soft mb-3 w-full rounded-2xl p-4 text-left">
        <div className="flex items-center space-x-2 text-orange-300">
          <MessageSquareQuote className="w-4 h-4" />
          <span className="text-xs font-extrabold uppercase tracking-wider">Campus polls</span>
        </div>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-neutral-300">Ask UniAbuja something the campus will want to answer. Create the first campus poll and start the conversation.</p>
        <button
          onClick={() => {
            if (requestAuthentication()) setIsCreatingPoll(true);
          }}
          className="mt-3 text-xs font-bold text-orange-300 hover:text-white flex items-center space-x-1"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>{isAuthenticated ? 'Create the first campus poll' : 'Sign up to create a poll'}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="uoa-surface-soft mb-3 w-full rounded-2xl p-3.5 text-left transition-all"
      id="campus-daily-poll-card"
    >
      {/* Poll Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="rounded-lg bg-white/[0.07] p-1.5 text-pink-200 ring-1 ring-white/10">
            <MessageSquareQuote className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="uoa-section-kicker">
                {currentPoll.category || 'Campus Vibe Poll'}
              </span>
              <span className="text-[10px] text-orange-400/80 font-semibold">
                • {activePollIndex + 1}/{campusPolls.length}
              </span>
            </div>
            <h4 className="text-xs font-bold text-white leading-tight">
              {currentPoll.question}
            </h4>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          {campusPolls.length > 1 && (
            <div className="flex items-center space-x-0.5 mr-1 bg-orange-950/60 rounded-lg p-0.5 border border-orange-800/30">
              <button
                onClick={handlePrevPoll}
                className="p-1 rounded text-orange-300 hover:bg-orange-900/60 transition-colors"
                title="Previous Poll"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextPoll}
                className="p-1 rounded text-orange-300 hover:bg-orange-900/60 transition-colors"
                title="Next Poll"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg text-orange-400 hover:bg-orange-950/60 transition-colors"
            title={isCollapsed ? 'Expand Poll' : 'Collapse Poll'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-3 space-y-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPoll.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {currentPoll.options.map((opt) => {
                const isSelected = currentPoll.userVotedOptionId === opt.id;
                const percentage = currentPoll.totalVotes > 0
                  ? Math.round((opt.votes / currentPoll.totalVotes) * 100)
                  : 0;

                return (
                  <motion.button
                    key={opt.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (requestAuthentication()) voteCampusPoll(currentPoll.id, opt.id);
                    }}
                    className={`relative w-full overflow-hidden rounded-xl border p-3 text-left transition-all ${
                      isSelected
                        ? 'bg-pink-500/10 border-pink-300/50 ring-1 ring-pink-300/25'
                        : 'bg-white/[0.035] border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Percentage fill bar if voted */}
                    {hasVoted && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className={`absolute inset-y-0 left-0 ${
                          isSelected
                            ? 'bg-pink-500/25'
                            : 'bg-white/[0.06]'
                        }`}
                      />
                    )}

                    <div className="relative z-10 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 text-neutral-100 font-medium truncate pr-2">
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-orange-300 shrink-0" />
                        )}
                        <span className="truncate">{opt.text}</span>
                      </div>

                      {hasVoted && (
                        <span className="text-[11px] font-bold text-orange-200 shrink-0 ml-2">
                          {percentage}%
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1 px-1">
            <span>
              {currentPoll.totalVotes.toLocaleString()} UniAbuja votes
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-orange-300/80">
                {isAuthenticated
                  ? hasVoted
                    ? 'Your vote is counted'
                    : 'Tap an option to vote'
                  : 'Sign up to vote'}
              </span>
              <button
                onClick={() => {
                  if (requestAuthentication()) setIsCreatingPoll(!isCreatingPoll);
                }}
                className="text-orange-400 hover:text-orange-200 font-semibold flex items-center space-x-0.5"
              >
                <PlusCircle className="w-3 h-3" />
                <span>{isAuthenticated ? 'Suggest Poll' : 'Sign up to suggest'}</span>
              </button>
            </div>
          </div>

          {/* Quick Propose Poll Modal/Drawer */}
          {isCreatingPoll && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreatePollSubmit}
              className="mt-2 pt-2 border-t border-orange-900/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-orange-200">
                  Suggest a UniAbuja Campus Poll
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingPoll(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Question (e.g. Best chill spot on campus?)"
                className="w-full text-xs p-2 rounded-xl bg-orange-950/60 border border-orange-800/60 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-400"
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newOpt1}
                  onChange={(e) => setNewOpt1(e.target.value)}
                  placeholder="Option 1 (Required)"
                  className="text-xs p-2 rounded-xl bg-orange-950/60 border border-orange-800/60 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-400"
                  required
                />
                <input
                  type="text"
                  value={newOpt2}
                  onChange={(e) => setNewOpt2(e.target.value)}
                  placeholder="Option 2 (Required)"
                  className="text-xs p-2 rounded-xl bg-orange-950/60 border border-orange-800/60 text-white placeholder-neutral-400 focus:outline-none focus:border-orange-400"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="text-[11px] p-1.5 rounded-lg bg-orange-950 border border-orange-800 text-orange-200 focus:outline-none"
                >
                  <option value="Campus Vibe">Campus Vibe</option>
                  <option value="UniAbuja Showdown">UniAbuja Showdown</option>
                  <option value="Hostel & Food">Hostel & Food</option>
                  <option value="Dating Pulse">Dating Pulse</option>
                </select>

                <button
                  type="submit"
                  disabled={!newQuestion.trim() || !newOpt1.trim() || !newOpt2.trim()}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-600 text-white text-xs font-semibold flex items-center space-x-1 disabled:opacity-40"
                >
                  <Send className="w-3 h-3" />
                  <span>Post Poll</span>
                </button>
              </div>
            </motion.form>
          )}
        </div>
      )}
    </div>
  );
};
