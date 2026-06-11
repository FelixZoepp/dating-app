import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileEditor } from '@/components/profile-editor';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  const { data: values } = await supabase
    .from('values')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Mein Profil</h1>
      <ProfileEditor profile={profile} values={values} />
    </div>
  );
}
