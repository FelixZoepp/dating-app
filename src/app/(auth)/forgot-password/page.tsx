'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/callback`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-foreground">Founder</span>
            <span className="text-accent">Match</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-6 mb-2">Passwort zurücksetzen</h1>
          <p className="text-text-secondary text-sm">Gib deine E-Mail ein und wir senden dir einen Reset-Link.</p>
        </div>

        <div className="bg-surface p-8 rounded-2xl border border-border">
          {sent ? (
            <div className="text-center">
              <p className="text-text-secondary mb-4">
                Falls ein Account mit <strong className="text-foreground">{email}</strong> existiert, erhältst du eine E-Mail mit einem Reset-Link.
              </p>
              <Link href="/login" className="text-accent font-medium hover:text-accent-hover text-sm">
                Zurück zum Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="email"
                label="E-Mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                required
              />
              {error && <p className="text-sm text-error">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Wird gesendet...' : 'Reset-Link senden'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          <Link href="/login" className="text-accent font-medium hover:text-accent-hover">
            Zurück zum Login
          </Link>
        </p>
      </div>
    </div>
  );
}
