import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Zap, BookOpen, BarChart3, FlaskConical, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing — Medigify',
  description: 'Choose a plan that fits your study goals. Free plan available. Upgrade to Pro for unlimited MCQ access.',
};

const FREE_FEATURES = [
  '5 MCQs per subject per session',
  'Access to all 7 subjects',
  'Instant explanations & feedback',
];

const PRO_FEATURES = [
  'Unlimited MCQs across all subjects',
  'Full question bank (10,000+ questions)',
  'Detailed performance analytics',
  'Weak subject identification',
  'Flashcard saving & review',
  'Mock test mode (coming soon)',
  'Priority support',
];

function FeatureItem({ text, included }: { text: string; included: boolean }) {
  return (
    <li className={`flex items-start gap-3 text-sm ${included ? 'text-text-primary' : 'text-text-secondary/50 line-through'}`}>
      <span className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${included ? 'bg-success/15 text-success' : 'bg-border text-text-secondary/40'}`}>
        <Check className="w-3 h-3" />
      </span>
      {text}
    </li>
  );
}

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-text-primary tracking-tight mb-4">
          Simple, Honest Pricing
        </h1>
        <p className="text-text-secondary text-lg max-w-xl mx-auto">
          Start for free. Upgrade when you need more. No hidden fees, no surprise charges.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">

        {/* Free Card */}
        <div className="bg-bg-surface border border-border rounded-2xl p-8 flex flex-col">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-text-secondary" />
              <span className="text-sm font-semibold uppercase tracking-widest text-text-secondary">Free</span>
            </div>
            <div className="flex items-end gap-1 mt-3">
              <span className="font-heading text-4xl font-bold text-text-primary">Rs 0</span>
              <span className="text-text-secondary mb-1.5">/ forever</span>
            </div>
            <p className="text-text-secondary text-sm mt-2">
              Perfect for getting started and exploring the platform.
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8">
            {FREE_FEATURES.map((f) => (
              <FeatureItem key={f} text={f} included={true} />
            ))}
          </ul>

          <Link
            href="/signup"
            className="block w-full py-3 px-6 rounded-lg border border-border text-center font-semibold text-text-primary hover:bg-bg-surface-hover transition-colors duration-150"
          >
            Get Started Free
          </Link>
        </div>

        {/* Pro Card */}
        <div className="relative bg-bg-surface border-2 border-accent rounded-2xl p-8 flex flex-col shadow-xl shadow-accent/10 overflow-hidden">
          {/* Glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="absolute top-5 right-5 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
            MOST POPULAR
          </div>

          <div className="mb-6 relative">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold uppercase tracking-widest text-accent">Pro</span>
            </div>
            <div className="flex items-end gap-1 mt-3">
              <span className="font-heading text-4xl font-bold text-text-primary">Rs 1500</span>
              <span className="text-text-secondary mb-1.5">/ month</span>
            </div>
            <p className="text-text-secondary text-sm mt-2">
              Everything you need to master your exams.
            </p>
          </div>

          <ul className="space-y-3 flex-1 mb-8 relative">
            {PRO_FEATURES.map((f) => (
              <FeatureItem key={f} text={f} included={true} />
            ))}
          </ul>

          <a
            href="mailto:medigifyglobal@gmail.com?subject=Medigify Pro Early Access"
            className="relative block w-full py-3 px-6 rounded-lg bg-accent hover:bg-accent-hover text-white text-center font-semibold transition-colors duration-150"
          >
            <Zap className="w-4 h-4 inline mr-2 -mt-0.5" />
            Get Early Access
          </a>
          <p className="text-center text-xs text-text-secondary mt-3 relative">
            Email us to get Pro access while we set up payments.
          </p>
        </div>

      </div>

      {/* Trust bar */}
      <div className="mt-16 border-t border-border pt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
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
