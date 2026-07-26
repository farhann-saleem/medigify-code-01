'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { ReactNode } from 'react';

interface AccordionItem {
  question: string;
  answer: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className={`border rounded-xl overflow-hidden transition-colors duration-200 ${
              isOpen ? 'border-accent/30 bg-bg-surface' : 'border-border hover:border-border/80'
            }`}
          >
            <button
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between p-4 md:p-5 text-left min-h-[48px] hover:bg-bg-surface-hover/50 transition-colors duration-200"
              aria-expanded={isOpen}
            >
              <span className="font-body font-medium text-text-primary pr-4 text-sm md:text-base">
                {item.question}
              </span>
              <ChevronDown
                className={`w-5 h-5 text-text-secondary shrink-0 transition-transform duration-300 ${
                  isOpen ? 'rotate-180 text-accent' : ''
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-4 pb-4 md:px-5 md:pb-5 text-text-secondary leading-relaxed text-sm">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
