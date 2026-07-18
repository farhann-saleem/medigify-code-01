import { MCQ, MCQExplanation, Answer, SubjectInfo, SubjectBreakdown } from './types';

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Format milliseconds to human-readable time
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * Get unique subjects with their MCQ counts
 */
export function getSubjects(mcqs: MCQ[]): SubjectInfo[] {
  const subjectMap = new Map<string, number>();
  mcqs.forEach((mcq) => {
    const count = subjectMap.get(mcq.subject) || 0;
    subjectMap.set(mcq.subject, count + 1);
  });
  return Array.from(subjectMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Filter MCQs by selected subjects
 */
export function filterMCQsBySubjects(mcqs: MCQ[], subjects: string[]): MCQ[] {
  return mcqs.filter((mcq) => subjects.includes(mcq.subject));
}

/**
 * Get subject breakdown from answers
 */
export function getSubjectBreakdown(
  questions: MCQ[],
  answers: Map<string, Answer>
): SubjectBreakdown[] {
  const breakdown = new Map<string, { correct: number; total: number }>();

  questions.forEach((question) => {
    const answer = answers.get(question.id);
    if (!answer) return;

    const current = breakdown.get(question.subject) || { correct: 0, total: 0 };
    current.total += 1;
    if (answer.isCorrect) current.correct += 1;
    breakdown.set(question.subject, current);
  });

  return Array.from(breakdown.entries())
    .map(([subject, stats]) => ({
      subject,
      correct: stats.correct,
      total: stats.total,
      accuracy: calculateAccuracy(stats.correct, stats.total),
    }))
    .sort((a, b) => a.subject.localeCompare(b.subject));
}

/**
 * Get the score color class based on percentage
 */
export function getScoreColor(percentage: number): string {
  if (percentage >= 80) return 'text-success';
  if (percentage >= 50) return 'text-warning';
  return 'text-error';
}

/**
 * Get option label (A, B, C, D, E) from key
 */
export function getOptionLabel(key: string): string {
  return key.toUpperCase();
}

/**
 * Get unique modules with their MCQ counts
 */
export function getModules(mcqs: MCQ[]): SubjectInfo[] {
  const moduleMap = new Map<string, number>();
  mcqs.forEach((mcq) => {
    const count = moduleMap.get(mcq.module) || 0;
    moduleMap.set(mcq.module, count + 1);
  });
  return Array.from(moduleMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get difficulty counts
 */
export function getDifficulties(mcqs: MCQ[]): SubjectInfo[] {
  const order = ['easy', 'moderate', 'hard'];
  const diffMap = new Map<string, number>();
  mcqs.forEach((mcq) => {
    const count = diffMap.get(mcq.difficulty) || 0;
    diffMap.set(mcq.difficulty, count + 1);
  });
  return order
    .filter((d) => diffMap.has(d))
    .map((d) => ({ name: d, count: diffMap.get(d)! }));
}

/**
 * Filter MCQs by multiple criteria
 */
export function filterMCQs(
  mcqs: MCQ[],
  filters: {
    subjects?: string[];
    difficulties?: string[];
    modules?: string[];
  }
): MCQ[] {
  return mcqs.filter((mcq) => {
    if (filters.subjects && filters.subjects.length > 0) {
      if (!filters.subjects.includes(mcq.subject)) return false;
    }
    if (filters.difficulties && filters.difficulties.length > 0) {
      if (!filters.difficulties.includes(mcq.difficulty)) return false;
    }
    if (filters.modules && filters.modules.length > 0) {
      if (!filters.modules.includes(mcq.module)) return false;
    }
    return true;
  });
}

/**
 * Format per-option explanation object for display.
 * Shows correct answer explanation first, then incorrect ones.
 */
export function formatExplanation(
  explanation: MCQExplanation,
  correctOption: string
): string {
  const parts: string[] = [];
  const correctText = explanation[correctOption as keyof MCQExplanation];
  if (correctText) {
    parts.push(`✓ ${getOptionLabel(correctOption)}: ${correctText}`);
  }
  const keys = Object.keys(explanation).sort() as Array<keyof MCQExplanation>;
  for (const key of keys) {
    if (key === correctOption) continue;
    const text = explanation[key];
    if (text) {
      parts.push(`✗ ${getOptionLabel(key)}: ${text}`);
    }
  }
  return parts.join('\n');
}

/**
 * Get capitalized difficulty label
 */
export function getDifficultyLabel(difficulty: string): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

/**
 * Get difficulty color classes
 */
export function getDifficultyColor(difficulty: string): { text: string; bg: string; border: string } {
  switch (difficulty) {
    case 'easy':
      return { text: 'text-success', bg: 'bg-success/10', border: 'border-success/30' };
    case 'moderate':
      return { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' };
    case 'hard':
      return { text: 'text-error', bg: 'bg-error/10', border: 'border-error/30' };
    default:
      return { text: 'text-text-secondary', bg: 'bg-border', border: 'border-border' };
  }
}
