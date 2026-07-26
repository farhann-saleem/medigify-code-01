'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check, Shield, FlaskConical, BarChart3,
  Tag, Loader2, Sparkles, ShoppingCart,
} from 'lucide-react';
import { MODULES, PRICES, isEarlyBird, getEffectivePrice, calculateTotal } from '@/lib/pricing';
import { useUserPlan } from '@/hooks/useUserPlan';
import SubscribeButton from './SubscribeButton';

const MODULE_ICONS: Record<string, string> = {
  'Cardiovascular Module': '\u2764\uFE0F',
  'Foundation Module': '\uD83E\uDDEC',
  'Hematopoietic and Lymphatic Module': '\uD83E\uDE78',
  'Musculoskeletal Module': '\uD83E\uDDB4',
  'Respiratory Module': '\uD83E\uDEC1',
};

export default function PricingPage() {
  const { purchasedModules, isLoading } = useUserPlan();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | undefined>();
  const [promoLabel, setPromoLabel] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const earlyBird = isEarlyBird();
  const { price: effectivePrice } = getEffectivePrice(appliedPromo);
  const selectedModules = Array.from(selected);
  const { total, pricePerModule, label: discountLabel } = calculateTotal(
    selectedModules.length,
    appliedPromo,
  );

  const toggleModule = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const unowned = MODULES.filter((m) => !purchasedModules.includes(m.id)).map((m) => m.id);
    setSelected(new Set(unowned));
  };

  const handleValidatePromo = async () => {
    const code = promoInput.trim();
    if (!code) return;

    setPromoError(null);
    setPromoLoading(true);

    try {
      const res = await fetch('/api/payment/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.valid) {
        setAppliedPromo(code);
        setPromoLabel(data.label);
        setPromoError(null);
      } else {
        setPromoError('Invalid promo code');
        setAppliedPromo(undefined);
        setPromoLabel(null);
      }
    } catch {
      setPromoError('Could not validate code');
    } finally {
      setPromoLoading(false);
    }
  };

  const clearPromo = () => {
    setAppliedPromo(undefined);
    setPromoLabel(null);
    setPromoInput('');
    setPromoError(null);
  };

  const savingsPerModule = PRICES.base - effectivePrice;
  const totalSavings = savingsPerModule * selectedModules.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
          Unlock Your Modules
        </h1>
        <p className="text-text-secondary text-lg max-w-xl mx-auto">
          Pick the modules you need. Pay once, practice unlimited.
        </p>
      </div>

      {/* Early Bird Banner */}
      {earlyBird && (
        <div className="max-w-2xl mx-auto mb-10 rounded-xl border border-warning/30 bg-warning/5 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-warning" />
            <span className="font-heading font-semibold text-text-primary">Early Bird Pricing Active</span>
          </div>
          <p className="text-sm text-text-secondary">
            <span className="line-through text-text-secondary/60">Rs {PRICES.base}</span>{' '}
            <span className="font-bold text-warning">Rs {PRICES.earlyBird}</span> per module until Aug 15, 2026
          </p>
        </div>
      )}

      {/* Module Grid */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-semibold text-text-primary">
            Select Modules
          </h2>
          {purchasedModules.length < MODULES.length && (
            <button
              onClick={selectAll}
              className="text-sm text-accent hover:underline cursor-pointer"
            >
              Select all available
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map((mod) => {
              const owned = purchasedModules.includes(mod.id);
              const isSelected = selected.has(mod.id);
              const icon = MODULE_ICONS[mod.id] || '';

              return (
                <button
                  key={mod.id}
                  onClick={() => !owned && toggleModule(mod.id)}
                  disabled={owned}
                  className={`relative rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                    owned
                      ? 'border-success/30 bg-success/5 cursor-default'
                      : isSelected
                      ? 'border-accent bg-accent/5 shadow-md shadow-accent/10 cursor-pointer'
                      : 'border-border bg-bg-surface hover:border-accent/30 hover:bg-bg-surface-hover cursor-pointer'
                  }`}
                >
                  {owned && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Owned
                    </span>
                  )}
                  {isSelected && !owned && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  )}
                  <span className="text-2xl mb-2 block">{icon}</span>
                  <h3 className="font-heading font-semibold text-text-primary text-sm">
                    {mod.label}
                  </h3>
                  {!owned && (
                    <p className="text-xs text-text-secondary mt-1">
                      Rs {effectivePrice}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Promo Code Section */}
      <div className="max-w-3xl mx-auto mb-8">
        <div className="bg-bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">Promo Code</span>
          </div>
          {appliedPromo ? (
            <div className="flex items-center justify-between bg-success/10 border border-success/20 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-success">
                  {appliedPromo.toUpperCase()} applied ({promoLabel})
                </span>
              </div>
              <button
                onClick={clearPromo}
                className="text-xs text-text-secondary hover:text-error cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="flex-1 rounded-lg border-0 py-2.5 px-3 bg-bg-primary text-text-primary ring-1 ring-inset ring-border focus:ring-2 focus:ring-accent text-sm"
              />
              <button
                onClick={handleValidatePromo}
                disabled={promoLoading || !promoInput.trim()}
                className="px-4 py-2.5 rounded-lg bg-bg-primary border border-border text-sm font-medium text-text-primary hover:bg-bg-surface-hover disabled:opacity-50 transition-colors cursor-pointer"
              >
                {promoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </button>
            </div>
          )}
          {promoError && (
            <p className="text-xs text-error mt-2">{promoError}</p>
          )}
          {earlyBird && !appliedPromo && (
            <p className="text-xs text-text-secondary mt-2">
              Early bird discount (Rs {PRICES.earlyBird}/module) is already applied and beats most promo codes.
            </p>
          )}
        </div>
      </div>

      {/* Sticky Checkout Bar */}
      {selectedModules.length > 0 && (
        <div className="max-w-3xl mx-auto mb-10">
          <div className="bg-bg-surface border-2 border-accent/30 rounded-2xl p-6 shadow-lg shadow-accent/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="w-4 h-4 text-accent" />
                  <span className="font-heading font-semibold text-text-primary">
                    {selectedModules.length} module{selectedModules.length > 1 ? 's' : ''} selected
                  </span>
                </div>
                <p className="text-sm text-text-secondary">
                  Rs {pricePerModule} x {selectedModules.length} = Rs {total.toLocaleString()}
                  {totalSavings > 0 && (
                    <span className="ml-2 text-success font-medium">
                      (Save Rs {totalSavings.toLocaleString()})
                    </span>
                  )}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {discountLabel} pricing
                </p>
              </div>
            </div>
            <SubscribeButton
              selectedModules={selectedModules}
              promoCode={appliedPromo}
              total={total}
            />
          </div>
        </div>
      )}

      {/* Free tier info */}
      {purchasedModules.length === 0 && selectedModules.length === 0 && (
        <div className="max-w-3xl mx-auto mb-10 text-center">
          <div className="bg-bg-surface border border-border rounded-xl p-6">
            <p className="text-text-secondary text-sm mb-3">
              Already using Medigify for free? You get <span className="font-semibold text-text-primary">5 MCQs per subject</span> per session.
              Unlock modules for unlimited access.
            </p>
            <Link href="/signup" className="text-accent text-sm font-medium hover:underline">
              Create a free account
            </Link>
          </div>
        </div>
      )}

      {/* Trust bar */}
      <div className="max-w-3xl mx-auto border-t border-border pt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
        <div className="flex flex-col items-center gap-2">
          <Shield className="w-7 h-7 text-accent" />
          <h3 className="font-heading font-semibold text-text-primary">Secure & Private</h3>
          <p className="text-text-secondary text-sm">Your data is fully encrypted and securely stored, ensuring complete privacy and protection</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <FlaskConical className="w-7 h-7 text-accent" />
          <h3 className="font-heading font-semibold text-text-primary">Exam-Focused</h3>
          <p className="text-text-secondary text-sm">Carefully curated, high-yield questions designed specifically according to UHS exam patterns, helping you study smarter</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <BarChart3 className="w-7 h-7 text-accent" />
          <h3 className="font-heading font-semibold text-text-primary">Track Progress</h3>
          <p className="text-text-secondary text-sm">Get detailed insights into your performance, identify weak areas, and continuously improve with a clear, data-driven view.</p>
        </div>
      </div>
    </div>
  );
}
