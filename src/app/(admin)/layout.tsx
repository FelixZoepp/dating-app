import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="bg-zinc-900 text-white border-b border-zinc-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-xl font-bold tracking-tight">
              <span className="text-white">Founder</span>
              <span className="text-amber-500">Match</span>
              <span className="text-xs text-zinc-400 ml-2">Admin</span>
            </Link>
          </div>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Zurück zum Dashboard
          </Link>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
