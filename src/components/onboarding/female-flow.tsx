'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { calculateScores, type QuizAnswers } from '@/lib/score';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Shield, Heart, CheckCircle, Users, Sparkles } from 'lucide-react';

const STEPS = [
  'relationship_goal',
  'partner_values',
  'family_timeline',
  'lifestyle',
  'partner_qualities',
  'safety_promise',
  'consent',
  'premium_invite',
];

interface Props {
  name: string;
  userId: string | null;
}

export function FemaleOnboarding({ name, userId }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [answers, setAnswers] = useState<QuizAnswers>({
    gender: 'female',
    relationshipGoal: '',
    partnerValues: [],
    familyTimeline: '',
    lifestylePreference: '',
    partnerQualities: '',
  });

  const [consentTerms, setConsentTerms] = useState(false);
  const [consentSpecialData, setConsentSpecialData] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  function next() { setStep(step + 1); }
  function prev() { if (step > 0) setStep(step - 1); }

  function toggleValue(val: string) {
    setAnswers((prev) => ({
      ...prev,
      partnerValues: prev.partnerValues?.includes(val)
        ? prev.partnerValues.filter((v) => v !== val)
        : [...(prev.partnerValues || []), val],
    }));
  }

  async function handleComplete() {
    if (!userId) return;
    setLoading(true);

    const scores = calculateScores(answers);
    const supabase = createClient();

    await supabase
      .from('profiles')
      .update({
        first_name: name,
        gender: 'female',
        relationship_goal: answers.relationshipGoal || null,
        account_type: 'ambitious_woman',
        onboarding_completed: true,
        score_ambition: scores.ambition,
        score_family: scores.family,
        score_lifestyle: scores.lifestyle,
        score_readiness: scores.readiness,
        score_total: scores.total,
        score_potential: scores.potential,
      })
      .eq('id', userId);

    // Record consents
    for (const consent of [
      { type: 'terms', granted: consentTerms },
      { type: 'special_data', granted: consentSpecialData },
      { type: 'marketing', granted: consentMarketing },
    ]) {
      await supabase.from('consents').insert({
        user_id: userId,
        type: consent.type,
        granted: consent.granted,
        version: '1.0',
      });
    }

    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_name: 'onboarding_completed',
      metadata: { gender: 'female', score: scores.total },
    });

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold tracking-tight">
              <span className="text-foreground">Founder</span>
              <span className="text-accent">Match</span>
            </span>
            <span className="text-sm text-text-secondary">{step + 1} / {STEPS.length}</span>
          </div>
          <ProgressBar value={progress} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 animate-fade-in">

        {/* Relationship Goal */}
        {currentStep === 'relationship_goal' && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Was suchst du, {name}?
            </h2>
            <p className="text-text-secondary mb-8">Wir finden Männer, die dasselbe Ziel haben.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'serious', label: 'Ernsthafte Beziehung' },
                { value: 'marriage', label: 'Ehe' },
                { value: 'family', label: 'Familie gründen' },
                { value: 'open', label: 'Bin offen' },
              ].map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  selected={answers.relationshipGoal === opt.value}
                  onClick={() => setAnswers((p) => ({ ...p, relationshipGoal: opt.value }))}
                />
              ))}
            </div>
          </div>
        )}

        {/* Partner Values */}
        {currentStep === 'partner_values' && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Was ist dir bei einem Partner wichtig?
            </h2>
            <p className="text-text-secondary mb-8">Wähle die Werte, die dir am wichtigsten sind.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'ambition', label: 'Ambition & Drive' },
                { value: 'loyalty', label: 'Loyalität & Treue' },
                { value: 'family', label: 'Familienwerte' },
                { value: 'humor', label: 'Humor' },
                { value: 'security', label: 'Sicherheit' },
                { value: 'adventure', label: 'Abenteuer' },
                { value: 'communication', label: 'Kommunikation' },
              ].map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  selected={answers.partnerValues?.includes(opt.value) || false}
                  onClick={() => toggleValue(opt.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Family Timeline */}
        {currentStep === 'family_timeline' && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Familie & Zukunft
            </h2>
            <p className="text-text-secondary mb-8">Wann könntest du dir eine Familie vorstellen?</p>
            <div className="space-y-3">
              {[
                { value: 'now', label: 'Möglichst bald', desc: 'In den nächsten 1-2 Jahren' },
                { value: '2_years', label: 'In 2-3 Jahren', desc: 'Wenn der richtige Partner da ist' },
                { value: '5_years', label: 'In 5+ Jahren', desc: 'Erstmal andere Prioritäten' },
                { value: 'unsure', label: 'Bin noch unsicher', desc: 'Kommt auf die Situation an' },
                { value: 'no', label: 'Kein Kinderwunsch', desc: 'Partnerschaft ohne Kinder' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnswers((p) => ({ ...p, familyTimeline: opt.value }))}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    answers.familyTimeline === opt.value
                      ? 'border-accent bg-accent-muted'
                      : 'border-border bg-surface hover:border-accent/50'
                  }`}
                >
                  <div className={`font-medium ${answers.familyTimeline === opt.value ? 'text-accent' : 'text-foreground'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lifestyle */}
        {currentStep === 'lifestyle' && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Dein Lebensmodell
            </h2>
            <p className="text-text-secondary mb-8">Wie stellst du dir eure Partnerschaft vor?</p>
            <div className="space-y-3">
              {[
                { value: 'traditional', label: 'Eher klassisch', desc: 'Er verdient, ich manage Familie & Zuhause' },
                { value: 'modern', label: 'Beide Karriere', desc: 'Wir sind beide beruflich ambitioniert' },
                { value: 'flexible', label: 'Flexibel', desc: 'Je nach Lebensphase anpassen' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnswers((p) => ({ ...p, lifestylePreference: opt.value }))}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    answers.lifestylePreference === opt.value
                      ? 'border-accent bg-accent-muted'
                      : 'border-border bg-surface hover:border-accent/50'
                  }`}
                >
                  <div className={`font-medium ${answers.lifestylePreference === opt.value ? 'text-accent' : 'text-foreground'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Partner Qualities (free text) */}
        {currentStep === 'partner_qualities' && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Beschreibe deinen idealen Partner
            </h2>
            <p className="text-text-secondary mb-8">Was macht ihn besonders? Was ist ein absolutes Muss?</p>
            <textarea
              value={answers.partnerQualities || ''}
              onChange={(e) => setAnswers((p) => ({ ...p, partnerQualities: e.target.value }))}
              placeholder="z.B. Er sollte ambitioniert sein, aber auch Zeit für die Familie haben..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent resize-none h-32"
            />
          </div>
        )}

        {/* Safety Promise */}
        {currentStep === 'safety_promise' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-accent-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Deine Sicherheit ist uns wichtig
            </h2>
            <p className="text-text-secondary mb-8 max-w-sm mx-auto">
              Auf FounderMatch triffst du nur verifizierte, ernsthafte Männer mit klaren Absichten.
            </p>
            <div className="space-y-3 text-left">
              {[
                { icon: Shield, text: 'Jeder Unternehmer wird manuell verifiziert' },
                { icon: Users, text: 'Nur ernsthafte Mitglieder mit klaren Beziehungszielen' },
                { icon: Heart, text: 'Kuratierte Matches statt Massenanfragen' },
                { icon: CheckCircle, text: 'Melde- und Blockfunktion jederzeit verfügbar' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 bg-surface p-4 rounded-xl border border-border">
                  <item.icon className="w-5 h-5 text-accent shrink-0" />
                  <span className="text-sm text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Consent */}
        {currentStep === 'consent' && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Datenschutz & Einwilligung
            </h2>
            <p className="text-text-secondary mb-8">Deine Daten sind uns wichtig. Bitte bestätige folgende Punkte.</p>

            <div className="space-y-4">
              <label className="flex items-start gap-3 bg-surface p-4 rounded-xl border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentTerms}
                  onChange={(e) => setConsentTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">AGB & Datenschutzerklärung</div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    Ich akzeptiere die Allgemeinen Geschäftsbedingungen und die Datenschutzerklärung.
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 bg-surface p-4 rounded-xl border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentSpecialData}
                  onChange={(e) => setConsentSpecialData(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">Besondere Datenkategorien</div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    Ich stimme der Verarbeitung meiner Angaben zu Beziehungszielen, Familienwunsch und Werten zu (Art. 9 DSGVO).
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 bg-surface p-4 rounded-xl border border-border cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentMarketing}
                  onChange={(e) => setConsentMarketing(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-border text-accent focus:ring-accent bg-surface-2"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">Marketing (optional)</div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    Ich möchte Tipps, Angebote und Updates per E-Mail erhalten. Jederzeit abbestellbar.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Soft Premium Invite (NO hard paywall for women) */}
        {currentStep === 'premium_invite' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-accent-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Du bist bereit, {name}!
            </h2>
            <p className="text-text-secondary mb-8 max-w-sm mx-auto">
              Dein Profil ist eingerichtet. Du kannst sofort loslegen — kostenlos.
            </p>

            <div className="bg-surface p-6 rounded-2xl border border-border mb-4">
              <div className="text-sm text-text-secondary mb-3">Optional: Mehr Möglichkeiten mit Premium</div>
              <ul className="space-y-2 text-left mb-4">
                {['Mehr kuratierte Vorschläge', 'Sehen, wer Interesse zeigt', 'Erweiterte Filter'].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle className="w-4 h-4 text-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" onClick={() => handleComplete()}>
                Premium entdecken — 79 €/Monat
              </Button>
            </div>

            <Button className="w-full" size="lg" onClick={() => handleComplete()} disabled={loading}>
              {loading ? 'Wird eingerichtet...' : 'Kostenlos starten'}
            </Button>

            <p className="text-xs text-text-secondary mt-4">
              Du kannst jederzeit upgraden. Keine versteckten Kosten.
            </p>
          </div>
        )}

        {/* Navigation */}
        {currentStep !== 'premium_invite' && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            <Button variant="ghost" onClick={prev} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            <Button
              onClick={next}
              disabled={
                (currentStep === 'relationship_goal' && !answers.relationshipGoal) ||
                (currentStep === 'partner_values' && (!answers.partnerValues || answers.partnerValues.length === 0)) ||
                (currentStep === 'family_timeline' && !answers.familyTimeline) ||
                (currentStep === 'lifestyle' && !answers.lifestylePreference) ||
                (currentStep === 'consent' && (!consentTerms || !consentSpecialData))
              }
            >
              Weiter
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
