'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Loader2 } from 'lucide-react';
import { useUserPlan } from '@/hooks/useUserPlan';
import { createClient } from '@/lib/supabase/client';

export default function SubscribeButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isPro, isLoading: planLoading } = useUserPlan();
  const router = useRouter();

  const handleSubscribe = async () => {
    setError(null);
    setLoading(true);

    try {
      // Check if logged in
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
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to initiate payment');
        return;
      }

      // Redirect to Swich payment page
      window.location.href = data.paymentUrl;
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isPro) {
    return (
      <div className="relative block w-full py-3 px-6 rounded-lg bg-success/15 text-success text-center font-semibold">
        You are on Pro
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleSubscribe}
        disabled={loading || planLoading}
        className="relative block w-full py-3 px-6 rounded-lg bg-accent hover:bg-accent-hover text-white text-center font-semibold transition-colors duration-150 disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 inline mr-2 -mt-0.5 animate-spin" />
        ) : (
          <Zap className="w-4 h-4 inline mr-2 -mt-0.5" />
        )}
        {loading ? 'Redirecting to payment...' : 'Subscribe to Pro'}
      </button>
      {error && (
        <p className="text-error text-xs text-center mt-2">{error}</p>
      )}
    </div>
  );
}
