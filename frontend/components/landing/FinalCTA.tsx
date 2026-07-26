import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function FinalCTA() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden" aria-labelledby="final-cta-heading">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-bg-surface to-bg-primary" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <h2
          id="final-cta-heading"
          className="font-heading text-3xl md:text-4xl font-bold"
        >
          <span className="text-text-primary">Your Exams Won&apos;t Wait.</span>
          <br />
          <span className="gradient-text">Neither Should You.</span>
        </h2>
        <p className="mt-4 text-text-secondary max-w-md mx-auto">
          Join thousands of medical students already studying smarter.
        </p>
        <div className="mt-8">
          <Link href="/practice">
            <Button variant="filled" size="lg">
              Start Practicing Now. It&apos;s Free
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
