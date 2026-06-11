'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Save } from 'lucide-react';

interface Preferences {
  likes_enabled: boolean;
  matches_enabled: boolean;
  messages_enabled: boolean;
  offers_enabled: boolean;
  insights_enabled: boolean;
  concierge_enabled: boolean;
  marketing_enabled: boolean;
}

interface Props {
  preferences: Preferences;
}

const PREF_ITEMS: { key: keyof Preferences; label: string; description: string }[] = [
  { key: 'likes_enabled', label: 'Likes', description: 'Wenn jemand Interesse an dir zeigt' },
  { key: 'matches_enabled', label: 'Matches', description: 'Wenn ein neues Match entsteht' },
  { key: 'messages_enabled', label: 'Nachrichten', description: 'Wenn du eine neue Nachricht erhältst' },
  { key: 'offers_enabled', label: 'Angebote', description: 'Premium-Angebote und Aktionen' },
  { key: 'insights_enabled', label: 'Insights', description: 'Kompatibilitätsreports und Profilbesucher' },
  { key: 'concierge_enabled', label: 'Concierge', description: 'Persönliche Matchmaking-Hinweise' },
  { key: 'marketing_enabled', label: 'Marketing', description: 'Neuigkeiten und allgemeine Updates' },
];

export function NotificationSettings({ preferences }: Props) {
  const [prefs, setPrefs] = useState<Preferences>(preferences);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from('notification_preferences')
        .upsert({ user_id: user.id, ...prefs });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
    router.refresh();
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-amber-600" />
          <h2 className="font-semibold text-zinc-900">Benachrichtigungs-Einstellungen</h2>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {PREF_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3 border-b border-zinc-100 last:border-0"
            >
              <div>
                <div className="text-sm font-medium text-zinc-900">{item.label}</div>
                <div className="text-xs text-zinc-500">{item.description}</div>
              </div>
              <button
                onClick={() => setPrefs((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  prefs[item.key] ? 'bg-amber-500' : 'bg-zinc-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    prefs[item.key] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Speichern...' : saved ? 'Gespeichert!' : 'Einstellungen speichern'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
