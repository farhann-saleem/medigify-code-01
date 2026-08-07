'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Flame, Play, Clock, Target, Zap,
  BookOpen, TrendingUp, ChevronRight,
  BarChart3, CheckCircle2, RefreshCw, Lock
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useUserPlan } from '@/hooks/useUserPlan';
import mcqData from '@/data/mcqs.json';
import type { MCQ } from '@/lib/types';

interface Profile {
  first_name: string | null;
  username: string | null;
  examining_body_id: string | null;
  college_id: string | null;
  academic_year: number | null;
}

interface Attempt {
  question_id: string;
  is_correct: boolean;
  created_at: string;
}

interface Stats {
  total: number;
  correct: number;
  accuracy: number;
  streak: number;
  uniqueAttempted: number;
}

interface SubjectStat {
  total: number;
  correct: number;
  uniqueAttempted: number;
}

const SUBJECT_STYLES = [
  { color: 'bg-blue-400', border: 'border-blue-400/20' },
  { color: 'bg-purple-400', border: 'border-purple-400/20' },
  { color: 'bg-pink-400', border: 'border-pink-400/20' },
  { color: 'bg-orange-400', border: 'border-orange-400/20' },
  { color: 'bg-red-400', border: 'border-red-400/20' },
  { color: 'bg-yellow-400', border: 'border-yellow-400/20' },
  { color: 'bg-green-400', border: 'border-green-400/20' },
  { color: 'bg-cyan-400', border: 'border-cyan-400/20' },
];

const QUICK_ACTIONS = [
  { label: 'Quick 10',       desc: 'Random 10 MCQs',        href: '/practice/session?count=10',                    icon: Zap },
  { label: 'Embryology',     desc: '5 MCQs',                href: '/practice/session?subjects=Embryology&count=5', icon: BookOpen },
  { label: 'Weak Areas',     desc: 'Practice low scores',   href: '/practice',                                     icon: TrendingUp },
  { label: 'Custom Session', desc: 'Choose your subjects',  href: '/practice',                                     icon: RefreshCw },
];

