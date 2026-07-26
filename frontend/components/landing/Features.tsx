import Link from 'next/link';
import { Library, Timer, Layers, Smartphone } from 'lucide-react';
import Card from '@/components/ui/Card';
import Reveal from '@/components/ui/Reveal';

export default function Features() {
  const features = [
    {
      icon: Library,
      title: "10,000+ Past Paper MCQs",
      description:
        "Organized by subject, topic, and year. Every question comes with a detailed explanation.",
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-400',
    },
    {
      icon: Timer,
      title: "Exam-Realistic Mock Tests",
      description:
        "Timed blocks with no answer peeking. Full review after submission.",
      gradient: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
    },
    {
      icon: Layers,
      title: "Smart Flashcards",
      description:
        "One tap turns any question into a flashcard. Our algorithm surfaces it when you need it most, targeting your weak concepts.",
      gradient: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400',
    },
    {
      icon: Smartphone,
      title: "Works Everywhere",
      description: "Install as an app on your phone. Study on slow networks. No app store needed.",
      gradient: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-400',
      link: { href: '/pwa-guide', label: 'Learn more' },
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24 relative" aria-labelledby="features-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="features-heading"
          className="font-heading text-3xl md:text-4xl font-bold text-center text-text-primary"
        >
          Everything You Need to Pass
        </h2>
        <p className="text-text-secondary text-center mt-3 max-w-lg mx-auto">
          Tools designed around how medical students actually study
        </p>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={i * 100}>
                <Card hoverable className="h-full">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-text-secondary leading-relaxed text-sm">
                    {feature.description}
                    {feature.link && (
                      <>
                        {' '}
                        <Link
                          href={feature.link.href}
                          className="text-accent hover:text-accent-hover font-medium transition-colors inline-block"
                        >
                          {feature.link.label} &rarr;
                        </Link>
                      </>
                    )}
                  </p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
