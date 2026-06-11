import type { UserSegment } from '@/types';

export interface EmailTemplate {
  id: string;
  trigger: string;
  subject: string;
  previewText: string;
  dayOffset: number | null;
  segment: UserSegment | null;
}

/**
 * Email trigger templates.
 * These define WHEN and WHAT to send, not HOW (that's the email service's job).
 * Implementation uses Supabase Edge Functions + your email provider.
 */
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // Day 0
  {
    id: 'welcome',
    trigger: 'onboarding_completed',
    subject: 'Dein Kompatibilitätsreport ist fertig',
    previewText: 'Wir haben dein Profil analysiert und die ersten Matches berechnet.',
    dayOffset: 0,
    segment: 'new_user',
  },

  // Day 1
  {
    id: 'new_matches_day1',
    trigger: 'scheduled',
    subject: 'Neue passende Profile für dich',
    previewText: 'Wir haben neue Mitglieder gefunden, die zu dir passen.',
    dayOffset: 1,
    segment: 'new_user',
  },

  // Day 2
  {
    id: 'profile_viewed',
    trigger: 'profile_view',
    subject: 'Jemand mit hoher Kompatibilität hat dein Profil angesehen',
    previewText: 'Eine Person mit über 80% Kompatibilität interessiert sich für dich.',
    dayOffset: 2,
    segment: null,
  },

  // Day 3 / Trial end
  {
    id: 'trial_ending',
    trigger: 'trial_expiring',
    subject: 'Dein kostenloser Testzeitraum endet heute',
    previewText: 'Sichere dir jetzt 14 Tage vollen Zugang für nur 29 €.',
    dayOffset: 3,
    segment: 'trial_ending',
  },

  // After trial
  {
    id: 'post_trial',
    trigger: 'trial_ended',
    subject: 'Founder Pass: 14 Tage voller Zugang für 29 €',
    previewText: 'Deine Matches warten auf dich. Starte jetzt mit dem Founder Pass.',
    dayOffset: 4,
    segment: null,
  },

  // Like received
  {
    id: 'like_received',
    trigger: 'like_received',
    subject: 'Eine passende Person hat Interesse gezeigt',
    previewText: 'Jemand mit hoher Kompatibilität findet dich interessant.',
    dayOffset: null,
    segment: null,
  },

  // High match
  {
    id: 'high_match',
    trigger: 'high_compatibility_match',
    subject: 'Kompatibilität über 90% mit einem neuen Mitglied',
    previewText: 'Ein neues Mitglied passt besonders gut zu deinen Werten und Zielen.',
    dayOffset: null,
    segment: null,
  },

  // Inactive
  {
    id: 'comeback',
    trigger: 'inactivity_14d',
    subject: 'Neue passende Mitglieder warten auf dich',
    previewText: 'Wir haben neue Matches für dich berechnet. Schau vorbei.',
    dayOffset: null,
    segment: 'inactive_user',
  },

  // Premium insights
  {
    id: 'premium_insights',
    trigger: 'weekly_digest',
    subject: 'Deine neuen Premium-Insights',
    previewText: 'Dein wöchentlicher Report: wer dich angesehen hat, neue Matches, und mehr.',
    dayOffset: null,
    segment: 'premium_user',
  },

  // Elite exclusive
  {
    id: 'elite_exclusive',
    trigger: 'new_elite_member',
    subject: 'Du wurdest für FounderMatch Elite vorgemerkt',
    previewText: 'Exklusive neue Mitglieder sind der Plattform beigetreten.',
    dayOffset: null,
    segment: 'elite_user',
  },

  // Concierge
  {
    id: 'concierge_pitch',
    trigger: 'concierge_candidate_identified',
    subject: 'Du könntest für persönliches Matchmaking geeignet sein',
    previewText: 'Basierend auf deinem Profil und deiner Aktivität empfehlen wir Concierge.',
    dayOffset: null,
    segment: 'concierge_candidate',
  },
];

/**
 * Determines which email should be sent for a given trigger event.
 */
export function getEmailForTrigger(
  trigger: string,
  segment: UserSegment | null
): EmailTemplate | null {
  // Find the most specific match (with segment match) first
  const withSegment = EMAIL_TEMPLATES.find(
    (t) => t.trigger === trigger && t.segment === segment
  );
  if (withSegment) return withSegment;

  // Fall back to generic trigger
  const generic = EMAIL_TEMPLATES.find(
    (t) => t.trigger === trigger && t.segment === null
  );
  return generic || null;
}
