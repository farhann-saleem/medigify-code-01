'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import { useUserPlan } from '@/hooks/useUserPlan';

export default function PaymentSuccessContent() {
  const { purchasedModules, isLoading } = useUserPlan();
  const [pollCount, setPollCount] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [verifyAttempted, setVerifyAttempted] = useState(false);
  const initialModulesRef = useRef<number | null>(null);

  // Capture initial module count on first load
  useEffect(() => {
    if (!isLoading && initialModulesRef.current === null) {
      initialModulesRef.current = purchasedModules.length;
    }
  }, [isLoading, purchasedModules]);

  // Detect new modules appearing (compare to initial count)
  useEffect(() => {
    if (isLoading || initialModulesRef.current === null) return;
    if (purchasedModules.length > initialModulesRef.current) {
      setUnlocked(true);
    }
  }, [purchasedModules, isLoading]);

  // Poll: first wait for callback (polls 1-4), then call verify API as fallback (poll 5+)
  useEffect(() => {
    if (unlocked || isLoading) return;
    if (pollCount >= 15) return;

    const timer = setTimeout(async () => {
      // After poll 5 (~15s), call verify endpoint to force-process pending purchases
      if (pollCount >= 4 && !verifyAttempted) {
        try {
          await fetch('/api/payment/verify', { method: 'POST' });
          setVerifyAttempted(true);
        } catch {
          // ignore, will retry on next poll
        }
      }

      setPollCount((c) => c + 1);
      // Trigger useUserPlan re-fetch
      window.dispatchEvent(new Event('visibilitychange'));
    }, 3000);

    return () => clearTimeout(timer);
  }, [pollCount, isLoading, unlocked, verifyAttempted]);

  const timedOut = pollCount >= 15 && !unlocked;

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-success" />
      </div>

      <h1 className="font-heading text-3xl font-bold text-text-primary mb-3">
        Payment Successful
      </h1>

      {unlocked ? (
        <p className="text-text-secondary mb-8">
          Your modules have been unlocked. Enjoy unlimited MCQs in your purchased modules.
        </p>
      ) : timedOut ? (
        <p className="text-text-secondary mb-8">
          Payment received! Your modules are being activated and will appear shortly.
          If they don&apos;t show up within a few minutes, please contact support.
        </p>
      ) : (
        <div className="flex items-center justify-center gap-2 text-text-secondary mb-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          <p>Activating your modules...</p>
        </div>
      )}

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-accent hover:opacity-90 text-white font-semibold transition-all duration-200 shadow-md shadow-accent/20"
      >
        Go to Dashboard
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
