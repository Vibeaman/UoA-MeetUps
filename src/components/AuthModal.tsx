import React, { useEffect, useState } from 'react';
import {
  X,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getSupabase } from '../lib/supabase';
import { supabaseService } from '../services/supabaseService';
import { Logo } from './Logo';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    updateCurrentUser,
    authenticateUser,
    authModalMode,
  } = useApp();

  const [mode, setMode] = useState<'login' | 'signup' | 'onboarding'>('signup');
  const [usernameInput, setUsernameInput] = useState(currentUser.username || '');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState(currentUser.name || '');
  const [ageInput, setAgeInput] = useState(currentUser.age > 0 ? String(currentUser.age) : '');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    setMode(authModalMode);
    setUsernameInput(currentUser.username || '');
    setEmailInput('');
    setPasswordInput('');
    setAgeInput(currentUser.age > 0 ? String(currentUser.age) : '');
    setAgeConfirmed(false);
    setAuthError('');
  }, [isAuthModalOpen, authModalMode]);

  if (!isAuthModalOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (mode === 'signup' && !ageConfirmed) {
      setAuthError('You must confirm that you are at least 18 years old to use UoA MeetUps.');
      return;
    }

    const age = Number.parseInt(ageInput, 10);
    if (mode === 'signup' && (!Number.isInteger(age) || age < 18 || age > 100)) {
      setAuthError('Enter your real age, from 18 to 100.');
      return;
    }

    const username = usernameInput.trim().toLowerCase();
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    if (!/^[a-z0-9_]{3,24}$/.test(username)) {
      setAuthError('Choose a username with 3–24 lowercase letters, numbers, or underscores.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabase();

      if (mode === 'signup') {
        if (!email) {
          setAuthError('Enter an email address to create your UoA MeetUps account.');
          return;
        }

        const { data: existingProfiles, error: usernameCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .limit(1);
        if (usernameCheckError) {
          setAuthError('We could not check that username. Please try again.');
          return;
        }
        if (existingProfiles && existingProfiles.length > 0) {
          setAuthError('That username is already taken. Choose another one.');
          return;
        }

        const result = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullNameInput.trim(),
              username,
              age,
            },
          },
        });

        if (result.error) {
          setAuthError(result.error.message);
          return;
        }

        const user = result.data.user;
        if (!user || !result.data.session) {
          setAuthError('Account creation did not return a session. Please try again.');
          return;
        }

        const profileReady = await supabaseService.ensureUserProfile(user.id, username, fullNameInput, age);
        if (!profileReady) {
          setAuthError('Your account was created, but profile setup did not finish. Please try logging in again.');
          return;
        }

        updateCurrentUser({ username, name: fullNameInput.trim(), age });
        authenticateUser(user.id, Boolean(user.email_confirmed_at || user.confirmed_at));
        setMode('onboarding');
        return;
      }

      const usernameResult = await supabaseService.signInWithUsername(username, password);
      if (usernameResult.error || !usernameResult.session || !usernameResult.user) {
        setAuthError(usernameResult.error || 'Invalid username or password.');
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession(usernameResult.session as Parameters<typeof supabase.auth.setSession>[0]);
      if (sessionError || !sessionData.user) {
        setAuthError(sessionError?.message || 'Could not start your session. Please try again.');
        return;
      }

      updateCurrentUser({ username });
      authenticateUser(sessionData.user.id, Boolean(sessionData.user.email_confirmed_at || sessionData.user.confirmed_at));
      setIsAuthModalOpen(false);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const houseRules = [
    {
      title: 'Be yourself.',
      desc: 'Use your own photos, age, and profile details. Keep your profile true to who you are.',
    },
    {
      title: 'Stay safe.',
      desc: 'Protect your personal information and take new conversations at your own pace.',
    },
    {
      title: 'Play it cool.',
      desc: 'Respect other students and treat them as you would like to be treated.',
    },
    {
      title: 'Speak up.',
      desc: 'Report bad behaviour so we can keep the UniAbuja community welcoming.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0d0710]/98 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <div className="hidden sm:block">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-pink-300/85">UniAbuja campus</p>
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

        {mode === 'onboarding' ? (
          /* House Rules */
          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-between bg-[#111013] px-1 py-8 sm:rounded-[2rem] sm:px-10 sm:py-12">
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pink-900/70 text-pink-200 ring-1 ring-pink-300/40">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h2 className="mt-7 text-center font-display text-3xl font-bold tracking-[-0.04em] text-white sm:text-5xl">
                Welcome to UoA MeetUps.
              </h2>
              <p className="mt-3 text-center text-lg text-white/55 sm:text-2xl">
                Please follow these house rules.
              </p>

              <div className="mt-10 space-y-7 sm:mt-12 sm:space-y-8">
                {houseRules.map((rule) => (
                  <div key={rule.title} className="grid grid-cols-[2rem_1fr] gap-3 sm:grid-cols-[2.5rem_1fr] sm:gap-4">
                    <Check className="mt-1 h-6 w-6 text-pink-300" strokeWidth={2.5} />
                    <div>
                      <h3 className="text-xl font-bold text-white sm:text-2xl">{rule.title}</h3>
                      <p className="mt-2 max-w-xl text-base leading-relaxed text-white/50 sm:text-lg">{rule.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-12 sm:mt-16">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                className="w-full rounded-full bg-white px-5 py-4 text-lg font-bold text-[#17131a] transition-colors hover:bg-pink-100 sm:py-5 sm:text-xl"
              >
                I Agree
              </button>
              <p className="mt-4 text-center text-xs text-white/35">
                You can revisit these rules any time from Safety.
              </p>
            </div>
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
                  ? 'Create your account with a username and email, then find genuine connections across UniAbuja.'
                  : 'Log in with your username to continue your conversations and discover more students.'}
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
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-300/40"
                />
              </div>
            )}

            {/* Username */}
            <div>
              <label className="mb-2 block text-left text-[11px] font-semibold text-white/65">
                Username
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={24}
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="e.g. campus_connect"
                autoComplete="username"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-300/40"
              />
              <p className="mt-1.5 text-left text-[11px] text-white/35">3–24 lowercase letters, numbers, or underscores.</p>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="mb-2 block text-left text-[11px] font-semibold text-white/65">
                  Age
                </label>
                <input
                  type="number"
                  required
                  min={18}
                  max={100}
                  inputMode="numeric"
                  value={ageInput}
                  onChange={(e) => setAgeInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
                  placeholder="18 or older"
                  autoComplete="off"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-300/40"
                />
                <p className="mt-1.5 text-left text-[11px] text-white/35">Your real age is shown on your profile.</p>
              </div>
            )}

            {mode === 'signup' && (
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
                  autoComplete="email"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-300/40"
                />
              </div>
            )}

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
                className="w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-300/40"
              />
            </div>

            {authError && (
              <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-left text-[11px] font-semibold text-rose-300">
                {authError}
              </p>
            )}

            {mode === 'signup' && (
              <div className="flex items-start space-x-3 rounded-2xl border border-white/10 bg-white/[0.035] p-3 text-left">
                <input
                  type="checkbox"
                  id="age-confirm-check"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-white/10 text-pink-400 focus:ring-0"
                />
                <label htmlFor="age-confirm-check" className="text-xs leading-relaxed text-white/60">
                  I confirm I am <strong>18+ years of age</strong> and currently enrolled at University of Abuja.
                </label>
              </div>
            )}

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
                      setPasswordInput('');
                      setMode('login');
                    }}
                    className="font-semibold text-pink-200 underline-offset-4 hover:underline"
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
                      setPasswordInput('');
                      setMode('signup');
                    }}
                    className="font-semibold text-pink-200 underline-offset-4 hover:underline"
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
