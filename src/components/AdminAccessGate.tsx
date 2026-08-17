import { FC, FormEvent, useState } from 'react';
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AdminAccessGateProps {
  onBack: () => void;
}

export const AdminAccessGate: FC<AdminAccessGateProps> = ({ onBack }) => {
  const { authenticateAdmin } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (await authenticateAdmin(password)) return;
      setPassword('');
      setError('That staff password is not valid. Please try again.');
    } catch {
      setPassword('');
      setError('Unable to verify staff access. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full flex-1 flex items-center justify-center px-4 py-10 relative z-10">
      <div className="w-full max-w-sm rounded-[2rem] border border-orange-700/50 bg-[#120620]/95 p-6 sm:p-8 shadow-[0_20px_80px_rgba(88,28,135,0.28)]">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 rounded-xl border border-orange-900/70 bg-orange-950/40 px-3 py-2 text-xs font-bold text-orange-200 transition-colors hover:border-orange-600 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to app
        </button>

        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/50 bg-gradient-to-br from-orange-600/30 to-orange-600/20 text-orange-200 shadow-[0_0_24px_rgba(168,85,247,0.28)]">
          <LockKeyhole className="h-7 w-7" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-black text-white">Staff access</h1>
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-sm leading-6 text-orange-200/75">
            The moderation console is restricted to authorised UniAbuja staff.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label htmlFor="admin-password" className="block text-xs font-black uppercase tracking-[0.18em] text-orange-300">
            Staff password
          </label>
          <input
            id="admin-password"
            name="admin-password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value.replace(/[^a-z]/gi, '').slice(0, 3));
              setError('');
            }}
            placeholder="•••"
            maxLength={3}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            autoFocus
            className="w-full rounded-2xl border border-orange-800/70 bg-[#090312] px-4 py-3 text-center text-xl font-black uppercase tracking-[0.55em] text-white outline-none transition-colors placeholder:text-orange-300/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
            aria-describedby={error ? 'admin-password-error' : 'admin-password-help'}
          />
          <p id="admin-password-help" className="text-center text-[11px] text-neutral-500">
            Enter the three-letter staff password.
          </p>
          {error && (
            <p id="admin-password-error" role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-center text-xs font-semibold text-rose-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={password.length !== 3 || isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-600 to-orange-600 px-4 py-3 text-sm font-black text-white shadow-[0_0_22px_rgba(168,85,247,0.28)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting ? 'Verifying...' : 'Unlock admin console'}
          </button>
        </form>
      </div>
    </main>
  );
};
