'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein.');
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="bg-white p-8 rounded-2xl border border-border-light">
            <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2 font-[family-name:var(--font-display)]">Bestätige deine E-Mail</h2>
            <p className="text-text-secondary text-sm">
              Wir haben dir eine E-Mail an <strong className="text-foreground">{email}</strong> gesendet. Klicke auf den Link, um dein Konto zu aktivieren.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            <span className="text-foreground">Founder</span>
            <span className="text-accent">Match</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-6 mb-2 font-[family-name:var(--font-display)]">Bewirb dich jetzt</h1>
          <p className="text-text-secondary text-sm">Erstelle dein Profil in wenigen Minuten.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-border-light">
          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              id="email"
              label="E-Mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
            />
            <Input
              id="password"
              label="Passwort"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mindestens 8 Zeichen"
              required
            />
            <Input
              id="confirmPassword"
              label="Passwort bestätigen"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Passwort wiederholen"
              required
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
              {loading ? 'Wird erstellt...' : 'Account erstellen'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          Bereits registriert?{' '}
          <Link href="/login" className="text-accent font-medium hover:text-accent-hover">
            Anmelden
          </Link>
        </p>
      </div>
    </div>
  );
}
