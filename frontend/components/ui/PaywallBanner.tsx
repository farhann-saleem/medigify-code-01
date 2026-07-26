'use client';

import Link from 'next/link';
import { Lock, Zap } from 'lucide-react';
import Button from '@/components/ui/Button';

interface PaywallBannerProps {
  questionsRemaining: number;
}

export default function PaywallBanner({ questionsRemaining }: PaywallBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 via-bg-surface to-bg-surface p-6 md:p-8 text-center shadow-lg">
      {/* Decorative glow */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        {/* Lock icon */}
        <div className="mx-auto w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7 text-accent" />
        </div>

        <h2 className="font-heading text-xl md:text-2xl font-bold text-text-primary mb-2">
          You've reached your free limit
        </h2>
        <p className="text-text-secondary text-sm md:text-base mb-6 max-w-sm mx-auto leading-relaxed">
          Free accounts get <span className="font-semibold text-text-primary">5 MCQs per subject</span>.
          Unlock modules starting from <span className="font-semibold text-accent">Rs 199/module</span> for unlimited practice.
        </p>

        {/* Feature list */}
        <ul className="inline-flex flex-col items-start gap-2 mb-6 text-sm text-text-secondary">
          <li className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent shrink-0" />
            Unlimited MCQs in unlocked modules
          </li>
          <li className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent shrink-0" />
            Pick only the modules you need
          </li>
          <li className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent shrink-0" />
            Detailed performance analytics
          </li>
          <li className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent shrink-0" />
            Early bird pricing available now
          </li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/pricing">
            <Button variant="filled" size="lg">
              <Zap className="w-4 h-4 mr-2" />
              Unlock Modules
            </Button>
          </Link>
          <Link href="/practice">
            <Button variant="ghost" size="lg">
              Practice a Different Subject
            </Button>
          </Link>
        </div>

        {questionsRemaining > 0 && (
          <p className="mt-4 text-xs text-text-secondary">
            You have <span className="font-medium text-text-primary">{questionsRemaining} free questions</span> remaining in other subjects.
          </p>
        )}
      </div>
    </div>
  );
}
