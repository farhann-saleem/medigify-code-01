'use client';

import { useMemo, Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Home, Bookmark, LayoutDashboard, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import mcqData from '@/data/mcqs.json';
import { MCQ, Answer } from '@/lib/types';
import {
  shuffleArray,
  filterMCQs,
  calculateAccuracy,
  formatTime,
  getSubjectBreakdown,
  getScoreColor,
  getOptionLabel,
  getDifficultyLabel,
  getDifficultyColor,
} from '@/lib/utils';
import { usePracticeSession } from '@/hooks/usePracticeSession';
import { useUserPlan } from '@/hooks/useUserPlan';
import { PLAN_LIMITS } from '@/lib/plans';
import { createClient } from '@/lib/supabase/client';
import PaywallBanner from '@/components/ui/PaywallBanner';

function PracticeSessionStage({ questions, isPro }: { questions: MCQ[]; isPro: boolean }) {
  const router = useRouter();
  const [savedFlashcardIds, setSavedFlashcardIds] = useState<Set<string>>(
    () => new Set()
  );
  const [savingFlashcardId, setSavingFlashcardId] = useState<string | null>(null);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);

  const {
    session,
    currentQuestion,
    currentAnswer,
    hasAnswered,
    isLastQuestion,
    selectAnswer,
    nextQuestion,
    totalCorrect,
    totalIncorrect,
    avgTimeMs,
  } = usePracticeSession(questions);

  useEffect(() => {
    setFlashcardError(null);
  }, [currentQuestion?.id]);

  // Post-block summary
  if (session.isComplete) {
    const accuracy = calculateAccuracy(totalCorrect, session.questions.length);
    const subjectBreakdown = getSubjectBreakdown(
      session.questions,
      session.answers
    );
    const totalTime = Array.from(session.answers.values()).reduce(
      (sum, a) => sum + a.timeSpentMs,
      0
    );

    const incorrectQuestions = session.questions.filter((q) => {
      const answer = session.answers.get(q.id);
      return answer && !answer.isCorrect;
    });

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Score Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-2">
            Practice Complete!
          </h1>
          <div className="mt-4">
            <span className={`text-5xl md:text-6xl font-heading font-bold ${getScoreColor(accuracy)}`}>
              {accuracy}%
            </span>
            <p className="text-text-secondary mt-2">
              {totalCorrect} of {session.questions.length} correct
            </p>
          </div>
        </div>

        {!isPro && (
          <div className="mb-8">
            <PaywallBanner questionsRemaining={0} />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-bg-surface border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-heading font-bold text-success">{totalCorrect}</p>
            <p className="text-xs text-text-secondary mt-1">Correct</p>
          </div>
          <div className="bg-bg-surface border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-heading font-bold text-error">{totalIncorrect}</p>
            <p className="text-xs text-text-secondary mt-1">Incorrect</p>
          </div>
          <div className="bg-bg-surface border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-heading font-bold text-text-primary">{formatTime(totalTime)}</p>
            <p className="text-xs text-text-secondary mt-1">Total Time</p>
          </div>
          <div className="bg-bg-surface border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-heading font-bold text-text-primary">{formatTime(avgTimeMs)}</p>
            <p className="text-xs text-text-secondary mt-1">Avg / Question</p>
          </div>
        </div>

        {/* Subject Breakdown */}
        {subjectBreakdown.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading text-lg font-semibold text-text-primary mb-3">
              Subject Breakdown
            </h2>
            <div className="space-y-3">
              {subjectBreakdown.map((item) => (
                <div
                  key={item.subject}
                  className="bg-bg-surface border border-border rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-text-primary text-sm">
                      {item.subject}
                    </span>
                    <span className={`font-heading font-bold ${getScoreColor(item.accuracy)}`}>
                      {item.accuracy}%
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        item.accuracy >= 80
                          ? 'bg-success'
                          : item.accuracy >= 50
                          ? 'bg-warning'
                          : 'bg-error'
                      }`}
                      style={{ width: `${item.accuracy}%` }}
                    />
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {item.correct} of {item.total} correct
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Mistakes */}
        {incorrectQuestions.length > 0 && (
          <div className="mb-8">
            <h2 className="font-heading text-lg font-semibold text-text-primary mb-3">
              Review Mistakes ({incorrectQuestions.length})
            </h2>
            <div className="space-y-3">
              {incorrectQuestions.map((q) => {
                const answer = session.answers.get(q.id) as Answer;
                return (
                  <div
                    key={q.id}
                    className="bg-bg-surface border border-error/20 rounded-lg p-4"
                  >
                    <p className="text-sm text-text-primary mb-3 leading-relaxed">
                      {q.statement}
                    </p>
                    <div className="space-y-1 text-sm">
                      <p className="text-error">
                        Your answer: {getOptionLabel(answer.selectedOption)}.{' '}
                        {q.options[answer.selectedOption as keyof typeof q.options]}
                      </p>
                      <p className="text-success">
                        Correct answer: {getOptionLabel(q.correct_option)}.{' '}
                        {q.options[q.correct_option as keyof typeof q.options]}
                      </p>
                    </div>
                    <div className="mt-3 border-l-2 border-accent bg-bg-primary rounded-r-lg p-3 space-y-1.5">
                      {q.explanation[q.correct_option as keyof typeof q.explanation] && (
                        <p className="text-xs leading-relaxed text-text-secondary">
                          <span className="font-medium text-success">{getOptionLabel(q.correct_option)}:</span>{' '}
                          {q.explanation[q.correct_option as keyof typeof q.explanation]}
                        </p>
                      )}
                      {answer.selectedOption !== q.correct_option && q.explanation[answer.selectedOption as keyof typeof q.explanation] && (
                        <p className="text-xs leading-relaxed text-text-secondary">
                          <span className="font-medium text-error">{getOptionLabel(answer.selectedOption)}:</span>{' '}
                          {q.explanation[answer.selectedOption as keyof typeof q.explanation]}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="md" className="w-full justify-center">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href="/practice">
            <Button variant="filled" size="md" className="w-full justify-center">
              <RotateCcw className="w-4 h-4 mr-2" />
              Practice Again
            </Button>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="md" className="w-full justify-center">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // No questions found
  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="font-heading text-2xl font-bold text-text-primary mb-4">
          No Questions Found
        </h1>
        <p className="text-text-secondary mb-8">
          No questions match your selected subjects. Try selecting different
          subjects.
        </p>
        <Link href="/practice">
          <Button variant="filled">Go Back</Button>
        </Link>
      </div>
    );
  }

  const optionKeys = Object.keys(currentQuestion.options) as Array<
    keyof typeof currentQuestion.options
  >;
  const currentQuestionSaved = savedFlashcardIds.has(currentQuestion.id);

  const handleSaveFlashcard = async () => {
    setFlashcardError(null);

    const isMockMode =
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-project.supabase.co';

    if (isMockMode) {
      const mockId = localStorage.getItem('mock_user_id');
      if (!mockId) {
        router.push('/login');
        return;
      }

      setSavedFlashcardIds((prev) => new Set(prev).add(currentQuestion.id));
      return;
    }

    setSavingFlashcardId(currentQuestion.id);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase.from('flashcards').insert({
        user_id: user.id,
        question_id: currentQuestion.id,
        subject: currentQuestion.subject,
        topic: currentQuestion.topic,
      });

      if (error && error.code !== '23505') {
        throw error;
      }

      setSavedFlashcardIds((prev) => new Set(prev).add(currentQuestion.id));
    } catch (error) {
      console.error('Failed to save flashcard:', error);
      setFlashcardError('Could not add this question to your flashcards.');
    } finally {
      setSavingFlashcardId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-secondary">
            Question {session.currentIndex + 1} of {session.questions.length}
          </span>
        </div>
        <div className="w-full bg-border rounded-full h-1.5">
          <div
            className="h-1.5 bg-accent rounded-full transition-all duration-300"
            style={{
              width: `${((session.currentIndex + 1) / session.questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-bg-surface border border-border rounded-lg p-5 md:p-6 mb-6">
        <p className="text-text-primary text-lg leading-relaxed font-medium">
          {currentQuestion.statement}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {currentQuestion.difficulty && (
            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border ${getDifficultyColor(currentQuestion.difficulty).text} ${getDifficultyColor(currentQuestion.difficulty).bg} ${getDifficultyColor(currentQuestion.difficulty).border}`}>
              {getDifficultyLabel(currentQuestion.difficulty)}
            </span>
          )}
          <span className="inline-flex items-center text-xs text-text-secondary bg-bg-primary border border-border px-2.5 py-1 rounded-full">
            {currentQuestion.module && `${currentQuestion.module} · `}{currentQuestion.subject}{currentQuestion.topic && ` · ${currentQuestion.topic}`}
          </span>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {optionKeys.map((key) => {
          const isSelected = currentAnswer?.selectedOption === key;
          const isCorrect = key === currentQuestion.correct_option;
          const optionText = currentQuestion.options[key];

          let optionStyle = 'border-border bg-bg-surface hover:bg-bg-surface-hover hover:border-accent/30';

          if (hasAnswered) {
            if (isCorrect) {
              optionStyle = 'border-success bg-success/10';
            } else if (isSelected && !isCorrect) {
              optionStyle = 'border-error bg-error/10';
            } else {
              optionStyle = 'border-border bg-bg-surface opacity-50';
            }
          }

          return (
            <button
              key={key}
              onClick={() => selectAnswer(key)}
              disabled={hasAnswered}
              className={`w-full p-4 rounded-lg border text-left transition-all duration-150 min-h-[48px] flex items-start gap-3 ${optionStyle} ${
                !hasAnswered ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <span
                className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold ${
                  hasAnswered && isCorrect
                    ? 'border-success text-success'
                    : hasAnswered && isSelected
                    ? 'border-error text-error'
                    : 'border-text-secondary text-text-secondary'
                }`}
              >
                {getOptionLabel(key)}
              </span>
              <span className="flex-1 text-text-primary">{optionText}</span>
              {hasAnswered && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
              )}
              {hasAnswered && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Panel */}
      {hasAnswered && (
        <div className="overflow-hidden animate-slideDown mb-6">
          <div className="border-l-2 border-accent bg-bg-surface rounded-r-lg p-4 md:p-5">
            <div className="flex items-center gap-2 mb-2">
              {currentAnswer?.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <XCircle className="w-5 h-5 text-error" />
              )}
              <span
                className={`font-heading font-semibold ${
                  currentAnswer?.isCorrect ? 'text-success' : 'text-error'
                }`}
              >
                {currentAnswer?.isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            <div className="space-y-2 mt-1">
              {currentQuestion.explanation[currentQuestion.correct_option as keyof typeof currentQuestion.explanation] && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <p className="text-text-primary leading-relaxed text-sm">
                    <span className="font-medium text-success">{getOptionLabel(currentQuestion.correct_option)}:</span>{' '}
                    {currentQuestion.explanation[currentQuestion.correct_option as keyof typeof currentQuestion.explanation]}
                  </p>
                </div>
              )}
              {currentAnswer && currentAnswer.selectedOption !== currentQuestion.correct_option &&
                currentQuestion.explanation[currentAnswer.selectedOption as keyof typeof currentQuestion.explanation] && (
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                  <p className="text-text-secondary leading-relaxed text-sm">
                    <span className="font-medium text-error">{getOptionLabel(currentAnswer.selectedOption)}:</span>{' '}
                    {currentQuestion.explanation[currentAnswer.selectedOption as keyof typeof currentQuestion.explanation]}
                  </p>
                </div>
              )}
              {Object.entries(currentQuestion.explanation)
                .filter(([key]) => key !== currentQuestion.correct_option && key !== currentAnswer?.selectedOption)
                .map(([key, text]) => (
                  <p key={key} className="text-text-secondary leading-relaxed text-sm pl-6">
                    <span className="font-medium">{getOptionLabel(key)}:</span> {text}
                  </p>
                ))}
            </div>

            {/* Add to Flashcards */}
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <button
                onClick={handleSaveFlashcard}
                disabled={currentQuestionSaved || savingFlashcardId === currentQuestion.id}
                className={`flex items-center gap-2 text-sm transition-colors duration-150 ${
                  currentQuestionSaved
                    ? 'text-success cursor-default'
                    : 'text-text-secondary hover:text-accent cursor-pointer'
                }`}
              >
                {savingFlashcardId === currentQuestion.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentQuestionSaved ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
                {currentQuestionSaved ? 'Added to Flashcards' : 'Add to Flashcards'}
              </button>
              {flashcardError && (
                <p className="text-xs text-error">{flashcardError}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {hasAnswered && (
        <div className="flex justify-end">
          <Button
            variant="filled"
            size="md"
            onClick={nextQuestion}
          >
            {isLastQuestion ? 'Finish Practice' : 'Next Question'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}

function PracticeSessionContent() {
  const searchParams = useSearchParams();
  const { isPro, isLoading: planLoading } = useUserPlan();

  const subjectsParam = searchParams.get('subjects') || 'all';
  const difficultyParam = searchParams.get('difficulty') || 'all';
  const moduleParam = searchParams.get('module') || 'all';
  const countParam = parseInt(searchParams.get('count') || '10', 10);

  const questions = useMemo(() => {
    const allMcqs = mcqData as MCQ[];

    const filtered = filterMCQs(allMcqs, {
      subjects: subjectsParam === 'all' ? undefined : subjectsParam.split(','),
      difficulties: difficultyParam === 'all' ? undefined : difficultyParam.split(','),
      modules: moduleParam === 'all' ? undefined : moduleParam.split(','),
    });

    const shuffled = shuffleArray(filtered);
    const limit = isPro ? countParam : Math.min(countParam, PLAN_LIMITS.free.mcqsPerSubject);
    return shuffled.slice(0, limit);
  }, [subjectsParam, difficultyParam, moduleParam, countParam, isPro]);

  const sessionKey = useMemo(
    () => questions.map((question) => question.id).join('|'),
    [questions]
  );

  if (planLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-text-secondary">Loading your session...</p>
      </div>
    );
  }

  return <PracticeSessionStage key={sessionKey} questions={questions} isPro={isPro} />;
}

export default function PracticeSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-text-secondary">Loading questions...</p>
        </div>
      }
    >
      <PracticeSessionContent />
    </Suspense>
  );
}
