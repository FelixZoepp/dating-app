import type { Profile, UserSegment } from '@/types';

/**
 * Determines the user's current segment.
 * Returns the most relevant segment (only one).
 */
export function getUserSegment(
  profile: Profile & {
    last_active_at?: string | null;
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
    total_likes_received?: number;
    total_likes_sent?: number;
    total_messages_sent?: number;
  }
): UserSegment {
  const now = new Date();

  // Incomplete onboarding
  if (!profile.onboarding_completed) return 'onboarding_incomplete';

  // Needs verification (entrepreneur without verification)
  const isEntrepreneur = profile.account_type &&
    ['entrepreneur', 'self_employed', 'ceo', 'investor'].includes(profile.account_type);
  if (isEntrepreneur && profile.verification_status === 'pending') return 'needs_verification';

  // Paying users
  if (profile.plan === 'concierge') return 'concierge_candidate';
  if (profile.plan === 'elite') return 'elite_user';
  if (profile.plan === 'premium') return 'premium_user';
  if (profile.plan === 'founder_pass') return 'founder_pass_active';

  // Trial status
  if (profile.trial_ends_at) {
    const trialEnd = new Date(profile.trial_ends_at);
    const hoursUntilEnd = (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilEnd > 0 && hoursUntilEnd < 24) return 'trial_ending';
    if (hoursUntilEnd > 0) return 'trial_active';
  }

  // Inactive (no activity in 14+ days)
  if (profile.last_active_at) {
    const daysSince = (now.getTime() - new Date(profile.last_active_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 14) return 'inactive_user';
  }

  // New user (registered < 3 days ago)
  const daysSinceJoin = (now.getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceJoin < 3) return 'new_user';

  // Low quality profile
  const requiredFields = [
    profile.first_name, profile.age, profile.city, profile.bio,
    profile.relationship_goal, profile.children_wish,
  ];
  const filledCount = requiredFields.filter(Boolean).length;
  if (filledCount < 4) return 'low_quality_profile';

  // High quality free user (complete profile, active, receiving likes)
  const likesReceived = profile.total_likes_received ?? 0;
  const messagesSent = profile.total_messages_sent ?? 0;
  if (filledCount >= 5 && likesReceived >= 2) return 'high_quality_free_user';

  // Free user with high intent (active, sending likes/messages)
  const likesSent = profile.total_likes_sent ?? 0;
  if (likesSent >= 3 || messagesSent >= 2) return 'free_high_intent';

  return 'new_user';
}

/**
 * Returns UI hints for each segment.
 */
export function getSegmentHints(segment: UserSegment): {
  badge: string | null;
  bannerText: string | null;
  emailTrigger: string | null;
  upsellType: string | null;
} {
  const hints: Record<UserSegment, ReturnType<typeof getSegmentHints>> = {
    new_user: {
      badge: 'Neu',
      bannerText: 'Willkommen! Vervollständige dein Profil für bessere Matches.',
      emailTrigger: 'welcome_day0',
      upsellType: null,
    },
    onboarding_incomplete: {
      badge: null,
      bannerText: 'Schließe dein Onboarding ab, um Vorschläge zu erhalten.',
      emailTrigger: 'onboarding_reminder',
      upsellType: null,
    },
    trial_active: {
      badge: 'Trial',
      bannerText: 'Dein Testzeitraum läuft – nutze alle Features!',
      emailTrigger: 'trial_active_tips',
      upsellType: null,
    },
    trial_ending: {
      badge: 'Trial endet',
      bannerText: 'Dein Testzeitraum endet heute. Sichere dir den Founder Pass!',
      emailTrigger: 'trial_ending_urgent',
      upsellType: 'founder_pass',
    },
    free_high_intent: {
      badge: null,
      bannerText: null,
      emailTrigger: 'high_intent_nudge',
      upsellType: 'founder_pass',
    },
    founder_pass_active: {
      badge: 'Founder Pass',
      bannerText: null,
      emailTrigger: null,
      upsellType: 'premium',
    },
    premium_user: {
      badge: 'Premium',
      bannerText: null,
      emailTrigger: 'premium_insights',
      upsellType: 'elite',
    },
    elite_user: {
      badge: 'Elite',
      bannerText: null,
      emailTrigger: 'elite_exclusive',
      upsellType: 'concierge',
    },
    concierge_candidate: {
      badge: 'Concierge',
      bannerText: null,
      emailTrigger: 'concierge_update',
      upsellType: null,
    },
    inactive_user: {
      badge: null,
      bannerText: null,
      emailTrigger: 'comeback',
      upsellType: 'comeback',
    },
    high_quality_free_user: {
      badge: null,
      bannerText: 'Du erhältst Interesse! Upgrade um zu sehen, wer.',
      emailTrigger: 'quality_nudge',
      upsellType: 'founder_pass',
    },
    low_quality_profile: {
      badge: null,
      bannerText: 'Vervollständige dein Profil für bessere Vorschläge.',
      emailTrigger: 'profile_improvement',
      upsellType: null,
    },
    needs_verification: {
      badge: 'Verifizierung ausstehend',
      bannerText: 'Deine Unternehmer-Verifizierung wird geprüft.',
      emailTrigger: null,
      upsellType: null,
    },
  };

  return hints[segment];
}
