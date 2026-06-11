'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { trackEventAsync } from '@/lib/analytics/trackEvent';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, X, MapPin, Target, Baby, Shield, ChevronLeft, ChevronRight } from 'lucide-react';

const GOAL_LABELS: Record<string, string> = {
  serious: 'Ernsthafte Beziehung', marriage: 'Ehe', family: 'Familie', open: 'Offen',
};
const CHILDREN_LABELS: Record<string, string> = {
  yes: 'Ja', no: 'Nein', maybe: 'Vielleicht', already_have: 'Bereits Kinder',
};

interface Suggestion {
  dailyMatchId: string;
  profile: any;
  compatibilityScore: number;
  values: any;
}

interface Props {
  suggestions: Suggestion[];
  currentUserId: string;
  userPlan: string;
}

export function SwipeDeck({ suggestions, currentUserId, userPlan }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cards, setCards] = useState(suggestions);
  const [loading, setLoading] = useState(false);
  const [matchAlert, setMatchAlert] = useState<string | null>(null);
  const router = useRouter();

  const current = cards[currentIndex];

  async function handleLike() {
    if (!current || loading) return;
    setLoading(true);
    const supabase = createClient();

    // Update daily match status
    await supabase
      .from('daily_matches')
      .update({ status: 'liked' })
      .eq('id', current.dailyMatchId);

    // Insert like
    await supabase.from('likes').insert({
      from_profile_id: currentUserId,
      to_profile_id: current.profile.id,
    });

    trackEventAsync(supabase, currentUserId, 'like_sent', {
      toProfileId: current.profile.id,
      score: current.compatibilityScore,
    });

    // Check for mutual match
    const { data: reverseLike } = await supabase
      .from('likes')
      .select('id')
      .eq('from_profile_id', current.profile.id)
      .eq('to_profile_id', currentUserId)
      .single();

    if (reverseLike) {
      setMatchAlert(current.profile.first_name || 'jemand');
      trackEventAsync(supabase, currentUserId, 'match_created', {
        withProfileId: current.profile.id,
      });
      setTimeout(() => setMatchAlert(null), 3000);
    }

    advance();
    setLoading(false);
  }

  async function handleReject() {
    if (!current || loading) return;
    setLoading(true);
    const supabase = createClient();

    await supabase
      .from('daily_matches')
      .update({ status: 'rejected' })
      .eq('id', current.dailyMatchId);

    await supabase.from('rejections').insert({
      from_profile_id: currentUserId,
      to_profile_id: current.profile.id,
    });

    advance();
    setLoading(false);
  }

  function advance() {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCards([]);
    }
  }

  if (cards.length === 0 || currentIndex >= cards.length) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-8 h-8 text-text-secondary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Alle Vorschläge gesehen</h3>
        <p className="text-text-secondary text-sm">Morgen gibt es neue kuratierte Matches für dich.</p>
      </div>
    );
  }

  const p = current.profile;

  return (
    <>
      {matchAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-accent text-background px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <Heart className="w-5 h-5" />
          <span className="font-semibold">Match mit {matchAlert}!</span>
        </div>
      )}

      <div className="max-w-md mx-auto">
        {/* Card counter */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-text-secondary">
            {currentIndex + 1} von {cards.length}
          </span>
          <div className="flex gap-1">
            {cards.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-accent' : i < currentIndex ? 'bg-accent/30' : 'bg-surface-2'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Profile Card */}
        <Card className="overflow-hidden animate-fade-in">
          <div className="h-64 bg-gradient-to-br from-surface-2 to-surface flex items-center justify-center relative">
            {p.profile_image_url ? (
              <img src={p.profile_image_url} alt={p.first_name || ''} className="w-full h-full object-cover" />
            ) : (
              <div className="w-24 h-24 bg-accent-muted rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-accent">{p.first_name?.charAt(0) || '?'}</span>
              </div>
            )}
            {p.verification_status === 'verified' && (
              <div className="absolute top-3 right-3">
                <Badge variant="success" className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Verifiziert
                </Badge>
              </div>
            )}
            {/* Compatibility badge */}
            <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border">
              <span className="text-lg font-bold text-accent">{current.compatibilityScore}%</span>
              <span className="text-xs text-text-secondary ml-1">Match</span>
            </div>
          </div>

          <CardContent className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                {p.first_name}, {p.age}
              </h3>
              {p.city && (
                <div className="flex items-center gap-1 text-sm text-text-secondary mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {p.city}
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4">
              {p.relationship_goal && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Target className="w-4 h-4 text-accent/60" />
                  {GOAL_LABELS[p.relationship_goal] || p.relationship_goal}
                </div>
              )}
              {p.children_wish && (
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Baby className="w-4 h-4 text-accent/60" />
                  Kinderwunsch: {CHILDREN_LABELS[p.children_wish] || p.children_wish}
                </div>
              )}
            </div>

            {p.bio && (
              <p className="text-sm text-text-secondary mb-6 line-clamp-3">{p.bio}</p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border border-border text-text-secondary hover:text-error hover:border-error/50 transition-colors font-medium text-sm disabled:opacity-50"
              >
                <X className="w-5 h-5" />
                Nicht passend
              </button>
              <button
                onClick={handleLike}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-background hover:bg-accent-hover transition-colors font-semibold text-sm disabled:opacity-50"
              >
                <Heart className="w-5 h-5" />
                Interesse
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
