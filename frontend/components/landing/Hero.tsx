'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

const questions = [
  {
    num: 3,
    progress: 30,
    text: 'Which cranial nerve carries taste from the anterior 2/3 of the tongue?',
    options: ['CN IX', 'CN VII', 'CN V', 'CN X'],
    correctIndex: 1,
    explanation: 'The facial nerve (CN VII) carries taste via the chorda tympani...',
  },
  {
    num: 4,
    progress: 40,
    text: 'Which enzyme deficiency causes Phenylketonuria (PKU)?',
    options: ['Tyrosinase', 'Phenylalanine hydroxylase', 'Homogentisic oxidase', 'Cystathionine synthase'],
    correctIndex: 1,
    explanation: 'PKU is caused by deficiency of phenylalanine hydroxylase...',
  },
  {
    num: 5,
    progress: 50,
    text: 'The SA node is supplied by which artery in most individuals?',
    options: ['Left circumflex', 'LAD', 'Right coronary', 'Posterior descending'],
    correctIndex: 2,
    explanation: 'In ~60% of people, the SA node is supplied by the right coronary artery...',
  },
];

export default function Hero() {
  const [qIndex, setQIndex] = useState(0);
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    // Initial entrance delay (wait for stagger animations)
    const initialDelay = setTimeout(() => {
      setPhase('show');
    }, 2800);

    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    if (phase !== 'show') return;

    // Stay on current question for 3s, then cycle
    const timer = setTimeout(() => {
      setPhase('exit');
      setTimeout(() => {
        setQIndex((prev) => (prev + 1) % questions.length);
        setPhase('enter');
        setTimeout(() => setPhase('show'), 50);
      }, 400);
    }, 3000);

    return () => clearTimeout(timer);
  }, [phase, qIndex]);

  const q = questions[qIndex];
  const isFirst = qIndex === 0 && phase === 'enter';

  return (
    <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden" aria-labelledby="hero-heading">
      {/* Ambient glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-accent/8 rounded-full blur-[100px] animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" style={{ animationDelay: '1.5s' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <h1
              id="hero-heading"
              className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight"
            >
              <span className="text-text-primary">Ace Your Medical Exams,</span>
              <br />
              <span className="gradient-text">One Question at a Time</span>
            </h1>
            <p className="mt-6 text-base md:text-lg text-text-secondary leading-relaxed max-w-xl mx-auto lg:mx-0">
              Pakistan&apos;s smartest question bank, past papers, spaced-repetition flashcards, and high-yield mock tests — built around how you actually study.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
              <Link href="/practice">
                <Button variant="filled" size="lg">
                  Try Practice Mode, It&apos;s Free!
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="ghost" size="lg">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>

          {/* Phone Mockup */}
          <div className="flex-shrink-0 animate-float">
            <div className="relative">
              {/* Glow behind phone */}
              <div className="absolute -inset-4 bg-accent/10 rounded-[3rem] blur-2xl pointer-events-none animate-pulse-glow" />

              <div className="w-[240px] sm:w-[260px] h-[480px] sm:h-[520px] bg-bg-surface border border-border/60 rounded-[2.5rem] p-2.5 relative overflow-hidden shadow-xl shadow-black/20">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-bg-primary rounded-b-xl z-10" />
                {/* Screen Content */}
                <div className="w-full h-full bg-bg-primary rounded-[2rem] p-3.5 pt-7 overflow-hidden">
                  {/* Mini Progress Bar */}
                  <div className="w-full h-1 bg-border rounded-full mb-2.5">
                    <div
                      className={`h-full gradient-accent rounded-full ${isFirst ? 'phone-progress-bar' : 'transition-all duration-700 ease-out'}`}
                      style={isFirst ? undefined : { width: `${q.progress}%` }}
                    />
                  </div>

                  <div
                    className={`transition-all duration-300 ${
                      phase === 'exit' ? 'opacity-0 translate-y-[-4px]' :
                      phase === 'enter' && !isFirst ? 'opacity-0 translate-y-[8px]' : ''
                    }`}
                  >
                    <p className={`text-[10px] text-text-secondary text-right mb-3 ${isFirst ? 'phone-stagger-1' : ''}`}>
                      Question {q.num} of 10
                    </p>
                    {/* Mini Question Card */}
                    <div className={`bg-bg-surface border border-border/60 rounded-lg p-2.5 mb-2.5 ${isFirst ? 'phone-stagger-2' : ''}`}>
                      <p className="text-[11px] text-text-primary leading-relaxed">
                        {q.text}
                      </p>
                    </div>
                    {/* Mini Options */}
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`mb-1.5 p-2 rounded border text-[10px] transition-all duration-200 ${isFirst ? `phone-stagger-${i + 3}` : ''} ${
                          isFirst && i === q.correctIndex
                            ? 'phone-correct-answer border-border/40 text-text-secondary'
                            : !isFirst && i === q.correctIndex && phase === 'show'
                              ? 'border-success/50 bg-success/10 text-success font-medium'
                              : 'border-border/40 text-text-secondary'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}. {opt}
                        {i === q.correctIndex && (
                          <span className={`ml-1 ${isFirst ? 'phone-checkmark' : phase === 'show' ? 'inline-block' : 'opacity-0'}`}>
                            &#10003;
                          </span>
                        )}
                      </div>
                    ))}
                    {/* Mini Explanation */}
                    <div className={`border-l-2 border-accent bg-accent/5 rounded-r-lg p-2 mt-2.5 ${isFirst ? 'phone-stagger-7' : ''}`}>
                      <p className="text-[9px] text-text-secondary leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
