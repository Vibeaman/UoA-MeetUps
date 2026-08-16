import React from 'react';
import { ShieldAlert, ChevronLeft, CheckCircle2, AlertOctagon, Lock, Flame } from 'lucide-react';

export const CommunityGuidelinesView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="w-full max-w-md mx-auto flex-1 flex flex-col p-3 sm:p-4 space-y-4 overflow-y-auto custom-scrollbar pb-24">
      {/* Header */}
      <div className="flex items-center space-x-2.5 pb-2 border-b border-purple-950/80">
        <button
          onClick={onBack}
          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-black font-display text-white">Community Guidelines</h2>
          <p className="text-[11px] text-purple-300">University of Abuja Code of Conduct</p>
        </div>
      </div>

      {/* Intro Warning */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/60 to-purple-950/60 border border-rose-800/40 text-xs text-neutral-200 leading-relaxed">
        <div className="flex items-center space-x-2 font-bold text-rose-300 mb-1">
          <AlertOctagon className="w-4 h-4 text-rose-400" />
          <span>Zero Tolerance Policy</span>
        </div>
        UoA MeetUps is an exclusive campus space for genuine University of Abuja students. Any violation of the rules below results in an immediate, irreversible ban.
      </div>

      {/* Guidelines Rules List */}
      <div className="space-y-3 text-xs">
        <div className="p-4 rounded-2xl bg-[#120620] border border-purple-950 space-y-1">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
            <span>1. Authentic Matric Number & Identity</span>
          </h3>
          <p className="text-neutral-300 leading-relaxed">
            You must register with your real UniAbuja Matriculation Number. Impersonating other students, using borrowed credentials, or creating fake alumni accounts will trigger instant banning and account blacklisting.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#120620] border border-purple-950 space-y-1">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
            <span>2. Strict 18+ Age Requirement</span>
          </h3>
          <p className="text-neutral-300 leading-relaxed">
            Only students who are 18 years or older are permitted on UoA MeetUps. Underage accounts will be terminated immediately upon detection during portal verification.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#120620] border border-purple-950 space-y-1">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
            <span>3. No Non-Consensual Media or Blackmail</span>
          </h3>
          <p className="text-neutral-300 leading-relaxed">
            Sharing, recording, or threatening to leak intimate photos, screenshots of Lowkey chats, or private recordings is a severe criminal violation. We assist campus authorities with electronic audit trails in all blackmail cases.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#120620] border border-purple-950 space-y-1">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
            <span>4. Respect Lowkey Mode Discretion</span>
          </h3>
          <p className="text-neutral-300 leading-relaxed">
            Lowkey Mode exists to give privacy-conscious students discretion. Respect each user's chosen privacy boundary. Do not publicly broadcast who you saw in Lowkey Mode on campus social media.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#120620] border border-purple-950 space-y-1">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
            <span>5. Zero Financial Scams & Commercial Spam</span>
          </h3>
          <p className="text-neutral-300 leading-relaxed">
            UoA MeetUps is for genuine human connections, dating, and campus social life. Soliciting bank transfers, crypto schemes, commercial sales, or scam links will lead to immediate ban and device hash block.
          </p>
        </div>
      </div>

      <button
        onClick={onBack}
        className="w-full py-3 rounded-2xl bg-purple-900/60 border border-purple-600/40 text-purple-200 font-bold text-xs hover:bg-purple-800 transition-all"
      >
        I Understand & Agree to the Rules
      </button>
    </div>
  );
};
