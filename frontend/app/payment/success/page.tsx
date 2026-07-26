import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Payment Successful',
};

export default function PaymentSuccessPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-success" />
      </div>

      <h1 className="font-heading text-3xl font-bold text-text-primary mb-3">
        Payment Successful
      </h1>

      <p className="text-text-secondary mb-8">
        Your modules have been unlocked. Enjoy unlimited MCQs in your purchased modules.
      </p>

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
