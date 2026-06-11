import type { SupabaseClient } from '@supabase/supabase-js';
import { sendPushNotification } from './sendPushNotification';

type NotificationType =
  | 'like_received'
  | 'match_created'
  | 'message_received'
  | 'high_compatibility'
  | 'trial_ending'
  | 'offer_expiring'
  | 'premium_insights'
  | 'concierge_invitation'
  | 'profile_viewed';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  deepLink?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates a notification and optionally sends a push.
 * Respects user notification preferences.
 *
 * IMPORTANT: All notifications must be based on real events.
 * Never create fake notifications.
 */
export async function createNotification(
  supabase: SupabaseClient,
  params: CreateNotificationParams
): Promise<void> {
  // Check preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('user_id', params.userId)
    .single();

  if (prefs) {
    const typeToPreference: Record<NotificationType, string> = {
      like_received: 'likes_enabled',
      match_created: 'matches_enabled',
      message_received: 'messages_enabled',
      high_compatibility: 'insights_enabled',
      trial_ending: 'offers_enabled',
      offer_expiring: 'offers_enabled',
      premium_insights: 'insights_enabled',
      concierge_invitation: 'concierge_enabled',
      profile_viewed: 'insights_enabled',
    };

    const prefKey = typeToPreference[params.type];
    if (prefKey && !(prefs as Record<string, boolean>)[prefKey]) {
      return; // User has disabled this notification type
    }
  }

  // Create in-app notification
  await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    deep_link: params.deepLink,
    metadata: params.metadata || {},
  });

  // Send push notification
  await sendPushNotification(supabase, params.userId, {
    title: params.title,
    body: params.body,
    deepLink: params.deepLink,
  });
}

/**
 * Pre-built notification creators for common events.
 * All based on real data, never fake.
 */
export const NotificationFactory = {
  likeReceived(supabase: SupabaseClient, userId: string, likerName: string) {
    return createNotification(supabase, {
      userId,
      type: 'like_received',
      title: 'Neues Interesse',
      body: `${likerName} hat Interesse an dir gezeigt.`,
      deepLink: '/dashboard/discover',
      metadata: { likerName },
    });
  },

  matchCreated(supabase: SupabaseClient, userId: string, partnerName: string, matchId: string) {
    return createNotification(supabase, {
      userId,
      type: 'match_created',
      title: 'Neues Match!',
      body: `Du und ${partnerName} habt gematcht! Schreib die erste Nachricht.`,
      deepLink: `/chat/${matchId}`,
      metadata: { partnerName, matchId },
    });
  },

  messageReceived(supabase: SupabaseClient, userId: string, senderName: string, matchId: string) {
    return createNotification(supabase, {
      userId,
      type: 'message_received',
      title: 'Neue Nachricht',
      body: `${senderName} hat dir geschrieben.`,
      deepLink: `/chat/${matchId}`,
      metadata: { senderName, matchId },
    });
  },

  highCompatibility(supabase: SupabaseClient, userId: string, score: number) {
    return createNotification(supabase, {
      userId,
      type: 'high_compatibility',
      title: 'Hohe Kompatibilität entdeckt',
      body: `Ein neues Mitglied hat ${score}% Kompatibilität mit dir.`,
      deepLink: '/dashboard/discover',
      metadata: { score },
    });
  },

  trialEnding(supabase: SupabaseClient, userId: string) {
    return createNotification(supabase, {
      userId,
      type: 'trial_ending',
      title: 'Testzeitraum endet bald',
      body: 'Dein kostenloser Testzeitraum endet heute. Sichere dir den Founder Pass!',
      deepLink: '/pricing',
    });
  },

  conciergeInvitation(supabase: SupabaseClient, userId: string) {
    return createNotification(supabase, {
      userId,
      type: 'concierge_invitation',
      title: 'Concierge-Einladung',
      body: 'Du wurdest für persönliches Matchmaking vorgemerkt.',
      deepLink: '/pricing#concierge',
    });
  },
};