function calcStreak(attempts: Attempt[]): number {
  if (attempts.length === 0) return 0;

  const uniqueDays = [
    ...new Set(attempts.map(a => new Date(a.created_at).toDateString())),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86_400_000).toDateString();

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]).getTime();
    const curr = new Date(uniqueDays[i]).getTime();
    if (Math.round((prev - curr) / 86_400_000) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const router  = useRouter();
  const { isPro, isPremium, plan, purchasedModules, error: planError } = useUserPlan();

  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [stats,        setStats]        = useState<Stats>({ total: 0, correct: 0, accuracy: 0, streak: 0, uniqueAttempted: 0 });
  const [subjectStats, setSubjectStats] = useState<Record<string, SubjectStat>>({});
  const [loading,      setLoading]      = useState(true);
  const [pageError,    setPageError]    = useState<string | null>(null);

  // Build a lookup map of MCQ id → question using local JSON
  const mcqMap = useMemo(() => {
    const map = new Map<string, MCQ>();
    (mcqData as MCQ[]).forEach(q => map.set(q.id, q));
    return map;
  }, []);
  const academicYear = profile?.academic_year ?? null;

  const availableBank = useMemo(() => {
    const allMcqs = mcqData as MCQ[];
    if (!academicYear) {
      return allMcqs;
    }

    const filtered = allMcqs.filter(
      (question) => question.academic_year === academicYear
    );

    return filtered.length > 0 ? filtered : allMcqs;
  }, [academicYear]);

  const availableCountsBySubject = useMemo(() => {
    const counts = new Map<string, number>();
    availableBank.forEach((question) => {
      counts.set(question.subject, (counts.get(question.subject) ?? 0) + 1);
    });
    return counts;
  }, [availableBank]);

  const allSubjects = useMemo(() => {
    return Array.from(availableCountsBySubject.keys())
      .sort((a, b) => a.localeCompare(b))
      .map((name, index) => ({
        name,
        ...SUBJECT_STYLES[index % SUBJECT_STYLES.length],
      }));
  }, [availableCountsBySubject]);

  const greeting = getGreeting();

  useEffect(() => {
    const fetchAll = async () => {
      const isMockMode = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-project.supabase.co';

      if (isMockMode) {
        const mockId = localStorage.getItem('mock_user_id');
        if (!mockId) { router.push('/login'); return; }
        setProfile({ first_name: 'Demo', username: mockId, examining_body_id: 'UHS', college_id: 'KEMU', academic_year: 2 });
        // In mock mode keep stats at 0 — no real DB
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      // Fetch profile + attempts in parallel
      const [profileRes, attemptsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('first_name, username, examining_body_id, college_id, academic_year')
          .eq('id', user.id)
          .single(),
        supabase
          .from('question_attempts')
          .select('question_id, is_correct, created_at')
          .eq('user_id', user.id),
      ]);

      if (profileRes.error || attemptsRes.error) {
        setPageError('Some dashboard data could not be loaded. Try refreshing the page.');
      }

      if (profileRes.data) setProfile(profileRes.data);

      const attempts: Attempt[] = attemptsRes.data ?? [];

      // ── Compute stats ──
      const total   = attempts.length;
      const correct = attempts.filter(a => a.is_correct).length;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      const streak  = calcStreak(attempts);
      const uniqueAttempted = new Set(attempts.map((attempt) => attempt.question_id)).size;
      setStats({ total, correct, accuracy, streak, uniqueAttempted });

      // ── Per-subject breakdown using local MCQ map ──
      const bySubject: Record<string, SubjectStat> = {};
      const attemptedBySubject = new Map<string, Set<string>>();
      attempts.forEach(a => {
        const question = mcqMap.get(a.question_id);
        if (!question) return;
        const subject = question.subject;
        if (!bySubject[subject]) bySubject[subject] = { total: 0, correct: 0, uniqueAttempted: 0 };
        if (!attemptedBySubject.has(subject)) {
          attemptedBySubject.set(subject, new Set());
        }
        attemptedBySubject.get(subject)?.add(a.question_id);
        bySubject[subject].total++;
        if (a.is_correct) bySubject[subject].correct++;
      });
      Object.entries(bySubject).forEach(([subject, stat]) => {
        stat.uniqueAttempted = attemptedBySubject.get(subject)?.size ?? 0;
      });
      setSubjectStats(bySubject);

      setLoading(false);
    };

    fetchAll();
  }, [router, mcqMap]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const displayName  = profile?.first_name || profile?.username || 'Doctor';
  const totalMcqs    = availableBank.length;
  const progressPct  =
    totalMcqs > 0 ? Math.min((stats.uniqueAttempted / totalMcqs) * 100, 100) : 0;
  const showingScopedBank =
    !profile?.academic_year ||
    availableBank.some((question) => question.academic_year === profile.academic_year);
  const profileDetails = [
    profile?.college_id,
    profile?.academic_year ? `Year ${profile.academic_year}` : null,
    profile?.examining_body_id,
  ].filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">

      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          <p className="text-text-secondary text-sm mb-1">{greeting},</p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">
              {displayName} 👋
            </h1>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
              isPro
                ? 'bg-accent/10 text-accent border-accent/30'
                : purchasedModules.length > 0
                ? 'bg-accent/10 text-accent border-accent/30'
                : 'bg-border/60 text-text-secondary border-border'
            }`}>
              {isPro ? (isPremium ? 'Premium' : 'Pro') : 'Free'}
            </span>
          </div>
          {profileDetails.length > 0 && (
            <p className="text-text-secondary text-sm mt-1.5">
              {profileDetails.join(' · ')}
            </p>
          )}
          {!showingScopedBank && (
            <p className="text-xs text-accent mt-2">
              Current content coverage is still focused on first-year material, so progress is measured against the shared bank until your year-specific content is added.
            </p>
          )}
        </div>

        <Link href="/practice">
          <Button variant="filled" size="lg" className="gap-2">
            <Play className="w-4 h-4" />
            Start Practice
          </Button>
        </Link>
      </div>

      {(pageError || planError) && (
        <div className="mb-8 rounded-lg border border-error/20 bg-error/10 p-4 text-sm text-error">
          {pageError && <p>{pageError}</p>}
          {planError && <p>{planError}</p>}
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Streak', icon: Flame, color: 'text-warning', bg: 'bg-warning/10',
            hoverBorder: 'hover:border-warning/40',
            value: stats.streak > 0 ? stats.streak : 0,
            suffix: 'days',
            empty: stats.streak === 0,
          },
          {
            label: 'Attempted', icon: BarChart3, color: 'text-accent', bg: 'bg-accent/10',
            hoverBorder: 'hover:border-accent/40',
            value: stats.total,
            suffix: 'MCQs',
            empty: stats.total === 0,
          },
          {
            label: 'Accuracy', icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10',
            hoverBorder: 'hover:border-success/40',
            value: stats.accuracy,
            suffix: '%',
            empty: stats.total === 0,
          },
          {
            label: 'Correct', icon: Target, color: 'text-purple-400', bg: 'bg-purple-400/10',
            hoverBorder: 'hover:border-purple-400/40',
            value: stats.correct,
            suffix: 'right',
            empty: stats.total === 0,
          },
        ].map(({ label, icon: Icon, color, bg, hoverBorder, value, suffix, empty }) => (
          <div key={label} className={`bg-bg-surface border border-border rounded-xl p-5 relative overflow-hidden group ${hoverBorder} transition-all duration-200 card-hover`}>
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-1.5 ${bg} rounded-xl`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">{label}</span>
            </div>
            {empty ? (
              <span className="text-2xl font-heading font-bold text-text-secondary/40">—</span>
            ) : (
              <div className="flex items-end gap-1">
                <span className={`text-3xl font-heading font-bold ${color}`}>{value.toLocaleString()}</span>
                <span className="text-text-secondary text-sm mb-0.5">{suffix}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Subject Progress */}
        <div className="lg:col-span-2 bg-bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading font-semibold text-text-primary flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Subject Progress
            </h2>
            <span className="text-xs text-text-secondary">
              {stats.uniqueAttempted} / {totalMcqs.toLocaleString()} covered
            </span>
          </div>

          {stats.total === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <BookOpen className="w-10 h-10 text-text-secondary/30" />
              <p className="text-text-secondary text-sm">No attempts yet. Start a practice session to see your progress!</p>
              <Link href="/practice">
                <Button variant="filled" size="sm">Start Practising</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {allSubjects.map(({ name, color, border }) => {
                const s = subjectStats[name];
                const attempted = s?.total ?? 0;
                const uniqueAttempted = s?.uniqueAttempted ?? 0;
                const available = availableCountsBySubject.get(name) ?? 0;
                const accuracy = attempted > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                const completionPct =
                  available > 0 ? Math.min((uniqueAttempted / available) * 100, 100) : 0;
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${color}/60 border ${border}`} />
                        <span className="text-sm font-medium text-text-primary">{name}</span>
                        {purchasedModules.length === 0 && <Lock className="w-3 h-3 text-text-secondary/40" />}
                      </div>
                      <span className="text-xs text-text-secondary">
                        {attempted > 0
                          ? `${uniqueAttempted}/${available} covered · ${accuracy}% acc`
                          : `${available} available`}
                      </span>
                    </div>
                    <div className="w-full bg-border rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${color} opacity-70 transition-all duration-500`}
                        style={{ width: attempted > 0 ? `${Math.max(completionPct, 2)}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-4">
          {/* Quick Start */}
          <div className="bg-bg-surface border border-border rounded-xl p-5 flex-1">
            <h2 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              Quick Start
            </h2>
            <div className="space-y-2">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-bg-primary hover:bg-bg-surface-hover border border-transparent hover:border-border transition-all duration-150 group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-border rounded-md">
                        <action.icon className="w-3.5 h-3.5 text-text-secondary group-hover:text-accent transition-colors" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{action.label}</p>
                        <p className="text-xs text-text-secondary">{action.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-secondary/50 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              ))}
              <Link href="/flashcards">
                <div className="flex items-center justify-between p-3 rounded-lg bg-bg-primary hover:bg-bg-surface-hover border border-transparent hover:border-border transition-all duration-150 group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-border rounded-md">
                      <BookOpen className="w-3.5 h-3.5 text-text-secondary group-hover:text-accent transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">Flashcards</p>
                      <p className="text-xs text-text-secondary">Review saved weak questions</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-secondary/50 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            </div>
          </div>

          {/* Module upgrade card for users without all modules */}
          {!isPremium && (
            <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-gradient-to-br from-accent/10 to-bg-surface p-5">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/15 rounded-full blur-2xl" />
              <div className="relative">
                <Zap className="w-6 h-6 text-accent mb-2" />
                <h3 className="font-heading font-semibold text-text-primary mb-1">
                  {isPro ? 'Get Premium' : 'Unlock Modules'}
                </h3>
                <p className="text-xs text-text-secondary mb-3">
                  {isPro
                    ? `You have ${purchasedModules.length}/5 modules. Get the rest!`
                    : 'Starting from Rs 199/module'}
                </p>
                <Link href="/pricing">
                  <Button variant="filled" size="sm" className="w-full justify-center text-xs">
                    View Modules
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Overall Progress */}
        <div className="bg-bg-surface border border-border rounded-xl p-6">
          <h2 className="font-heading font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Overall Progress
          </h2>
          <div className="flex items-end gap-2 mb-3">
            <span className="text-4xl font-heading font-bold text-text-primary">
              {stats.uniqueAttempted.toLocaleString()}
            </span>
            <span className="text-text-secondary mb-1">/ {totalMcqs.toLocaleString()} MCQs</span>
          </div>
          <div className="w-full bg-border rounded-full h-2 mb-2">
            <div
              className="h-2 gradient-accent rounded-full transition-all duration-700"
              style={{ width: `${Math.max(progressPct, 0.2)}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary">
            {stats.uniqueAttempted === 0
              ? 'Start your first session to track progress.'
              : `${(100 - progressPct).toFixed(1)}% of content remaining`}
          </p>
        </div>

        {/* Mock Tests placeholder */}
        <div className="bg-bg-surface border border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-3 bg-border/50 rounded-full">
            <Clock className="w-6 h-6 text-text-secondary" />
          </div>
          <div>
            <h2 className="font-heading font-semibold text-text-primary mb-1">Mock Tests</h2>
            <p className="text-text-secondary text-sm">
              Coming in Phase 3 — full timed exams with UHS & NUMS patterns.
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-border text-text-secondary font-medium">Phase 3</span>
        </div>
      </div>

    </div>
  );
}
