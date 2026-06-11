'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Home, Heart, MessageCircle, User, Crown, Settings, LogOut, Shield } from 'lucide-react';
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
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="text-xl font-bold tracking-tight">
            <span className="text-zinc-900">Founder</span>
            <span className="text-amber-600">Match</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-amber-50 text-amber-700'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
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
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-red-50 text-red-700'
                    : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
                )}
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {plan !== 'basic' && (
              <Badge variant="premium">{plan}</Badge>
            )}
            <span className="text-sm text-zinc-600 hidden sm:block">{firstName}</span>
            <button
              onClick={handleLogout}
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
              title="Abmelden"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-1 pb-2 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                pathname === link.href || pathname.startsWith(link.href + '/')
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-zinc-500 hover:text-zinc-700'
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
