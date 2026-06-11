'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Profile, BusinessVerification } from '@/types';
import { Shield, Ban, CheckCircle, XCircle, Eye, Search } from 'lucide-react';

interface Props {
  profiles: Profile[];
  verifications: BusinessVerification[];
}

export function AdminUserList({ profiles, verifications }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'banned'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const verificationMap = new Map(verifications.map((v) => [v.profile_id, v]));

  const filtered = profiles.filter((p) => {
    const matchesSearch =
      !search ||
      p.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.city?.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && p.verification_status === 'pending') ||
      (filter === 'verified' && p.verification_status === 'verified') ||
      (filter === 'banned' && p.is_banned);

    return matchesSearch && matchesFilter;
  });

  async function updateVerification(profileId: string, status: 'verified' | 'rejected') {
    const supabase = createClient();

    await supabase
      .from('profiles')
      .update({ verification_status: status })
      .eq('id', profileId);

    const verification = verificationMap.get(profileId);
    if (verification) {
      await supabase
        .from('business_verifications')
        .update({ status })
        .eq('profile_id', profileId);
    }

    router.refresh();
  }

  async function toggleBan(profileId: string, currentlyBanned: boolean) {
    const supabase = createClient();
    await supabase
      .from('profiles')
      .update({ is_banned: !currentlyBanned })
      .eq('id', profileId);
    router.refresh();
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge variant="success">Verifiziert</Badge>;
      case 'rejected': return <Badge variant="danger">Abgelehnt</Badge>;
      default: return <Badge variant="warning">Ausstehend</Badge>;
    }
  };

  const ACCOUNT_LABELS: Record<string, string> = {
    entrepreneur: 'Unternehmer',
    self_employed: 'Selbstständig',
    ceo: 'Geschäftsführer',
    investor: 'Investor',
    ambitious_woman: 'Ambitioniert',
    businesswoman: 'Unternehmerin',
    career_woman: 'Karrierefrau',
    student: 'Studentin',
    family_oriented: 'Familienorientiert',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-zinc-900">Alle Nutzer ({profiles.length})</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Suche..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="px-3 py-2 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Alle</option>
              <option value="pending">Ausstehend</option>
              <option value="verified">Verifiziert</option>
              <option value="banned">Gesperrt</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {filtered.map((profile) => {
            const verification = verificationMap.get(profile.id);
            const isExpanded = expandedId === profile.id;

            return (
              <div
                key={profile.id}
                className={`border rounded-xl p-4 transition-colors ${
                  profile.is_banned ? 'border-red-200 bg-red-50/50' : 'border-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-amber-700">
                        {profile.first_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-zinc-900 text-sm">
                          {profile.first_name || 'Unbekannt'}
                        </span>
                        {profile.age && <span className="text-xs text-zinc-400">{profile.age} Jahre</span>}
                        {profile.account_type && (
                          <Badge variant="default" className="text-[10px]">
                            {ACCOUNT_LABELS[profile.account_type] || profile.account_type}
                          </Badge>
                        )}
                        {profile.is_banned && <Badge variant="danger">Gesperrt</Badge>}
                        {profile.plan !== 'basic' && <Badge variant="premium">{profile.plan}</Badge>}
                      </div>
                      <div className="text-xs text-zinc-500 truncate">{profile.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge(profile.verification_status)}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : profile.id)}
                      className="text-zinc-400 hover:text-zinc-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-zinc-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                      <div>
                        <span className="text-zinc-400">Stadt:</span>{' '}
                        <span className="text-zinc-700">{profile.city || '-'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Geschlecht:</span>{' '}
                        <span className="text-zinc-700">{profile.gender || '-'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Ziel:</span>{' '}
                        <span className="text-zinc-700">{profile.relationship_goal || '-'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400">Onboarding:</span>{' '}
                        <span className="text-zinc-700">{profile.onboarding_completed ? 'Ja' : 'Nein'}</span>
                      </div>
                    </div>

                    {profile.bio && (
                      <p className="text-sm text-zinc-600 mb-4">{profile.bio}</p>
                    )}

                    {verification && (
                      <div className="bg-zinc-50 rounded-lg p-3 mb-4">
                        <h4 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Business-Verifizierung</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {verification.company_name && <div><span className="text-zinc-400">Firma:</span> {verification.company_name}</div>}
                          {verification.website && <div><span className="text-zinc-400">Website:</span> {verification.website}</div>}
                          {verification.linkedin && <div><span className="text-zinc-400">LinkedIn:</span> {verification.linkedin}</div>}
                          {verification.revenue_range && <div><span className="text-zinc-400">Umsatz:</span> {verification.revenue_range}</div>}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {profile.verification_status !== 'verified' && (
                        <Button size="sm" onClick={() => updateVerification(profile.id, 'verified')}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Verifizieren
                        </Button>
                      )}
                      {profile.verification_status !== 'rejected' && (
                        <Button size="sm" variant="outline" onClick={() => updateVerification(profile.id, 'rejected')}>
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Ablehnen
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={profile.is_banned ? 'secondary' : 'danger'}
                        onClick={() => toggleBan(profile.id, profile.is_banned)}
                      >
                        <Ban className="w-3.5 h-3.5 mr-1" />
                        {profile.is_banned ? 'Entsperren' : 'Sperren'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-zinc-500 text-sm">
              Keine Nutzer gefunden.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
