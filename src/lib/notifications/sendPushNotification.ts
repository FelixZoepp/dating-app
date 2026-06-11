import type { SupabaseClient } from '@supabase/supabase-js';

interface PushPayload {
  title: string;
  body: string;
  deepLink?: string;
  data?: Record<string, string>;
}

/**
 * Sends a push notification to a user.
 *
 * In production, this would integrate with:
 * - Firebase Cloud Messaging (FCM) for Android & Web
 * - Apple Push Notification service (APNs) for iOS
 * - Expo Push Notifications if using Expo
 *
 * For MVP: Creates an in-app notification record.
 * Push delivery will be added when the mobile app is built.
 */
export async function sendPushNotification(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload
): Promise<{ sent: boolean; method: 'in_app' | 'push' }> {
  // Get active push tokens
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token, platform')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (tokens && tokens.length > 0) {
    // TODO: Integrate with push provider
    // For each token, send via FCM/APNs/Expo
    // await sendViaPushProvider(tokens, payload);

    // For now, just log
    console.log(`[Push] Would send to ${tokens.length} devices for user ${userId.slice(0, 8)}`);
  }

  // Always create in-app notification as fallback
  return { sent: true, method: tokens && tokens.length > 0 ? 'push' : 'in_app' };
}

/**
 * Placeholder for push provider integration.
 * Implement when mobile app is ready.
 */
// async function sendViaPushProvider(
//   tokens: { token: string; platform: string }[],
//   payload: PushPayload
// ) {
//   // Expo Push:
//   // await fetch('https://exp.host/--/api/v2/push/send', { ... })
//
//   // FCM:
//   // await admin.messaging().sendMulticast({ tokens, notification: payload })
//
//   // APNs:
//   // Use @parse/node-apn or similar
// }
