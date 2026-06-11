import type { SupabaseClient } from '@supabase/supabase-js';

export interface NotificationPreferences {
  likes_enabled: boolean;
  matches_enabled: boolean;
  messages_enabled: boolean;
  offers_enabled: boolean;
  insights_enabled: boolean;
  concierge_enabled: boolean;
  marketing_enabled: boolean;
}

export async function getNotificationPreferences(
  supabase: SupabaseClient,
  userId: string
): Promise<NotificationPreferences> {
  const { data } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (data) return data as NotificationPreferences;

  // Create defaults if not exists
  const defaults: NotificationPreferences = {
    likes_enabled: true,
    matches_enabled: true,
    messages_enabled: true,
    offers_enabled: true,
    insights_enabled: true,
    concierge_enabled: true,
    marketing_enabled: false,
  };

  await supabase.from('notification_preferences').insert({ user_id: userId, ...defaults });
  return defaults;
}

export async function updateNotificationPreferences(
  supabase: SupabaseClient,
  userId: string,
  prefs: Partial<NotificationPreferences>
): Promise<void> {
  await supabase
    .from('notification_preferences')
    .update(prefs)
    .eq('user_id', userId);
}
