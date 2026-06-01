'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, User, BookOpen, Zap, Bookmark } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useUserPlan } from '@/hooks/useUserPlan';

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInitial, setUserInitial] = useState('');
  const { isPro } = useUserPlan();

  useEffect(() => {
    const isMockMode = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-project.supabase.co';

    if (isMockMode) {
      Promise.resolve().then(() => {
        const mockId = localStorage.getItem('mock_user_id');
        if (mockId) {
          setIsLoggedIn(true);
          setUserInitial(mockId.charAt(0).toUpperCase());
        }
      });
      return;
    }

    // Real Supabase auth listener
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session?.user?.email) {
        setUserInitial(session.user.email.charAt(0).toUpperCase());
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user?.email) {
        setUserInitial(session.user.email.charAt(0).toUpperCase());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const isMockMode = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://mock-project.supabase.co';
    if (isMockMode) {
      localStorage.removeItem('mock_user_id');
    } else {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    setIsLoggedIn(false);
    router.push('/');
  };

  const navLinks = [
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Contact Us', href: 'mailto:support@medigify.com' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-bg-primary/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isLoggedIn ? '/dashboard' : '/'} className="flex items-center gap-2 shrink-0 overflow-visible">
            <img src="/logo.svg" alt="Medigify Logo" className="w-32 md:w-48 h-auto -my-8 object-contain" />
          </Link>

          {/* Desktop Nav */}
          {!isLoggedIn && (
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-text-secondary hover:text-text-primary transition-colors duration-150 text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {isLoggedIn && (
            <nav className="hidden md:flex items-center gap-6" aria-label="App navigation">
              <Link href="/dashboard" className="text-text-secondary hover:text-text-primary transition-colors duration-150 text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/practice" className="text-text-secondary hover:text-text-primary transition-colors duration-150 text-sm font-medium flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Practice
              </Link>
              <Link href="/flashcards" className="text-text-secondary hover:text-text-primary transition-colors duration-150 text-sm font-medium flex items-center gap-1.5">
                <Bookmark className="w-4 h-4" />
                Flashcards
              </Link>
              {!isPro && (
                <Link href="/pricing" className="text-text-secondary hover:text-accent transition-colors duration-150 text-sm font-medium flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  Upgrade
                </Link>
              )}
            </nav>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                {isPro && (
                  <span className="hidden lg:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-to-r from-accent/20 to-accent/10 text-accent border border-accent/30 tracking-widest uppercase">
                    <Zap className="w-3 h-3" /> Pro
                  </span>
                )}
                <Link href="/profile">
                  <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-sm font-bold cursor-pointer hover:bg-accent/30 transition-colors">
                    {userInitial || <User className="w-4 h-4" />}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-error transition-colors duration-150 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="filled" size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-md hover:bg-bg-surface-hover transition-colors duration-150"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-text-primary" />
              ) : (
                <Menu className="w-6 h-6 text-text-primary" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-bg-surface">
          <nav className="px-4 py-4 space-y-3" aria-label="Mobile navigation">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-text-secondary hover:text-text-primary transition-colors duration-150 font-medium">Dashboard</Link>
                <Link href="/practice" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-text-secondary hover:text-text-primary transition-colors duration-150 font-medium">Practice</Link>
                <Link href="/flashcards" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-text-secondary hover:text-text-primary transition-colors duration-150 font-medium">Flashcards</Link>
                {!isPro && (
                  <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-accent font-medium">⚡ Upgrade to Pro</Link>
                )}
                <div className="pt-3 border-t border-border">
                  <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-error font-medium">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-text-secondary hover:text-text-primary transition-colors duration-150 font-medium">
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3 border-t border-border flex gap-3">
                  <Link href="/login" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" fullWidth>Login</Button>
                  </Link>
                  <Link href="/signup" className="w-full" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="filled" size="sm" fullWidth>Sign Up</Button>
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
