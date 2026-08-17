import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, Flag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserProfile, ReportReason } from '../types';

interface ReportModalProps {
  targetUser: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ targetUser, isOpen, onClose }) => {
  const { submitReport, blockUser } = useApp();
  const [reason, setReason] = useState<ReportReason>('fake_profile');
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReport(targetUser, reason, details);
    setIsSubmitted(true);
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setDetails('');
    onClose();
  };

  const reportOptions: { value: ReportReason; label: string; desc: string }[] = [
    {
      value: 'fake_profile',
      label: 'Fake Profile / Fake Username',
      desc: 'Not a real UniAbuja student or impersonating someone else',
    },
    {
      value: 'harassment',
      label: 'Harassment & Cyberbullying',
      desc: 'Unwanted advances, threats, or abusive messages',
    },
    {
      value: 'non_consensual',
      label: 'Non-Consensual Media / Blackmail',
      desc: 'Sharing or threatening private content or screenshots',
    },
    {
      value: 'inappropriate_content',
      label: 'Inappropriate Content or Nudity',
      desc: 'Publicly lewd photos in standard discovery feed',
    },
    {
      value: 'underage',
      label: 'Underage (Below 18)',
      desc: 'User is not up to 18 years old',
    },
    {
      value: 'scam',
      label: 'Scam, Fraud, or Commercial Spam',
      desc: 'Soliciting money, crypto, or selling products',
    },
    {
      value: 'other',
      label: 'Other Campus Safety Issue',
      desc: 'Any other violation of UniAbuja guidelines',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#0e051a] border border-rose-900/50 rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden text-left flex flex-col">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-neutral-300 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-rose-950/80 border border-rose-700/50 text-rose-400">
                <Flag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black font-display text-white">Report Student</h3>
                <p className="text-xs text-orange-300">
                  Reporting: <strong>{targetUser.name}</strong> (@{targetUser.username})
                </p>
              </div>
            </div>

            <p className="text-xs text-neutral-400">
              Your report is strictly confidential and reviewed by the UniAbuja Admin Moderation team.
            </p>

            {/* Reason Radio buttons */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar">
              {reportOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`p-2.5 rounded-xl border flex items-start space-x-2.5 cursor-pointer transition-all ${
                    reason === opt.value
                      ? 'bg-rose-950/40 border-rose-600/70 text-white'
                      : 'bg-[#1a0b22] border-orange-950 text-neutral-300 hover:border-orange-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={opt.value}
                    checked={reason === opt.value}
                    onChange={() => setReason(opt.value)}
                    className="mt-1 text-rose-600 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold block">{opt.label}</span>
                    <span className="text-[10px] text-neutral-400">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Extra details */}
            <div>
              <label className="block text-[11px] font-bold text-orange-300 uppercase mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                rows={2}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain what occurred or paste relevant details..."
                className="w-full p-2.5 rounded-xl bg-[#1a0b22] border border-orange-900/50 text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>

            {/* Submit buttons */}
            <div className="pt-2 flex items-center space-x-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 text-neutral-400 text-xs font-semibold hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition-all flex items-center justify-center space-x-1.5"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Submit Confidential Report</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4 animate-fadeIn">
            <div className="w-14 h-14 rounded-full bg-rose-950 border-2 border-rose-500 text-rose-300 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold font-display text-white">Report Logged</h3>
            <p className="text-xs text-neutral-300 max-w-xs mx-auto">
              Thank you for keeping University of Abuja safe. Our admins are reviewing the account and reported behaviour.
            </p>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  blockUser(targetUser.id);
                  handleClose();
                }}
                className="w-full py-2.5 rounded-xl bg-rose-900/60 border border-rose-600/40 text-rose-200 text-xs font-bold hover:bg-rose-800"
              >
                Also Block {targetUser.name}
              </button>

              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-white/10 text-neutral-300 text-xs font-bold hover:text-white"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
