export interface MCQOption {
  a: string;
  b: string;
  c: string;
  d: string;
  e?: string;
}

export interface MCQExplanation {
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  e?: string;
}

export interface MCQ {
  id: string;
  statement: string;
  options: MCQOption;
  correct_option: 'a' | 'b' | 'c' | 'd' | 'e';
  explanation: MCQExplanation;
  subject: string;
  topic: string | null;
  tags: string[];
  year: number | null;
  academic_year: number;
  difficulty: 'easy' | 'moderate' | 'hard';
  module: string;
}

export interface Answer {
  selectedOption: string;
  isCorrect: boolean;
  timeSpentMs: number;
}

export interface PracticeSessionState {
  questions: MCQ[];
  currentIndex: number;
  answers: Map<string, Answer>;
  sessionStartTime: number;
  currentQuestionStartTime: number;
  isComplete: boolean;
}

export interface SubjectInfo {
  name: string;
  count: number;
}

export interface SubjectBreakdown {
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
}
