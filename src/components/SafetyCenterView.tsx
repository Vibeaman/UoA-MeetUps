import React, { useState } from 'react';
import {
  ShieldCheck,
  PhoneCall,
  AlertTriangle,
  FileText,
  HeartHandshake,
  Lock,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { CAMPUS_SAFETY_RULES, UNI_ABUJA_EMERGENCY_CONTACTS } from '../data/mockData';
import { useApp } from '../context/AppContext';

export const SafetyCenterView: React.FC<{
  onOpenGuidelines: () => void;
  onOpenTips: () => void;
}> = ({ onOpenGuidelines, onOpenTips }) => {
  const { setActiveTab } = useApp();

  return (
    <div className="w-full max-w-md mx-auto flex-1 flex flex-col p-3 sm:p-4 space-y-5 overflow-y-auto custom-scrollbar pb-24">
      {/* Hero Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1d0933] via-[#130622] to-[#090312] border border-purple-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="flex items-center space-x-2.5 mb-2">
          <div className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">
            UniAbuja Safety Hub
          </span>
        </div>

        <h2 className="text-2xl font-black font-display text-white tracking-tight">
          Campus Dating & Safety Center
        </h2>
        <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
          Your physical security, privacy, and well-being at University of Abuja are our utmost priority.
        </p>

        {/* Quick Links to Guidelines & Tips */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={onOpenGuidelines}
            className="p-3 rounded-2xl bg-purple-950/60 border border-purple-800/40 text-left hover:bg-purple-900/60 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-white block">Community Rules</span>
              <span className="text-[10px] text-purple-300">Zero-tolerance policies</span>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={onOpenTips}
            className="p-3 rounded-2xl bg-purple-950/60 border border-purple-800/40 text-left hover:bg-purple-900/60 transition-all flex items-center justify-between group"
          >
            <div>
              <span className="text-xs font-bold text-white block">Dating & Sex Tips</span>
              <span className="text-[10px] text-purple-300">Consent & Health guides</span>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Safety Rules Accordion */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center space-x-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Core Campus Safety Rules</span>
        </h3>

        {CAMPUS_SAFETY_RULES.map((rule, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-[#130722] border border-purple-950 space-y-1.5 shadow-sm"
          >
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-purple-900/80 text-purple-300 text-[10px] font-bold flex items-center justify-center border border-purple-700/50 shrink-0">
                {idx + 1}
              </span>
              <h4 className="text-xs font-bold text-white">{rule.title}</h4>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed pl-7">
              {rule.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Emergency Contacts */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center space-x-1.5">
          <PhoneCall className="w-3.5 h-3.5" />
          <span>UniAbuja Campus Emergency Lines</span>
        </h3>

        <div className="grid grid-cols-1 gap-2">
          {UNI_ABUJA_EMERGENCY_CONTACTS.map((c, i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-[#140825] border border-purple-900/40 flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-bold text-white block">{c.name}</span>
                <span className="text-[10px] text-neutral-400">{c.location}</span>
              </div>
              <a
                href={`tel:${c.phone}`}
                className="px-3 py-1.5 rounded-xl bg-purple-900/70 border border-purple-600/50 text-purple-200 text-xs font-bold hover:bg-purple-800 transition-all flex items-center space-x-1"
              >
                <PhoneCall className="w-3 h-3" />
                <span>{c.phone}</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
