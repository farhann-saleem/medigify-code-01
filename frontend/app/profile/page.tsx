'use client';

import { useState, useEffect } from 'react';
import {
  User, LogOut, Loader2, Save, BadgeCheck,
  CheckCircle2, AlertCircle, Mail, GraduationCap,
  Zap, Pencil, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useUserPlan } from '@/hooks/useUserPlan';
import { getDaysRemaining } from '@/lib/pricing';
import { mapAuthErrorMessage, normalizeText } from '@/lib/auth';

const ACADEMIC_YEARS = [1, 2, 3, 4, 5];

interface ProfileData {
  first_name: string;
  last_name: string;
  username: string;
  examining_body_id: string;
  college_id: string;
  academic_year: number | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const { isPro, purchasedModules, modulesExpiry, error: planError } = useUserPlan();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Saved data (shown in view mode)
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    username: '',
    examining_body_id: '',
    college_id: '',
    academic_year: null,
  });

  // Draft (only written to while editing, reset on cancel)
  const [draft, setDraft] = useState<ProfileData>(profile);

  useEffect(() => {
    const fetchProfile = async () => {
      const isMockMode =
        process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-project.supabase.co';

      if (isMockMode) {
        if (!localStorage.getItem('mock_user_id')) { router.push('/login'); return; }
        const mock: ProfileData = {
          first_name: 'Demo', last_name: 'User',
          username: 'demo_user', examining_body_id: 'UHS',
          college_id: 'King Edward Medical University', academic_year: 3,
        };
        setProfile(mock);
        setDraft(mock);
        setUserEmail('demo@medigify.com');
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      setUserEmail(user.email ?? '');

      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, username, examining_body_id, college_id, academic_year')
        .eq('id', user.id)
        .single();

      if (error) {
        setLoadError(mapAuthErrorMessage(error.message));
        setLoading(false);
        return;
      }

      if (!data) {
        setLoadError('We could not find your profile record.');
        setLoading(false);
        return;
      }

      const p: ProfileData = {
        first_name: data.first_name ?? '',
        last_name: data.last_name ?? '',
        username: data.username ?? '',
        examining_body_id: data.examining_body_id ?? '',
        college_id: data.college_id ?? '',
        academic_year: data.academic_year ?? null,
      };
      setProfile(p);
      setDraft(p);

      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  const startEditing = () => {
    setDraft({ ...profile });  // reset draft to current saved values
    setIsEditing(true);
    setSaveSuccess(false);
    setSaveError(null);
  };

  const cancelEditing = () => {
    setDraft({ ...profile });
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);

    const isMockMode =
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-project.supabase.co';

    if (isMockMode) {
      await new Promise(r => setTimeout(r, 800));
      setProfile({ ...draft });
      setSaveSuccess(true);
      setIsEditing(false);
      setSaving(false);
      setTimeout(() => setSaveSuccess(false), 3000);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');

      const normalizedFirstName = normalizeText(draft.first_name);
      const normalizedLastName = normalizeText(draft.last_name);

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: normalizedFirstName,
          last_name: normalizedLastName,
          academic_year: draft.academic_year,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile({
        ...draft,
        first_name: normalizedFirstName,
        last_name: normalizedLastName,
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save. Please try again.';
      setSaveError(mapAuthErrorMessage(message));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const isMockMode =
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-project.supabase.co';
    if (isMockMode) {
      localStorage.removeItem('mock_user_id');
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.username || 'User';
  const initials = profile.first_name && profile.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : (profile.username?.[0] ?? 'U').toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-text-primary">Profile</h1>
          <p className="text-text-secondary mt-1 text-sm">Manage your account and preferences.</p>
        </div>
        <Button
          variant="ghost"
          className="text-error border-error/20 hover:bg-error/10 hover:border-error/40 text-sm"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log out
        </Button>
      </div>

      <div className="space-y-5">
        {(loadError || planError) && (
          <div className="rounded-lg border border-error/20 bg-error/10 p-4 text-sm text-error flex items-start gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              {loadError && <p>{loadError}</p>}
              {planError && <p>{planError}</p>}
            </div>
          </div>
        )}

        {/* ── Avatar Card ── */}
        <div className="bg-bg-surface border border-border rounded-xl p-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-accent/15 border-2 border-accent/30 flex items-center justify-center text-accent text-2xl font-heading font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-text-primary text-lg truncate">{displayName}</p>
            <p className="text-text-secondary text-sm truncate flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              {userEmail}
            </p>
          </div>
          <div className="shrink-0">
            {isPro ? (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-accent/10 text-accent border border-accent/25">
                <Zap className="w-3.5 h-3.5" /> PRO
              </span>
            ) : (
              <Link href="/pricing">
                <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-bg-primary text-text-secondary border border-border hover:border-accent/40 hover:text-accent transition-colors cursor-pointer">
                  <Zap className="w-3.5 h-3.5" /> Upgrade
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* ── Personal Details ── */}
        <section className="bg-bg-surface border border-border rounded-xl overflow-hidden">
          {/* Section header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-heading text-base font-semibold text-text-primary flex items-center gap-2">
              <User className="w-4 h-4 text-accent" />
              Personal Details
            </h2>
            {!isEditing ? (
              <button
                onClick={startEditing}
                className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
            ) : (
              <button
                onClick={cancelEditing}
                className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-error transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
          </div>

          {/* Success toast */}
          {saveSuccess && (
            <div className="mx-6 mt-4 flex items-center gap-3 rounded-lg bg-success/10 border border-success/20 p-3 text-sm text-success">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Changes saved successfully!
            </div>
          )}
          {saveError && (
            <div className="mx-6 mt-4 flex items-center gap-3 rounded-lg bg-error/10 border border-error/20 p-3 text-sm text-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {saveError}
            </div>
          )}

          {/* VIEW MODE */}
          {!isEditing && (
            <div className="divide-y divide-border">
              {[
                { label: 'First name', value: profile.first_name || '—' },
                { label: 'Last name', value: profile.last_name || '—' },
                { label: 'Username', value: profile.username || '—' },
                { label: 'Academic Year', value: profile.academic_year ? `Year ${profile.academic_year}` : '—' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between px-6 py-4">
                  <span className="text-sm text-text-secondary w-40 shrink-0">{row.label}</span>
                  <span className="text-sm font-medium text-text-primary flex-1 text-right">{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* EDIT MODE */}
          {isEditing && (
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-primary mb-1.5">First name</label>
                  <input
                    type="text"
                    required
                    value={draft.first_name}
                    onChange={e => setDraft(d => ({ ...d, first_name: e.target.value }))}
                    className="block w-full rounded-lg border-0 py-2.5 px-3 bg-bg-primary text-text-primary shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm"
                    placeholder="First name"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Last name</label>
                  <input
                    type="text"
                    required
                    value={draft.last_name}
                    onChange={e => setDraft(d => ({ ...d, last_name: e.target.value }))}
                    className="block w-full rounded-lg border-0 py-2.5 px-3 bg-bg-primary text-text-primary shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm"
                    placeholder="Last name"
                  />
                </div>
              </div>

              {/* Username (always read-only) */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">Username</label>
                <input
                  type="text"
                  disabled
                  value={profile.username}
                  className="block w-full rounded-lg border-0 py-2.5 px-3 bg-bg-primary/40 text-text-secondary ring-1 ring-inset ring-border cursor-not-allowed sm:text-sm"
                />
                <p className="mt-1 text-xs text-text-secondary">Usernames cannot be changed after registration.</p>
              </div>

              {/* Academic year */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-text-secondary" />
                  Current Academic Year
                </label>
                <select
                  value={draft.academic_year ?? ''}
                  onChange={e => setDraft(d => ({
                    ...d,
                    academic_year: e.target.value ? Number(e.target.value) : null,
                  }))}
                  className="block w-full rounded-lg border-0 py-2.5 px-3 bg-bg-primary text-text-primary shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm appearance-none"
                >
                  <option value="" disabled>Select year</option>
                  {ACADEMIC_YEARS.map(y => (
                    <option key={y} value={y}>Year {y}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-1">
                <Button type="submit" variant="filled" disabled={saving} className="min-w-[140px] justify-center">
                  {saving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="w-4 h-4 mr-2" />Save Changes</>
                  )}
                </Button>
              </div>
            </form>
          )}
        </section>

        {/* ── Academic Record (always read-only) ── */}
        <section className="bg-bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-heading text-base font-semibold text-text-primary flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-accent" />
              Academic Record
            </h2>
          </div>
          <div className="divide-y divide-border">
            {[
              { label: 'Examining Body', value: profile.examining_body_id || '—' },
              { label: 'College / Institute', value: profile.college_id || '—' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-6 py-4">
                <span className="text-sm text-text-secondary w-40 shrink-0">{row.label}</span>
                <span className="text-sm font-medium text-text-primary flex-1 text-right">{row.value}</span>
              </div>
            ))}
          </div>
          <p className="px-6 pb-4 mt-2 text-xs text-text-secondary">
            To update these,{' '}
            <a href="mailto:medigifyglobal@gmail.com" className="text-accent hover:underline">contact support</a>.
          </p>
        </section>

        {/* ── Subscription ── */}
        <section className={`rounded-xl p-6 border ${isPro ? 'bg-accent/5 border-accent/20' : purchasedModules.length > 0 ? 'bg-accent/5 border-accent/20' : 'bg-bg-surface border-border'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-base font-semibold text-text-primary flex items-center gap-2">
                <Zap className={`w-4 h-4 ${isPro || purchasedModules.length > 0 ? 'text-accent' : 'text-text-secondary'}`} />
                {isPro ? 'All Modules Unlocked' : purchasedModules.length > 0 ? `${purchasedModules.length}/5 Modules` : 'Free Plan'}
              </h2>
              <p className="text-sm text-text-secondary mt-0.5">
                {isPro
                  ? 'Unlimited MCQs across all subjects.'
                  : purchasedModules.length > 0
                  ? 'Unlimited MCQs in your purchased modules.'
                  : '5 MCQs per subject per session.'}
              </p>
            </div>
            {!isPro && (
              <Link href="/pricing">
                <Button variant="filled" size="sm">
                  {purchasedModules.length > 0 ? 'Get More Modules' : 'Unlock Modules'}
                </Button>
              </Link>
            )}
          </div>
          {purchasedModules.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Owned Modules</p>
              <div className="flex flex-wrap gap-2">
                {purchasedModules.map((mod) => {
                  const expiryDate = modulesExpiry[mod];
                  const daysLeft = expiryDate ? getDaysRemaining(expiryDate) : null;
                  return (
                    <span
                      key={mod}
                      className="text-xs font-medium px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20"
                    >
                      {mod.replace(' Module', '')}
                      {daysLeft !== null && (
                        <span className={`ml-1.5 ${daysLeft <= 30 ? 'text-warning' : 'text-text-secondary'}`}>
                          ({daysLeft}d)
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
