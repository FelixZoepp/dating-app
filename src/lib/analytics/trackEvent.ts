import type { AnalyticsEventName } from '@/types';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Tracks an analytics event.
 * Can be called from both client and server.
 */
export async function trackEvent(
  supabase: SupabaseClient,
  userId: string,
  eventName: AnalyticsEventName,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_name: eventName,
    metadata,
  });
}

/**
 * Tracks an event from the client side.
 * Fire-and-forget, does not block UI.
 */
export function trackEventAsync(
  supabase: SupabaseClient,
  userId: string,
  eventName: AnalyticsEventName,
  metadata: Record<string, unknown> = {}
): void {
  supabase.from('analytics_events').insert({
    user_id: userId,
    event_name: eventName,
    metadata,
  }).then(() => {});
}
