import type { Profile, AnalyticsEvent } from '@/types';

interface UpgradeLikelihoodResult {
  score: number;
  signals: string[];
  primarySignal: string;
}

/**
 * Calculates how likely a user is to upgrade.
 * IMPORTANT: This score is ONLY used for:
 * - Choosing the right moment to show an upsell
 * - Selecting the right offer
 * - Email trigger timing
 *
 * It is NEVER used to withhold matches or manipulate matching quality.
 */
export function calculateUpgradeLikelihood(
  profile: Profile & {
    last_active_at?: string | null;
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
    total_likes_received?: number;
    total_likes_sent?: number;
    total_messages_sent?: number;
  },
  events: AnalyticsEvent[]
): UpgradeLikelihoodResult {
  let score = 0;
  const signals: string[] = [];

  // Already paying - no upgrade needed for their current plan
  if (['premium', 'elite', 'concierge'].includes(profile.plan)) {
    // But could upsell to higher tier
    if (profile.plan === 'premium') score += 20;
    if (profile.plan === 'founder_pass') score += 40;
  }

  // Onboarding completed (+10)
  if (profile.onboarding_completed) {
    score += 10;
    signals.push('onboarding_complete');
  }

  // Has received likes (+15)
  const likesReceived = profile.total_likes_received ?? 0;
  if (likesReceived > 0) {
    score += Math.min(15, likesReceived * 3);
    signals.push('likes_received');
  }

  // Has sent likes (+10)
  const likesSent = profile.total_likes_sent ?? 0;
  if (likesSent > 0) {
    score += Math.min(10, likesSent * 2);
    signals.push('likes_sent');
  }

  // Has sent messages (+10)
  const messagesSent = profile.total_messages_sent ?? 0;
  if (messagesSent > 0) {
    score += Math.min(10, messagesSent * 2);
    signals.push('active_chatter');
  }

  // Event-based signals
  const eventNames = new Set(events.map((e) => e.event_name));

  if (eventNames.has('report_viewed')) {
    score += 5;
    signals.push('report_viewed');
  }

  if (eventNames.has('compatibility_details_clicked')) {
    score += 8;
    signals.push('details_curious');
  }

  if (eventNames.has('paywall_viewed')) {
    score += 12;
    signals.push('paywall_seen');
  }

  if (eventNames.has('premium_clicked') || eventNames.has('elite_clicked')) {
    score += 15;
    signals.push('upgrade_interest');
  }

  if (eventNames.has('founder_pass_clicked')) {
    score += 12;
    signals.push('founder_pass_interest');
  }

  // Trial ending soon (+15)
  if (profile.trial_ends_at) {
    const trialEnd = new Date(profile.trial_ends_at);
    const now = new Date();
    const hoursUntilEnd = (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilEnd > 0 && hoursUntilEnd < 24) {
      score += 15;
      signals.push('trial_ending_today');
    } else if (hoursUntilEnd <= 0) {
      score += 10;
      signals.push('trial_ended');
    }
  }

  // Repeated returns (+8)
  const uniqueDays = new Set(events.map((e) => new Date(e.created_at).toDateString()));
  if (uniqueDays.size >= 3) {
    score += 8;
    signals.push('repeated_visitor');
  }
  if (uniqueDays.size >= 7) {
    score += 5;
    signals.push('loyal_visitor');
  }

  // High activity in last 48h (+10)
  const recentEvents = events.filter((e) => {
    const age = Date.now() - new Date(e.created_at).getTime();
    return age < 48 * 60 * 60 * 1000;
  });
  if (recentEvents.length >= 10) {
    score += 10;
    signals.push('high_recent_activity');
  }

  // Entrepreneur with revenue info (+5)
  const isEntrepreneur = profile.account_type &&
    ['entrepreneur', 'self_employed', 'ceo', 'investor'].includes(profile.account_type);
  if (isEntrepreneur) {
    score += 5;
    signals.push('entrepreneur');
  }

  // Determine primary signal
  let primarySignal = 'general_engagement';
  if (signals.includes('trial_ending_today')) primarySignal = 'trial_urgency';
  else if (signals.includes('upgrade_interest')) primarySignal = 'direct_interest';
  else if (signals.includes('paywall_seen')) primarySignal = 'paywall_encounter';
  else if (signals.includes('likes_received') && likesReceived >= 3) primarySignal = 'social_proof';
  else if (signals.includes('high_recent_activity')) primarySignal = 'high_engagement';

  return {
    score: Math.min(100, Math.max(0, score)),
    signals,
    primarySignal,
  };
}
