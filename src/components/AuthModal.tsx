import React, { useEffect, useState } from 'react';
import {
  X,
  Lock,
  Flame,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  ArrowRight,
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
    authenticateUser,
    refreshAuthentication,
    resendVerificationEmail,
    authModalMode,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'signup' | 'verification' | 'onboarding'>('signup');
  const [matricInput, setMatricInput] = useState(currentUser.matricNumber || '');
  const [emailInput, setEmailInput] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState(currentUser.name || '');
  const [ageConfirmed, setAgeConfirmed] = useState(true);
  const [authError, setAuthError] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [onboardingSlide, setOnboardingSlide] = useState(0);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    setMode(authModalMode);
    setPasswordInput('');
    setAuthError('');
    setVerificationMessage('');
    setOnboardingSlide(0);
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setVerificationMessage('');

    if (!ageConfirmed) {
      setAuthError('You must confirm that you are at least 18 years old to use UoA MeetUps.');
      return;
    }

    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();
    setIsSubmitting(true);

    try {
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
        if (mode === 'login' && /email not confirmed/i.test(result.error.message)) {
          setVerificationEmail(email);
          setAuthError('Your email has not been confirmed yet. Check your inbox before signing in.');
          setMode('verification');
        } else {
          setAuthError(result.error.message);
        }
        return;
      }

      const user = result.data.user;
      const isVerified = Boolean(user?.email_confirmed_at || user?.confirmed_at);
      if (!user || !result.data.session || !isVerified) {
        setVerificationEmail(email);
        setPasswordInput('');
        setMode('verification');
        setVerificationMessage('We sent a confirmation link to your email. Open it before signing in.');
        return;
      }

      updateCurrentUser({
        matricNumber: matricInput.trim().toUpperCase(),
        name: fullNameInput.trim(),
      });
      authenticateUser(user.id);
      setOnboardingSlide(0);
      setMode('onboarding');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckVerification = async () => {
    setAuthError('');
    setVerificationMessage('Checking your email confirmation...');
    setIsSubmitting(true);

    try {
      const result = await refreshAuthentication();
      if (!result.hasSession) {
        setPasswordInput('');
        setVerificationMessage('Your email may be confirmed, but this browser is not signed in. Sign in with your email and password to continue.');
        setMode('login');
        return;
      }

      if (!result.isEmailVerified || !result.isAuthenticated) {
        setVerificationMessage('Your email is not confirmed yet. Open the link in your inbox, then check again.');
        return;
      }

      authenticateUser(result.userId);
      setVerificationMessage('Email confirmed. You can continue into UoA MeetUps.');
      setOnboardingSlide(0);
      setMode('onboarding');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not check verification status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setAuthError('');
    setVerificationMessage('Sending a new confirmation email...');
    setIsSubmitting(true);

    try {
      const result = await resendVerificationEmail(verificationEmail);
      if (result.success) {
        setVerificationMessage(result.message);
      } else {
        setAuthError(result.message);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Could not resend the confirmation email.');
    } finally {
      setIsSubmitting(false);
    }
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
      desc: 'Accounts can submit a real selfie and optional student ID for manual campus verification review.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0d0710]/98 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="hidden sm:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-violet-300/85">UniAbuja campus</p>
              <p className="mt-0.5 text-[10px] text-white/45">Student network</p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="uoa-quiet-button rounded-full p-2.5 text-white/70 transition-colors hover:text-white"
            aria-label="Close authentication"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col">

        {mode === 'verification' ? (
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center space-y-6 py-10 sm:py-14">
            <div className="mx-auto w-16 h-16 rounded-full bg-purple-900/80 border-2 border-purple-400 flex items-center justify-center text-purple-300 shadow-[0_0_25px_#a855f7]">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-xl font-black font-display text-white">Confirm your email</h2>
              <p className="text-xs text-purple-300 mt-1">One quick step before you join the campus community.</p>
            </div>
            <div className="uoa-surface-soft rounded-2xl p-4 text-left">
              <p className="text-xs text-neutral-200 leading-relaxed">
                We sent a confirmation link to <strong className="text-purple-200 break-all">{verificationEmail}</strong>. Open it in your email app, then return here and tap “I confirmed my email”.
              </p>
            </div>
            {authError && (
              <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-left text-[11px] font-semibold text-rose-300">
                {authError}
              </p>
            )}
            {verificationMessage && (
              <p className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-left text-[11px] font-semibold text-emerald-300">
                {verificationMessage}
              </p>
            )}
            <button
              type="button"
              onClick={handleCheckVerification}
              disabled={isSubmitting}
              className="uoa-primary-button w-full rounded-2xl px-4 py-4 text-sm font-bold text-white disabled:opacity-50"
            >
              {isSubmitting ? 'Checking...' : 'I confirmed my email'}
            </button>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isSubmitting}
              className="uoa-quiet-button w-full rounded-2xl px-4 py-3.5 text-sm font-semibold disabled:opacity-50"
            >
              Resend confirmation email
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthError('');
                setVerificationMessage('');
                setPasswordInput('');
                setMode('login');
              }}
              className="text-xs text-neutral-400 hover:text-white underline"
            >
              Back to log in
            </button>
          </div>
        ) : mode === 'onboarding' ? (
          /* Onboarding Explanation Slides */
          <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center space-y-6 py-10 sm:py-14">
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
              className="uoa-primary-button flex w-full items-center justify-center space-x-2 rounded-2xl px-4 py-4 text-sm font-bold text-white hover:brightness-110"
            >
              <span>{onboardingSlide === onboardingSlides.length - 1 ? 'Start Meeting Students' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Sign Up / Login Form */
          <form onSubmit={handleAuthSubmit} className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center space-y-5 py-10 sm:py-14">
            <div className="max-w-lg">
              <p className="uoa-section-kicker">University of Abuja</p>
              <h1 className="mt-3 max-w-xl font-display text-4xl font-black tracking-[-0.06em] text-white sm:text-6xl">
                {mode === 'signup' ? 'Meet your people on campus.' : 'Welcome back to campus.'}
              </h1>
              <p className="uoa-muted-copy mt-4 max-w-md text-sm sm:text-base">
                {mode === 'signup'
                  ? 'Create a verified student account and find genuine connections across UniAbuja.'
                  : 'Log in to continue your conversations and discover more students.'}
              </p>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="mb-2 block text-left text-[11px] font-semibold text-white/65">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullNameInput}
                  onChange={(e) => setFullNameInput(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-300/40"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="mb-2 block text-left text-[11px] font-semibold text-white/65">
                Email Address
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="you@example.com"
                autoComplete={mode === 'signup' ? 'email' : 'username'}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-300/40"
              />
            </div>

            {/* Matric Number Input */}
            <div>
              <label className="mb-2 block text-left text-[11px] font-semibold text-white/65">
                UniAbuja Matric Number
              </label>

              <input
                type="text"
                required
                value={matricInput}
                onChange={(e) => setMatricInput(e.target.value)}
                placeholder="e.g. 21/104CS082 or 22/209LAW044"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3.5 font-mono text-sm uppercase text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-300/40"
              />

            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-left text-[11px] font-semibold text-white/65">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-300/40"
              />
            </div>

            {authError && (
              <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-left text-[11px] font-semibold text-rose-300">
                {authError}
              </p>
            )}

            {/* 18+ Age confirmation */}
            <div className="flex items-start space-x-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left">
              <input
                type="checkbox"
                id="age-confirm-check"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-white/20 bg-white/10 text-violet-400 focus:ring-0"
              />
              <label htmlFor="age-confirm-check" className="text-xs leading-relaxed text-white/60">
                I confirm I am <strong>18+ years of age</strong> and currently enrolled at University of Abuja.
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="uoa-primary-button w-full rounded-2xl px-4 py-4 text-sm font-bold text-white transition-all hover:brightness-110"
            >
              {isSubmitting ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Log in'}
            </button>

            {/* Toggle Login / Signup */}
            <div className="border-t border-white/10 pt-5 text-center text-sm text-white/50">
              {mode === 'signup' ? (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setVerificationMessage('');
                      setPasswordInput('');
                      setMode('login');
                    }}
                    className="font-semibold text-violet-200 underline-offset-4 hover:underline"
                  >
                    Log in
                  </button>
                </span>
              ) : (
                <span>
                  New to UoA MeetUps?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError('');
                      setVerificationMessage('');
                      setPasswordInput('');
                      setMode('signup');
                    }}
                    className="font-semibold text-violet-200 underline-offset-4 hover:underline"
                  >
                    Sign up
                  </button>
                </span>
              )}
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
};
