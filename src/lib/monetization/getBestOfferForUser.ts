import type { Profile, Offer, UserSegment } from '@/types';
import { getUserSegment } from '../segments/getUserSegment';

/**
 * Returns the single best offer for a user.
 * Only one offer at a time to avoid confusion.
 */
export function getBestOfferForUser(
  profile: Profile & {
    last_active_at?: string | null;
    trial_started_at?: string | null;
    trial_ends_at?: string | null;
    total_likes_received?: number;
  },
  upgradeLikelihood: number
): Offer | null {
  const segment = getUserSegment(profile);

  const isEntrepreneur = profile.account_type &&
    ['entrepreneur', 'self_employed', 'ceo', 'investor'].includes(profile.account_type);

  // Already on highest relevant plan
  if (profile.plan === 'concierge') return null;

  // Elite user → Concierge if entrepreneur and high engagement
  if (profile.plan === 'elite' && isEntrepreneur && upgradeLikelihood > 60) {
    return {
      id: 'concierge_offer',
      type: 'concierge',
      headline: 'Persönliches Matchmaking für dich',
      description: 'Unser Matchmaker findet und stellt dir persönlich die besten Partner vor – ohne Algorithmus, mit persönlicher Einführung.',
      price: '999 €/Monat',
      ctaText: 'Jetzt bewerben',
      ctaLink: '/pricing#concierge',
      priority: 1,
    };
  }

  // Premium user → Elite
  if (profile.plan === 'premium' && upgradeLikelihood > 50) {
    return {
      id: 'elite_upgrade',
      type: 'elite',
      headline: 'Upgrade auf Elite',
      description: 'Priorisierte Ausspielung, Profilanalyse und Zugang zu exklusiven Mitgliedern.',
      price: '199 €/Monat',
      ctaText: 'Elite werden',
      ctaLink: '/pricing',
      priority: 2,
    };
  }

  // Founder Pass holder → Premium
  if (profile.plan === 'founder_pass') {
    return {
      id: 'premium_after_pass',
      type: 'premium',
      headline: 'Weiter mit Premium',
      description: 'Behalte vollen Zugang mit 20 Vorschlägen pro Woche, erweiterten Filtern und höherer Sichtbarkeit.',
      price: '79 €/Monat',
      ctaText: 'Premium sichern',
      ctaLink: '/pricing',
      priority: 2,
    };
  }

  // Trial active
  if (segment === 'trial_active') {
    return {
      id: 'trial_info',
      type: 'trial_info',
      headline: 'Dein Testzeitraum läuft',
      description: 'Du hast gerade vollen Zugang zu FounderMatch. Nutze die Zeit, um deine besten Matches zu entdecken.',
      price: null,
      ctaText: 'Vorschläge ansehen',
      ctaLink: '/dashboard/discover',
      priority: 5,
    };
  }

  // Trial ending today
  if (segment === 'trial_ending') {
    return {
      id: 'trial_ending_offer',
      type: 'trial_ending',
      headline: 'Dein Testzeitraum endet heute',
      description: 'Sichere dir jetzt den Founder Pass: 14 Tage voller Zugang für einmalig 29 €.',
      price: '29 €',
      ctaText: 'Founder Pass sichern',
      ctaLink: '/pricing#founder-pass',
      priority: 1,
    };
  }

  // Inactive user → Comeback
  if (segment === 'inactive_user') {
    return {
      id: 'comeback_offer',
      type: 'comeback',
      headline: 'Willkommen zurück!',
      description: 'Wir haben neue passende Mitglieder für dich. Teste Premium 7 Tage für nur 9 €.',
      price: '9 €',
      ctaText: '7 Tage testen',
      ctaLink: '/pricing#comeback',
      priority: 2,
    };
  }

  // Free user with high intent → Founder Pass
  if (segment === 'free_high_intent' || segment === 'high_quality_free_user') {
    return {
      id: 'founder_pass',
      type: 'founder_pass',
      headline: 'Founder Pass – 14 Tage voller Zugang',
      description: 'Teste alle Premium-Features für 14 Tage. Sehe wer Interesse gezeigt hat, erhalte mehr Vorschläge und höhere Sichtbarkeit.',
      price: '29 €',
      ctaText: 'Founder Pass starten',
      ctaLink: '/pricing#founder-pass',
      priority: 3,
    };
  }

  // Active entrepreneur free user → Elite pitch
  if (isEntrepreneur && upgradeLikelihood > 40) {
    return {
      id: 'entrepreneur_elite',
      type: 'elite',
      headline: 'FounderMatch Elite für Unternehmer',
      description: 'Priorisierte Ausspielung, Profilanalyse und Zugang zu den exklusivsten Mitgliedern der Plattform.',
      price: '199 €/Monat',
      ctaText: 'Elite entdecken',
      ctaLink: '/pricing',
      priority: 3,
    };
  }

  // Default: Premium offer for basic users
  if (profile.plan === 'basic' && upgradeLikelihood > 25) {
    return {
      id: 'premium_default',
      type: 'premium',
      headline: 'Mehr Matches, bessere Ergebnisse',
      description: '20 kuratierte Vorschläge pro Woche, sehen wer Interesse zeigt, und erweiterte Filter.',
      price: '79 €/Monat',
      ctaText: 'Premium werden',
      ctaLink: '/pricing',
      priority: 4,
    };
  }

  return null;
}
