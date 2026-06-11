import type { Profile, Values, MatchRecommendation } from '@/types';
import { calculateCompatibility } from './calculateCompatibility';
import { calculateVisibilityScore } from './calculateVisibilityScore';
import { SupabaseClient } from '@supabase/supabase-js';

const MIN_COMPATIBILITY = 60;

/**
 * Hard exclusion filter: profiles that must not appear.
 */
function isExcluded(
  candidate: Profile,
  currentUser: Profile,
  rejectedIds: Set<string>,
  matchedIds: Set<string>,
  blockedIds: Set<string>,
  likedIds: Set<string>
): boolean {
  // Self
  if (candidate.id === currentUser.id) return true;

  // Banned or flagged
  if (candidate.is_banned) return true;
  if ((candidate as any).is_flagged) return true;

  // Incomplete profile
  if (!candidate.onboarding_completed) return true;

  // Gender filter
  if (currentUser.seeking_gender && currentUser.seeking_gender !== 'other') {
    if (candidate.gender !== currentUser.seeking_gender) return true;
  }

  // Reverse gender check: candidate must be seeking current user's gender
  if (candidate.seeking_gender && candidate.seeking_gender !== 'other') {
    if (currentUser.gender !== candidate.seeking_gender) return true;
  }

  // Already interacted
  if (rejectedIds.has(candidate.id)) return true;
  if (matchedIds.has(candidate.id)) return true;
  if (blockedIds.has(candidate.id)) return true;
  if (likedIds.has(candidate.id)) return true;

  return false;
}

/**
 * Soft filter: minimum compatibility thresholds.
 */
function passesMinimumThresholds(
  candidate: Profile,
  currentUser: Profile,
  compatibility: ReturnType<typeof calculateCompatibility>
): boolean {
  // Overall minimum
  if (compatibility.totalScore < MIN_COMPATIBILITY) return false;

  // Relationship goal must not be completely contradictory
  if (compatibility.categoryScores.relationshipGoal < 25) return false;

  // Children wish must not be completely contradictory
  if (compatibility.categoryScores.childrenWish < 20) return false;

  return true;
}

/**
 * Calculate final ranking score.
 * Compatibility always has priority over monetization signals.
 */
function calculateFinalRank(
  compatibility: ReturnType<typeof calculateCompatibility>,
  visibility: ReturnType<typeof calculateVisibilityScore>,
  candidate: Profile & { last_active_at?: string | null }
): number {
  // Base: 70% compatibility, 30% visibility
  let rank = compatibility.totalScore * 0.70 + visibility.score * 0.30;

  // Active user boost (max +5)
  if (candidate.last_active_at) {
    const daysSince = (Date.now() - new Date(candidate.last_active_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 1) rank += 5;
    else if (daysSince < 3) rank += 3;
  }

  // Verified boost (+3)
  if (candidate.verification_status === 'verified') rank += 3;

  // Premium/Elite slight boost (+2) - small enough to not distort quality
  if (['premium', 'elite', 'concierge'].includes(candidate.plan)) rank += 2;

  // New user boost (registered < 7 days ago, +3)
  const daysSinceJoin = (Date.now() - new Date(candidate.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceJoin < 7) rank += 3;

  // High response rate boost (+2)
  if ((candidate as any).response_rate > 0.7) rank += 2;

  return Math.round(rank * 100) / 100;
}

export async function getRecommendedMatches(
  supabase: SupabaseClient,
  currentUser: Profile,
  currentValues: Values | null,
  limit: number = 10
): Promise<MatchRecommendation[]> {
  // Fetch exclusion sets in parallel
  const [
    { data: rejections },
    { data: matches },
    { data: blocks },
    { data: likes },
  ] = await Promise.all([
    supabase.from('rejections').select('to_profile_id').eq('from_profile_id', currentUser.id),
    supabase.from('matches').select('profile_a, profile_b')
      .or(`profile_a.eq.${currentUser.id},profile_b.eq.${currentUser.id}`),
    supabase.from('blocks').select('to_profile_id').eq('from_profile_id', currentUser.id),
    supabase.from('likes').select('to_profile_id').eq('from_profile_id', currentUser.id),
  ]);

  const rejectedIds = new Set(rejections?.map((r) => r.to_profile_id) || []);
  const matchedIds = new Set<string>();
  matches?.forEach((m) => {
    matchedIds.add(m.profile_a === currentUser.id ? m.profile_b : m.profile_a);
  });
  const blockedIds = new Set(blocks?.map((b) => b.to_profile_id) || []);
  // Also check reverse blocks
  const { data: blockedByOthers } = await supabase
    .from('blocks')
    .select('from_profile_id')
    .eq('to_profile_id', currentUser.id);
  blockedByOthers?.forEach((b) => blockedIds.add(b.from_profile_id));

  const likedIds = new Set(likes?.map((l) => l.to_profile_id) || []);

  // Fetch candidates
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('onboarding_completed', true)
    .eq('is_banned', false)
    .neq('id', currentUser.id);

  // Pre-filter by gender if possible
  if (currentUser.seeking_gender && currentUser.seeking_gender !== 'other') {
    query = query.eq('gender', currentUser.seeking_gender);
  }

  const { data: candidates } = await query.limit(200);
  if (!candidates || candidates.length === 0) return [];

  // Fetch all values
  const candidateIds = candidates.map((c) => c.id);
  const { data: allValues } = await supabase
    .from('values')
    .select('*')
    .in('profile_id', candidateIds);

  const valuesMap = new Map<string, Values>();
  allValues?.forEach((v) => valuesMap.set(v.profile_id, v as Values));

  // Score and rank
  const recommendations: MatchRecommendation[] = [];

  for (const candidate of candidates) {
    if (isExcluded(candidate as Profile, currentUser, rejectedIds, matchedIds, blockedIds, likedIds)) {
      continue;
    }

    const candidateValues = valuesMap.get(candidate.id) || null;
    const compatibility = calculateCompatibility(
      currentUser,
      candidate as Profile,
      currentValues,
      candidateValues
    );

    if (!passesMinimumThresholds(candidate as Profile, currentUser, compatibility)) {
      continue;
    }

    const visibility = calculateVisibilityScore(candidate as Profile & { last_active_at?: string | null });
    const finalRank = calculateFinalRank(compatibility, visibility, candidate as Profile & { last_active_at?: string | null });

    recommendations.push({
      profile: candidate as Profile,
      values: candidateValues,
      compatibility,
      visibilityScore: visibility.score,
      finalRank,
    });
  }

  // Sort by final rank descending
  recommendations.sort((a, b) => b.finalRank - a.finalRank);

  return recommendations.slice(0, limit);
}
