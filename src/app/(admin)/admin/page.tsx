import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminUserList } from '@/components/admin/admin-user-list';
import { Users, Shield, Heart, Crown, Clock, UserCheck, TrendingUp, MessageCircle, BarChart3, Zap } from 'lucide-react';

export default async function AdminPage() {
  const supabase = await createClient();

  // Basic stats
  const [
    { count: totalUsers },
    { count: entrepreneurs },
    { count: women },
    { count: totalMatches },
    { count: premiumUsers },
    { count: pendingVerifications },
    { count: conciergeApps },
    { count: totalLikes },
    { count: totalMessages },
    { count: founderPassUsers },
    { count: eliteUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .in('account_type', ['entrepreneur', 'self_employed', 'ceo', 'investor']),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('gender', 'female'),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'premium'),
    supabase.from('business_verifications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('concierge_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('likes').select('*', { count: 'exact', head: true }),
    supabase.from('messages').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'founder_pass'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'elite'),
  ]);

  // Analytics event counts
  const { data: eventCounts } = await supabase
    .from('analytics_events')
    .select('event_name')
    .order('created_at', { ascending: false })
    .limit(1000);

  const eventMap = new Map<string, number>();
  eventCounts?.forEach((e) => {
    eventMap.set(e.event_name, (eventMap.get(e.event_name) || 0) + 1);
  });

  // Active users (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: activeUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gte('last_active_at', sevenDaysAgo);

  // Calculate conversion rates
  const total = totalUsers || 1;
  const founderPassRate = ((founderPassUsers || 0) / total * 100).toFixed(1);
  const premiumRate = ((premiumUsers || 0) / total * 100).toFixed(1);
  const eliteRate = ((eliteUsers || 0) / total * 100).toFixed(1);

  // Avg likes per user
  const avgLikes = totalUsers ? ((totalLikes || 0) / totalUsers).toFixed(1) : '0';
  const avgMatches = totalUsers ? ((totalMatches || 0) / totalUsers).toFixed(1) : '0';
  const activityRate = totalUsers ? ((activeUsers || 0) / totalUsers * 100).toFixed(0) : '0';

  const stats = [
    { label: 'Nutzer gesamt', value: totalUsers || 0, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Unternehmer', value: entrepreneurs || 0, icon: Crown, color: 'text-amber-600 bg-amber-50' },
    { label: 'Frauen', value: women || 0, icon: UserCheck, color: 'text-pink-600 bg-pink-50' },
    { label: 'Matches', value: totalMatches || 0, icon: Heart, color: 'text-red-600 bg-red-50' },
    { label: 'Aktiv (7T)', value: activeUsers || 0, icon: Zap, color: 'text-green-600 bg-green-50' },
    { label: 'Offene Verif.', value: pendingVerifications || 0, icon: Clock, color: 'text-orange-600 bg-orange-50' },
  ];

  const revenueStats = [
    { label: 'Founder Pass', value: founderPassUsers || 0, rate: `${founderPassRate}%`, revenue: `${(founderPassUsers || 0) * 29} €` },
    { label: 'Premium', value: premiumUsers || 0, rate: `${premiumRate}%`, revenue: `${(premiumUsers || 0) * 79} €/m` },
    { label: 'Elite', value: eliteUsers || 0, rate: `${eliteRate}%`, revenue: `${(eliteUsers || 0) * 199} €/m` },
    { label: 'Concierge Bew.', value: conciergeApps || 0, rate: '-', revenue: '-' },
  ];

  const engagementStats = [
    { label: 'Likes gesamt', value: totalLikes || 0 },
    { label: 'Nachrichten', value: totalMessages || 0 },
    { label: 'Ø Likes/Nutzer', value: avgLikes },
    { label: 'Ø Matches/Nutzer', value: avgMatches },
    { label: 'Aktivitätsrate', value: `${activityRate}%` },
    { label: 'Paywall Views', value: eventMap.get('paywall_viewed') || 0 },
  ];

  // Get all users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: verifications } = await supabase
    .from('business_verifications')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: conciergeApplications } = await supabase
    .from('concierge_applications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Admin Dashboard</h1>

      {/* Core Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4 text-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-zinc-900">{stat.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue & Conversion */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-zinc-900">Umsatz & Conversion</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revenueStats.map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-zinc-900">{s.label}</span>
                    <span className="text-xs text-zinc-400 ml-2">({s.value} Nutzer)</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-zinc-900">{s.revenue}</div>
                    <div className="text-xs text-zinc-400">Conv. {s.rate}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              <h2 className="font-semibold text-zinc-900">Engagement</h2>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {engagementStats.map((s) => (
                <div key={s.label} className="text-center p-3 bg-zinc-50 rounded-xl">
                  <div className="text-lg font-bold text-zinc-900">{s.value}</div>
                  <div className="text-xs text-zinc-500">{s.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Paywall Triggers */}
      {eventMap.size > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="font-semibold text-zinc-900">Top Events (letzte 1000)</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Array.from(eventMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([name, count]) => (
                  <Badge key={name} variant="default" className="text-xs">
                    {name}: {count}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Concierge */}
      {conciergeApplications && conciergeApplications.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="font-semibold text-zinc-900">Concierge-Bewerbungen ({conciergeApplications.length})</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conciergeApplications.map((app) => (
                <div key={app.id} className="border border-zinc-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-900">Profil: {app.profile_id.slice(0, 8)}...</span>
                    <Badge variant="warning">Ausstehend</Badge>
                  </div>
                  {app.motivation && <p className="text-sm text-zinc-600 mb-1"><strong>Motivation:</strong> {app.motivation}</p>}
                  {app.expectations && <p className="text-sm text-zinc-600"><strong>Erwartungen:</strong> {app.expectations}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users list */}
      <AdminUserList
        profiles={profiles || []}
        verifications={verifications || []}
      />
    </div>
  );
}
