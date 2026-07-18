'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import Button from '@/components/ui/Button';
import mcqData from '@/data/mcqs.json';
import { MCQ } from '@/lib/types';
import {
  getSubjects,
  getModules,
  getDifficulties,
  filterMCQs,
  getDifficultyLabel,
  getDifficultyColor,
} from '@/lib/utils';

const BLOCK_SIZES = [5, 10, 15, 20];

export default function PracticePage() {
  const router = useRouter();
  const mcqs = mcqData as MCQ[];

  const subjects = useMemo(() => getSubjects(mcqs), [mcqs]);
  const modules = useMemo(() => getModules(mcqs), [mcqs]);
  const difficulties = useMemo(() => getDifficulties(mcqs), [mcqs]);

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [blockSize, setBlockSize] = useState<number | 'all'>(10);

  const toggle = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(
      list.includes(item)
        ? list.filter((s) => s !== item)
        : [...list, item]
    );
  };

  const availableCount = useMemo(() => {
    return filterMCQs(mcqs, {
      subjects: selectedSubjects.length > 0 ? selectedSubjects : undefined,
      difficulties: selectedDifficulties.length > 0 ? selectedDifficulties : undefined,
      modules: selectedModules.length > 0 ? selectedModules : undefined,
    }).length;
  }, [selectedSubjects, selectedDifficulties, selectedModules, mcqs]);

  const actualBlockSize = blockSize === 'all' ? availableCount : Math.min(blockSize, availableCount);

  const handleStart = () => {
    const params = new URLSearchParams();
    params.set('subjects', selectedSubjects.length === 0 ? 'all' : selectedSubjects.join(','));
    params.set('difficulty', selectedDifficulties.length === 0 ? 'all' : selectedDifficulties.join(','));
    params.set('module', selectedModules.length === 0 ? 'all' : selectedModules.join(','));
    params.set('count', String(actualBlockSize));
    router.push(`/practice/session?${params.toString()}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Page Header */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <BookOpen className="w-8 h-8 text-accent" />
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
            Practice Mode
          </h1>
        </div>
        <p className="text-text-secondary max-w-lg mx-auto">
          Select difficulty, module, and subjects to start a focused practice
          session with immediate feedback.
        </p>
      </div>

      {/* Difficulty Selection */}
      <section aria-labelledby="difficulty-heading" className="mb-8">
        <h2
          id="difficulty-heading"
          className="font-heading text-xl font-semibold text-text-primary mb-4"
        >
          Difficulty
        </h2>
        <div className="flex flex-wrap gap-3">
          {difficulties.map((diff) => {
            const isSelected = selectedDifficulties.includes(diff.name);
            const dc = getDifficultyColor(diff.name);
            return (
              <button
                key={diff.name}
                onClick={() => toggle(selectedDifficulties, diff.name, setSelectedDifficulties)}
                className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-150 min-h-[48px] ${
                  isSelected
                    ? `${dc.border} ${dc.bg} ${dc.text}`
                    : 'border-border bg-bg-surface hover:bg-bg-surface-hover text-text-secondary'
                }`}
              >
                {getDifficultyLabel(diff.name)}
                <span className="ml-2 text-xs opacity-70">({diff.count})</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {selectedDifficulties.length === 0
            ? 'All difficulties selected'
            : `${selectedDifficulties.map(getDifficultyLabel).join(', ')} selected`}
        </p>
      </section>

      {/* Module Selection */}
      <section aria-labelledby="module-heading" className="mb-8">
        <h2
          id="module-heading"
          className="font-heading text-xl font-semibold text-text-primary mb-4"
        >
          Module
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modules.map((mod) => {
            const isSelected = selectedModules.includes(mod.name);
            return (
              <button
                key={mod.name}
                onClick={() => toggle(selectedModules, mod.name, setSelectedModules)}
                className={`relative p-4 rounded-lg border text-left transition-all duration-150 min-h-[48px] ${
                  isSelected
                    ? 'border-accent bg-accent/10 ring-1 ring-accent'
                    : 'border-border bg-bg-surface hover:bg-bg-surface-hover hover:border-accent/30'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <p className="font-medium text-text-primary text-sm">{mod.name}</p>
                <p className="text-xs text-text-secondary mt-1">{mod.count} MCQs</p>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-text-secondary mt-2">
          {selectedModules.length === 0
            ? 'All modules selected'
            : `${selectedModules.length} module${selectedModules.length !== 1 ? 's' : ''} selected`}
        </p>
      </section>

      {/* Subject Selection */}
      <section aria-labelledby="subjects-heading" className="mb-10">
        <h2
          id="subjects-heading"
          className="font-heading text-xl font-semibold text-text-primary mb-4"
        >
          Subjects
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {subjects.map((subject) => {
            const isSelected = selectedSubjects.includes(subject.name);
            return (
              <button
                key={subject.name}
                onClick={() => toggle(selectedSubjects, subject.name, setSelectedSubjects)}
                className={`relative p-4 rounded-lg border text-left transition-all duration-150 min-h-[48px] ${
                  isSelected
                    ? 'border-accent bg-accent/10 ring-1 ring-accent'
                    : 'border-border bg-bg-surface hover:bg-bg-surface-hover hover:border-accent/30'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <p className="font-medium text-text-primary text-sm">{subject.name}</p>
                <p className="text-xs text-text-secondary mt-1">{subject.count} MCQs</p>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-text-secondary mt-3">
          {selectedSubjects.length === 0
            ? `All subjects selected`
            : `${selectedSubjects.length} subject${selectedSubjects.length !== 1 ? 's' : ''} selected`}
        </p>
      </section>

      {/* Available count */}
      <div className="text-center mb-4">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">{availableCount}</span> MCQs match your filters
        </p>
      </div>

      {/* Block Size Picker */}
      <section aria-labelledby="block-size-heading" className="mb-10">
        <h2
          id="block-size-heading"
          className="font-heading text-xl font-semibold text-text-primary mb-4"
        >
          Block Size
        </h2>
        <div className="flex flex-wrap gap-3">
          {BLOCK_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setBlockSize(size)}
              disabled={size > availableCount}
              className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-150 min-h-[48px] ${
                blockSize === size
                  ? 'bg-accent text-white border-accent'
                  : size > availableCount
                  ? 'border-border text-text-secondary/40 cursor-not-allowed'
                  : 'border-border text-text-secondary hover:border-accent/30 hover:text-text-primary'
              }`}
            >
              {size}
            </button>
          ))}
          <button
            onClick={() => setBlockSize('all')}
            className={`px-5 py-2.5 rounded-full border text-sm font-medium transition-all duration-150 min-h-[48px] ${
              blockSize === 'all'
                ? 'bg-accent text-white border-accent'
                : 'border-border text-text-secondary hover:border-accent/30 hover:text-text-primary'
            }`}
          >
            All ({availableCount})
          </button>
        </div>
      </section>

      {/* Start Button */}
      <div className="text-center">
        <Button
          variant="filled"
          size="lg"
          onClick={handleStart}
          disabled={availableCount === 0}
        >
          Start Practice ({actualBlockSize} question{actualBlockSize !== 1 ? 's' : ''})
        </Button>
      </div>
    </div>
  );
}
