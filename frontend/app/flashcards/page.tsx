'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, BookOpen, CalendarClock, Loader2, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import mcqData from '@/data/mcqs.json';
import type { MCQ } from '@/lib/types';

interface FlashcardRow {
  id: string;
  question_id: string;
  subject: string;
  topic: string | null;
  created_at: string;
  next_review_date: string | null;
}

export default function FlashcardsPage() {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<FlashcardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const questionMap = useMemo(() => {
    const map = new Map<string, MCQ>();
    (mcqData as MCQ[]).forEach((question) => map.set(question.id, question));
    return map;
  }, []);

  useEffect(() => {
    const fetchFlashcards = async () => {
      const isMockMode =
        process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-project.supabase.co';

      if (isMockMode) {
        if (!localStorage.getItem('mock_user_id')) {
          router.push('/login');
          return;
        }

        setFlashcards([]);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        const { data, error } = await supabase
          .from('flashcards')
          .select('id, question_id, subject, topic, created_at, next_review_date')
          .eq('user_id', user.id)
          .order('next_review_date', { ascending: true })
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setFlashcards(data ?? []);
      } catch (err) {
        console.error('Failed to load flashcards:', err);
        setError('Could not load your flashcards right now.');
      } finally {
        setLoading(false);
      }
    };

    void fetchFlashcards();
  }, [router]);

  const dueTodayCount = flashcards.filter((flashcard) => {
    if (!flashcard.next_review_date) {
      return false;
    }

    return flashcard.next_review_date <= new Date().toISOString().slice(0, 10);
  }).length;

  const handleRemove = async (flashcardId: string) => {
    setRemovingId(flashcardId);
    setError(null);

    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', flashcardId);

      if (deleteError) {
        throw deleteError;
      }

      setFlashcards((prev) => prev.filter((flashcard) => flashcard.id !== flashcardId));
    } catch (err) {
      console.error('Failed to delete flashcard:', err);
      setError('Could not remove that flashcard. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Loading your flashcards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
            Flashcards
          </h1>
          <p className="text-text-secondary mt-2 max-w-2xl">
            Questions you saved during practice for later review.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 min-w-[220px]">
          <div className="bg-bg-surface border border-border rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-text-secondary">Saved</p>
            <p className="font-heading text-2xl font-bold text-text-primary mt-1">
              {flashcards.length}
            </p>
          </div>
          <div className="bg-bg-surface border border-border rounded-xl p-4">
            <p className="text-xs uppercase tracking-wider text-text-secondary">Due Today</p>
            <p className="font-heading text-2xl font-bold text-accent mt-1">
              {dueTodayCount}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-error/20 bg-error/10 p-4 text-sm text-error flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {flashcards.length === 0 ? (
        <div className="bg-bg-surface border border-border rounded-2xl p-10 text-center">
          <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-accent" />
          </div>
          <h2 className="font-heading text-2xl font-semibold text-text-primary mb-2">
            No flashcards yet
          </h2>
          <p className="text-text-secondary max-w-md mx-auto mb-6">
            Save a question from practice after you answer it incorrectly and it will appear here for spaced review.
          </p>
          <Link href="/practice">
            <Button variant="filled" size="lg">
              Start Practice
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {flashcards.map((flashcard) => {
            const question = questionMap.get(flashcard.question_id);

            return (
              <div
                key={flashcard.id}
                className="bg-bg-surface border border-border rounded-2xl p-5 md:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="inline-flex items-center rounded-full bg-accent/10 border border-accent/20 px-2.5 py-1 font-medium text-accent">
                        {flashcard.subject}
                      </span>
                      {flashcard.topic && (
                        <span className="inline-flex items-center rounded-full bg-bg-primary border border-border px-2.5 py-1 font-medium text-text-secondary">
                          {flashcard.topic}
                        </span>
                      )}
                      {flashcard.next_review_date && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-bg-primary border border-border px-2.5 py-1 font-medium text-text-secondary">
                          <CalendarClock className="w-3 h-3" />
                          Review {flashcard.next_review_date}
                        </span>
                      )}
                    </div>
                    <p className="text-base md:text-lg font-medium text-text-primary leading-relaxed">
                      {question?.statement ?? 'This question is no longer available in the local bank, but the flashcard record still exists.'}
                    </p>
                    {question?.explanation && (
                      <div className="border-l-2 border-accent bg-bg-primary rounded-r-xl p-4 space-y-1.5">
                        {question.explanation[question.correct_option as keyof typeof question.explanation] && (
                          <p className="text-sm leading-relaxed text-text-secondary">
                            <span className="font-medium text-success">{question.correct_option.toUpperCase()}:</span>{' '}
                            {question.explanation[question.correct_option as keyof typeof question.explanation]}
                          </p>
                        )}
                        {Object.entries(question.explanation)
                          .filter(([key]) => key !== question.correct_option)
                          .map(([key, text]) => (
                            <p key={key} className="text-sm text-text-secondary leading-relaxed">
                              <span className="font-medium">{key.toUpperCase()}:</span> {text}
                            </p>
                          ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(flashcard.id)}
                    disabled={removingId === flashcard.id}
                    className="justify-center sm:self-start"
                  >
                    {removingId === flashcard.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
