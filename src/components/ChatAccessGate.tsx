import React from 'react';
import { LockKeyhole, LogIn, MessageCircle, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ChatAccessGateProps {
  children: React.ReactNode;
}

export const ChatAccessGate: React.FC<ChatAccessGateProps> = ({ children }) => {
  const { isAuthenticated, isAuthLoading, openAuthModal } = useApp();

  if (isAuthLoading) {
    return (
      <div
        className="w-full max-w-5xl mx-auto min-w-0 flex-1 flex items-center justify-center p-4"
        role="status"
        aria-live="polite"
      >
        <div className="w-full max-w-md rounded-3xl border border-purple-900/60 bg-[#120722] p-8 text-center shadow-2xl">
          <MessageCircle className="mx-auto h-9 w-9 animate-pulse text-purple-400" />
          <p className="mt-3 text-sm font-bold text-white">Checking your secure session</p>
          <p className="mt-1 text-xs text-neutral-400">Your chats will appear after authentication is confirmed.</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="w-full max-w-5xl mx-auto min-w-0 flex-1 flex items-center justify-center p-3 sm:p-4 overflow-y-auto custom-scrollbar pb-24">
      <section
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-purple-800/60 bg-[#0e051a] shadow-2xl"
        aria-labelledby="chat-access-title"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none select-none p-4 opacity-50 blur-md sm:p-6"
        >
          <div className="mb-4 flex items-center gap-3 border-b border-purple-900/60 pb-4">
            <div className="h-10 w-10 rounded-full bg-purple-800/80" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded-full bg-purple-700/80" />
              <div className="h-2 w-24 rounded-full bg-purple-900/80" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="ml-auto h-12 w-3/4 rounded-2xl rounded-br-none bg-purple-700/70" />
            <div className="h-16 w-2/3 rounded-2xl rounded-bl-none bg-purple-900/80" />
            <div className="ml-auto h-10 w-1/2 rounded-2xl rounded-br-none bg-fuchsia-800/70" />
            <div className="h-14 w-3/5 rounded-2xl rounded-bl-none bg-purple-900/80" />
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-[#090312]/80 p-5 backdrop-blur-[2px] sm:p-8">
          <div className="w-full max-w-sm text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-purple-500/60 bg-purple-950/90 text-purple-200 shadow-[0_0_25px_rgba(168,85,247,0.25)]">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <h2 id="chat-access-title" className="mt-4 text-xl font-black font-display text-white">
              Sign up or Log in to access chat history
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-neutral-300">
              Create or access your verified UniAbuja account to view your private matches and conversations.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => openAuthModal('signup')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-purple-950/50 transition-transform hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-[#090312]"
              >
                <UserPlus className="h-4 w-4" />
                <span>Sign up</span>
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-purple-600/70 bg-purple-950/70 px-4 py-3 text-xs font-bold text-purple-100 transition-colors hover:bg-purple-900/80 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2 focus:ring-offset-[#090312]"
              >
                <LogIn className="h-4 w-4" />
                <span>Log in</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
