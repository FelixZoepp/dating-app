import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getRecommendedMatches } from '@/lib/matching/getRecommendedMatches';
import { DiscoverCards } from '@/components/matching/discover-cards';
import { OfferBanner } from '@/components/monetization/offer-banner';
import { getBestOfferForUser } from '@/lib/monetization/getBestOfferForUser';
import { calculateUpgradeLikelihood } from '@/lib/monetization/calculateUpgradeLikelihood';
import type { Profile, Values } from '@/types';

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

  const { data: myValues } = await supabase
    .from('values')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  // Update last active
  await supabase.from('profiles').update({ last_active_at: new Date().toISOString() }).eq('id', user.id);

  // Get recommended matches using new algorithm
  const recommendations = await getRecommendedMatches(
    supabase,
    myProfile as Profile,
    myValues as Values | null,
    10
  );

  // Get best offer for user
  const { data: events } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const { score: upgradeLikelihood } = calculateUpgradeLikelihood(myProfile as any, events || []);
  const offer = getBestOfferForUser(myProfile as any, upgradeLikelihood);

  if (recommendations.length === 0) {
    return (
      <div>
        {offer && <OfferBanner offer={offer} userId={user.id} />}
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Noch keine Vorschläge</h2>
          <p className="text-zinc-500">Neue Mitglieder werden regelmäßig aufgenommen. Schau bald wieder vorbei.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {offer && <OfferBanner offer={offer} userId={user.id} />}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Deine Vorschläge</h1>
        <p className="text-zinc-500 text-sm">
          Kuratierte Profile basierend auf eurer Kompatibilität – Qualität vor Quantität.
        </p>
      </div>
      <DiscoverCards
        recommendations={recommendations}
        currentUserId={user.id}
        userPlan={myProfile.plan}
      />
    </div>
  );
}
