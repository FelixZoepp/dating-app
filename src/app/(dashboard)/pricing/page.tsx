'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Crown, Star, Sparkles, ArrowRight } from 'lucide-react';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'Kostenlos',
    priceNum: 0,
    icon: Star,
    features: [
      'Profil erstellen',
      '3 kuratierte Vorschläge pro Woche',
      'Interesse zeigen (begrenzt)',
      'Chat mit Matches',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '79 €/Monat',
    priceNum: 79,
    popular: true,
    icon: Crown,
    features: [
      '20 kuratierte Vorschläge pro Woche',
      'Sehen, wer Interesse gezeigt hat',
      'Erweiterte Filter',
      'Höhere Sichtbarkeit',
      'Chat mit Matches',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '199 €/Monat',
    priceNum: 199,
    icon: Sparkles,
    features: [
      'Alles aus Premium',
      'Priorisierte Ausspielung',
      'Profilanalyse',
      'Zugriff auf exklusive Mitglieder',
      'Vorbereitung für Concierge-Matching',
    ],
  },
];

export default function PricingPage() {
  const [showConcierge, setShowConcierge] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [budget, setBudget] = useState('');
  const [expectations, setExpectations] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  async function handleUpgrade(planId: string) {
    // Placeholder for Stripe Checkout
    alert(`Stripe Checkout wird für "${planId}" vorbereitet. Integration kommt bald.`);
  }

  async function handleConciergeApply() {
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('concierge_applications').insert({
        profile_id: user.id,
        motivation,
        budget,
        expectations,
      });
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Wähle deinen Plan</h1>
        <p className="text-zinc-500">Investiere in dein Liebesleben wie in dein Business.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={plan.popular ? 'ring-2 ring-amber-500 relative' : ''}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="premium">Beliebt</Badge>
              </div>
            )}
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                <plan.icon className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-1">{plan.name}</h3>
              <div className="text-3xl font-bold text-zinc-900 mb-6">{plan.price}</div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-600">
                    <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full"
                onClick={() => handleUpgrade(plan.id)}
              >
                {plan.id === 'basic' ? 'Aktueller Plan' : 'Upgrade'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Concierge */}
      <Card className="max-w-3xl mx-auto bg-gradient-to-br from-zinc-900 to-zinc-800 text-white border-amber-500/30">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Concierge Matching</h3>
              <p className="text-zinc-400 text-sm">999 €/Monat • Auf Bewerbung</p>
            </div>
          </div>

          <ul className="space-y-2 mb-6">
            {[
              'Persönliche Match-Vorschläge durch unseren Matchmaker',
              'Manuelle Vorauswahl nach deinen Kriterien',
              'Persönliche Einführung zwischen dir und deinem Match',
              'Exklusiver Zugang zu nicht-öffentlichen Profilen',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                <CheckCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          {!showConcierge && !submitted && (
            <Button variant="primary" onClick={() => setShowConcierge(true)}>
              Jetzt bewerben
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {showConcierge && !submitted && (
            <div className="space-y-4 mt-4 pt-4 border-t border-zinc-700">
              <Textarea
                id="motivation"
                label="Warum möchtest du das Concierge-Matching?"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Erzähl uns von deinen Erwartungen..."
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500"
              />
              <Textarea
                id="expectations"
                label="Was ist dir bei einem Partner besonders wichtig?"
                value={expectations}
                onChange={(e) => setExpectations(e.target.value)}
                placeholder="Deine wichtigsten Kriterien..."
                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500"
              />
              <Button onClick={handleConciergeApply} disabled={submitting}>
                {submitting ? 'Wird gesendet...' : 'Bewerbung absenden'}
              </Button>
            </div>
          )}

          {submitted && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 mt-4">
              <p className="text-emerald-300 text-sm font-medium">
                Bewerbung eingegangen! Wir melden uns innerhalb von 48 Stunden bei dir.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
