import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Shield, Users, ArrowRight, CheckCircle, Clock } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/login');
  if (!profile.onboarding_completed) redirect('/onboarding');

  const fields = [
    profile.first_name, profile.age, profile.city, profile.gender,
    profile.seeking_gender, profile.relationship_goal, profile.children_wish,
    profile.career_focus, profile.family_orientation, profile.bio,
  ];
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  const { count: matchCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`profile_a.eq.${user.id},profile_b.eq.${user.id}`);

  const { count: likesCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('to_profile_id', user.id);

  const vStatusMap: Record<string, { text: string; variant: 'success' | 'warning' | 'danger' }> = {
    verified: { text: 'Verifiziert', variant: 'success' },
    pending: { text: 'Prüfung läuft', variant: 'warning' },
    rejected: { text: 'Abgelehnt', variant: 'danger' },
  };
  const vStatus = vStatusMap[profile.verification_status] || { text: 'Ausstehend', variant: 'warning' as const };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Willkommen zurück, {profile.first_name || 'Mitglied'}
        </h1>
        <p className="text-text-secondary">Hier ist dein Überblick.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: CheckCircle, label: 'Profil komplett', value: `${completeness}%`, color: 'text-accent bg-accent-muted' },
          { icon: Shield, label: 'Verifizierung', value: vStatus.text, isBadge: true, badgeVariant: vStatus.variant, color: 'text-accent bg-accent-muted' },
          { icon: Heart, label: 'Interesse erhalten', value: likesCount || 0, color: 'text-accent bg-accent-muted' },
          { icon: Users, label: 'Matches', value: matchCount || 0, color: 'text-accent bg-accent-muted' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col items-center text-center py-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.isBadge ? (
                <Badge variant={stat.badgeVariant}>{stat.value}</Badge>
              ) : (
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              )}
              <div className="text-xs text-text-secondary mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8">
        <CardContent className="flex items-start gap-4">
          <div className="w-10 h-10 bg-accent-muted rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Kuratierte Vorschläge</h3>
            <p className="text-sm text-text-secondary">
              FounderMatch zeigt dir bewusst nur wenige hochwertige Vorschläge statt endloser Profile.
              Qualität vor Quantität — wie bei allem, was du tust.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/dashboard/discover">
          <Card className="hover:border-accent/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-muted rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Vorschläge ansehen</h3>
                  <p className="text-xs text-text-secondary">Deine kuratierten Matches</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-secondary" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/matches">
          <Card className="hover:border-accent/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-muted rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Deine Matches</h3>
                  <p className="text-xs text-text-secondary">{matchCount || 0} aktive Matches</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-text-secondary" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
