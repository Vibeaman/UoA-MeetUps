import React, { useState } from 'react';
import {
  X,
  Crown,
  Check,
  Zap,
  Eye,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Building,
  Smartphone,
  Lock,
} from 'lucide-react';
import { PREMIUM_PLANS } from '../data/catalogData';
import { useApp } from '../context/AppContext';

export const PremiumModal: React.FC = () => {
  const {
    isPremiumModalOpen,
    setIsPremiumModalOpen,
    isPremium,
    activePlan,
    activatePremium,
  } = useApp();

  const [selectedPlanId, setSelectedPlanId] = useState<'weekly' | 'monthly' | 'semester'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [payMethod, setPayMethod] = useState<'card' | 'transfer' | 'ussd'>('card');
  const [showPaystackCheckout, setShowPaystackCheckout] = useState(false);

  if (!isPremiumModalOpen) return null;

  const selectedPlan = PREMIUM_PLANS.find((p) => p.id === selectedPlanId) || PREMIUM_PLANS[1];

  const handleStartCheckout = () => {
    setShowPaystackCheckout(true);
  };

  const handleCompletePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowPaystackCheckout(false);
      activatePremium(selectedPlanId);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#1c0a32] via-[#120622] to-[#090312] border border-purple-600/40 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(168,85,247,0.3)] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Floating Close */}
        <button
          onClick={() => {
            setShowPaystackCheckout(false);
            setIsPremiumModalOpen(false);
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-neutral-300 hover:text-white transition-all z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Normal Plan View vs Paystack simulation */}
        {!showPaystackCheckout ? (
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5">
            {/* Header */}
            <div className="text-center pt-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-600/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-widest mb-2 shadow-sm">
                <Crown className="w-3.5 h-3.5 fill-amber-400" />
                <span>UoA MeetUps VIP Access</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
                Unlock Total Campus Dominance
              </h2>
              <p className="text-xs text-purple-200/80 mt-1 max-w-xs mx-auto">
                Get 5x more matches, unmask who liked you, and browse campus in Incognito.
              </p>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {PREMIUM_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#2e104f] to-[#1a0730] border-amber-400/80 shadow-[0_0_20px_rgba(234,179,8,0.25)] scale-[1.02]'
                        : 'bg-[#140726]/80 border-purple-950 hover:border-purple-800'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black uppercase bg-gradient-to-r from-amber-500 to-fuchsia-600 text-black px-2 py-0.5 rounded-full shadow-sm">
                        {plan.badge}
                      </span>
                    )}

                    <div className="text-center pt-1">
                      <span className="text-xs font-bold text-neutral-300 block">{plan.name}</span>
                      <div className="mt-1">
                        <span className="text-xl font-black text-white">{plan.price}</span>
                        <span className="text-[10px] text-neutral-400 block">{plan.period}</span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-purple-950 flex items-center justify-center">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'bg-amber-400 border-amber-400 text-black'
                            : 'border-neutral-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Benefits Checklist */}
            <div className="p-4 rounded-2xl bg-[#140826] border border-purple-900/40 space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300 block flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{selectedPlan.name} VIP Benefits:</span>
              </span>

              <div className="space-y-2 text-xs text-neutral-200">
                {selectedPlan.features.map((feat, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/40">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Paystack integration badge */}
            <div className="flex items-center justify-between text-[11px] text-neutral-400 px-2">
              <span className="flex items-center space-x-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Secured by Paystack Nigeria</span>
              </span>
              <span>Instant Auto-Activation</span>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleStartCheckout}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-purple-600 to-fuchsia-600 text-black font-black text-sm shadow-[0_0_25px_rgba(234,179,8,0.4)] hover:brightness-110 transition-all flex items-center justify-center space-x-2"
              id="paystack-checkout-trigger-btn"
            >
              <Crown className="w-4 h-4 fill-black" />
              <span>Proceed to Pay {selectedPlan.price} with Paystack</span>
            </button>
          </div>
        ) : (
          /* Paystack Checkout Simulator */
          <div className="space-y-5 pt-2 animate-fadeIn">
            <div className="text-center pb-3 border-b border-purple-950">
              <div className="inline-block p-2 rounded-xl bg-purple-950 border border-purple-700/50 text-purple-300 mb-1">
                <CreditCard className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-black text-white">Paystack Secure Checkout</h3>
              <p className="text-xs text-neutral-400">
                Paying <strong className="text-amber-300">{selectedPlan.price}</strong> for {selectedPlan.name}
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPayMethod('card')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  payMethod === 'card'
                    ? 'bg-purple-900/80 border-purple-400 text-white'
                    : 'bg-[#140826] border-purple-950 text-neutral-400'
                }`}
              >
                <CreditCard className="w-4 h-4 mx-auto mb-1 text-purple-300" />
                <span className="text-[11px] font-bold block">Debit Card</span>
              </button>

              <button
                onClick={() => setPayMethod('transfer')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  payMethod === 'transfer'
                    ? 'bg-purple-900/80 border-purple-400 text-white'
                    : 'bg-[#140826] border-purple-950 text-neutral-400'
                }`}
              >
                <Building className="w-4 h-4 mx-auto mb-1 text-purple-300" />
                <span className="text-[11px] font-bold block">Bank Transfer</span>
              </button>

              <button
                onClick={() => setPayMethod('ussd')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  payMethod === 'ussd'
                    ? 'bg-purple-900/80 border-purple-400 text-white'
                    : 'bg-[#140826] border-purple-950 text-neutral-400'
                }`}
              >
                <Smartphone className="w-4 h-4 mx-auto mb-1 text-purple-300" />
                <span className="text-[11px] font-bold block">USSD</span>
              </button>
            </div>

            {/* Mock card input preview */}
            {payMethod === 'card' && (
              <div className="p-4 rounded-2xl bg-[#140826] border border-purple-900/50 space-y-2.5 text-xs">
                <div>
                  <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    defaultValue="5399 •••• •••• 9012"
                    className="w-full p-2.5 rounded-xl bg-[#0e041b] border border-purple-950 text-white font-mono"
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                      Expiry
                    </label>
                    <input
                      type="text"
                      defaultValue="08 / 28"
                      className="w-full p-2.5 rounded-xl bg-[#0e041b] border border-purple-950 text-white font-mono"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 uppercase font-bold block mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      defaultValue="889"
                      className="w-full p-2.5 rounded-xl bg-[#0e041b] border border-purple-950 text-white font-mono"
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}

            {payMethod === 'transfer' && (
              <div className="p-4 rounded-2xl bg-[#140826] border border-purple-900/50 space-y-2 text-xs">
                <span className="text-[10px] text-purple-400 font-bold block uppercase">
                  Pay to Dynamic Wema/Paystack Account
                </span>
                <div className="p-3 rounded-xl bg-[#0e041b] border border-purple-950 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Account Number</span>
                    <strong className="text-sm text-white font-mono">9920148810</strong>
                  </div>
                  <span className="text-xs text-purple-300 font-bold">Wema Bank</span>
                </div>
              </div>
            )}

            {payMethod === 'ussd' && (
              <div className="p-4 rounded-2xl bg-[#140826] border border-purple-900/50 text-xs text-center space-y-1">
                <span className="text-neutral-300">Dial below on your registered SIM:</span>
                <p className="text-base font-mono font-bold text-amber-300">*737*50*1500*819#</p>
              </div>
            )}

            {/* Confirm & Activate */}
            <div className="space-y-2">
              <button
                onClick={handleCompletePayment}
                disabled={isProcessing}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 hover:brightness-110 transition-all flex items-center justify-center space-x-2"
                id="complete-paystack-btn"
              >
                {isProcessing ? (
                  <span>Authorizing with Paystack...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm Payment of {selectedPlan.price}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowPaystackCheckout(false)}
                className="w-full py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel & Change Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
