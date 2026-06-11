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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');
  if (!profile.onboarding_completed) redirect('/onboarding');

  // Profile completeness
  const fields = [
    profile.first_name, profile.age, profile.city, profile.gender,
    profile.seeking_gender, profile.relationship_goal, profile.children_wish,
    profile.career_focus, profile.family_orientation, profile.bio,
  ];
  const completeness = Math.round((fields.filter(Boolean).length / fields.length) * 100);

  // Get matches count
  const { count: matchCount } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`profile_a.eq.${user.id},profile_b.eq.${user.id}`);

  // Get pending likes count
  const { count: likesCount } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('to_profile_id', user.id);

  const verificationLabel: Record<string, { text: string; variant: 'success' | 'warning' | 'danger' }> = {
    verified: { text: 'Verifiziert', variant: 'success' },
    pending: { text: 'Prüfung läuft', variant: 'warning' },
    rejected: { text: 'Abgelehnt', variant: 'danger' },
  };

  const vStatus = verificationLabel[profile.verification_status] || verificationLabel.pending;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">
          Willkommen zurück, {profile.first_name || 'Mitglied'}
        </h1>
        <p className="text-zinc-500">Hier ist dein Überblick.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="flex flex-col items-center text-center py-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-zinc-900">{completeness}%</div>
            <div className="text-xs text-zinc-500 mt-1">Profil komplett</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center text-center py-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <Badge variant={vStatus.variant}>{vStatus.text}</Badge>
            <div className="text-xs text-zinc-500 mt-2">Verifizierung</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center text-center py-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
              <Heart className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-zinc-900">{likesCount || 0}</div>
            <div className="text-xs text-zinc-500 mt-1">Interesse erhalten</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center text-center py-6">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-zinc-900">{matchCount || 0}</div>
            <div className="text-xs text-zinc-500 mt-1">Matches</div>
          </CardContent>
        </Card>
      </div>

      {/* Info box */}
      <Card className="mb-8">
        <CardContent className="flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900 mb-1">Kuratierte Vorschläge</h3>
            <p className="text-sm text-zinc-500">
              FounderMatch zeigt dir bewusst nur wenige hochwertige Vorschläge statt endloser Profile.
              Qualität vor Quantität – wie bei allem, was du tust.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href="/dashboard/discover">
          <Card className="hover:border-amber-300 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Vorschläge ansehen</h3>
                  <p className="text-xs text-zinc-500">Deine kuratierten Matches</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-400" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/matches">
          <Card className="hover:border-amber-300 transition-colors cursor-pointer">
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900">Deine Matches</h3>
                  <p className="text-xs text-zinc-500">{matchCount || 0} aktive Matches</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-400" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
