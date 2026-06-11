import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { generateDailyBatch } from '@/lib/matching/generateDailyBatch';
import { SwipeDeck } from '@/components/matching/swipe-deck';
import { OfferBanner } from '@/components/monetization/offer-banner';
import { getBestOfferForUser } from '@/lib/monetization/getBestOfferForUser';
import { calculateUpgradeLikelihood } from '@/lib/monetization/calculateUpgradeLikelihood';

export default async function DiscoverPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!myProfile || !myProfile.onboarding_completed) redirect('/onboarding');

  // Update last active
  await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id);

  // Generate daily batch if needed
  await generateDailyBatch(supabase, user.id);

  // Get today's pending suggestions
  const today = new Date().toISOString().split('T')[0];
  const { data: dailyMatches } = await supabase
    .from('daily_matches')
    .select('*, suggested_profile:profiles!daily_matches_suggested_profile_id_fkey(id, first_name, age, city, gender, relationship_goal, children_wish, career_focus, family_orientation, relationship_model, bio, profile_image_url, verification_status, account_type)')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('compatibility_score', { ascending: false });

  // Get values for suggested profiles
  const profileIds = dailyMatches?.map((m) => m.suggested_profile_id) || [];
  const { data: allValues } = await supabase
    .from('values')
    .select('*')
    .in('profile_id', profileIds.length > 0 ? profileIds : ['none']);

  const valuesMap = new Map();
  allValues?.forEach((v) => valuesMap.set(v.profile_id, v));

  // Get best offer
  const { data: events } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const { score: upgradeLikelihood } = calculateUpgradeLikelihood(myProfile as any, events || []);
  const offer = getBestOfferForUser(myProfile as any, upgradeLikelihood);

  const suggestions = dailyMatches?.map((dm) => ({
    dailyMatchId: dm.id,
    profile: dm.suggested_profile,
    compatibilityScore: dm.compatibility_score,
    values: valuesMap.get(dm.suggested_profile_id) || null,
  })).filter((s) => s.profile) || [];

  return (
    <div>
      {offer && <OfferBanner offer={offer} userId={user.id} />}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Deine Vorschläge
        </h1>
        <p className="text-text-secondary text-sm">
          {suggestions.length > 0
            ? `${suggestions.length} kuratierte Profile für heute — Qualität vor Quantität.`
            : 'Keine neuen Vorschläge verfügbar. Schau morgen wieder vorbei.'}
        </p>
      </div>
      {suggestions.length > 0 ? (
        <SwipeDeck suggestions={suggestions} currentUserId={user.id} userPlan={myProfile.plan} />
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Alles für heute gesehen</h3>
          <p className="text-text-secondary text-sm max-w-xs mx-auto">
            Deine nächsten kuratierten Vorschläge kommen morgen. Geduld zahlt sich aus.
          </p>
        </div>
      )}
    </div>
  );
}
