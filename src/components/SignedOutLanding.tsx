import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';

export const SignedOutLanding: React.FC = () => {
  const { openAuthModal } = useApp();
  const [isLandingMenuOpen, setIsLandingMenuOpen] = useState(false);

  return (
    <div className="relative flex min-h-[100dvh] flex-1 flex-col overflow-hidden bg-[#0b0610] px-6 pb-7 pt-7 text-white sm:px-12 sm:pt-10">
      <div className="mx-auto flex w-full max-w-[1120px] items-start justify-between">
        <Logo size="md" className="origin-left scale-[0.82] sm:scale-100" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsLandingMenuOpen((open) => !open)}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.08] text-pink-200 ring-1 ring-white/15 transition-colors hover:bg-white/[0.14]"
            aria-label="Open account menu"
            aria-expanded={isLandingMenuOpen}
          >
            <Menu className="h-6 w-6" strokeWidth={2.5} />
          </button>
          {isLandingMenuOpen && (
            <div className="absolute right-0 top-[4.5rem] z-20 w-44 rounded-2xl bg-[#17101e] p-2 text-left shadow-[0_18px_45px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsLandingMenuOpen(false);
                  openAuthModal('signup');
                }}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-white/85 hover:bg-white/[0.08]"
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLandingMenuOpen(false);
                  openAuthModal('login');
                }}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-pink-200 hover:bg-white/[0.08]"
              >
                Log in
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col items-center justify-center py-12 text-center sm:py-16">
        <h1 className="max-w-[10ch] font-serif text-[4.4rem] font-semibold leading-[0.86] tracking-[-0.065em] text-[#ff59ad] sm:text-[7.5rem]">
          It starts
          <br />
          with a
          <br />
          hello.
        </h1>

        <div className="mt-14 flex w-full max-w-sm flex-col gap-3">
          <button
            type="button"
            onClick={() => openAuthModal('signup')}
            className="w-full rounded-full bg-gradient-to-r from-[#7d1cc4] to-[#ff177f] px-5 py-4 text-base font-bold text-white shadow-[0_12px_24px_rgba(109,40,217,0.25)] transition-colors hover:brightness-110"
          >
            Create account
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="w-full rounded-full bg-white/[0.08] px-5 py-4 text-base font-bold text-white ring-1 ring-white/15 transition-colors hover:bg-white/[0.14]"
          >
            Log in
          </button>
        </div>

        <p className="mt-14 text-center text-base leading-snug text-white/65 sm:text-lg">
          Someone at UniAbuja might make you smile.
          <br />
          Find out who <span aria-hidden="true">↓</span>
        </p>
      </div>

      <p className="mx-auto mt-auto w-full max-w-[1120px] text-center text-xs text-white/40 sm:text-sm">
        For verified University of Abuja students only.
      </p>
    </div>
  );
};
