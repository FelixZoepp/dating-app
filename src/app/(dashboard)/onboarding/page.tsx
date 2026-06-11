'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MaleOnboarding } from '@/components/onboarding/male-flow';
import { FemaleOnboarding } from '@/components/onboarding/female-flow';

export default function OnboardingPage() {
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [step, setStep] = useState<'gender' | 'flow'>('gender');
  const [name, setName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  if (step === 'gender' || !gender) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md animate-fade-in">
          {/* Welcome */}
          {!name && !gender && (
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Willkommen bei <span className="text-accent">FounderMatch</span>
              </div>
              <p className="text-text-secondary mb-8">Lass uns dein Profil erstellen.</p>

              <div className="bg-surface p-6 rounded-2xl border border-border space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Dein Vorname</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Vorname"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-surface-2 text-foreground placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <button
                  onClick={() => name.trim() && setGender(null)}
                  disabled={!name.trim()}
                  className="w-full bg-accent text-background py-3 rounded-xl font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  Weiter
                </button>
              </div>
            </div>
          )}

          {/* Name entered, choose gender */}
          {name && !gender && (
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Hey {name}, schön dass du hier bist!
              </div>
              <p className="text-text-secondary mb-8">Was beschreibt dich?</p>

              <div className="space-y-3">
                <button
                  onClick={() => { setGender('male'); setStep('flow'); }}
                  className="w-full bg-surface p-5 rounded-2xl border border-border text-left hover:border-accent/50 transition-colors group"
                >
                  <div className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">Mann</div>
                  <div className="text-sm text-text-secondary">Unternehmer, Gründer, Geschäftsführer</div>
                </button>
                <button
                  onClick={() => { setGender('female'); setStep('flow'); }}
                  className="w-full bg-surface p-5 rounded-2xl border border-border text-left hover:border-accent/50 transition-colors group"
                >
                  <div className="text-lg font-semibold text-foreground group-hover:text-accent transition-colors">Frau</div>
                  <div className="text-sm text-text-secondary">Ambitionierte Frau mit klaren Lebenszielen</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gender === 'male') {
    return <MaleOnboarding name={name} userId={userId} />;
  }

  return <FemaleOnboarding name={name} userId={userId} />;
}
