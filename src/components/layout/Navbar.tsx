'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Plane, LayoutDashboard, LogIn, LogOut, Menu, X, UserCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/useUserStore';
import { useFlightStore } from '@/stores/useFlightStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useUserStore();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at,
          });
        } else {
          setUser(null);
        }
      }
    );

    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          created_at: authUser.created_at,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, setUser]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    useUserStore.getState().resetStore();
    useFlightStore.getState().resetStore();
    toast.success('Signed out successfully');
    router.push('/');
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: Plane },
    ...(user
      ? [{ href: '/dashboard', label: 'My Bookings', icon: LayoutDashboard }]
      : []),
  ];

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-black/20 backdrop-blur-md py-4 border-b border-white/10'
          : 'bg-transparent py-6'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group flex-1">
            <div className="w-8 h-8 flex items-center justify-center">
              <Plane className="w-6 h-6 text-white transform -rotate-45 group-hover:-translate-y-1 transition-transform" />
            </div>
            <span className="text-xl font-bold text-white tracking-wide">SkyBook</span>
          </Link>

          {/* Center Nav Links */}
          <div className="hidden md:flex items-center justify-center gap-8 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-all duration-200 hover:text-white',
                  pathname === link.href ? 'text-white' : 'text-white/70'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center justify-end gap-4 flex-1">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-white/90">
                  <UserCircle className="w-4 h-4" />
                  <span className="max-w-[150px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-all shadow-md"
                >
                  Sign Out
                  <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                    <LogOut className="w-3 h-3 text-white" />
                  </div>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-white/90 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-all shadow-md"
                >
                  Get Started
                  <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                    <Plane className="w-3 h-3 text-white transform -rotate-45" />
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg text-white/80 hover:text-white transition-colors"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 w-full glass-card border-b border-white/10 animate-slide-down">
            <div className="flex flex-col px-4 py-6 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all',
                    pathname === link.href ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-white/10 my-2" />
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 text-white/70">
                    <UserCircle className="w-5 h-5" />
                    {user.email}
                  </div>
                  <button
                    onClick={() => { handleSignOut(); setIsOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-400 hover:bg-white/5 transition-all w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 px-4 py-3 mt-2 rounded-full bg-white text-slate-900 text-base font-semibold"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
