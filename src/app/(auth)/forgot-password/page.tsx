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
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-zinc-900">Founder</span>
            <span className="text-amber-600">Match</span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 mt-6 mb-2">Passwort zurücksetzen</h1>
          <p className="text-zinc-500 text-sm">Gib deine E-Mail ein und wir senden dir einen Reset-Link.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
          {sent ? (
            <div className="text-center">
              <p className="text-zinc-700 mb-4">
                Falls ein Account mit <strong>{email}</strong> existiert, erhältst du eine E-Mail mit einem Reset-Link.
              </p>
              <Link href="/login" className="text-amber-600 font-medium hover:text-amber-700 text-sm">
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
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Wird gesendet...' : 'Reset-Link senden'}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-zinc-500 mt-6">
          <Link href="/login" className="text-amber-600 font-medium hover:text-amber-700">
            Zurück zum Login
          </Link>
        </p>
      </div>
    </div>
  );
}
