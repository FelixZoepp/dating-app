'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { calculateScores, generatePlanItems, type QuizAnswers } from '@/lib/score';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Loader2, Target } from 'lucide-react';

const STEPS = [
  'relationship_goal',
  'current_status',
  'response_rate',
  'blockers',
  'professional',
  'vision',
  'loading',
  'score_reveal',
  'plan',
  'commitment',
  'social_proof',
  'consent',
  'paywall',
];

interface Props {
  name: string;
  userId: string | null;
}

export function MaleOnboarding({ name, userId }: Props) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<ReturnType<typeof calculateScores> | null>(null);
  const [planItems, setPlanItems] = useState<string[]>([]);
  const router = useRouter();

  // Answers
  const [answers, setAnswers] = useState<QuizAnswers>({
    gender: 'male',
    relationshipGoal: '',
    currentStatus: '',
    responseRate: '',
    blockers: [],
    professionalStand: '',
    fiveYearVision: '',
  });

  // Consent
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentSpecialData, setConsentSpecialData] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  function next() {
    if (currentStep === 'vision') {
      // Trigger loading → score calculation
      setStep(step + 1); // Go to loading
      setTimeout(() => {
        const result = calculateScores(answers);
        setScores(result);
        setPlanItems(generatePlanItems(result, answers));
        setStep(step + 2); // Go to score_reveal
      }, 2500);
      return;
    }
    setStep(step + 1);
  }

  function prev() {
    if (step > 0) {
      // Skip loading screen when going back
      if (STEPS[step - 1] === 'loading') setStep(step - 2);
      else setStep(step - 1);
    }
  }

  function toggleBlocker(blocker: string) {
    setAnswers((prev) => ({
      ...prev,
      blockers: prev.blockers?.includes(blocker)
        ? prev.blockers.filter((b) => b !== blocker)
        : [...(prev.blockers || []), blocker],
    }));
  }

  async function handleComplete() {
    if (!userId) return;
    setLoading(true);

    const supabase = createClient();

    // Update profile
    await supabase
      .from('profiles')
      .update({
        first_name: name,
        gender: 'male',
        relationship_goal: answers.relationshipGoal || null,
        account_type: answers.professionalStand === 'founder' ? 'entrepreneur'
          : answers.professionalStand === 'ceo' ? 'ceo'
          : answers.professionalStand === 'investor' ? 'investor'
          : answers.professionalStand === 'self_employed' ? 'self_employed'
          : null,
        onboarding_completed: true,
        score_ambition: scores?.ambition || 0,
        score_family: scores?.family || 0,
        score_lifestyle: scores?.lifestyle || 0,
        score_readiness: scores?.readiness || 0,
        score_total: scores?.total || 0,
        score_potential: scores?.potential || 0,
      })
      .eq('id', userId);

    // Record consents
    const consents = [
      { type: 'terms', granted: consentTerms },
      { type: 'special_data', granted: consentSpecialData },
      { type: 'marketing', granted: consentMarketing },
    ];

    for (const consent of consents) {
      await supabase.from('consents').insert({
        user_id: userId,
        type: consent.type,
        granted: consent.granted,
        version: '1.0',
      });
    }

    // Track event
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event_name: 'onboarding_completed',
      metadata: { gender: 'male', score: scores?.total },
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
            <span className="text-sm text-text-secondary">
              {step + 1} / {STEPS.length}
            </span>
          </div>
          <ProgressBar value={progress} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 animate-fade-in">

        {/* Step: Relationship Goal */}
        {currentStep === 'relationship_goal' && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Was suchst du, {name}?
            </h2>
            <p className="text-text-secondary mb-8">Dein Beziehungsziel hilft uns, passende Matches zu finden.</p>
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

        {/* Step: Current Status */}
        {currentStep === 'current_status' && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Wie ist dein aktueller Status?
            </h2>
            <p className="text-text-secondary mb-8">Sei ehrlich — das hilft uns, deinen persönlichen Plan zu erstellen.</p>
            <div className="space-y-3">
              {[
                { value: 'single_long', label: 'Seit längerem Single', desc: 'Über 1 Jahr' },
                { value: 'single_recent', label: 'Seit kurzem Single', desc: 'Unter 6 Monate' },
                { value: 'dating', label: 'Ich date gelegentlich', desc: 'Aber nichts Ernstes' },
                { value: 'complicated', label: 'Es ist kompliziert', desc: 'Unklare Situation' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnswers((p) => ({ ...p, currentStatus: opt.value }))}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    answers.currentStatus === opt.value
                      ? 'border-accent bg-accent-muted'
                      : 'border-border bg-surface hover:border-accent/50'
                  }`}
                >
                  <div className={`font-medium ${answers.currentStatus === opt.value ? 'text-accent' : 'text-foreground'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Response Rate */}
        {currentStep === 'response_rate' && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Wie oft bekommst du Antworten auf Dating-Apps?
            </h2>
            <p className="text-text-secondary mb-8">Deine ehrliche Einschätzung.</p>
            <div className="space-y-3">
              {[
                { value: 'very_low', label: 'Sehr selten', desc: 'Fast keine Antworten' },
                { value: 'low', label: 'Selten', desc: 'Wenige Antworten' },
                { value: 'medium', label: 'Manchmal', desc: 'Ab und zu Gespräche' },
                { value: 'high', label: 'Oft', desc: 'Gute Antwortrate' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnswers((p) => ({ ...p, responseRate: opt.value }))}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    answers.responseRate === opt.value
                      ? 'border-accent bg-accent-muted'
                      : 'border-border bg-surface hover:border-accent/50'
                  }`}
                >
                  <div className={`font-medium ${answers.responseRate === opt.value ? 'text-accent' : 'text-foreground'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Blockers */}
        {currentStep === 'blockers' && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Was hält dich zurück?
            </h2>
            <p className="text-text-secondary mb-8">Wähle alles, was zutrifft. Mehrfachauswahl möglich.</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'time', label: 'Zu wenig Zeit' },
                { value: 'wrong_people', label: 'Falsche Leute' },
                { value: 'no_effort', label: 'Kein Bock auf Swipen' },
                { value: 'location', label: 'Falscher Ort' },
                { value: 'confidence', label: 'Unsicherheit' },
                { value: 'standards', label: 'Hohe Ansprüche' },
              ].map((opt) => (
                <Chip
                  key={opt.value}
                  label={opt.label}
                  selected={answers.blockers?.includes(opt.value) || false}
                  onClick={() => toggleBlocker(opt.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step: Professional Standing */}
        {currentStep === 'professional' && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Dein beruflicher Stand
            </h2>
            <p className="text-text-secondary mb-8">Wir nutzen das für deine Verifizierung und bessere Matches.</p>
            <div className="space-y-3">
              {[
                { value: 'founder', label: 'Gründer / Unternehmer' },
                { value: 'ceo', label: 'Geschäftsführer' },
                { value: 'investor', label: 'Investor' },
                { value: 'self_employed', label: 'Selbstständig' },
                { value: 'employee', label: 'Angestellt' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnswers((p) => ({ ...p, professionalStand: opt.value }))}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    answers.professionalStand === opt.value
                      ? 'border-accent bg-accent-muted'
                      : 'border-border bg-surface hover:border-accent/50'
                  }`}
                >
                  <div className={`font-medium ${answers.professionalStand === opt.value ? 'text-accent' : 'text-foreground'}`}>
                    {opt.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: 5 Year Vision */}
        {currentStep === 'vision' && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Wo siehst du dich in 5 Jahren?
            </h2>
            <p className="text-text-secondary mb-8">Deine Vision hilft uns, kompatible Partner zu finden.</p>
            <div className="space-y-3">
              {[
                { value: 'family', label: 'Familie & Partnerschaft', desc: 'Verheiratet, Kinder, Stabilität' },
                { value: 'career', label: 'Karriere & Wachstum', desc: 'Business skalieren, Erfolg' },
                { value: 'both', label: 'Beides', desc: 'Familie UND Karriere' },
                { value: 'freedom', label: 'Freiheit & Lifestyle', desc: 'Reisen, Flexibilität' },
                { value: 'unsure', label: 'Noch unsicher', desc: 'Bin offen für alles' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAnswers((p) => ({ ...p, fiveYearVision: opt.value }))}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    answers.fiveYearVision === opt.value
                      ? 'border-accent bg-accent-muted'
                      : 'border-border bg-surface hover:border-accent/50'
                  }`}
                >
                  <div className={`font-medium ${answers.fiveYearVision === opt.value ? 'text-accent' : 'text-foreground'}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Screen */}
        {currentStep === 'loading' && (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-accent mx-auto mb-6 animate-spin" />
            <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Dein Profil wird analysiert...
            </h2>
            <p className="text-text-secondary text-sm">Wir berechnen deinen persönlichen Kompatibilitäts-Score.</p>
          </div>
        )}

        {/* Score Reveal */}
        {currentStep === 'score_reveal' && scores && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Dein FounderMatch Score
            </h2>

            <div className="bg-surface p-8 rounded-2xl border border-border mb-6">
              <div className="relative w-40 h-40 mx-auto mb-6">
                <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="#1C212B" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="54" fill="none" stroke="#CDA349" strokeWidth="8"
                    strokeDasharray={`${(scores.total / 100) * 339.3} 339.3`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                    {scores.total}
                  </span>
                  <span className="text-xs text-text-secondary">von 100</span>
                </div>
              </div>

              <p className="text-sm text-text-secondary mb-4">Dein aktueller Score &bull; Selbsteinschätzung, keine Diagnostik</p>

              <div className="space-y-3">
                {[
                  { label: 'Ambition', value: scores.ambition },
                  { label: 'Familie', value: scores.family },
                  { label: 'Lifestyle', value: scores.lifestyle },
                  { label: 'Beziehungsbereitschaft', value: scores.readiness },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">{s.label}</span>
                      <span className="text-foreground font-medium">{s.value}</span>
                    </div>
                    <div className="w-full bg-surface-2 rounded-full h-1.5">
                      <div className="bg-accent h-1.5 rounded-full transition-all duration-700" style={{ width: `${s.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Potential */}
            <div className="bg-accent-muted p-4 rounded-xl border border-accent/30 mb-4">
              <div className="text-sm text-accent font-medium mb-1">Dein Potenzial-Score</div>
              <div className="text-3xl font-bold text-accent" style={{ fontFamily: 'var(--font-display)' }}>{scores.potential}</div>
              <div className="text-xs text-text-secondary mt-1">Erreichbar im richtigen Pool mit den richtigen Matches</div>
            </div>
          </div>
        )}

        {/* Plan */}
        {currentStep === 'plan' && scores && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Dein persönlicher Plan
            </h2>
            <p className="text-text-secondary mb-8">
              Von <span className="text-foreground font-semibold">{scores.total}</span> auf{' '}
              <span className="text-accent font-semibold">{scores.potential}</span> — so schaffen wir das:
            </p>
            <div className="space-y-3">
              {planItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-surface p-4 rounded-xl border border-border">
                  <div className="w-8 h-8 bg-accent-muted rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commitment */}
        {currentStep === 'commitment' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-accent-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Target className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Bist du bereit?
            </h2>
            <p className="text-text-secondary mb-8 max-w-sm mx-auto">
              FounderMatch ist für Menschen, die es ernst meinen. Keine Spielchen, keine Zeitverschwendung — nur echte Verbindungen.
            </p>
            <div className="space-y-3">
              {[
                'Ich suche eine ernsthafte Beziehung',
                'Ich bin bereit, in mich zu investieren',
                'Ich respektiere andere Mitglieder',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 bg-surface p-4 rounded-xl border border-border">
                  <Check className="w-5 h-5 text-accent shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Proof */}
        {currentStep === 'social_proof' && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2 text-center" style={{ fontFamily: 'var(--font-display)' }}>
              Was andere sagen
            </h2>
            <p className="text-text-secondary mb-8 text-center">Echte Mitglieder, echte Ergebnisse.</p>
            <div className="space-y-4">
              {[
                { name: 'Max, 34', role: 'Gründer', text: 'Nach 2 Wochen auf FounderMatch hatte ich mehr qualitative Gespräche als in 6 Monaten auf Tinder.' },
                { name: 'Daniel, 38', role: 'CEO', text: 'Die Frauen hier wissen, was sie wollen. Kein Smalltalk, echte Verbindungen.' },
                { name: 'Philipp, 31', role: 'Investor', text: 'Endlich eine Plattform, die versteht, dass meine Zeit wertvoll ist.' },
              ].map((t) => (
                <div key={t.name} className="bg-surface p-5 rounded-2xl border border-border">
                  <p className="text-sm text-foreground mb-3 italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-accent-muted rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-accent">{t.name.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{t.name}</div>
                      <div className="text-xs text-text-secondary">{t.role}</div>
                    </div>
                  </div>
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
                    Ich stimme der Verarbeitung meiner Angaben zu Beziehungszielen, Kinderwunsch und Werten zu (Art. 9 DSGVO). Diese Daten werden nur für das Matching verwendet.
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

        {/* Paywall */}
        {currentStep === 'paywall' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              Starte jetzt mit FounderMatch
            </h2>
            <p className="text-text-secondary mb-8">Wähle deinen Plan oder starte kostenlos.</p>

            <div className="space-y-4 mb-6">
              <div className="bg-surface p-6 rounded-2xl border border-accent relative">
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-accent text-background text-xs font-semibold px-3 py-0.5 rounded-full">
                  Empfohlen
                </div>
                <div className="text-lg font-bold text-foreground mb-1">Premium</div>
                <div className="text-3xl font-bold text-accent mb-1" style={{ fontFamily: 'var(--font-display)' }}>79 &euro;<span className="text-sm text-text-secondary font-normal">/Monat</span></div>
                <div className="text-xs text-text-secondary mb-4">3 Tage kostenlos testen &bull; Jederzeit kündbar</div>
                <ul className="space-y-2 text-left mb-5">
                  {['20 kuratierte Vorschläge/Woche', 'Sehen, wer Interesse zeigt', 'Erweiterte Filter', 'Höhere Sichtbarkeit'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-accent shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" size="lg" onClick={() => handleComplete()}>
                  {loading ? 'Wird eingerichtet...' : 'Premium starten — 3 Tage gratis'}
                </Button>
              </div>

              <button
                onClick={() => handleComplete()}
                className="text-sm text-text-secondary hover:text-foreground transition-colors underline"
              >
                Erstmal kostenlos starten
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              Inkl. MwSt. &bull; Kündigung jederzeit im Profil &bull; Keine versteckten Kosten
            </p>
          </div>
        )}

        {/* Navigation */}
        {currentStep !== 'loading' && currentStep !== 'paywall' && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            <Button variant="ghost" onClick={prev} disabled={step === 0}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
            <Button
              onClick={next}
              disabled={
                (currentStep === 'relationship_goal' && !answers.relationshipGoal) ||
                (currentStep === 'current_status' && !answers.currentStatus) ||
                (currentStep === 'response_rate' && !answers.responseRate) ||
                (currentStep === 'professional' && !answers.professionalStand) ||
                (currentStep === 'vision' && !answers.fiveYearVision) ||
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
