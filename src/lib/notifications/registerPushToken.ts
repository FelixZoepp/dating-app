import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Registers or updates a push token for a user.
 */
export async function registerPushToken(
  supabase: SupabaseClient,
  userId: string,
  token: string,
  platform: 'ios' | 'android' | 'web',
  deviceId?: string
): Promise<void> {
  await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        platform,
        device_id: deviceId,
        last_used_at: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: 'user_id,token' }
    );
}

/**
 * Deactivates a push token (e.g., on logout).
 */
export async function deactivatePushToken(
  supabase: SupabaseClient,
  token: string
): Promise<void> {
  await supabase
    .from('push_tokens')
    .update({ is_active: false })
    .eq('token', token);
}
