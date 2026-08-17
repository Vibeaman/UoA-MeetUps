import React from 'react';
import { ArrowUpRight, MessageCircle, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { CampusStoriesBar } from './CampusStoriesBar';
import { CampusPulseBar } from './CampusPulseBar';
import { CampusDailyPollCard } from './CampusDailyPollCard';

interface DesktopCampusRailProps {
  onOpenConversation: () => void;
}

export const DesktopCampusRail: React.FC<DesktopCampusRailProps> = ({ onOpenConversation }) => {
  const { gossipPosts } = useApp();
  const latestPost = gossipPosts[0];

  return (
    <aside className="hidden min-w-0 flex-col gap-4 xl:flex" aria-label="Campus activity">
      <div className="flex items-end justify-between px-1">
        <div>
          <p className="uoa-section-kicker">Campus activity</p>
          <h2 className="mt-1 text-sm font-black tracking-tight text-white">Stay in the loop.</h2>
        </div>
        <Sparkles className="h-4 w-4 text-orange-300" />
      </div>

      <div className="uoa-surface-soft overflow-hidden rounded-3xl p-3">
        <CampusStoriesBar />
      </div>

      <div className="uoa-surface-soft rounded-3xl p-3">
        <CampusPulseBar />
      </div>

      <div className="uoa-surface-soft rounded-3xl p-3">
        <CampusDailyPollCard />
      </div>

      <button
        type="button"
        onClick={onOpenConversation}
        className="uoa-surface group rounded-3xl p-4 text-left transition-colors hover:bg-white/[0.08]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-pink-500/10 text-pink-200 ring-1 ring-pink-300/20">
              <MessageCircle className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="uoa-section-kicker">Campus conversation</p>
              <p className="mt-1 truncate text-xs font-bold text-white">
                {latestPost ? latestPost.content : 'Start the campus conversation.'}
              </p>
            </div>
          </div>
          <ArrowUpRight className="h-4 w-4 shrink-0 text-orange-300 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
        <p className="mt-3 text-[10px] font-semibold text-orange-300">
          {latestPost ? `Read ${gossipPosts.length} conversation${gossipPosts.length === 1 ? '' : 's'}` : 'Be the first to share what is happening'}
        </p>
      </button>
    </aside>
  );
};
