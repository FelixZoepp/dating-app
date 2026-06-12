'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Home, Heart, MessageCircle, User, Crown, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DashboardNavProps {
  firstName: string;
  isAdmin: boolean;
  plan: string;
}

export function DashboardNav({ firstName, isAdmin, plan }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/discover', label: 'Entdecken', icon: Heart },
    { href: '/matches', label: 'Matches', icon: MessageCircle },
    { href: '/profile', label: 'Profil', icon: User },
    { href: '/pricing', label: 'Premium', icon: Crown },
  ];

  return (
    <nav className="bg-background/90 backdrop-blur-md border-b border-border sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            <span className="text-foreground">Founder</span>
            <span className="text-accent">Match</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-accent-muted text-accent'
                    : 'text-text-secondary hover:text-foreground hover:bg-surface-2'
                )}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-error/15 text-error'
                    : 'text-text-secondary hover:text-foreground hover:bg-surface-2'
                )}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {plan !== 'basic' && <Badge variant="premium">{plan}</Badge>}
            <span className="text-sm text-text-secondary hidden sm:block">{firstName}</span>
            <button onClick={handleLogout} className="text-text-secondary hover:text-foreground transition-colors" title="Abmelden">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex md:hidden items-center gap-1 pb-2 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap',
                pathname === link.href || pathname.startsWith(link.href + '/')
                  ? 'bg-accent-muted text-accent'
                  : 'text-text-secondary hover:text-foreground'
              )}
            >
              <link.icon className="w-3.5 h-3.5" />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
