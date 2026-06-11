import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/layout/dashboard-nav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, onboarding_completed, is_admin, profile_image_url, plan')
    .eq('id', user.id)
    .single();

  if (!profile?.onboarding_completed && !profile?.is_admin) {
    // Allow onboarding page
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <DashboardNav
        firstName={profile?.first_name || 'Nutzer'}
        isAdmin={profile?.is_admin || false}
        plan={profile?.plan || 'basic'}
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
