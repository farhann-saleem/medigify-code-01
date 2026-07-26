'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SubscribeButtonProps {
  selectedModules: string[];
  promoCode?: string;
  total: number;
}

export default function SubscribeButton({ selectedModules, promoCode, total }: SubscribeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubscribe = async () => {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirect=/pricing');
        return;
      }

      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: selectedModules, promoCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to initiate payment');
        return;
      }

      window.location.href = data.paymentUrl;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || selectedModules.length === 0;

  return (
    <div className="relative">
      <button
        onClick={handleSubscribe}
        disabled={disabled}
        className="relative block w-full py-3.5 px-6 rounded-xl gradient-accent hover:opacity-90 text-white text-center font-semibold transition-all duration-200 disabled:opacity-60 shadow-md shadow-accent/20 cursor-pointer"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 inline mr-2 -mt-0.5 animate-spin" />
        ) : (
          <Zap className="w-4 h-4 inline mr-2 -mt-0.5" />
        )}
        {loading
          ? 'Redirecting to payment...'
          : selectedModules.length === 0
          ? 'Select modules to continue'
          : `Pay Rs ${total.toLocaleString()}`}
      </button>
      {error && (
        <p className="text-error text-xs text-center mt-2">{error}</p>
      )}
    </div>
  );
}
