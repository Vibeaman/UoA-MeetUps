import React, { useState } from 'react';
import {
  X,
  Lock,
  Flame,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSupabase } from '../lib/supabase';
import { Logo } from './Logo';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    updateCurrentUser,
    syncStudentPortal,
    authenticateUser,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'signup' | 'onboarding'>('signup');
  const [matricInput, setMatricInput] = useState(currentUser.matricNumber || '21/104CS082');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState(currentUser.name || 'Tariro Adebayo');
  const [ageConfirmed, setAgeConfirmed] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');
  const [authError, setAuthError] = useState('');
  const [onboardingSlide, setOnboardingSlide] = useState(0);

  if (!isAuthModalOpen) return null;

  const handlePortalSync = async () => {
    setIsSyncing(true);
    setSyncStatusMsg('Connecting to UniAbuja Student Portal Server...');
    const res = await syncStudentPortal(matricInput);
    setIsSyncing(false);
    setSyncStatusMsg(res.message);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!ageConfirmed) {
      setAuthError('You must confirm that you are at least 18 years old to use UoA MeetUps.');
      return;
    }

    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();
    const supabase = getSupabase();
    const result =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullNameInput.trim(),
                matric_number: matricInput.trim().toUpperCase(),
              },
            },
          })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setAuthError(result.error.message);
      return;
    }

    if (!result.data.session) {
      setAuthError('Check your email to confirm your account, then sign in to continue.');
      return;
    }

    updateCurrentUser({
      matricNumber: matricInput.trim().toUpperCase(),
      name: fullNameInput.trim(),
    });
    authenticateUser(result.data.user?.id);
    setMode('onboarding');
  };

  const onboardingSlides = [
    {
      title: 'Welcome to UoA MeetUps',
      subtitle: 'CONNECT. MEET. BELONG.',
      icon: <Logo size="lg" showTagline />,
      desc: 'The official, exclusive dating and social network designed specifically for University of Abuja students across all campuses.',
    },
    {
      title: 'Normal Mode vs Lowkey Mode',
      subtitle: 'Your Privacy, Your Choice',
      icon: (
        <div className="flex items-center space-x-4 my-2">
          <div className="p-4 rounded-2xl bg-purple-900/60 border border-purple-500 text-center">
            <Flame className="w-8 h-8 text-purple-300 mx-auto mb-1" />
            <span className="text-xs font-bold text-white block">Normal Mode</span>
            <span className="text-[10px] text-purple-300">Public Campus Feed</span>
          </div>
          <div className="p-4 rounded-2xl bg-fuchsia-950/80 border border-fuchsia-400 text-center">
            <Lock className="w-8 h-8 text-fuchsia-300 mx-auto mb-1" />
            <span className="text-xs font-bold text-white block">Lowkey Mode</span>
            <span className="text-[10px] text-fuchsia-300">Discreet & Private</span>
          </div>
        </div>
      ),
      desc: 'In Lowkey Mode, your profile is strictly hidden from general view and only visible to fellow students who also have Lowkey Mode enabled.',
    },
    {
      title: 'Mandatory Student Verification',
      subtitle: 'No Bots. No Scammers. 100% UniAbuja.',
      icon: (
        <div className="w-16 h-16 rounded-full bg-purple-900/80 border-2 border-purple-400 flex items-center justify-center text-purple-300 mx-auto shadow-[0_0_25px_#a855f7]">
          <ShieldCheck className="w-9 h-9" />
        </div>
      ),
      desc: 'All accounts verify their student status via live selfie facial recognition and matric directory sync.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0e051a] border border-purple-800/50 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-y-auto custom-scrollbar max-h-[92vh] text-center flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-neutral-300 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {mode === 'onboarding' ? (
          /* Onboarding Explanation Slides */
          <div className="py-4 space-y-5 animate-fadeIn">
            <div className="min-h-[220px] flex flex-col items-center justify-center">
              {onboardingSlides[onboardingSlide].icon}
              <h3 className="text-xl sm:text-2xl font-black font-display text-white mt-4">
                {onboardingSlides[onboardingSlide].title}
              </h3>
              <span className="text-xs font-bold text-purple-400 tracking-wider uppercase block mt-0.5">
                {onboardingSlides[onboardingSlide].subtitle}
              </span>
              <p className="text-xs text-neutral-300 mt-2 leading-relaxed max-w-xs">
                {onboardingSlides[onboardingSlide].desc}
              </p>
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center space-x-1.5">
              {onboardingSlides.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === onboardingSlide ? 'w-6 bg-purple-400' : 'w-2 bg-purple-950'
                  }`}
                />
              ))}
            </div>

            {/* Next / Get Started */}
            <button
              onClick={() => {
                if (onboardingSlide < onboardingSlides.length - 1) {
                  setOnboardingSlide((s) => s + 1);
                } else {
                  setIsAuthModalOpen(false);
                }
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold text-xs shadow-lg shadow-purple-900/50 hover:brightness-110 flex items-center justify-center space-x-2"
            >
              <span>{onboardingSlide === onboardingSlides.length - 1 ? 'Start Meeting Students' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Sign Up / Login Form */
          <form onSubmit={handleAuthSubmit} className="space-y-4 pt-2">
            <Logo size="md" />

            <div>
              <h2 className="text-xl font-black font-display text-white mt-1">
                {mode === 'signup' ? 'Student Registration' : 'Student Login'}
              </h2>
              <p className="text-xs text-purple-300">
                Exclusively for University of Abuja students
              </p>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-left text-[11px] font-bold text-purple-300 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  placeholder="e.g. Tariro Adebayo"
                  className="w-full p-2.5 rounded-xl bg-[#150826] border border-purple-900/50 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-left text-[11px] font-bold text-purple-300 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                autoComplete={mode === 'signup' ? 'email' : 'username'}
                className="w-full p-2.5 rounded-xl bg-[#150826] border border-purple-900/50 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Matric Number Input + Portal Sync */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-left text-[11px] font-bold text-purple-300 uppercase">
                  UniAbuja Matric Number
                </label>
                <button
                  type="button"
                  onClick={handlePortalSync}
                  disabled={isSyncing || !matricInput.trim()}
                  className="text-[10px] text-purple-300 hover:text-white font-bold flex items-center space-x-1 underline"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Sync Student Portal</span>
                </button>
              </div>

              <input
                type="text"
                required
                value={matricInput}
                onChange={(e) => setMatricInput(e.target.value)}
                placeholder="e.g. 21/104CS082 or 22/209LAW044"
                className="w-full p-2.5 rounded-xl bg-[#150826] border border-purple-900/50 text-xs text-white uppercase placeholder-neutral-500 font-mono focus:outline-none focus:border-purple-400"
              />

              {syncStatusMsg && (
                <p className="text-[10px] text-emerald-400 text-left mt-1 font-semibold">
                  {syncStatusMsg}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-left text-[11px] font-bold text-purple-300 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full p-2.5 rounded-xl bg-[#150826] border border-purple-900/50 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-400"
              />
            </div>

            {authError && (
              <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-left text-[11px] font-semibold text-rose-300">
                {authError}
              </p>
            )}

            {/* 18+ Age confirmation */}
            <div className="flex items-start space-x-2 text-left p-2 rounded-xl bg-[#140726] border border-purple-950">
              <input
                type="checkbox"
                id="age-confirm-check"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-0"
              />
              <label htmlFor="age-confirm-check" className="text-[11px] text-neutral-300 leading-tight">
                I confirm I am <strong>18+ years of age</strong> and currently enrolled at University of Abuja.
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold text-xs shadow-lg shadow-purple-900/50 hover:brightness-110 transition-all"
            >
              {mode === 'signup' ? 'Create Student Account' : 'Sign In'}
            </button>

            {/* Toggle Login / Signup */}
            <div className="pt-2 text-xs text-neutral-400">
              {mode === 'signup' ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-purple-300 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </span>
              ) : (
                <span>
                  New to UoA MeetUps?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-purple-300 font-bold hover:underline"
                  >
                    Register
                  </button>
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
