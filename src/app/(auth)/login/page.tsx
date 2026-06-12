'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('E-Mail oder Passwort ist falsch.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight font-[family-name:var(--font-display)]">
            <span className="text-foreground">Founder</span>
            <span className="text-accent">Match</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mt-6 mb-2 font-[family-name:var(--font-display)]">Willkommen zurück</h1>
          <p className="text-text-secondary text-sm">Melde dich an, um deine Matches zu sehen.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-border-light">
          <form onSubmit={handleLogin} className="space-y-4">
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
              placeholder="••••••••"
              required
            />
            {error && <p className="text-sm text-error">{error}</p>}
            <Button type="submit" className="w-full rounded-full" size="lg" disabled={loading}>
              {loading ? 'Wird angemeldet...' : 'Anmelden'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-accent hover:text-accent-hover">
              Passwort vergessen?
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-text-secondary mt-6">
          Noch kein Account?{' '}
          <Link href="/register" className="text-accent font-medium hover:text-accent-hover">
            Jetzt bewerben
          </Link>
        </p>
      </div>
    </div>
  );
}
