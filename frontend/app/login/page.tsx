'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { mapAuthErrorMessage, normalizeEmail } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const normalizedEmailValue = normalizeEmail(email);

    const isMockMode = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-project.supabase.co';
    
    if (isMockMode) {
      // Mock Login logic
      setTimeout(() => {
        if (email === 'demo@medigify.com' && password === 'password123') {
          // Store fake cookie token simply via localStorage since middleware bypasses it in mock mode
          localStorage.setItem('mock_user_id', 'user_123');
          router.push('/dashboard');
        } else {
          setError('Invalid login credentials in Mock Mode. Use demo@medigify.com / password123');
          setLoading(false);
        }
      }, 1000);
      return;
    }

    // Real Supabase Login Logic
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmailValue,
        password,
      });

      if (authError) {
        setError(mapAuthErrorMessage(authError.message));
        return;
      }
      
      router.replace('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during login. Please try again.';
      setError(mapAuthErrorMessage(message));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const normalizedEmailValue = normalizeEmail(email);

    if (!normalizedEmailValue) {
      setError('Enter your email address first so we can send the reset link.');
      setResetMessage(null);
      return;
    }

    setResettingPassword(true);
    setError(null);
    setResetMessage(null);

    const isMockMode =
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-project.supabase.co';

    if (isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setResetMessage('Mock mode: password recovery emails are not sent.');
      setResettingPassword(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalizedEmailValue,
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        }
      );

      if (resetError) {
        throw resetError;
      }

      setResetMessage('Reset link sent. Check your inbox and spam folder.');
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not send the password reset email. Please try again.';
      setError(mapAuthErrorMessage(message));
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-heading font-bold text-text-primary tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-accent hover:text-accent-hover transition-colors">
            Sign up for free
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-bg-surface border border-border px-4 py-8 shadow-lg shadow-black/5 sm:rounded-2xl sm:px-12">
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-error/10 p-4 border border-error/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {resetMessage && (
              <div className="rounded-md bg-success/10 p-4 border border-success/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-success shrink-0 mt-0.5" />
                <p className="text-sm text-success">{resetMessage}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-text-primary">
                Email address
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-2.5 pl-10 bg-bg-primary text-text-primary shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-accent sm:text-sm sm:leading-6 placeholder:text-text-secondary/50"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-text-primary">
                Password
              </label>
              <div className="relative mt-2">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-text-secondary" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
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

            <div>
              <Button type="submit" variant="filled" size="lg" className="w-full justify-center" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log in'}
              </Button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resettingPassword}
                className="text-sm font-medium text-accent hover:text-accent-hover transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resettingPassword ? 'Sending reset link...' : 'Forgot password?'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
