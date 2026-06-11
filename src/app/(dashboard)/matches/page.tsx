import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, MapPin, Shield } from 'lucide-react';

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .or(`profile_a.eq.${user.id},profile_b.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageCircle className="w-8 h-8 text-text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Noch keine Matches</h2>
        <p className="text-text-secondary text-sm mb-6">
          Zeige Interesse an Profilen — wenn es gegenseitig ist, entsteht ein Match.
        </p>
        <Link
          href="/dashboard/discover"
          className="inline-flex items-center gap-2 bg-accent text-background px-6 py-3 rounded-xl text-sm font-semibold hover:bg-accent-hover transition-colors"
        >
          Vorschläge ansehen
        </Link>
      </div>
    );
  }

  const partnerIds = matches.map((m) => m.profile_a === user.id ? m.profile_b : m.profile_a);
  const { data: partners } = await supabase
    .from('profiles')
    .select('id, first_name, age, city, profile_image_url, verification_status')
    .in('id', partnerIds);

  const partnerMap = new Map(partners?.map((p) => [p.id, p]) || []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>Deine Matches</h1>
        <p className="text-text-secondary text-sm">{matches.length} Match{matches.length !== 1 ? 'es' : ''}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => {
          const partnerId = match.profile_a === user.id ? match.profile_b : match.profile_a;
          const partner = partnerMap.get(partnerId);
          if (!partner) return null;
          return (
            <Link key={match.id} href={`/chat/${match.id}`}>
              <Card className="hover:border-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-accent-muted rounded-full flex items-center justify-center shrink-0">
                    {partner.profile_image_url ? (
                      <img src={partner.profile_image_url} alt={partner.first_name || ''} className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-accent">{partner.first_name?.charAt(0) || '?'}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{partner.first_name}, {partner.age}</h3>
                      {partner.verification_status === 'verified' && (
                        <Shield className="w-3.5 h-3.5 text-accent shrink-0" />
                      )}
                    </div>
                    {partner.city && (
                      <div className="flex items-center gap-1 text-xs text-text-secondary mt-0.5">
                        <MapPin className="w-3 h-3" />{partner.city}
                      </div>
                    )}
                  </div>
                  <MessageCircle className="w-5 h-5 text-accent" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
