'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Crown, Star, Sparkles, ArrowRight, Users, BookOpen, UserCheck, Camera, Zap } from 'lucide-react';

async function startCheckout(productKey: string) {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productKey }),
  });
  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  } else {
    alert(data.error || 'Checkout konnte nicht gestartet werden. Bitte versuche es erneut.');
  }
}

const TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 'Kostenlos',
    icon: Star,
    features: ['Profil erstellen', '3 Vorschläge / Woche', 'Interesse zeigen (begrenzt)', 'Chat mit Matches (antworten)'],
  },
  {
    id: 'app_premium',
    name: 'Premium',
    price: '79 €/Monat',
    trial: '3 Tage kostenlos',
    popular: true,
    icon: Crown,
    features: ['20 Vorschläge / Woche', 'Sehen, wer Interesse zeigt', 'Erweiterte Filter', 'Höhere Sichtbarkeit', 'Chat initiieren', 'Jederzeit kündbar'],
  },
  {
    id: 'app_elite',
    name: 'Elite',
    price: '199 €/Monat',
    icon: Sparkles,
    features: ['Alles aus Premium', 'Priorisierte Ausspielung', 'Profilanalyse', 'Exklusive Mitglieder', 'Concierge-Vorbereitung'],
  },
];

const PRODUCTS = [
  {
    id: 'community_monthly',
    name: 'Inner Circle Community',
    price: '49 €/Monat',
    icon: Users,
    desc: 'Geschlossene Community für ambitionierte Männer. Austausch, Accountability, Live-Calls.',
    tag: 'Community',
  },
  {
    id: 'signature_course',
    name: 'Signature-Programm',
    price: '499 €',
    icon: BookOpen,
    desc: 'Komplett-Kurs: Profil-Optimierung, Mindset, Dating-Strategie. Sofort verfügbar.',
    tag: 'Kurs',
  },
  {
    id: 'coaching_session',
    name: '1:1 Coaching Session',
    price: '399 €',
    icon: UserCheck,
    desc: 'Persönliches Coaching mit unserem Experten. 60 Minuten, 1:1.',
    tag: 'Coaching',
  },
  {
    id: 'profile_dfy',
    name: 'Profil Done-For-You',
    price: '290 €',
    icon: Zap,
    desc: 'Wir optimieren dein komplettes Profil professionell.',
    tag: 'Service',
  },
  {
    id: 'photoshoot',
    name: 'Profi-Fotoshooting',
    price: 'ab 490 €',
    icon: Camera,
    desc: 'Vermittlung an professionelle Fotografen in deiner Stadt.',
    tag: 'Service',
  },
];

export default function PricingPage() {
  const [showConcierge, setShowConcierge] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [expectations, setExpectations] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleConciergeApply() {
    setSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('concierge_applications').insert({
        profile_id: user.id,
        motivation,
        expectations,
      });
    }
    setSubmitted(true);
    setSubmitting(false);
  }

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          Wähle deinen Plan
        </h1>
        <p className="text-text-secondary">Investiere in dein Liebesleben wie in dein Business.</p>
      </div>

      {/* App Tiers */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
        {TIERS.map((tier) => (
          <Card key={tier.id} className={tier.popular ? 'ring-1 ring-accent relative' : ''}>
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="premium">Beliebt</Badge>
              </div>
            )}
            <CardContent className="p-8">
              <div className="w-12 h-12 bg-accent-muted rounded-xl flex items-center justify-center mb-4">
                <tier.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1">{tier.name}</h3>
              <div className="text-3xl font-bold text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                {tier.price}
              </div>
              {tier.trial && <div className="text-xs text-accent mb-4">{tier.trial}</div>}
              {!tier.trial && <div className="mb-4" />}
              <ul className="space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={tier.popular ? 'primary' : 'outline'}
                className="w-full"
                onClick={() => tier.id !== 'basic' && startCheckout(tier.id)}
              >
                {tier.id === 'basic' ? 'Aktueller Plan' : tier.trial ? 'Kostenlos testen' : 'Upgrade'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Products */}
      <div className="max-w-5xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: 'var(--font-display)' }}>
          Mehr Möglichkeiten
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRODUCTS.map((product) => (
            <Card key={product.id} className="hover:border-accent/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 bg-accent-muted rounded-xl flex items-center justify-center">
                    <product.icon className="w-5 h-5 text-accent" />
                  </div>
                  <Badge variant="default">{product.tag}</Badge>
                </div>
                <h3 className="font-semibold text-foreground mb-1">{product.name}</h3>
                <div className="text-lg font-bold text-accent mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {product.price}
                </div>
                <p className="text-xs text-text-secondary mb-4">{product.desc}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={() => startCheckout(product.id)}>
                  Jetzt buchen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transformation Bundle */}
      <Card className="max-w-3xl mx-auto mb-16 border-accent/30">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-accent-muted rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Transformation Intensive</h3>
              <p className="text-text-secondary text-sm">Alles in einem Paket</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-accent mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            1.997 € <span className="text-sm text-text-secondary font-normal">einmalig</span>
          </div>
          <ul className="space-y-2 mb-6">
            {['Premium-Mitgliedschaft (12 Monate)', 'Inner Circle Community', 'Signature-Programm (Kurs)', '3x 1:1 Coaching Sessions', 'Profil Done-For-You'].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 text-accent shrink-0" />{f}
              </li>
            ))}
          </ul>
          <Button className="w-full" size="lg" onClick={() => startCheckout('transformation_bundle')}>
            Jetzt starten
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Concierge */}
      <Card className="max-w-3xl mx-auto bg-surface-2 border-accent/20">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-accent-muted rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Concierge Matching</h3>
              <p className="text-text-secondary text-sm">ab 2.500 €/Monat • Auf Bewerbung</p>
            </div>
          </div>
          <ul className="space-y-2 mb-6">
            {['Persönliche Match-Vorschläge durch unseren Matchmaker', 'Manuelle Vorauswahl nach deinen Kriterien', 'Persönliche Einführung', 'Exklusiver Zugang zu nicht-öffentlichen Profilen'].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                <CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />{f}
              </li>
            ))}
          </ul>

          {!showConcierge && !submitted && (
            <Button onClick={() => setShowConcierge(true)}>
              Jetzt bewerben <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {showConcierge && !submitted && (
            <div className="space-y-4 mt-4 pt-4 border-t border-border">
              <Textarea id="motivation" label="Motivation" value={motivation} onChange={(e) => setMotivation(e.target.value)} placeholder="Warum interessierst du dich für Concierge?" />
              <Textarea id="expectations" label="Erwartungen" value={expectations} onChange={(e) => setExpectations(e.target.value)} placeholder="Was ist dir bei einem Partner wichtig?" />
              <Button onClick={handleConciergeApply} disabled={submitting}>
                {submitting ? 'Wird gesendet...' : 'Bewerbung absenden'}
              </Button>
            </div>
          )}

          {submitted && (
            <div className="bg-success/10 border border-success/20 rounded-xl p-4 mt-4">
              <p className="text-success text-sm font-medium">
                Bewerbung eingegangen! Wir melden uns innerhalb von 48 Stunden.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DSGVO: Cancellation button */}
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <p className="text-xs text-text-secondary">
          Alle Preise inkl. MwSt. • Kündigung jederzeit im Profil • Keine versteckten Kosten
        </p>
      </div>
    </div>
  );
}
