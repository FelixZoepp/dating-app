import type { SupabaseClient } from '@supabase/supabase-js';
import type { Profile, Values } from '@/types';
import { calculateCompatibility } from './calculateCompatibility';

const PLAN_LIMITS: Record<string, number> = {
  basic: 3,        // 3 per batch (shown across the week)
  founder_pass: 5,
  premium: 10,
  elite: 20,
  concierge: 20,
};

/**
 * Generates a daily batch of curated match suggestions for a user.
 * Respects plan limits, exclusion filters, and minimum compatibility.
 * Called via cron or on-demand when user visits discover page.
 */
export async function generateDailyBatch(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Check if batch already exists for today
  const { count: existingCount } = await supabase
    .from('daily_matches')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('batch_date', today);

  if (existingCount && existingCount > 0) return; // Already generated

  // Get user profile + values
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile || !profile.onboarding_completed) return;

  const { data: userValues } = await supabase
    .from('values')
    .select('*')
    .eq('profile_id', userId)
    .single();

  const limit = PLAN_LIMITS[profile.plan] || 3;

  // Get exclusion sets
  const [
    { data: rejections },
    { data: matches },
    { data: blocks },
    { data: likes },
    { data: previousDaily },
  ] = await Promise.all([
    supabase.from('rejections').select('to_profile_id').eq('from_profile_id', userId),
    supabase.from('matches').select('profile_a, profile_b')
      .or(`profile_a.eq.${userId},profile_b.eq.${userId}`),
    supabase.from('blocks').select('to_profile_id').eq('from_profile_id', userId),
    supabase.from('likes').select('to_profile_id').eq('from_profile_id', userId),
    // Exclude profiles shown in last 7 days
    supabase.from('daily_matches').select('suggested_profile_id')
      .eq('user_id', userId)
      .gte('batch_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]),
  ]);

  const excludeIds = new Set<string>([userId]);
  rejections?.forEach((r) => excludeIds.add(r.to_profile_id));
  matches?.forEach((m) => {
    excludeIds.add(m.profile_a === userId ? m.profile_b : m.profile_a);
  });
  blocks?.forEach((b) => excludeIds.add(b.to_profile_id));
  likes?.forEach((l) => excludeIds.add(l.to_profile_id));
  previousDaily?.forEach((d) => excludeIds.add(d.suggested_profile_id));

  // Also exclude users who blocked this user
  const { data: blockedBy } = await supabase
    .from('blocks')
    .select('from_profile_id')
    .eq('to_profile_id', userId);
  blockedBy?.forEach((b) => excludeIds.add(b.from_profile_id));

  // Fetch candidates
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('onboarding_completed', true)
    .eq('is_banned', false)
    .neq('id', userId);

  if (profile.seeking_gender && profile.seeking_gender !== 'other') {
    query = query.eq('gender', profile.seeking_gender);
  }

  const { data: candidates } = await query.limit(200);
  if (!candidates) return;

  // Get values for candidates
  const candidateIds = candidates.filter((c) => !excludeIds.has(c.id)).map((c) => c.id);
  if (candidateIds.length === 0) return;

  const { data: allValues } = await supabase
    .from('values')
    .select('*')
    .in('profile_id', candidateIds);

  const valuesMap = new Map<string, Values>();
  allValues?.forEach((v) => valuesMap.set(v.profile_id, v as Values));

  // Score and rank
  const scored = candidates
    .filter((c) => !excludeIds.has(c.id))
    .map((candidate) => {
      const candidateValues = valuesMap.get(candidate.id) || null;
      const result = calculateCompatibility(
        profile as Profile,
        candidate as Profile,
        userValues as Values | null,
        candidateValues
      );
      return { profileId: candidate.id, score: result.totalScore };
    })
    .filter((s) => s.score >= 55) // Minimum compatibility
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (scored.length === 0) return;

  // Insert daily matches
  const inserts = scored.map((s) => ({
    user_id: userId,
    suggested_profile_id: s.profileId,
    batch_date: today,
    compatibility_score: s.score,
    status: 'pending',
  }));

  await supabase.from('daily_matches').insert(inserts);
}
