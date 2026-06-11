'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { trackEventAsync } from '@/lib/analytics/trackEvent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MatchRecommendation } from '@/types';
import { Heart, X, MapPin, Target, Baby, Users, Shield, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const GOAL_LABELS: Record<string, string> = {
  serious: 'Ernsthafte Beziehung',
  marriage: 'Ehe',
  family: 'Familie',
  open: 'Offen',
};

const CHILDREN_LABELS: Record<string, string> = {
  yes: 'Ja',
  no: 'Nein',
  maybe: 'Vielleicht',
  already_have: 'Bereits Kinder',
};

const MODEL_LABELS: Record<string, string> = {
  both_career: 'Beide karriereorientiert',
  traditional: 'Klassisch',
  flexible: 'Flexibel',
  undecided: 'Offen',
};

interface Props {
  recommendations: MatchRecommendation[];
  currentUserId: string;
  userPlan: string;
}

export function DiscoverCards({ recommendations, currentUserId, userPlan }: Props) {
  const [cards, setCards] = useState(recommendations);
  const [loading, setLoading] = useState<string | null>(null);
  const [matchAlert, setMatchAlert] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  async function handleLike(profileId: string) {
    setLoading(profileId);
    const supabase = createClient();

    await supabase.from('likes').insert({
      from_profile_id: currentUserId,
      to_profile_id: profileId,
    });

    trackEventAsync(supabase, currentUserId, 'like_sent', { toProfileId: profileId });

    const { data: reverseLike } = await supabase
      .from('likes')
      .select('id')
      .eq('from_profile_id', profileId)
      .eq('to_profile_id', currentUserId)
      .single();

    if (reverseLike) {
      const rec = cards.find((c) => c.profile.id === profileId);
      setMatchAlert(rec?.profile.first_name || 'jemand');
      trackEventAsync(supabase, currentUserId, 'match_created', { withProfileId: profileId });
      setTimeout(() => setMatchAlert(null), 3000);
    }

    setCards((prev) => prev.filter((c) => c.profile.id !== profileId));
    setLoading(null);
  }

  async function handleSkip(profileId: string) {
    const supabase = createClient();
    await supabase.from('rejections').insert({
      from_profile_id: currentUserId,
      to_profile_id: profileId,
    });
    setCards((prev) => prev.filter((c) => c.profile.id !== profileId));
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Keine weiteren Vorschläge</h3>
        <p className="text-zinc-500 text-sm">Schau später wieder vorbei für neue kuratierte Matches.</p>
      </div>
    );
  }

  return (
    <>
      {matchAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <Heart className="w-5 h-5" />
          <span className="font-semibold">Match mit {matchAlert}!</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {cards.map(({ profile: candidate, compatibility }) => {
          const isExpanded = expandedId === candidate.id;
          const showDetails = userPlan !== 'basic' || compatibility.totalScore <= 85;

          return (
            <Card key={candidate.id} className="overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center relative">
                {candidate.profile_image_url ? (
                  <img
                    src={candidate.profile_image_url}
                    alt={candidate.first_name || ''}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-amber-200 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-amber-700">
                      {candidate.first_name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
                {candidate.verification_status === 'verified' && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="success" className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Verifiziert
                    </Badge>
                  </div>
                )}
              </div>

              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">
                      {candidate.first_name}, {candidate.age}
                    </h3>
                    {candidate.city && (
                      <div className="flex items-center gap-1 text-sm text-zinc-500 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {candidate.city}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-600">
                      {compatibility.totalScore}%
                    </div>
                    <div className="text-xs text-zinc-400">Kompatibilität</div>
                  </div>
                </div>

                {/* Top shared values */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {compatibility.topSharedValues.map((v) => (
                    <Badge key={v} variant="default">{v}</Badge>
                  ))}
                </div>

                {/* Strengths */}
                {compatibility.strengths.length > 0 && (
                  <div className="mb-3">
                    {compatibility.strengths.slice(0, 2).map((s) => (
                      <div key={s} className="flex items-start gap-2 text-xs text-emerald-600 mb-1">
                        <span className="mt-0.5">✓</span>
                        {s}
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick info */}
                <div className="space-y-2 mb-4 text-sm">
                  {candidate.relationship_goal && (
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Target className="w-4 h-4 text-zinc-400" />
                      {GOAL_LABELS[candidate.relationship_goal] || candidate.relationship_goal}
                    </div>
                  )}
                  {candidate.children_wish && (
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Baby className="w-4 h-4 text-zinc-400" />
                      Kinderwunsch: {CHILDREN_LABELS[candidate.children_wish] || candidate.children_wish}
                    </div>
                  )}
                  {candidate.relationship_model && (
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Users className="w-4 h-4 text-zinc-400" />
                      {MODEL_LABELS[candidate.relationship_model] || candidate.relationship_model}
                    </div>
                  )}
                </div>

                {candidate.bio && (
                  <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{candidate.bio}</p>
                )}

                {/* Expandable details */}
                {showDetails && (
                  <button
                    onClick={() => {
                      setExpandedId(isExpanded ? null : candidate.id);
                      if (!isExpanded) {
                        const supabase = createClient();
                        trackEventAsync(supabase, currentUserId, 'compatibility_details_clicked', {
                          profileId: candidate.id,
                          score: compatibility.totalScore,
                        });
                      }
                    }}
                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 mb-4"
                  >
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {isExpanded ? 'Weniger Details' : 'Kompatibilitätsdetails'}
                  </button>
                )}

                {isExpanded && showDetails && (
                  <div className="mb-4 p-3 bg-zinc-50 rounded-xl space-y-2">
                    <p className="text-xs text-zinc-600 mb-3">{compatibility.explanation}</p>
                    {compatibility.risks.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 mb-1">Mögliche Herausforderungen:</p>
                        {compatibility.risks.map((r) => (
                          <div key={r} className="flex items-start gap-1.5 text-xs text-amber-600 mb-1">
                            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                            {r}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!showDetails && compatibility.totalScore > 85 && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-700">
                      <strong>{compatibility.totalScore}% Kompatibilität!</strong> Upgrade auf Premium für den vollständigen Report.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleSkip(candidate.id)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Nicht passend
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleLike(candidate.id)}
                    disabled={loading === candidate.id}
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    {loading === candidate.id ? '...' : 'Interesse'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
