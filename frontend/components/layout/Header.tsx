'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, User, BookOpen, Zap, Bookmark, CreditCard } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import Button from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useUserPlan } from '@/hooks/useUserPlan';

function Logo({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Link href="/" className="flex items-center shrink-0 cursor-pointer hover:opacity-80 transition-opacity duration-200">
      <span className="font-heading font-bold text-xl text-text-primary tracking-tight">
        Medi<span className="gradient-text">gify</span>
      </span>
    </Link>
  );
}

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInitial, setUserInitial] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { isPro, isPremium } = useUserPlan();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-bg-primary/90 backdrop-blur-md border-b border-border shadow-sm'
        : 'bg-bg-primary/70 backdrop-blur-sm border-b border-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Logo isLoggedIn={isLoggedIn} />

          {/* Desktop Nav — Not logged in */}
          {!isLoggedIn && (
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-text-secondary hover:text-text-primary transition-colors duration-200 text-sm font-medium relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-accent after:transition-all after:duration-200 hover:after:w-full"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Desktop Nav — Logged in */}
          {isLoggedIn && (
            <nav className="hidden md:flex items-center gap-6" aria-label="App navigation">
              <Link href="/dashboard" className="text-text-secondary hover:text-text-primary transition-colors duration-200 text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/practice" className="text-text-secondary hover:text-text-primary transition-colors duration-200 text-sm font-medium flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Practice
              </Link>
              <Link href="/flashcards" className="text-text-secondary hover:text-text-primary transition-colors duration-200 text-sm font-medium flex items-center gap-1.5">
                <Bookmark className="w-4 h-4" />
                Flashcards
              </Link>
              <Link href="/pricing" className="text-text-secondary hover:text-text-primary transition-colors duration-200 text-sm font-medium flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" />
                Pricing
              </Link>
              {!isPremium && (
                <Link href="/pricing" className="text-accent hover:text-accent-hover transition-colors duration-200 text-sm font-medium flex items-center gap-1.5">
                  <Zap className="w-4 h-4" />
                  {isPro ? 'Get Premium' : 'Upgrade'}
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
                  <span className="hidden lg:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full gradient-accent text-white tracking-widest uppercase">
                    <Zap className="w-3 h-3" /> {isPremium ? 'Premium' : 'Pro'}
                  </span>
                )}
                <Link href="/profile">
                  <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-accent text-sm font-bold cursor-pointer hover:bg-accent/30 transition-all duration-200 hover:scale-105">
                    {userInitial || <User className="w-4 h-4" />}
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-error transition-colors duration-200 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/signup">
                  <Button variant="filled" size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-bg-surface-hover transition-colors duration-200"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-text-primary" />
              ) : (
                <Menu className="w-5 h-5 text-text-primary" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-bg-surface/95 backdrop-blur-md animate-menu-slide">
          <nav className="px-4 py-3 space-y-1" aria-label="Mobile navigation">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-all duration-200 font-medium">
                  Dashboard
                </Link>
                <Link href="/practice" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-all duration-200 font-medium">
                  <BookOpen className="w-4 h-4" />
                  Practice
                </Link>
                <Link href="/flashcards" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-all duration-200 font-medium">
                  <Bookmark className="w-4 h-4" />
                  Flashcards
                </Link>
                <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-all duration-200 font-medium">
                  <CreditCard className="w-4 h-4" />
                  Pricing
                </Link>
                {!isPremium && (
                  <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 py-3 px-3 rounded-lg text-accent font-medium">
                    <Zap className="w-4 h-4" />
                    {isPro ? 'Get Premium' : 'Upgrade to Pro'}
                  </Link>
                )}
                <div className="pt-2 mt-2 border-t border-border">
                  <button onClick={handleLogout} className="flex items-center gap-3 py-3 px-3 rounded-lg text-error font-medium w-full text-left">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="flex items-center py-3 px-3 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-surface-hover transition-all duration-200 font-medium">
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3 mt-2 border-t border-border flex gap-3">
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
