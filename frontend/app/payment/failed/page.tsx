import type { Metadata } from 'next';
import Link from 'next/link';
import { XCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Payment Failed',
};

export default function PaymentFailedPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-error/15 flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-8 h-8 text-error" />
      </div>

      <h1 className="font-heading text-3xl font-bold text-text-primary mb-3">
        Payment Failed
      </h1>

      <p className="text-text-secondary mb-8">
        Something went wrong with your payment. No amount was charged. Please try again.
      </p>

      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold transition-colors"
      >
        Try Again
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
