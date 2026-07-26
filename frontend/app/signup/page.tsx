'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  User,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Info,
  Eye,
  EyeOff,
  Building2,
} from 'lucide-react';

import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import {
  mapAuthErrorMessage,
  normalizeEmail,
  normalizeText,
  normalizeUsername,
  validateUsername,
} from '@/lib/auth';

interface UsernameCheckResponse {
  available?: boolean;
  message?: string;
}

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [examiningBody, setExaminingBody] = useState('');
  const [college, setCollege] = useState('');
  const [academicYear, setAcademicYear] = useState('');

  const examiningBodies = [
    'Faisalabad Medical University (FMU)',
    'Fatima Jinnah Medical University (FJMU)',
    'King Edward Medical University (KEMU)',
    'National University Of Medical Sciences (NUMS)',
    'Nishtar Medical University (NMU)',
    'Rawalpindi Medical University (RMU)',
    'University College of Medicine and Dentistry (UCMD)',
    'University of Health Sciences (UHS)',
    'Other',
  ];

  useEffect(() => {
    const normalized = normalizeUsername(username);

    if (!normalized) {
      setUsernameAvailable(null);
      setUsernameMessage(null);
      setCheckingUsername(false);
      return;
    }

    const validationError = validateUsername(normalized);
    if (validationError) {
      setUsernameAvailable(false);
      setUsernameMessage(validationError);
      setCheckingUsername(false);
      return;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        setCheckingUsername(true);
        const response = await fetch(
          `/api/auth/check-username?username=${encodeURIComponent(normalized)}`
        );
        const payload = (await response.json()) as UsernameCheckResponse;

        if (isCancelled) {
          return;
        }

        if (!response.ok) {
          setUsernameAvailable(null);
          setUsernameMessage(
            payload.message ?? 'Unable to check username right now.'
          );
          return;
        }

        setUsernameAvailable(Boolean(payload.available));
        setUsernameMessage(
          payload.available ? 'Username is available.' : 'Username is already taken.'
        );
      } catch {
        if (!isCancelled) {
          setUsernameAvailable(null);
          setUsernameMessage('Unable to check username right now.');
        }
      } finally {
        if (!isCancelled) {
          setCheckingUsername(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [username]);

  const syncUsernameAvailability = async (candidate: string) => {
    const response = await fetch(
      `/api/auth/check-username?username=${encodeURIComponent(candidate)}`
    );
    const payload = (await response.json()) as UsernameCheckResponse;

    if (!response.ok) {
      return null;
    }

    if (payload.available === false) {
      setUsernameAvailable(false);
      setUsernameMessage('Username is already taken.');
      return false;
    }

    setUsernameAvailable(true);
    setUsernameMessage('Username is available.');
    return true;
  };

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();

    if (normalizeEmail(email) && password.length >= 8) {
      setStep(2);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const normalizedEmailValue = normalizeEmail(email);
    const normalizedFirstName = normalizeText(firstName);
    const normalizedLastName = normalizeText(lastName);
    const normalizedUsernameValue = normalizeUsername(username);
    const normalizedCollege = normalizeText(college);
    const usernameValidationError = validateUsername(normalizedUsernameValue);

    if (usernameValidationError) {
      setUsernameAvailable(false);
      setUsernameMessage(usernameValidationError);
      setError(usernameValidationError);
      setLoading(false);
      return;
    }

    if (usernameAvailable !== true) {
      setError('Choose an available username before creating your account.');
      setLoading(false);
      return;
    }

    if (!normalizedCollege) {
      setError('College / Institute is required.');
      setLoading(false);
      return;
    }

    const isMockMode =
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-project.supabase.co';

    if (isMockMode) {
      window.setTimeout(() => {
        localStorage.setItem('mock_user_id', normalizedUsernameValue);
        router.replace('/dashboard');
      }, 1500);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email: normalizedEmailValue,
        password,
        options: {
          data: {
            first_name: normalizedFirstName,
            last_name: normalizedLastName,
            username: normalizedUsernameValue,
            examining_body_id: examiningBody,
            college_id: normalizedCollege,
            academic_year: Number.parseInt(academicYear, 10),
          },
        },
      });

      if (authError) {
        const availability = await syncUsernameAvailability(normalizedUsernameValue);
        if (availability === false) {
          setError('That username is already taken. Choose another one.');
          setLoading(false);
          return;
        }

        throw authError;
      }

      if (!data.session) {
        throw new Error(
          'Sign up succeeded, but no session was returned. Check that email confirmation is disabled in Supabase.'
        );
      }

      router.replace('/dashboard');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An error occurred during sign up.';

      if (message.toLowerCase().includes('username')) {
        setUsernameAvailable(false);
        setUsernameMessage('Username is already taken.');
      }

      setError(mapAuthErrorMessage(message));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-heading font-bold text-text-primary tracking-tight">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            Log in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-bg-surface border border-border px-4 py-8 shadow-lg shadow-black/5 sm:rounded-2xl sm:px-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-border">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>

          <form
            className="space-y-6 mt-4"
            onSubmit={step === 1 ? nextStep : handleSignup}
          >
            {error && (
              <div className="rounded-md bg-error/10 p-4 border border-error/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {step === 1 && (
              <div className="animate-fadeIn space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium leading-6 text-text-primary"
                  >
                    Email address
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail
                        className="h-5 w-5 text-text-secondary"
                        aria-hidden="true"
                      />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-md border-0 py-2.5 pl-10 bg-bg-primary text-text-primary shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6 placeholder:text-text-secondary/50"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium leading-6 text-text-primary"
                  >
                    Password (min. 8 characters)
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock
                        className="h-5 w-5 text-text-secondary"
                        aria-hidden="true"
                      />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-md border-0 py-2.5 pl-10 pr-10 bg-bg-primary text-text-primary shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6"
                      placeholder="••••••••"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-text-secondary hover:text-text-primary focus:outline-none transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <Eye className="h-5 w-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="filled"
                  size="lg"
                  className="w-full justify-center mt-8"
                >
                  Continue to Profile
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fadeIn space-y-5">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium leading-6 text-text-primary">
                      First name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 bg-bg-primary text-text-primary shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm"
                      placeholder="John"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium leading-6 text-text-primary">
                      Last name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 bg-bg-primary text-text-primary shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-text-primary">
                    Username
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-5 w-5 text-text-secondary" />
                    </div>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-10 bg-bg-primary text-text-primary shadow-sm ring-1 ring-inset focus:ring-2 focus:ring-inset sm:text-sm ${
                        usernameAvailable === false
                          ? 'ring-error focus:ring-error'
                          : usernameAvailable === true
                            ? 'ring-success focus:ring-success'
                            : 'ring-border focus:ring-accent'
                      }`}
                      placeholder="doctor123"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    {checkingUsername && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <Loader2 className="h-5 w-5 animate-spin text-text-secondary" />
                      </div>
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <AlertCircle className="h-5 w-5 text-error" />
                      </div>
                    )}
                  </div>
                  {usernameMessage && (
                    <p
                      className={`mt-1 text-xs ${
                        usernameAvailable === false ? 'text-error' : 'text-success'
                      }`}
                    >
                      {usernameMessage}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium leading-6 text-text-primary">
                      Examining Body
                    </label>
                    <div className="group relative flex items-center">
                      <Info className="w-4 h-4 text-text-secondary cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-bg-surface-hover text-text-primary text-xs rounded-md border border-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center pointer-events-none">
                        Medigify is currently optimized for the UHS curriculum.
                        You are welcome to proceed if you would like to explore
                        our resources and tools using this framework.
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-bg-surface-hover"></div>
                      </div>
                    </div>
                  </div>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <BookOpen className="h-5 w-5 text-text-secondary" />
                    </div>
                    <select
                      required
                      value={examiningBody}
                      onChange={(e) => setExaminingBody(e.target.value)}
                      className="block w-full rounded-md border-0 py-2.5 pl-10 bg-bg-primary text-text-primary shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm appearance-none"
                    >
                      <option value="" disabled>
                        Select your examining body
                      </option>
                      {examiningBodies.map((body) => (
                        <option key={body} value={body}>
                          {body}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-2 text-xs text-accent">
                    Current focus: UHS content. Other examining bodies can still sign up, but the live bank is currently optimized around UHS coverage.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-text-primary">
                    College / Institute
                  </label>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Building2 className="h-5 w-5 text-text-secondary" />
                    </div>
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 bg-bg-primary text-text-primary shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm"
                      placeholder="King Edward Medical University"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <label className="block text-sm font-medium leading-6 text-text-primary">
                      Academic Year
                    </label>
                    <div className="group relative flex items-center">
                      <Info className="w-4 h-4 text-text-secondary cursor-help" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-bg-surface-hover text-text-primary text-xs rounded-md border border-border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center pointer-events-none">
                        We are currently perfecting our First Year content
                        library. Feel free to sign up and take a look around,
                        we&apos;re working hard to bring more years to the
                        platform soon!
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-bg-surface-hover"></div>
                      </div>
                    </div>
                  </div>
                  <div className="relative mt-2">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <GraduationCap className="h-5 w-5 text-text-secondary" />
                    </div>
                    <select
                      required
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="block w-full rounded-md border-0 py-2.5 pl-10 bg-bg-primary text-text-primary shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm appearance-none"
                    >
                      <option value="" disabled>
                        Select your current year
                      </option>
                      {[1, 2, 3, 4, 5].map((year) => (
                        <option key={year} value={year}>
                          Year {year}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-2 text-xs text-accent">
                    Current focus: First Year. You can still register with other study years while we expand the content bank.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep(1)}
                    className="px-4"
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="filled"
                    className="flex-1 justify-center"
                    disabled={loading || checkingUsername || usernameAvailable !== true}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
