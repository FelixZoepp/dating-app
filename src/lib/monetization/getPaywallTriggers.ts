import type { Profile, PaywallTrigger, AnalyticsEvent } from '@/types';
import { calculateUpgradeLikelihood } from './calculateUpgradeLikelihood';
import { getBestOfferForUser } from './getBestOfferForUser';

/**
 * Determines which paywall triggers should fire for a user.
 * Returns triggers in priority order.
 *
 * FAIRNESS: These triggers are based on real user actions,
 * never on artificially withheld content.
 */
export function getPaywallTriggers(
  profile: Profile & {
    last_active_at?: string | null;
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
    total_likes_received?: number;
    total_likes_sent?: number;
    total_messages_sent?: number;
  },
  events: AnalyticsEvent[],
  context: {
    viewingHighMatch?: boolean;
    highMatchScore?: number;
    wantsToSeeWhoLiked?: boolean;
    trialDaysUsed?: number;
    matchesWithHighScore?: number;
  } = {}
): PaywallTrigger[] {
  const triggers: PaywallTrigger[] = [];
  const isBasicOrFree = profile.plan === 'basic';
  const { score: upgradeLikelihood } = calculateUpgradeLikelihood(profile, events);

  // Trigger 1: Who liked me (Premium feature)
  if (context.wantsToSeeWhoLiked && isBasicOrFree) {
    triggers.push({
      type: 'who_liked',
      show: true,
      offer: {
        id: 'who_liked_paywall',
        type: 'premium',
        headline: 'Wer hat Interesse an dir?',
        description: `Du hast ${profile.total_likes_received ?? 0} Personen, die Interesse an dir zeigen. Upgrade um sie zu sehen.`,
        price: '79 €/Monat',
        ctaText: 'Jetzt freischalten',
        ctaLink: '/pricing',
        priority: 1,
      },
    });
  }

  // Trigger 2: High match details (score > 85)
  if (context.viewingHighMatch && context.highMatchScore && context.highMatchScore > 85 && isBasicOrFree) {
    triggers.push({
      type: 'high_match_details',
      show: true,
      offer: {
        id: 'high_match_paywall',
        type: 'premium',
        headline: `${context.highMatchScore}% Kompatibilität!`,
        description: 'Dieses Profil passt besonders gut zu dir. Upgrade für den vollständigen Kompatibilitätsreport.',
        price: '79 €/Monat',
        ctaText: 'Details freischalten',
        ctaLink: '/pricing',
        priority: 1,
      },
    });
  }

  // Trigger 3: Trial used 3 days
  if (context.trialDaysUsed && context.trialDaysUsed >= 3 && profile.plan === 'basic') {
    triggers.push({
      type: 'trial_end',
      show: true,
      offer: {
        id: 'after_trial',
        type: 'founder_pass',
        headline: 'Dein Testzeitraum ist abgelaufen',
        description: 'Sichere dir den Founder Pass: 14 Tage voller Zugang für 29 €.',
        price: '29 €',
        ctaText: 'Founder Pass sichern',
        ctaLink: '/pricing#founder-pass',
        priority: 1,
      },
    });
  }

  // Trigger 4: Many high-quality matches but no upgrade
  if (context.matchesWithHighScore && context.matchesWithHighScore >= 3 && isBasicOrFree) {
    triggers.push({
      type: 'founder_pass_offer',
      show: true,
      offer: {
        id: 'quality_matches_offer',
        type: 'founder_pass',
        headline: `${context.matchesWithHighScore} hochwertige Matches warten`,
        description: 'Du hast mehrere Matches mit über 80% Kompatibilität. Sichere dir 14 Tage vollen Zugang.',
        price: '29 €',
        ctaText: 'Founder Pass starten',
        ctaLink: '/pricing#founder-pass',
        priority: 2,
      },
    });
  }

  // Trigger 5: Active entrepreneur → Elite
  const isEntrepreneur = profile.account_type &&
    ['entrepreneur', 'self_employed', 'ceo', 'investor'].includes(profile.account_type);
  if (isEntrepreneur && (profile.total_likes_sent ?? 0) >= 5 && profile.plan === 'premium') {
    triggers.push({
      type: 'elite_offer',
      show: true,
      offer: {
        id: 'entrepreneur_elite_offer',
        type: 'elite',
        headline: 'FounderMatch Elite',
        description: 'Als aktiver Unternehmer erhältst du mit Elite priorisierte Ausspielung und exklusiven Zugang.',
        price: '199 €/Monat',
        ctaText: 'Elite werden',
        ctaLink: '/pricing',
        priority: 3,
      },
    });
  }

  // Trigger 6: High revenue entrepreneur → Concierge
  if (isEntrepreneur && upgradeLikelihood > 70 && ['premium', 'elite'].includes(profile.plan)) {
    triggers.push({
      type: 'concierge_offer',
      show: true,
      offer: {
        id: 'concierge_pitch',
        type: 'concierge',
        headline: 'Persönliches Matchmaking',
        description: 'Lass unseren Matchmaker die perfekte Partnerin für dich finden. Persönlich, diskret, handverlesen.',
        price: '999 €/Monat',
        ctaText: 'Jetzt bewerben',
        ctaLink: '/pricing#concierge',
        priority: 2,
      },
    });
  }

  // Sort by priority (lower number = higher priority)
  triggers.sort((a, b) => (a.offer?.priority ?? 99) - (b.offer?.priority ?? 99));

  return triggers;
}
