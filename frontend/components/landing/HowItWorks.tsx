import { Search, BookOpen, Brain } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: Search,
      title: 'Pick Your Subject',
      description: 'Filter by your year, your examining body, your weak spots.',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-400',
    },
    {
      number: '02',
      icon: BookOpen,
      title: 'Practice or Test',
      description:
        'Low-pressure practice with instant answers, or timed mock exams that simulate the real thing.',
      gradient: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
    },
    {
      number: '03',
      icon: Brain,
      title: 'Remember Everything',
      description:
        'Turn any question into a flashcard. Spaced repetition makes it stick.',
      gradient: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-400',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-24" aria-labelledby="how-it-works-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="how-it-works-heading"
          className="font-heading text-3xl md:text-4xl font-bold text-center text-text-primary"
        >
          How It Works
        </h2>
        <p className="text-text-secondary text-center mt-3 max-w-md mx-auto">
          Three steps to better exam results
        </p>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
          {/* Connection line (desktop only) */}
          <div className="hidden md:block absolute top-[72px] left-[16.5%] right-[16.5%] h-px bg-gradient-to-r from-transparent via-border to-transparent z-0" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.number} delay={i * 150}>
                <div className="relative z-10 text-center bg-bg-surface border border-border rounded-xl p-6 card-hover">
                  <span className="text-4xl font-heading font-bold gradient-text opacity-40">
                    {step.number}
                  </span>
                  <div className="mt-4 flex justify-center">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.gradient} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${step.iconColor}`} />
                    </div>
                  </div>
                  <h3 className="mt-4 font-heading text-xl font-semibold text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-text-secondary leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
