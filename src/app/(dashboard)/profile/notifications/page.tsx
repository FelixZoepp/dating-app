import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NotificationSettings } from '@/components/notification-settings';

export default async function NotificationSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const defaults = {
    likes_enabled: true,
    matches_enabled: true,
    messages_enabled: true,
    offers_enabled: true,
    insights_enabled: true,
    concierge_enabled: true,
    marketing_enabled: false,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Benachrichtigungen</h1>
      <NotificationSettings preferences={prefs || defaults} />
    </div>
  );
}
