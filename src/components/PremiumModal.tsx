import { FC, useState } from 'react';
import { X, Crown, Check, Sparkles, Lock, CreditCard } from 'lucide-react';
import { PREMIUM_PLANS } from '../data/catalogData';
import { useApp } from '../context/AppContext';
import { supabaseService } from '../services/supabaseService';

export const PremiumModal: FC = () => {
  const {
    isPremiumModalOpen,
    setIsPremiumModalOpen,
    activatePremium,
  } = useApp();

  const [selectedPlanId, setSelectedPlanId] = useState<'weekly' | 'monthly' | 'semester'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaystackCheckout, setShowPaystackCheckout] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (!isPremiumModalOpen) return null;

  const selectedPlan = PREMIUM_PLANS.find((plan) => plan.id === selectedPlanId) || PREMIUM_PLANS[1];

  const closeModal = () => {
    setShowPaystackCheckout(false);
    setPaymentError(null);
    setIsPremiumModalOpen(false);
  };

  const handleStartCheckout = () => {
    setPaymentError(null);
    setShowPaystackCheckout(true);
  };

  const handleCompletePayment = async () => {
    setIsProcessing(true);
    setPaymentError(null);

    const { data, error } = await supabaseService.initializePaystackTransaction(selectedPlanId);
    if (error || !data?.authorizationUrl) {
      const message = error || 'Paystack could not initialize this payment.';
      setPaymentError(message);
      setIsProcessing(false);
      return;
    }

    window.location.assign(data.authorizationUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/90 p-3 backdrop-blur-xl sm:p-4">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-orange-600/40 bg-gradient-to-b from-[#1c0a32] via-[#120622] to-[#090312] p-5 shadow-[0_0_50px_rgba(168,85,247,0.3)] sm:p-6">
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-4 z-20 rounded-full bg-white/10 p-2 text-neutral-300 transition-all hover:text-white"
          aria-label="Close premium plans"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-orange-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 rounded-full bg-orange-600/20 blur-3xl" />

        {!showPaystackCheckout ? (
          <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto">
            <div className="pt-2 text-center">
              <div className="mb-2 inline-flex items-center space-x-1.5 rounded-full border border-orange-400/40 bg-gradient-to-r from-orange-500/20 to-orange-600/20 px-3 py-1 text-xs font-black uppercase tracking-widest text-orange-300 shadow-sm">
                <Crown className="h-3.5 w-3.5 fill-orange-400" />
                <span>UoA MeetUps VIP Access</span>
              </div>
              <h2 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">
                Unlock Total Campus Dominance
              </h2>
              <p className="mx-auto mt-1 max-w-xs text-xs text-orange-200/80">
                Use a 30-minute Profile Boost, unmask who liked you, and browse campus in Incognito.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {PREMIUM_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                return (
                  <button
                    type="button"
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all ${
                      isSelected
                        ? 'scale-[1.02] border-orange-400/80 bg-gradient-to-b from-[#2e104f] to-[#1a0730] shadow-[0_0_20px_rgba(234,179,8,0.25)]'
                        : 'border-orange-950 bg-[#140726]/80 hover:border-orange-800'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-2 py-0.5 text-[8px] font-black uppercase text-black shadow-sm">
                        {plan.badge}
                      </span>
                    )}
                    <span className="block pt-1 text-center text-xs font-bold text-neutral-300">{plan.name}</span>
                    <span className="mt-1 block text-center text-xl font-black text-white">{plan.price}</span>
                    <span className="block text-center text-[10px] text-neutral-400">{plan.period}</span>
                    <span className="mt-2 flex items-center justify-center border-t border-orange-950 pt-2">
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${isSelected ? 'border-orange-400 bg-orange-400 text-black' : 'border-neutral-600'}`}>
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2.5 rounded-2xl border border-orange-900/40 bg-[#1e0c29] p-4">
              <span className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-orange-300">
                <Sparkles className="h-3.5 w-3.5 text-orange-400" />
                <span>{selectedPlan.name} VIP Benefits:</span>
              </span>
              <div className="space-y-2 text-xs text-neutral-200">
                {selectedPlan.features.map((feature) => (
                  <div key={feature} className="flex items-start space-x-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-orange-500/40 bg-orange-500/20 text-orange-300">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-2 text-[11px] text-neutral-400">
              <span className="flex items-center space-x-1">
                <Lock className="h-3 w-3 text-emerald-400" />
                <span>Server-verified by Paystack</span>
              </span>
              <span>Test mode</span>
            </div>

            <button
              type="button"
              onClick={handleStartCheckout}
              className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-orange-400 via-orange-600 to-orange-600 px-4 py-3.5 text-sm font-black text-black shadow-[0_0_25px_rgba(234,179,8,0.4)] transition-all hover:brightness-110"
              id="paystack-checkout-trigger-btn"
            >
              <Crown className="h-4 w-4 fill-black" />
              <span>Proceed to Pay {selectedPlan.price} with Paystack</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5 pt-2">
            <div className="border-b border-orange-950 pb-3 text-center">
              <div className="mb-1 inline-block rounded-xl border border-orange-700/50 bg-orange-950 p-2 text-orange-300">
                <CreditCard className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-black text-white">Paystack Test Checkout</h3>
              <p className="text-xs text-neutral-400">
                Paying <strong className="text-orange-300">{selectedPlan.price}</strong> for {selectedPlan.name}
              </p>
            </div>

            <div className="space-y-3 rounded-2xl border border-orange-900/50 bg-[#1e0c29] p-4 text-sm text-neutral-200">
              <p>Continue to Paystack’s hosted checkout to choose card, bank transfer, or USSD.</p>
              <p className="text-xs leading-relaxed text-neutral-400">
                Your premium access activates only after the server verifies the transaction amount and status. The admin revenue dashboard records only verified Paystack events.
              </p>
            </div>

            {paymentError && (
              <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-center text-xs font-semibold text-rose-300">
                {paymentError}
              </p>
            )}

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCompletePayment}
                disabled={isProcessing}
                className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/40 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                id="complete-paystack-btn"
              >
                {isProcessing ? <span>Opening Paystack…</span> : <><Check className="h-4 w-4" /><span>Continue to Paystack</span></>}
              </button>
              <button
                type="button"
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
