'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Profile, Values } from '@/types';
import { Save, Shield } from 'lucide-react';

interface Props {
  profile: Profile;
  values: Values | null;
}

export function ProfileEditor({ profile, values }: Props) {
  const [firstName, setFirstName] = useState(profile.first_name || '');
  const [city, setCity] = useState(profile.city || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [lifeIn5Years, setLifeIn5Years] = useState(profile.life_in_5_years || '');
  const [lookingFor, setLookingFor] = useState(profile.looking_for || '');
  const [uniqueTrait, setUniqueTrait] = useState(profile.unique_trait || '');
  const [relationshipGoal, setRelationshipGoal] = useState(profile.relationship_goal || '');
  const [childrenWish, setChildrenWish] = useState(profile.children_wish || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);
    const supabase = createClient();

    await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        city,
        bio,
        life_in_5_years: lifeIn5Years,
        looking_for: lookingFor,
        unique_trait: uniqueTrait,
        relationship_goal: relationshipGoal,
        children_wish: childrenWish,
      })
      .eq('id', profile.id);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setLoading(false);
    router.refresh();
  }

  const vStatus = {
    verified: { text: 'Verifiziert', variant: 'success' as const },
    pending: { text: 'Prüfung läuft', variant: 'warning' as const },
    rejected: { text: 'Abgelehnt', variant: 'danger' as const },
  }[profile.verification_status] || { text: 'Ausstehend', variant: 'warning' as const };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Status */}
      <Card>
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-zinc-400" />
            <span className="text-sm text-zinc-600">Verifizierungsstatus</span>
          </div>
          <Badge variant={vStatus.variant}>{vStatus.text}</Badge>
        </CardContent>
      </Card>

      {/* Basic info */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-zinc-900">Grunddaten</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input id="firstName" label="Vorname" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input id="city" label="Stadt" value={city} onChange={(e) => setCity(e.target.value)} />
          <Select
            id="relationshipGoal"
            label="Beziehungsziel"
            value={relationshipGoal}
            onChange={(e) => setRelationshipGoal(e.target.value)}
            placeholder="Bitte wählen"
            options={[
              { value: 'serious', label: 'Ernsthafte Beziehung' },
              { value: 'marriage', label: 'Ehe' },
              { value: 'family', label: 'Familie gründen' },
              { value: 'open', label: 'Offen' },
            ]}
          />
          <Select
            id="childrenWish"
            label="Kinderwunsch"
            value={childrenWish}
            onChange={(e) => setChildrenWish(e.target.value)}
            placeholder="Bitte wählen"
            options={[
              { value: 'yes', label: 'Ja' },
              { value: 'no', label: 'Nein' },
              { value: 'maybe', label: 'Vielleicht' },
              { value: 'already_have', label: 'Bereits Kinder' },
            ]}
          />
        </CardContent>
      </Card>

      {/* Texts */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-zinc-900">Über mich</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea id="bio" label="Kurzbeschreibung" value={bio} onChange={(e) => setBio(e.target.value)} />
          <Textarea id="lifeIn5Years" label="Mein Leben in 5 Jahren" value={lifeIn5Years} onChange={(e) => setLifeIn5Years(e.target.value)} />
          <Textarea id="lookingFor" label="Was ich suche" value={lookingFor} onChange={(e) => setLookingFor(e.target.value)} />
          <Textarea id="uniqueTrait" label="Was mich besonders macht" value={uniqueTrait} onChange={(e) => setUniqueTrait(e.target.value)} />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={loading} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {loading ? 'Speichern...' : saved ? 'Gespeichert!' : 'Änderungen speichern'}
        </Button>
      </div>
    </div>
  );
}
